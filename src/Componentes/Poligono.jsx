import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Draw, Modify } from "ol/interaction";
import { Style, Stroke, Fill } from "ol/style";
import WKT from "ol/format/WKT";
import { fromLonLat, transformExtent } from "ol/proj";
import { Circle as CircleGeometry, Polygon } from "ol/geom";
const Poligono = () => {
    const mapRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const [wktList, setWktList] = useState([]);

  useEffect(() => {
    // Crear la vista del mapa
    const view = new View({
      center: fromLonLat([-100.01768656831138, 25.332145091580095]), // Coordenadas iniciales
      zoom: 6,
    });

    // Capa base (OSM)
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Capa WMS
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

    // Crear fuente vectorial para dibujos
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Crear capa vectorial para geometrías dibujadas
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ffcc33",
          width: 2,
        }),
      }),
    });

    // Extensión de la capa WMS
    const extent = [-100.9925771, 22.961170783160195, -99.04279603662275, 27.7031194];
    const extent3857 = transformExtent(extent, "EPSG:4326", "EPSG:3857");

    // Crear el mapa
    const map = new Map({
      target: "map-container",
      layers: [baseLayer, wmsLayerEPSG3857, vectorLayer],
      view: view,
    });

    // Ajustar la vista al BBOX de la capa WMS
    map.getView().fit(extent3857, { size: map.getSize() });

    mapRef.current = map;

    // Crear un formateador WKT
    const wktFormat = new WKT();

    // Añadir interacción de dibujo
   
    const createCircleGeometryFunction = (coordinates, geometry) => {
        if (!geometry) {
          geometry = new CircleGeometry(coordinates);
        }
        return geometry;
      };
  
      const createSquareGeometryFunction = (coordinates, geometry) => {
        if (!geometry) {
          const circle = new CircleGeometry(coordinates, 5000); // Radio arbitrario
          geometry = Polygon.fromCircle(circle, 4);
        }
        return geometry;
      };
  
      const createStarGeometryFunction = (coordinates, geometry) => {
        const radius = 5000; // Radio arbitrario
        const points = 5;
        const outerRadius = radius;
        const innerRadius = radius / 2.5;
        const angle = Math.PI / points;
  
        const coords = [];
        for (let i = 0; i < 2 * points; i++) {
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const a = i * angle - Math.PI / 2;
          coords.push([
            coordinates[0] + r * Math.cos(a),
            coordinates[1] + r * Math.sin(a),
          ]);
        }
        coords.push(coords[0]); // Cerrar la estrella
  
        geometry = new Polygon([coords]);
        return geometry;
      };
      /* const addDrawInteraction = (type) => {
        let geometryFunction;
        if (type === "Circle") geometryFunction = createCircleGeometryFunction;
        if (type === "Square") geometryFunction = createSquareGeometryFunction;
        if (type === "Star") geometryFunction = createStarGeometryFunction;
  
        const draw = new Draw({
          source: vectorSource,
          type: "Circle",
          geometryFunction: geometryFunction,
        });
  
        draw.on("drawend", (event) => {
          const geometry = event.feature.getGeometry();
          const wkt = wktFormat.writeGeometry(geometry);
          setWktList((prevWktList) => [...prevWktList, wkt]);
        });
  
        map.addInteraction(draw);
      }; */
  
      // Interacciones iniciales (puedes cambiar el tipo según sea necesario)
      //addDrawInteraction("Circle"); // Dibujo por defecto
  

    // Al terminar de dibujar, convertir la geometría a WKT
    const draw = new Draw({
        source: vectorSource,
        type: "Circle", // Permite dibujar polígonos
      });
    /* draw.on("drawend", (event) => {
      const geometry = event.feature.getGeometry();
      const wkt = wktFormat.writeGeometry(geometry);
      setWktList((prevWktList) => [...prevWktList, wkt]);
    }); */

    map.addInteraction(draw);

    // Añadir interacción para modificar los polígonos
    const modify = new Modify({ source: vectorSource });
    map.addInteraction(modify);

    // Cleanup al desmontar el componente
    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <div>
      <div
        id="map-container"
        style={{ width: "100%", height: "70vh" }}
      ></div>
      <div>
        <h3>WKT de las Figuras Dibujadas:</h3>
        <ul>
          {wktList.map((wkt, index) => (
            <li key={index}>
              <textarea
                readOnly
                value={wkt}
                style={{ width: "100%", height: "80px", marginBottom: "10px" }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Poligono
