import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { Style, Stroke } from 'ol/style';
import * as olSphere from 'ol/sphere';
import WKT from 'ol/format/WKT';

const DistanceMeasurementMap = ({ wktString }) => {
  const mapRef = useRef(null);
  const vectorLayerRef = useRef(null);

  useEffect(() => {
    // Crear la fuente vectorial
    const vectorSource = new VectorSource();

    // Si hay un WKT proporcionado, agregar la geometría
    if (wktString) {
      const format = new WKT();
      const feature = format.readFeature(wktString, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      vectorSource.addFeature(feature);
    }

    // Crear la capa vectorial
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
      }),
    });
    vectorLayerRef.current = vectorLayer;

    // Crear el mapa
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([-100.0, 40.0]), // Ajustar la ubicación inicial
        zoom: 4,
      }),
    });

    // Agregar interacción de dibujo
    const draw = new Draw({
      source: vectorSource,
      type: 'LineString',
    });
    map.addInteraction(draw);

    // Escuchar el evento de finalización del dibujo
    draw.on('drawend', (event) => {
      const geometry = event.feature.getGeometry();
      const length = olSphere.getLength(geometry);
      alert(`Distancia: ${length.toFixed(2)} metros`);
    });

    return () => {
      map.setTarget(null);
    };
  }, [wktString]);

  return (
    <div>
      <h2>Mapa de Medición de Distancias</h2>
      <div
        ref={mapRef}
        style={{ width: '100%', height: '500px', border: '1px solid black' }}
      ></div>
    </div>
  );
};

export default DistanceMeasurementMap;
