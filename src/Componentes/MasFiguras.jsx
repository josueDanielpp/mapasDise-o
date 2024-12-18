import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Draw, { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import Map from 'ol/Map';
import Polygon, { fromCircle } from 'ol/geom/Polygon';
import View from 'ol/View';
import { OSM, TileWMS, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import WKT from 'ol/format/WKT';
import { Select } from 'ol/interaction';
import { Style, Stroke, Fill } from 'ol/style';
const MasFiguras = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [draw, setDraw] = useState(null);
    const [type, setType] = useState('Circle');
    const [wktList, setWktList] = useState([]); // Lista para guardar los WKT

    useEffect(() => {
        const raster = new TileLayer({
            source: new OSM(),
        });

        const source = new VectorSource({ wrapX: false });

        const vector = new VectorLayer({
            source: source,
           
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
            layers: [raster,wmsLayerEPSG3857, vector],
            target: mapRef.current,
            view: new View({
                center: [-11000000, 4600000],
                zoom: 4,
            }),
        });
        const selectInteraction = new Select({
            style: new Style({
                stroke: new Stroke({
                    color: 'rgba(255, 165, 0, 1)', // Naranja para selección
                    width: 3, // Grosor más pronunciado
                }),
                fill: new Fill({
                    color: 'rgba(255, 165, 0, 0.3)', // Naranja con transparencia
                }),
            }),
        });
        initialMap.addInteraction(selectInteraction);
        
       

        // Listener para capturar las geometrías dibujadas
        source.on('addfeature', (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();

            if (geometry.getType() === 'Circle') {
                // Convertir el círculo en un polígono
                const circlePolygon = fromCircle(geometry, 64); // 64 segmentos para mayor precisión
                feature.setGeometry(circlePolygon); // Actualizar la geometría de la feature
            }

            const format = new WKT();
            const wkt = format.writeFeature(feature); // Convierte la feature (ya polígono si era círculo) a WKT
            setWktList((prevList) => [...prevList, wkt]); // Guarda el WKT en la lista
        });

        setMap(initialMap);
        return () => {
            initialMap.setTarget(null);
        };
    }, []);


    useEffect(() => {
        if (!map) return;
        
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
        
            // Apuntar la interacción de dibujo a la capa vectorial
            const vectorSource = map.getLayers().getArray()[2].getSource();
        
            drawInteraction = new Draw({
                source: vectorSource, // Cambiar al origen vectorial
                type: type === 'Square' || type === 'Box' || type === 'Star' ? 'Circle' : type,
                geometryFunction,
            });
        
            map.addInteraction(drawInteraction);
            setDraw(drawInteraction);
        }
        
        return () => {
            if (drawInteraction) {
                map.removeInteraction(drawInteraction);
            }
        };
    }, [type, map]);

    const handleUndo = () => {
        if (draw) {
            draw.removeLastPoint();
        }
    };

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
            <div className="controls">
                <label htmlFor="type">Shape type:</label>
                <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option value="Circle">Circle</option>
                    <option value="Square">Square</option>
                    <option value="Box">Box</option>
                    <option value="Star">Star</option>
                    <option value="Polygon">Freehand Polygon</option> 
                    <option value="None">None</option>
                </select>
                <button onClick={handleUndo}>Undo</button>
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
