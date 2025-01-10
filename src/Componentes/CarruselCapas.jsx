import React, { useState } from 'react'
import OlLayerTile from 'ol/layer/Tile';

const CarruselCapas = ({capas,mapaPara,mapaSele}) => {
    const [indiceInicio, setIndiceInicio] = useState(0); // Índice inicial de las capas visibles
    const elementosPorPagina = 4; // Número de elementos visibles por página

    // Calcular los elementos visibles según el índice actual
    const capasVisibles = capas.slice(indiceInicio, indiceInicio + elementosPorPagina);
    

    const avanzar = () => {
        if (indiceInicio + 1 < capas.length) {
            setIndiceInicio(indiceInicio + 1);
        }
    };

    const retroceder = () => {
        if (indiceInicio - 1 >= 0) {
            setIndiceInicio(indiceInicio - 1);
        }
    };
    const cambiarfondo = (index) => {
        console.log("index", index);

        if (mapaSele != null) {
            const capasMapa = mapaSele.getLayers().getArray();
            if (capasMapa.length > 0) {
                mapaSele.removeLayer(capasMapa[0]);
            }

            const capaspara = mapaPara.getLayers().getArray();
            if (capaspara.length > 0) {
                mapaPara.removeLayer(capaspara[0]);
            }
            console.log("capasseleccionada",capas[index]);

            // Crea nuevas instancias de capas para ambos mapas
            const nuevaCapaMapaSeleccionado = new OlLayerTile({
                source: capas[index].getSource(), // Usa la misma fuente de la capa seleccionada
                properties: capas[index].getProperties()
            });

            const nuevaCapaMapaParametro = new OlLayerTile({
                source: capas[index].getSource(),
                properties: capas[index].getProperties()
            });

            nuevaCapaMapaSeleccionado.setVisible(true);
            nuevaCapaMapaParametro.setVisible(true);

            mapaSele.getLayers().insertAt(0, nuevaCapaMapaSeleccionado);
            mapaPara.getLayers().insertAt(0, nuevaCapaMapaParametro);
        }
    };

    return (
        <div className='cajaGeneral'>
            {/* Botón de retroceso */}
            <button onClick={retroceder} disabled={indiceInicio === 0}>
                &lt;
            </button>

            {/* Contenedor de las capas visibles */}
            <div className='cajaOpciones'>
                {capasVisibles.map((capa, indice) => (
                    
                    <div
                        key={indice}
                        className='opcionesCapas'
                        onClick={() => { cambiarfondo(indiceInicio+indice) }}
                    >
                        <img
                            src={capa.values_.image}
                            alt={capa.values_.name}
                            className='imagenes'
                        />
                        <div className='contenedorNombre'>
                            <pre className='nombre'>{capa?.values_?.name}</pre>
                            
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={avanzar} disabled={indiceInicio + elementosPorPagina >= capas.length}>
                &gt;
            </button>
        </div>
    );
}

export default CarruselCapas
