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
import { Feature, Overlay } from 'ol';
import { set } from 'ol/transform';
import { transform } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import Paginacion from './Paginacion';
import Panelhover from './Panelhover';
import PanelControlMapa from './PanelControlMapa';

const MasFiguras = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [draw, setDraw] = useState(null);
    const [type, setType] = useState('Circle');
    const [wktList, setWktList] = useState([]);
    const [capas, setCapas] = useState([]);
    const herramientaRef = useRef(false);
    const [capasenpoligono, setCapasenpoligono] = useState([]);
    const [color, setColor] = useState("#FFFF00");
    const drawStyleRef = useRef();
    const [wkt, setWkt] = useState("");
    const [capasseparadas, setCapasseparadas] = useState([]);
    const [capahoveractual, setCapahoveractual] = useState("");

    const VerCapasid = (mapa, wkt) => {
        const layerNames = verCapasmapa(mapa)
        let capaswms = [];
        capaswms = verCapasmapa(mapa);
        setCapasseparadas(capaswms);
    }

    const verCapasmapa = (mapa) => {
        const layers = mapa.getLayers().getArray();
        const layerNames = layers.map((layer) => {
            const source = layer.getSource();
            if (source instanceof TileWMS) {
                return source.getParams().LAYERS;
            }
            return null;
        });

        for (let indice in layerNames) {
            if (layerNames[indice] != null) {
                let capaswms = layerNames[indice].split(",");
                return capaswms;
            }
        }
    }

    useEffect(() => {
        const raster = new TileLayer({
            source: new OSM(),
        });

        const source = new VectorSource({ wrapX: false });
        const featureStyle = new Style({
            stroke: new Stroke({
                color: color,
                width: 2,
            }),
            fill: new Fill({
                color: `${color}80`
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
                        "geonode:poli_voronoi_nl_49_cc,geonode:beneficiarios,geonode:buffer2km_cc_49_topochico_nl,geonode:19e",
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
                projection: 'EPSG:3857',
            }),
        });
        const capasenmapa = verCapasmapa(initialMap);
        const capasparametros = capasenmapa.map(name => ({
            name,
            active: true
        }));
        console.log("Capas en el mapa: ", capasparametros);
        setCapas(capasparametros);


/* 
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
                    setWkt(wkt);
                    setWktList((prevList) => [...prevList, wkt]);
                } else {
                    alert('Por favor, introduce un número válido para el radio.');
                }
            }
        });
        let hoverTimeout = null; */

     

        setMap(initialMap);
        source.on('addfeature', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();

            if (geometry.getType() === 'Circle') {
                const circlePolygon = fromCircle(geometry, 64);
                feature.setGeometry(circlePolygon);
            }

            const format = new WKT();
            const wkt = format.writeFeature(feature);
            console.log("WKT: ", wkt);  
            VerCapasid(initialMap, wkt);
            setWkt(wkt);

            setWktList((prevList) => [...prevList, wkt]);

        });

        return () => {
            initialMap.setTarget(null);
        };
    }, []);

/* 
    useEffect(() => {
        if (!map) return;
        if (herramientaRef.current == false) {
            handleClear();
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
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`
                    }),
                });

                drawInteraction = new Draw({
                    source: vectorSource,
                    type: type === 'Square' || type === 'Box' || type === 'Star' ? 'Circle' : type,
                    geometryFunction,
                    style: drawStyle,
                });
                drawStyleRef.current = drawInteraction;
                let overlayElement = document.createElement('div');
                overlayElement.className = 'ol-overlay-label';
                overlayElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                overlayElement.style.border = '1px solid #000';
                overlayElement.style.padding = '5px';
                overlayElement.style.borderRadius = '5px';
                const overlayLabel = new Overlay({
                    element: overlayElement,
                    positioning: 'center-center',
                    stopEvent: false,
                });

                map.addOverlay(overlayLabel);

                drawInteraction.on("drawstart", (event) => {
                    handleClear();
                    const geometry = event.feature.getGeometry();
                    if (geometry?.getType() === 'Circle') {
                        const circleGeometry = geometry;
                        const radiusLabel = overlayLabel.getElement();
                        radiusLabel.style.background = 'rgba(255, 255, 255, 0.8)';
                        radiusLabel.style.padding = '5px';
                        radiusLabel.style.border = '1px solid #ccc';
                        radiusLabel.style.borderRadius = '4px';
                        radiusLabel.style.whiteSpace = 'nowrap';
                        radiusLabel.style.color = 'Black';

                        geometry.on('change', () => {
                            const center = circleGeometry.getCenter();
                            const radius = circleGeometry.getRadius();
                            const edgePoint = [center[0] + radius, center[1]];
                            const center4326 = transform(center, 'EPSG:3857', 'EPSG:4326');
                            const edge4326 = transform(edgePoint, 'EPSG:3857', 'EPSG:4326');
                            const radiusInMeters = getDistance(center4326, edge4326);
                            overlayLabel.setPosition(center);
                            radiusLabel.innerHTML = `Radio: ${radiusInMeters.toFixed(2)} m`;

                        });
                    }
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

    }, [type, map]); */


    const handleClear = () => {
        const vectorSource = map.getLayers().getArray()[2].getSource();
        vectorSource.clear();
    };

    useEffect(() => {
        if (!map) return;
        const vectorLayer = map.getLayers().getArray().find(layer => layer instanceof VectorLayer);
        if (vectorLayer) {
            vectorLayer.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`
                    }),
                })
            );
        }
        if (drawStyleRef.current) {
            console.log("Color actualizado:", drawStyleRef.current);

            drawStyleRef.current.overlay_.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`,
                    }),
                })
            );
        }

    }, [color, map]);


    return (
        <div>
            <div style={{ position: 'relative',width: '100%', height: '70vh' }}>
                <div
                    ref={mapRef}
                    style={{ width: '100%', height: '100%' }}
                ></div>
                <PanelControlMapa mapa={map}/>
            </div>
            {/* <div className="controls">
                <label htmlFor="type">tipo figura:</label>
                <select
                    id="type"
                    value={type}
                    onChange={(e) => {
                        setType(e.target.value)
                        if (e.target.value == "Buffer") {
                            herramientaRef.current = true;
                        } else {
                            herramientaRef.current = false;
                        }
                    }}
                >
                    <option value="Buffer">Buffer n metros</option>
                    <option value="Circle">Circulo</option>
                    <option value="Polygon">Poligono Libre</option>
                    <option value="None">Quitar</option>
                </select>
                <button onClick={handleClear}>Limpiar</button>
                <input type="color" name="" value={color} id="" onChange={(e) => { setColor(e.target.value) }} />
            </div> */}
            <div>
                <h3>capas presentes</h3>
                <ul>
                    {
                        capasseparadas.map((dato, i) => (
                            <>
                                <Paginacion wkt={wkt} capa={dato} />
                            </>
                        ))
                    }
                </ul>
                <Panelhover />
            </div>
        </div>
    );
}

export default MasFiguras;
