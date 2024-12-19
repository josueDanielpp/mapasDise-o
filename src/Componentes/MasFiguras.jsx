import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Draw, { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import Map from 'ol/Map';
import Polygon, { fromCircle } from 'ol/geom/Polygon';
import View from 'ol/View';
import { OSM, TileWMS, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import WKT from 'ol/format/WKT';
import { Circle as CircleGeom } from 'ol/geom';

import { Select } from 'ol/interaction';
import { Style, Stroke, Fill } from 'ol/style';
import { Feature } from 'ol';
const MasFiguras = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [draw, setDraw] = useState(null);
    const [type, setType] = useState('Circle');
    const [wktList, setWktList] = useState([]);
    const herramientaRef = useRef(false);
    useEffect(() => {
        const raster = new TileLayer({
            source: new OSM(),
        });

        const source = new VectorSource({ wrapX: false });
        const featureStyle = new Style({
            stroke: new Stroke({
                color: 'red',
                width: 2,
            }),
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.3)',
            }),
        });

        const vector = new VectorLayer({
            source: source,
            style: featureStyle,
        });
        const wmsLayerEPSG3857 = new TileLayer({
            source: new TileWMS({
                url: "http://192.168.1.73/geoserver/ows?",
                params: {
                    SERVICE: "WMS",
                    VERSION: "1.1.0",
                    REQUEST: "GetMap",
                    LAYERS:
                        "geonode:poli_voronoi_nl_49_cc,geonode:beneficiarios,geonode:buffer2km_cc_49_topochico_nl",
                    BBOX: "-100.9925771, 22.961170783160195, -99.04279603662275, 27.7031194",
                    SRS: "EPSG:3857",
                    FORMAT: "image/png",
                    TRANSPARENT: true,
                    STYLES: "",
                    SLD: `http://192.168.1.71:8082/mapa/SLDCombinado/2/11`,
                },
                crossOrigin: "anonymous",
            }),
        });

        const initialMap = new Map({
            layers: [raster, wmsLayerEPSG3857, vector],
            target: mapRef.current,
            view: new View({
                center: [-11000000, 4600000],
                zoom: 4,
            }),
        });

        source.on('addfeature', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();

            if (geometry.getType() === 'Circle') {
                const circlePolygon = fromCircle(geometry, 64);
                feature.setGeometry(circlePolygon);
            }

            const format = new WKT();
            const wkt = format.writeFeature(feature);
            setWktList((prevList) => [...prevList, wkt]);
        });
        initialMap.on('singleclick', (event) => {
            if (herramientaRef.current == true) {
                const radius = prompt('¿Cuántos metros quieres de radio?');

                if (radius && !isNaN(radius)) {
                    const radiusInMeters = parseFloat(radius);

                    const circle = new CircleGeom(event.coordinate, radiusInMeters);

                    const circlePolygon = fromCircle(circle, 64);
                    const feature = new Feature({
                        geometry: circlePolygon,
                    });

                    source.addFeature(feature);

                    const format = new WKT();
                    const wkt = format.writeFeature(feature);

                    setWktList((prevList) => [...prevList, wkt]);
                } else {
                    alert('Por favor, introduce un número válido para el radio.');
                }
            }
        });


        setMap(initialMap);
        return () => {
            initialMap.setTarget(null);
        };
    }, []);


    useEffect(() => {
        if (!map) return;
        if (herramientaRef.current == false) {
         let geometryFunction;
            let drawInteraction;
            if (type !== 'None') {
                if (type === 'Square') {
                    geometryFunction = createRegularPolygon(4);
                } else if (type === 'Box') {
                    geometryFunction = createBox();
                } else if (type === 'Star') {
                    geometryFunction = (coordinates, geometry) => {
                        const center = coordinates[0];
                        const last = coordinates[coordinates.length - 1];
                        const dx = center[0] - last[0];
                        const dy = center[1] - last[1];
                        const radius = Math.sqrt(dx * dx + dy * dy);
                        const rotation = Math.atan2(dy, dx);
                        const newCoordinates = [];
                        const numPoints = 12;
                        for (let i = 0; i < numPoints; ++i) {
                            const angle = rotation + (i * 2 * Math.PI) / numPoints;
                            const fraction = i % 2 === 0 ? 1 : 0.5;
                            const offsetX = radius * fraction * Math.cos(angle);
                            const offsetY = radius * fraction * Math.sin(angle);
                            newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                        }
                        newCoordinates.push(newCoordinates[0].slice());
                        if (!geometry) {
                            geometry = new Polygon([newCoordinates]);
                        } else {
                            geometry.setCoordinates([newCoordinates]);
                        }
                        return geometry;
                    };
                }

                const vectorSource = map.getLayers().getArray()[2].getSource();
                const drawStyle = new Style({
                    stroke: new Stroke({
                        color: 'blue',
                        width: 2,
                    }),
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.3)',
                    }),
                });
                drawInteraction = new Draw({
                    source: vectorSource,
                    type: type === 'Square' || type === 'Box' || type === 'Star' ? 'Circle' : type,
                    geometryFunction,
                    style: drawStyle,
                });

                map.addInteraction(drawInteraction);
                setDraw(drawInteraction);
            }
            return () => {
                if (drawInteraction) {
                    map.removeInteraction(drawInteraction);
                }
            };
        }
        
    }, [type, map]);

    const handleUndo = () => {
        if (draw) {
            draw.removeLastPoint();
        }
    };
    const handleClear = () => {
        const vectorSource = map.getLayers().getArray()[2].getSource(); 
        vectorSource.clear(); 
    };

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
            <div className="controls">
                <label htmlFor="type">tipo figura:</label>
                <select
                    id="type"
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value)
                        if (e.target.value == "Buffer") {
                            herramientaRef.current = true;
                            /* setHerramienta(true); */
                        } else {
                            herramientaRef.current = false;
                           /*  setHerramienta(false); */
                        }


                    }}
                >
                    <option value="Buffer">Buffer n metros</option>
                    <option value="Circle">Circulo</option>
                    <option value="Square">Cuadrado</option>
                    <option value="Box">Caja</option>
                    <option value="Star">Estrella</option>
                    <option value="Polygon">Poligono Libre</option>
                    <option value="None">Quitar</option>
                </select>
                <button onClick={handleClear}>Limpiar</button>
            </div>
            <div>
                <h3>WKT Output</h3>
                <ul>
                    {wktList.map((wkt, index) => (
                        <li key={index}>{wkt}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default MasFiguras;
