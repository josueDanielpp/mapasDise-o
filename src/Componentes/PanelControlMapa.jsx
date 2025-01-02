import React, { useEffect, useRef, useState } from 'react'
import '../assets/Css/PanelControlMapa.scss'
import { PiCursorClickThin as Mouse, PiSelectionBackgroundFill as Fondo, PiSelectionPlus as Seleccion } from "react-icons/pi";
import { BsVectorPen as Poligono } from "react-icons/bs";
import { RxCircle as Circulo } from "react-icons/rx";
import { BiArrowBack as Regreso } from "react-icons/bi";
import { MdOutlineCancel as Cancelar } from "react-icons/md";
import { TileWMS, Vector } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import WKT from 'ol/format/WKT';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Draw, { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import { Polygon } from 'ol/geom';
import { Overlay } from 'ol';
import { transform } from 'ol/proj';
import { getDistance } from 'ol/sphere';




const PanelControlMapa = ({ mapa }) => {
    const [funcionalidaes, setFuncionalidades] = useState({
        dibujar: true,
        hover: true,
        fondo: true,
    });
    const [funcionAcual, setFuncionActual] = useState('Menu');
    const [capasenMapa, setCapasenMapa] = useState([]);
    const [tipo, setTipo] = useState("None");
    const [color, setColor] = useState("#FFFF00");
    const herramientaRef = useRef(false);
    const drawStyleRef = useRef();
    const [vectorColocado, setVectorColocado] = useState(false);



    const cambiarFuncion = (funcion) => {
        setFuncionActual(funcion);
    }
    /*  const handleClear = () => {
         const vectorSource = mapa.getLayers().getArray()[2].getSource();
         vectorSource.clear();
     }; */

    useEffect(() => {
        if (mapa !== undefined && mapa !== null) {
            setCapasenMapa(obtenerCapas());
            if (funcionAcual === 'Dibujar' && vectorColocado == false) {
                colocarVector();
                setVectorColocado(true);
            }
        }
    }, [mapa]);
    useEffect(() => {
        if (!mapa) return;
        const vectorLayer = mapa.getLayers().getArray().find(layer => layer instanceof VectorLayer);
        if (vectorLayer) {
            vectorLayer.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`
                    }),
                })
            );
        }
        if (drawStyleRef.current) {
            console.log("Color actualizado:", drawStyleRef.current);

            drawStyleRef.current.overlay_.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`,
                    }),
                })
            );
        }

    }, [color]);
    useEffect(() => {
        if (!mapa) return;
        if (herramientaRef.current == false) {

            let geometryFunction;
            let drawInteraction;
            if (tipo !== 'None') {
                limpiarDibujo();
                if (tipo === 'Square') {
                    geometryFunction = createRegularPolygon(4);
                } else if (tipo === 'Box') {
                    geometryFunction = createBox();
                } else if (tipo === 'Star') {
                    geometryFunction = (coordinates, geometry) => {
                        const center = coordinates[0];
                        const last = coordinates[coordinates.length - 1];
                        const dx = center[0] - last[0];
                        const dy = center[1] - last[1];
                        const radius = Math.sqrt(dx * dx + dy * dy);
                        const rotation = Math.atan2(dy, dx);
                        const newCoordinates = [];
                        const numPoints = 12;
                        for (let i = 0; i < numPoints; ++i) {
                            const angle = rotation + (i * 2 * Math.PI) / numPoints;
                            const fraction = i % 2 === 0 ? 1 : 0.5;
                            const offsetX = radius * fraction * Math.cos(angle);
                            const offsetY = radius * fraction * Math.sin(angle);
                            newCoordinates.push([center[0] + offsetX, center[1] + offsetY]);
                        }
                        newCoordinates.push(newCoordinates[0].slice());
                        if (!geometry) {
                            geometry = new Polygon([newCoordinates]);
                        } else {
                            geometry.setCoordinates([newCoordinates]);
                        }
                        return geometry;
                    };
                }

                const vectorSource = mapa.getLayers().getArray()[2].getSource();
                const drawStyle = new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`
                    }),
                });
                const overlayrecuperado = document.getElementById('overlay-label');
                if (overlayrecuperado) {
                    overlayrecuperado.remove();
                }
                drawInteraction = new Draw({
                    source: vectorSource,
                    type: tipo === 'Square' || tipo === 'Box' || tipo === 'Star' ? 'Circle' : tipo,
                    geometryFunction,
                    style: drawStyle,
                });
                drawStyleRef.current = drawInteraction;
                let overlayElement = document.createElement('div');
                overlayElement.className = 'ol-overlay-label';
                overlayElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                overlayElement.style.border = '1px solid #000';
                overlayElement.style.padding = '5px';
                overlayElement.style.borderRadius = '5px';
                overlayElement.id = 'overlay-label';
                const overlayLabel = new Overlay({
                    element: overlayElement,
                    positioning: 'center-center',
                    stopEvent: false,
                });

                mapa.addOverlay(overlayLabel);

                drawInteraction.on("drawstart", (event) => {
                    limpiarDibujo();


                    const geometry = event.feature.getGeometry();
                    if (geometry?.getType() === 'Circle') {
                        const circleGeometry = geometry;
                        const radiusLabel = overlayLabel.getElement();
                        radiusLabel.style.background = 'rgba(255, 255, 255, 0.8)';
                        radiusLabel.style.padding = '5px';
                        radiusLabel.style.border = '1px solid #ccc';
                        radiusLabel.style.borderRadius = '4px';
                        radiusLabel.style.whiteSpace = 'nowrap';
                        radiusLabel.style.color = 'Black';

                        geometry.on('change', () => {
                            const center = circleGeometry.getCenter();
                            const radius = circleGeometry.getRadius();
                            const edgePoint = [center[0] + radius, center[1]];
                            const center4326 = transform(center, 'EPSG:3857', 'EPSG:4326');
                            const edge4326 = transform(edgePoint, 'EPSG:3857', 'EPSG:4326');
                            const radiusInMeters = getDistance(center4326, edge4326);
                            overlayLabel.setPosition(center);
                            radiusLabel.innerHTML = `Radio: ${radiusInMeters.toFixed(2)} m`;

                        });
                    }
                });

                mapa.addInteraction(drawInteraction);
            }
            return () => {
                if (drawInteraction) {
                    mapa.removeInteraction(drawInteraction);
                }
            };
        }

    }, [tipo]);
    useEffect(() => {
        if (!mapa) return;
        const vectorLayer = mapa.getLayers().getArray().find(layer => layer instanceof VectorLayer);
        if (vectorLayer) {
            vectorLayer.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`
                    }),
                })
            );
        }
        if (drawStyleRef.current) {
            console.log("Color actualizado:", drawStyleRef.current);

            drawStyleRef.current.overlay_.setStyle(
                new Style({
                    stroke: new Stroke({
                        color: color,
                        width: 2,
                    }),
                    fill: new Fill({
                        color: `${color}80`,
                    }),
                })
            );
        }

    }, [color]);
    const colocarVector = () => {
        const source = new VectorSource({ wrapX: false });
        const featureStyle = new Style({
            stroke: new Stroke({
                color: color,
                width: 2,
            }),
            fill: new Fill({
                color: `${color}80`,
            }),
        });
        const vector = new VectorLayer({
            source: source,
            style: featureStyle,
        });
        mapa.addLayer(vector);
    }
    const limpiarDibujo = () => {
        if (mapa != undefined && mapa != null) {
            const vectorSource = mapa.getLayers().getArray()[2].getSource();
            vectorSource.clear();
        }
    }

    /* 
        const colocarVectorConWKT = (mapa, wkt, color = 'red') => {
            const source = new VectorSource({ wrapX: false });
        
            const featureStyle = new Style({
                stroke: new Stroke({
                    color: color, 
                    width: 2,    
                }),
                fill: new Fill({
                    color: `${color}80`, 
                }),
            });
        
            const vector = new VectorLayer({
                source: source,
                style: featureStyle,
            });
        
            try {
                const feature = wktFormat.readFeature(wkt, {
                    dataProjection: 'EPSG:3857', 
                    featureProjection: 'EPSG:3857', 
                });
        
                source.addFeature(feature);
        
                const existingLayers = mapa.getLayers().getArray();
                const existingLayerIndex = existingLayers.findIndex(layer => layer instanceof VectorLayer);
        
                if (existingLayerIndex !== -1) {
                    mapa.removeLayer(existingLayers[existingLayerIndex]);
                    console.log("Capa vectorial existente eliminada.");
                }
        
                mapa.addLayer(vector);
                console.log("Capa vectorial con WKT añadida correctamente.");
            } catch (error) {
                console.error("Error al procesar el WKT:", error);
            }
        };
        
     */
    const llamada = (capaSeleccionada) => {
        colocarEvento(capaSeleccionada);
    }
    let habilitarHover = true;
    let hoverEventHandler = null;

    const colocarEvento = async (capaSeleccionada) => {
        console.log("Capa seleccionada:", capaSeleccionada);

        if (mapa !== undefined && mapa !== null) {
            let hoverTimeout = null;
            let lastCoordinates = null;

            if (hoverEventHandler) {
                mapa.un('pointermove', hoverEventHandler);
            }

            hoverEventHandler = (event) => {
                if (!habilitarHover) {
                    return;
                }

                const coordinates = event.coordinate;
                if (lastCoordinates && lastCoordinates[0] === coordinates[0] && lastCoordinates[1] === coordinates[1]) {
                    return;
                }

                lastCoordinates = coordinates;

                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }

                hoverTimeout = setTimeout(() => {
                    peticionhover(capaSeleccionada, coordinates, event);
                    lastCoordinates = null;
                }, 1000);
            };

            mapa.on('pointermove', hoverEventHandler);
        }
    };
    const ativarHover = (estado) => {
        habilitarHover = estado; // Cambia el estado de la funcionalidad
        console.log(`Hover habilitado: ${habilitarHover}`);
    };

    function calcularAreaPixel(centerCoord, resolution) {
        const halfPixel = resolution * 2;
        return {
            topLeft: [centerCoord[0] - halfPixel, centerCoord[1] + halfPixel],
            topRight: [centerCoord[0] + halfPixel, centerCoord[1] + halfPixel],
            bottomLeft: [centerCoord[0] - halfPixel, centerCoord[1] - halfPixel],
            bottomRight: [centerCoord[0] + halfPixel, centerCoord[1] - halfPixel],
        };
    }


    const peticionhover = async (capaSeleccionada, coordenadas, event) => {
        const endpoint = "http://192.168.1.71:8082/datasets/getWKTPrimaryKeyValues";
        const dataset = capaSeleccionada;
        const view = mapa.getView();
        const resolution = view.getResolution();
        const pixelAreaCoordenadas = calcularAreaPixel(coordenadas, resolution);
        const areaPixelWkt = areaPixelaWkt(pixelAreaCoordenadas);
        /*         colocarVectorConWKT(mapa, areaPixelWkt);*/
        const body = {
            dataset: dataset,
            wkt: areaPixelWkt,
        };

        const queryParams = {
            page: 1,
            size: 20,
        };
        const url = `${endpoint}?page=${queryParams.page}&size=${queryParams.size}&allData=true`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud: ${response.statusText}`);
            }
            const data = await response.json();
            mostrarPopup(data, event);

            return data;
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    }
    /* const mostrarPopup = (data, event) => {
        console.log("Datos obtenidos:", data.totalPaginas );
        if (data.totalPaginas != 0 && data.lista != undefined) {
            let popupContainer = document.getElementById("popup");
            if (!popupContainer) {
                popupContainer = document.createElement("div");
                popupContainer.id = "popup";
                popupContainer.style.position = "fixed";
                popupContainer.style.padding = "10px";
                popupContainer.style.border = "1px solid black";
                popupContainer.style.borderRadius = "5px";
                popupContainer.style.backgroundColor = "rgb(24,27,31)";
                popupContainer.style.color = "white";
                popupContainer.style.width = "400px";
                popupContainer.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.5)";
                popupContainer.style.zIndex = "1000";
                popupContainer.style.overflowY = "auto";
                document.body.appendChild(popupContainer);
            }

            const mouseX = event.originalEvent.clientX;
            const mouseY = event.originalEvent.clientY;
            popupContainer.style.left = `${mouseX + 10}px`;
            popupContainer.style.top = `${mouseY + 10}px`;

            const item = data.lista[0];
            let htmlContent = "<table style='width: 100%; border-collapse: collapse;'>";

            for (const key in item) {
                if (item.hasOwnProperty(key)) {
                    htmlContent += `
                <tr>
                  <td style="font-weight: bold; border: 1px solid #ccc; padding: 5px;">${key}</td>
                  <td style="border: 1px solid #ccc; padding: 5px;">${item[key]}</td>
                </tr>`;
                }
            }

            htmlContent += "</table>";
            popupContainer.innerHTML = `
            <button id="close-popup" style="float: right; background: red; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">X</button>
            ${htmlContent}
          `;

            // Agregar evento para cerrar el popup
            document.getElementById("close-popup")?.addEventListener("click", () => {
                popupContainer?.remove();
            });
        }
    }; */
    const mostrarPopup = (data, event) => {
        let popupContainer = document.getElementById("popup");
        let contador = 0;
        if (data.totalRegistros !== 0) {
            if (!popupContainer) {
                popupContainer = document.createElement("div");
                popupContainer.id = "popup";
                popupContainer.style.position = "fixed"; // Usar fixed para posicionarlo en la ventana
                popupContainer.style.padding = "10px";
                popupContainer.style.border = "1px solid black";
                popupContainer.style.borderRadius = "5px";
                popupContainer.style.backgroundColor = "rgb(24,27,31)";
                popupContainer.style.color = "white";
                popupContainer.style.width = "400px";
                popupContainer.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.5)";
                popupContainer.style.zIndex = "1000"; // Asegurar que sobresalga
                popupContainer.style.overflowY = "auto";
                document.body.appendChild(popupContainer);
            }

            // Calcular la posición del popup según la posición del mouse
            const mouseX = event.originalEvent.clientX; // Posición X del mouse en la pantalla
            const mouseY = event.originalEvent.clientY; // Posición Y del mouse en la pantalla
            popupContainer.style.left = `${mouseX + 10}px`; // Desplazar un poco para no cubrir el cursor
            popupContainer.style.top = `${mouseY + 10}px`; // Desplazar un poco para no cubrir el cursor

            // Construir la tabla con los datos obtenidos
            console.log(data.totalRegistros)
            let htmlContent = `<span style="text-align:center; display: flex; justify-content: space-between;"><button id="data-left" style="background: gray; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"><</button><h6 id="indicador-registro"  style="float: center;">${contador + 1}/${data.totalRegistros}</h6><button id="data-rigth" style="background: gray; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">></button></span>
          <table id="tabla-datos" style='width: 100%; border-collapse: collapse;'>`;
            //  <table style='width: 100%; border-collapse: collapse;'>`;

            htmlContent += crearHTMLPopUp(contador, data);
            popupContainer.innerHTML = `
            ${htmlContent}
            </table>
          `;


            document.getElementById("data-left")?.addEventListener("click", () => {
                if (contador !== 0) {
                    contador--;
                }
                htmlContent = `${crearHTMLPopUp(contador, data)}`
                let tablaDatos = document.getElementById("tabla-datos");
                if (tablaDatos) {
                    tablaDatos.innerHTML = htmlContent;
                }
            });
            document.getElementById("data-rigth")?.addEventListener("click", () => {
                if (contador <= data.totalRegistros) {
                    contador++;
                }
                htmlContent = `${crearHTMLPopUp(contador, data)}`
                let tablaDatos = document.getElementById("tabla-datos");
                if (tablaDatos) {
                    tablaDatos.innerHTML = htmlContent;
                }
            });
        } else {
            popupContainer?.remove();
        }
    }

    const crearHTMLPopUp=(registro, data)=> {
        const item = data.lista[registro];
        console.log(data.totalRegistros)
        let htmlTable = ``;
        for (const key in item) {
            if (item.hasOwnProperty(key)) {
                htmlTable += `
              <tr>
                <td style="font-weight: bold; border: 1px solid #ccc; padding: 5px;">${key}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${item[key]}</td>
              </tr>`;
            }
        }

        let textoRegistro = document.getElementById("indicador-registro");
        if (textoRegistro) {
            textoRegistro.innerHTML = `${registro + 1}/${data.totalRegistros}`;
        }

        return htmlTable;
    }


    const areaPixelaWkt = (pixelAreaCoords) => {
        const { topLeft, topRight, bottomRight, bottomLeft } = pixelAreaCoords;
        const wkt = `POLYGON((
          ${topLeft[0]} ${topLeft[1]},
          ${topRight[0]} ${topRight[1]},
          ${bottomRight[0]} ${bottomRight[1]},
          ${bottomLeft[0]} ${bottomLeft[1]},
          ${topLeft[0]} ${topLeft[1]}  
        ))`;
        return wkt;
    }

    const obtenerCapas = () => {
        console.log("mapa", mapa);
        const layers = mapa.getLayers().getArray();
        const layerNames = layers.map((layer) => {
            const source = layer.getSource();
            if (source instanceof TileWMS) {
                return source.getParams().LAYERS;
            }
            return null;
        });

        for (let indice in layerNames) {
            if (layerNames[indice] != null) {
                let capaswms = layerNames[indice].split(",");
                return capaswms;
            }
        }
    }

    return (
        <div className='cajaPanelControlMapa' >
            <div className='panelIconos'>
                {/*funcion menu */}
                {(funcionAcual === 'Menu') && (<>
                    {funcionalidaes.dibujar && (<Seleccion className='iconos' onClick={() => cambiarFuncion("Dibujar")} />)}
                    {funcionalidaes.hover && (<Mouse className='iconos' onClick={() => cambiarFuncion("Hover")} />)}
                    {funcionalidaes.fondo && (<Fondo className='iconos' onClick={() => cambiarFuncion("Fondo")} />)}
                </>)}
                {/*funcion Dibujar */}
                {funcionAcual === 'Dibujar' && (<>
                    <Regreso className='iconos' onClick={() => cambiarFuncion("Menu")} />
                    {funcionalidaes.dibujar && (
                        <>
                            {tipo == "Polygon" && (<Cancelar className='iconos' onClick={() => { setTipo("None") }} />)}
                            {tipo != "Polygon" && (<Poligono className='iconos' onClick={() => { setTipo("Polygon") }} />)}
                            {tipo == "Circle" && (<Cancelar className='iconos' onClick={() => { setTipo("None") }} />)}
                            {tipo != "Circle" && (<Circulo className='iconos' onClick={() => { setTipo("Circle") }} />)}
                            <input type="color" name="" className='iconos' value={color} id="" onChange={(e) => { setColor(e.target.value) }} />
                        </>
                    )}
                </>)}
                {funcionAcual === 'Hover' && (<>
                    {funcionalidaes.hover && (
                        <>
                            <Regreso className='iconos' onClick={() => { cambiarFuncion("Menu"); ativarHover(false) }} />
                            {/*Desglose de capas existentes*/}
                            {capasenMapa.map((capa, index) => {
                                const [nomenclatura, nombreCapa] = capa.split(':');
                                return (
                                    <div key={index} className='capas'>
                                        <input
                                            type="radio"
                                            name="capas"
                                            id={nombreCapa}
                                            value={nombreCapa}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    llamada(nombreCapa);
                                                }
                                            }}
                                        />
                                        <label htmlFor={nombreCapa}>{nombreCapa}</label>
                                    </div>
                                );
                            })}
                        </>)
                    }
                </>)}
            </div>
        </div>
    )
}

export default PanelControlMapa
