import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import { Tile as TileLayer } from "ol/layer";
import { OSM } from "ol/source";
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Polygon } from "ol/geom";

const DrawShapesExample = () => {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const [drawType, setDrawType] = useState(null);

  useEffect(() => {
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
        center: [0, 0],
        zoom: 2,
      }),
    });

    mapRef.current = map;
    return () => map.setTarget(null);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;

      // Remove existing interactions
      map.getInteractions().getArray().forEach((interaction) => {
        if (interaction instanceof Draw || interaction instanceof Modify) {
          map.removeInteraction(interaction);
        }
      });

      // Add Modify interaction
      const modify = new Modify({
        source: sourceRef.current,
      });
      map.addInteraction(modify);

      // Add Snap interaction
      const snap = new Snap({
        source: sourceRef.current,
      });
      map.addInteraction(snap);

      if (drawType) {
        const geometryFunction =
          drawType === "Square"
            ? createSquare
            : drawType === "Rectangle"
            ? createRectangle
            : drawType === "Star"
            ? createStar
            : undefined;

        const draw = new Draw({
          source: sourceRef.current,
          type: drawType === "Square" || drawType === "Rectangle" || drawType === "Star" ? "Circle" : drawType,
          geometryFunction,
        });
        map.addInteraction(draw);
      }
    }
  }, [drawType]);

  const createSquare = (coordinates, geometry) => {
    const [center, radius] = coordinates;
    const squareCoords = [
      [
        [center[0] - radius, center[1] - radius],
        [center[0] + radius, center[1] - radius],
        [center[0] + radius, center[1] + radius],
        [center[0] - radius, center[1] + radius],
        [center[0] - radius, center[1] - radius],
      ],
    ];
    if (!geometry) {
      geometry = new Polygon([]);
    }
    geometry.setCoordinates(squareCoords);
    return geometry;
  };

  const createRectangle = (coordinates, geometry) => {
    const [center, radius] = coordinates;
    const rectangleCoords = [
      [
        [center[0] - radius, center[1] - radius / 2],
        [center[0] + radius, center[1] - radius / 2],
        [center[0] + radius, center[1] + radius / 2],
        [center[0] - radius, center[1] + radius / 2],
        [center[0] - radius, center[1] - radius / 2],
      ],
    ];
    if (!geometry) {
      geometry = new Polygon([]);
    }
    geometry.setCoordinates(rectangleCoords);
    return geometry;
  };

  const createStar = (coordinates, geometry) => {
    const [center, radius] = coordinates;
    const numPoints = 10; // Number of points
    const step = (Math.PI * 2) / numPoints;

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = i * step;
      const r = i % 2 === 0 ? radius : radius / 2; // Alternate radius
      points.push([
        center[0] + Math.cos(angle) * r,
        center[1] + Math.sin(angle) * r,
      ]);
    }
    points.push(points[0]); // Close the star

    if (!geometry) {
      geometry = new Polygon([]);
    }
    geometry.setCoordinates([points]);
    return geometry;
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setDrawType("Point")}>Point</button>
        <button onClick={() => setDrawType("LineString")}>LineString</button>
        <button onClick={() => setDrawType("Polygon")}>Polygon</button>
        <button onClick={() => setDrawType("Circle")}>Circle</button>
        <button onClick={() => setDrawType("Square")}>Square</button>
        <button onClick={() => setDrawType("Rectangle")}>Rectangle</button>
        <button onClick={() => setDrawType("Star")}>Star</button>
        <button onClick={() => setDrawType(null)}>Stop Drawing</button>
      </div>
      <div
        ref={mapElement}
        style={{
          width: "100%",
          height: "500px",
          border: "1px solid black",
        }}
      ></div>
    </div>
  );
};

export default DrawShapesExample;
