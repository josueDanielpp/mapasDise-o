import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Circle as CircleGeom } from 'ol/geom';
import { Style, Stroke, Fill } from 'ol/style';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import WKT from 'ol/format/WKT';
import { fromCircle } from 'ol/geom/Polygon';
const MetrosFig = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [wktList, setWktList] = useState([]); 

    useEffect(() => {
        const raster = new TileLayer({
            source: new OSM(),
        });

        const source = new VectorSource({ wrapX: false });

        const featureStyle = new Style({
            stroke: new Stroke({
                color: 'red', // Color del borde
                width: 2,     // Ancho del borde
            }),
            fill: new Fill({
                color: 'rgba(255, 0, 0, 0.3)',
            }),
        });

        const vector = new VectorLayer({
            source: source,
            style: featureStyle, 
        });

        const initialMap = new Map({
            layers: [raster, vector],
            target: mapRef.current,
            view: new View({
                center: [-11000000, 4600000],
                zoom: 4,
            }),
        });

        initialMap.on('singleclick', (event) => {
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
        });

        setMap(initialMap);

        return () => {
            initialMap.setTarget(null);
        };
    }, []);

    return (
        <div>
            <div ref={mapRef} style={{ width: '100%', height: '400px' }}></div>
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

export default MetrosFig
