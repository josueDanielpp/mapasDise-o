import React, { useEffect, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import Polygon, { circular } from "ol/geom/Polygon";
import WKT from "ol/format/WKT";
const Digitalizacion = () => {

    const [wkt, setWkt] = useState("");

    useEffect(() => {
        // Coordenada central [longitud, latitud]
        const center = [-99.128145, 19.413793]; // Ciudad de México

        // Radio del círculo en metros
        const radius = 1000;

        // Transformar la coordenada al sistema EPSG:3857
        const centerTransformed = fromLonLat(center);

        // Crear el círculo (generación manual)
        const circleGeom = circular(center, radius, 64);
        circleGeom.transform("EPSG:4326", "EPSG:3857");

        // Crear una característica con el círculo
        const circleFeature = new Feature(circleGeom);

        // Crear una fuente vectorial y añadir la característica
        const vectorSource = new VectorSource({
            features: [circleFeature],
        });

        // Crear una capa vectorial para el círculo
        const circleLayer = new VectorLayer({
            source: vectorSource,
            style: new Style({
                fill: new Fill({
                    color: "rgba(0, 153, 255, 0.4)", // Color de relleno
                }),
                stroke: new Stroke({
                    color: "#0066ff", // Color del borde
                    width: 2,
                }),
            }),
        });

        // Crear la capa base del mapa
        const tileLayer = new TileLayer({
            source: new OSM(),
        });

        // Crear el mapa
        const map = new Map({
            target: "map-container",
            layers: [tileLayer, circleLayer],
            view: new View({
                center: centerTransformed,
                zoom: 15, // Nivel de zoom
            }),
        });

        // Obtener el WKT de la geometría del círculo
        const wktFormat = new WKT();
        const wktString = wktFormat.writeGeometry(circleGeom);
        console.log("WKT del círculo:", wktString);

        // Guardar el WKT en el estado
        setWkt(wktString);

        // Limpiar el mapa al desmontar el componente
        return () => map.setTarget(null);
    }, []);


    return (
        <div
            id="map-container"
            style={{ width: "100%", height: "100vh" }}
        ></div>
    );


}

export default Digitalizacion
