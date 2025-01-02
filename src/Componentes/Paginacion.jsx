import React, { useEffect, useState } from 'react'
import { use } from 'react'

const Paginacion = ({ wkt, capa }) => {
  const urlvar = "http://192.168.1.71:8082/datasets/getWKTPrimaryKeyValues"
  const [lista, setLista] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    console.log("veamosanes", capa)
    if (wkt && capa) {


      paginacion(1);
    }
    //
  }, [wkt])
  const paginacion = (page) => {
    const nombre = capa.split(":");
    const body = {
      dataset: nombre[1],
      wkt: wkt
    };

    fetch(urlvar + "?page=" + page, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Respuesta del servidor:", data);
        setLista(data.lista);
        setTotalPaginas(data.totalPaginas);
        setPaginaActual(data.paginaActual)

      })
      .catch(error => {
        console.error("Error en la petición:", error);
      });
  }
  return (
    <div>
      {lista.length > 0 && (
        <>
          <h1>{capa}</h1>
          {lista.map((objeto, index) => (
            <div key={index} style={{ margin: '10px 0', border: '1px solid gray', padding: '10px' }}>
              {Object.entries(objeto).map(([clave, valor]) => (
                <p key={clave}>
                  <strong>{clave}: </strong> {valor}
                </p>
              ))}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <button
              onClick={() => paginacion(Math.max(1, paginaActual - 1))}
              disabled={paginaActual === 1}
              style={{
                margin: '0 5px',
                padding: '10px',
                cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Anterior
            </button>

            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const numero = Math.max(1, paginaActual - 2) + i;
              if (numero > totalPaginas) return null; 

              return (
                <button
                  key={numero}
                  onClick={() => paginacion(numero)}
                  style={{
                    margin: '0 5px',
                    padding: '10px',
                    border: numero === paginaActual ? '2px solid black' : '1px solid gray',
                    backgroundColor: numero === paginaActual ? 'lightgray' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  {numero}
                </button>
              );
            })}
            <button
              onClick={() => paginacion(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual === totalPaginas}
              style={{
                margin: '0 5px',
                padding: '10px',
                cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
              }}
            >
              Siguiente
            </button>
          </div>
        </>
      )
      }
    </div>
  )
}

export default Paginacion
