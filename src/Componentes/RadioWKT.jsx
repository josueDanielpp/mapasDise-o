import React, { useState } from "react";
import * as turf from "@turf/turf";
import wkt from "wkt";

const RadioWKT = () => {
  const [wktInput, setWktInput] = useState("");
  const [radio, setRadio] = useState(null);

  const calcularRadio = () => {
    try {
      // Convertir WKT a GeoJSON
      const geojson = wkt.parse(wktInput);

      if (geojson.type === "Point") {
        setRadio(0); // El radio de un punto es 0
        return;
      }

      // Calcular el círculo circunscrito
      const centroid = turf.centroid(geojson); // Centroide de la geometría
      const coords = geojson.coordinates[0]; // Coordenadas del polígono

      // Calcular la distancia máxima desde el centroide
      let maxDistance = 0;
      coords.forEach(([x, y]) => {
        const point = turf.point([x, y]);
        const distancia = turf.distance(centroid, point);
        if (distancia > maxDistance) {
          maxDistance = distancia;
        }
      });

      setRadio(maxDistance); // Actualizar el estado con el radio
    } catch (error) {
      console.error("Error al procesar el WKT:", error);
      setRadio("Error en el WKT ingresado");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Calcular Radio de WKT</h2>
      <textarea
        placeholder="Ingresa una geometría WKT..."
        rows={4}
        cols={50}
        value={wktInput}
        onChange={(e) => setWktInput(e.target.value)}
      />
      <br />
      <button onClick={calcularRadio}>Calcular Radio</button>
      {radio !== null && (
        <p>
          <strong>Radio:</strong> {radio}
        </p>
      )}
    </div>
  );
};

export default RadioWKT;
