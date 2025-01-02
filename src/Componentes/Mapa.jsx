import React, { useEffect, useState, useRef } from "react";
import "ol/ol.css";
import { Map as OlMap, View as OlView } from "ol";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import { transformExtent } from "ol/proj";
import OSM from "ol/source/OSM";

const Ejemplo = () => {
    const mapRef = useRef();
    const [mapa, setMapa] = useState(null);
    const [bboxCoords, setBboxCoords] = useState(null);
    const [feature, setFeature] = useState(null);
    const [projection, setProjection] = useState("EPSG:4326"); // Proyección dinámica

    // Función para obtener las capacidades del WMS y calcular el bbox
    const fetchCapabilities = (layer, setBboxCoords, setProjection) => {
        const url = `${layer.getSource().getUrls()[0]}?service=WMS&version=1.1.1&request=GetCapabilities`;
        console.log("Fetching GetCapabilities from:", url);

        fetch(url)
            .then((response) => response.text())
            .then((text) => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");

                const extent = getLayerExtent(xmlDoc, layer);
                if (extent) {
                    const layerElement = xmlDoc.querySelector("Layer");
                    const crs = layerElement.querySelector("SRS, CRS")?.textContent || "EPSG:4326";
                    const epsgCode = crs.match(/EPSG:\d+/)?.[0] || "EPSG:4326";

                    setProjection(epsgCode);

                    let transformedExtent = extent;
                    if (epsgCode !== "EPSG:3857") {
                        transformedExtent = transformExtent(extent, epsgCode, "EPSG:3857");
                    }

                    const minValid = -20037508.342789244;
                    const maxValid = 20037508.342789244;

                    transformedExtent = transformedExtent.map((val) => {
                        if (val < minValid) return minValid;
                        if (val > maxValid) return maxValid;
                        return val;
                    });

                    console.log("Transformed BBox in EPSG:3857:", transformedExtent);
                    setBboxCoords(transformedExtent);
                }
            })
            .catch((error) => {
                console.error("Error fetching WMS capabilities:", error);
            });
    };

    // Función para extraer el extent de la capa del XML de capacidades
    const getLayerExtent = (xmlDoc, layer) => {
        const layerName = layer.get("name");
        const layerElement = Array.from(xmlDoc.querySelectorAll("Layer")).find((el) =>
            el.querySelector("Name")?.textContent === layerName
        );

        if (layerElement) {
            const bboxElement = layerElement.querySelector("BoundingBox");
            if (bboxElement) {
                const minx = parseFloat(bboxElement.getAttribute("minx"));
                const miny = parseFloat(bboxElement.getAttribute("miny"));
                const maxx = parseFloat(bboxElement.getAttribute("maxx"));
                const maxy = parseFloat(bboxElement.getAttribute("maxy"));
                return [minx, miny, maxx, maxy];
            }
        }
        console.warn(`No extent found for layer: ${layerName}`);
        return null;
    };

    // Configuración del mapa y las capas
    useEffect(() => {
        const baseLayer = new TileLayer({
            source: new OSM(),
        });

        const wmsSource = new TileWMS({
            url: "http://192.168.1.73:85/geoserver/ows",
            params: {
                LAYERS: "geonode:cc_49_voronoi_ageb",
                TILED: true,
            },
            serverType: "geoserver",
            crossOrigin: "anonymous",
        });

        const layerRecursoGeo = new TileLayer({
            source: wmsSource,
            properties: {
                name: "geonode:cc_49_voronoi_ageb",
            },
        });

        const map = new OlMap({
            target: mapRef.current,
            layers: [baseLayer, layerRecursoGeo],
            view: new OlView({
                center: [-11397148, 2510000],
                zoom: 9,
            }),
        });

        setMapa(map);
        fetchCapabilities(layerRecursoGeo, setBboxCoords, setProjection); 

        return () => map.setTarget(undefined); 
    }, []);

    useEffect(() => {
        if (mapa && projection) {
            mapa.on("singleclick", function (evt) {
                const view = mapa.getView();
                const extent = view.calculateExtent(mapa.getSize());
                const bbox = transformExtent(extent, "EPSG:3857", projection).join(",");

                const x = Math.floor(evt.pixel[0]);
                const y = Math.floor(evt.pixel[1]);
                const width = mapa.getSize()[0];
                const height = mapa.getSize()[1];

                const url = `http://192.168.1.73:85/geoserver/ows?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=geonode%3Acc_49_voronoi_ageb&query_layers=geonode%3Acc_49_voronoi_ageb&styles=&x=${x}&y=${y}&height=${height}&width=${width}&srs=${projection}&bbox=${bbox}&feature_count=1&info_format=application/json&format=image/png`;

                console.log("Proyección dinámica:", projection);
                console.log("URL de solicitud:", url);

                fetch(url)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.features && data.features.length > 0) {
                            console.log("Datos obtenidos:", data.features);
                            setFeature(data.features[0]);
                        } else {
                            console.log("No se encontraron características");
                            setFeature(null);
                        }
                    })
                    .catch((error) => {
                        console.error("Error al obtener los datos:", error);
                        setFeature(null);
                    });
            });
        }
    }, [mapa, projection]);

    return (
        <div>
            <div ref={mapRef} style={{ width: "100%", height: "500px" }}></div>
            {feature && (
                <div className="feature-info">
                    <h3>Información del elemento</h3>
                    <pre>{JSON.stringify(feature, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default Ejemplo;
