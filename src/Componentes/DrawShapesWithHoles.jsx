import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import { defaults as defaultControls } from "ol/control";

const DrawShapesWithHoles = () => {
  const mapElement = useRef(null);
  const mapRef = useRef(null); // Map instance
  const sourceRef = useRef(new VectorSource()); // Vector source for drawings
  const [drawType, setDrawType] = useState(null); // Store the current draw type

  useEffect(() => {
    // Initialize the map
    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: sourceRef.current,
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
      controls: defaultControls(), // Default map controls
    });

    mapRef.current = map;
    return () => map.setTarget(null); // Cleanup map on component unmount
  }, []);

  useEffect(() => {
    if (mapRef.current && drawType) {
      const map = mapRef.current;

      // Remove existing interactions
      map.getInteractions().getArray().forEach((interaction) => {
        if (interaction instanceof Draw || interaction instanceof Modify) {
          map.removeInteraction(interaction);
        }
      });

      // Add new drawing interaction
      const draw = new Draw({
        source: sourceRef.current,
        type: drawType,
      });

      const modify = new Modify({
        source: sourceRef.current,
      });

      const snap = new Snap({
        source: sourceRef.current,
      });

      map.addInteraction(draw);
      map.addInteraction(modify);
      map.addInteraction(snap);
    }
  }, [drawType]);

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setDrawType("Point")}>Point</button>
        <button onClick={() => setDrawType("LineString")}>LineString</button>
        <button onClick={() => setDrawType("Polygon")}>Polygon</button>
        <button onClick={() => setDrawType("Circle")}>Circle</button>
        <button onClick={() => setDrawType(null)}>Stop Drawing</button>
      </div>
      <div
        ref={mapElement}
        style={{ width: "100%", height: "500px", border: "1px solid black" }}
      ></div>
    </div>
  );
};

export default DrawShapesWithHoles;
