import React, { useEffect, useRef, useState } from 'react'
import '../assets/Css/PanelControlMapa.scss'
import { PiCursorClickThin as Mouse, PiSelectionBackgroundFill as Fondo, PiSelectionPlus as Seleccion } from "react-icons/pi";
import { BsVectorPen as Poligono } from "react-icons/bs";
import { RxCircle as Circulo } from "react-icons/rx";
import { BiArrowBack as Regreso } from "react-icons/bi";
import { MdOutlineCancel as Cancelar } from "react-icons/md";
import { TileWMS, Vector } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Draw, { createBox, createRegularPolygon } from 'ol/interaction/Draw';
import { Polygon } from 'ol/geom';
import { Overlay } from 'ol';
import { transform } from 'ol/proj';
import { getDistance } from 'ol/sphere';
import OlLayerTile from 'ol/layer/Tile';
import OlSourceOsm from 'ol/source/OSM';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceXYZ from 'ol/source/XYZ';


const PanelControlMapa = ({ mapa }) => {
    const endpoint = "http://192.168.1.71:8082/datasets/getWKTPrimaryKeyValues";
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
    const [elementohover, setElementoHover] = useState(null);
    const [mostrarCapas, setMostrarCapas] = useState(false);
    const capaActualSeleccionar = useRef("");
    const [alias, setAlias] = useState("");
    const aliasActualRef = useRef("");


    const fijar = useRef(false);

    const [capaSeleccionada, setCapaSeleccionada] = useState(null);

    let habilitarHover=useRef(false);
    const opcionCapas = [
        new OlLayerTile({
            source: new OlSourceOsm(),
            properties: {
                name: 'OSM',
                isBackgroundLayer: true,
                type: 'OpenStreetMap',
                description: 'OpenStreetMap base layer',
                minZoom: 0,
                maxZoom: 19,
                opacity: 1.0,
                attributions: '© OpenStreetMap contributors'
            }
        }),
        new OlLayerTile({
            visible: false,
            source: new OlSourceTileWMS({
                url: 'https://sgx.geodatenzentrum.de/wms_topplus_open',
                params: {
                    LAYERS: 'web'
                },
                attributions: '© <a href="https://www.bkg.bund.de">Bundesamt für Kartographie und Geodäsie' +
                    `(${new Date().getFullYear()})</a>, ` +
                    '<a href="https://sgx.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html">' +
                    'Datenquellen</a>'
            }),
            properties: {
                name: 'BKG',
                isBackgroundLayer: true,
                type: 'WMS',
                description: 'TopPlusOpen WMS layer',
                minZoom: 1,
                maxZoom: 18,
                opacity: 0.9,
                attributions: '© Bundesamt für Kartographie und Geodäsie'
            }
        }),
        new OlLayerTile({
            source: new OlSourceOsm({
                url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            }),
            properties: {
                name: 'OSM HOT',
                isBackgroundLayer: true,
                type: 'OpenStreetMap',
                description: 'OpenStreetMap HOT layer',
                minZoom: 0,
                maxZoom: 19,
                opacity: 1.0,
                attributions: '© OpenStreetMap contributors'
            }
        }),
        new OlLayerTile({
            visible: false,
            source: new OlSourceTileWMS({
                url: 'https://ows.terrestris.de/osm/service?',
                params: {
                    LAYERS: 'OSM-WMS'
                },
                attributions: 'Map data © OpenStreetMap contributors'
            }),
            properties: {
                name: 'Terrestris OSM',
                isBackgroundLayer: true,
                type: 'WMS',
                description: 'Terrestris OpenStreetMap WMS layer',
                minZoom: 1,
                maxZoom: 18,
                opacity: 0.8,
                attributions: '© OpenStreetMap contributors'
            }
        }),
        new OlLayerTile({
            source: new OlSourceXYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            }),
            properties: {
                name: 'ArcGIS Imagery',
                isBackgroundLayer: true,
                type: 'XYZ',
                description: 'ArcGIS World Imagery base layer',
                minZoom: 0,
                maxZoom: 22,
                opacity: 1.0,
                attributions: '© Esri, Maxar, Earthstar Geographics'
            }
        }),
        new OlLayerTile({
            source: new OlSourceXYZ({
                url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'
            }),
            properties: {
                name: 'CartoDB Positron',
                isBackgroundLayer: true,
                type: 'XYZ',
                description: 'CartoDB Positron base layer',
                minZoom: 0,
                maxZoom: 20,
                opacity: 1.0,
                attributions: '© CartoDB'
            }
        })
    ];



    const cambiarFuncion = (funcion) => {
        setFuncionActual(funcion);
    }
    const procesarNombresCapas = (capas) => {
        return capas.map((capa) => {
            if (capa.startsWith('geonode:')) {
                return capa.replace('geonode:', ''); // Elimina el prefijo geonode:
            }
            return capa; // Si no tiene geonode:, la deja tal cual
        });
    };
    useEffect(() => {
        const hacerPeticion = async () => {
            try {
                const capasfiltradas = procesarNombresCapas(capasenMapa);
                const response = await fetch('http://192.168.1.71:8082/datasets/getDescName', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        layersNames: capasfiltradas,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Error en la petición: ${response.status}`);
                }

                const data = await response.json();
                console.log('Respuesta del servidor:', data.data);
                const datos = data.data;

                setAlias(procesarNombresCapas(datos));
                // Aquí puedes manejar la respuesta, por ejemplo, guardarla en el estado
            } catch (error) {
                console.error('Error en la petición HTTP:', error);
            }
        };

        if (capasenMapa && capasenMapa.length > 0) {
            hacerPeticion();
        }

    }, [capasenMapa]);


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



    let hoverEventHandler = null;

    /*    const colocarEvento = async () => {
           if (!elementohover) {
               console.log("Capa seleccionada:", capaActualSeleccionar.current);
   
               if (mapa !== undefined && mapa !== null) {
                   let hoverTimeout = null;
                   let lastCoordinates = null;
   
                   if (hoverEventHandler) {
                       mapa.un('pointermove', hoverEventHandler);
                   }
                   const listeners = mapa?.getListeners('pointermove');
                   listeners?.forEach((listener) => {
                       mapa.un('pointermove', listener.listener);
                   });
   
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
                           if (fijar.current == false) {
                               peticionhover(coordinates, event);
                               lastCoordinates = null;
                           }
   
                       }, 500);
                   };
   
                   mapa.on('pointermove', hoverEventHandler);
               }
           }
   
       }; */
    const colocarEvento = async () => {
        if (!elementohover) {
            console.log("Capa seleccionada:", capaActualSeleccionar.current);

            if (mapa !== undefined && mapa !== null) {
                let hoverTimeout = null;
                let lastCoordinates = null;

                // Elimina cualquier listener previo
                if (hoverEventHandler) {
                    mapa.un('pointermove', hoverEventHandler);
                }
                const listeners = mapa?.getListeners('pointermove');
                listeners?.forEach((listener) => {
                    mapa.un('pointermove', listener);
                });

                // Función para manejar la interacción (reutilizable)
                const handleInteraction = (coordinates, event, delay = 0) => {
                    if (lastCoordinates && lastCoordinates[0] === coordinates[0] && lastCoordinates[1] === coordinates[1]) {
                        return;
                    }

                    lastCoordinates = coordinates;

                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                    }

                    hoverTimeout = setTimeout(() => {
                        if (fijar.current == false) {
                            peticionhover(coordinates, event);
                            lastCoordinates = null;
                        }
                    }, delay);
                };

                // Manejador de eventos para pointermove (con retraso)
                hoverEventHandler = (event) => {
                    if (!habilitarHover.current) {
                        return;
                    }
                    const coordinates = event.coordinate;
                    handleInteraction(coordinates, event, 500);
                };

                // Manejador de eventos para click (sin retraso)
                const clickEventHandler = (event) => {
                    const coordinates = event.coordinate;
                    handleInteraction(coordinates, event, 0); // Sin retraso
                };

                // Asocia los eventos al mapa
                mapa.on('pointermove', hoverEventHandler);
                mapa.on('click', clickEventHandler);
            }
        }
    };

    const ativarHover = (estado) => {
        habilitarHover.current = estado;
        console.log(`Hover habilitado: ${habilitarHover}`);
    };

    const calcularAreaPixel = (centerCoord, resolution, tolerancia = 1) => {
        const halfPixel = resolution * tolerancia;
        return {
            topLeft: [centerCoord[0] - halfPixel, centerCoord[1] + halfPixel],
            topRight: [centerCoord[0] + halfPixel, centerCoord[1] + halfPixel],
            bottomLeft: [centerCoord[0] - halfPixel, centerCoord[1] - halfPixel],
            bottomRight: [centerCoord[0] + halfPixel, centerCoord[1] - halfPixel],
        };
    }
    const calcularTolerancia = (zoom) => {
        const zoomMin = 1;
        const zoomMax = 20;
        const toleranciaMin = 1;
        const toleranciaMax = 5;

        console.log("Tolerancia", toleranciaMin + ((zoom - zoomMin) / (zoomMax - zoomMin)) * (toleranciaMax - toleranciaMin));
        return toleranciaMin + ((zoom - zoomMin) / (zoomMax - zoomMin)) * (toleranciaMax - toleranciaMin);
    }

    const detectarMouseHover = (elementId) => {
        const element = document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.addEventListener("mouseenter", () => {
            fijar.current = true;
        });

        element.addEventListener("mouseleave", () => {
            fijar.current = false;
            const popupElement = document.getElementById('popup');
            if (popupElement) {
                popupElement.remove();
            }
        });
    };


    const peticionhover = async (coordenadas, event) => {

        const dataset = capaActualSeleccionar.current;
        const view = mapa.getView();
        const zoom = view.getZoom();
        const resolution = view.getResolution();
        const pixelAreaCoordenadas = calcularAreaPixel(coordenadas, resolution, calcularTolerancia(zoom));
        const areaPixelWkt = areaPixelaWkt(pixelAreaCoordenadas);
        const body = {
            dataset: dataset,
            wkt: areaPixelWkt,
        };


        const url = `${endpoint}?paginated=true&allData=true`;
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

    const mostrarPopup = (data, event) => {
        let popupContainer = document.getElementById("popup");
        console.log("Capa en el pop:", aliasActualRef.current);
        let contador = 0;
        if (data.totalRegistros !== 0) {
            if (!popupContainer) {
                popupContainer = document.createElement("div");
                popupContainer.id = "popup";
                popupContainer.style.position = "fixed"; // Usar fixed para posicionarlo en la ventana
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

            const mouseX = event.originalEvent.clientX;
            const mouseY = event.originalEvent.clientY;
            popupContainer.style.left = `${mouseX + 10}px`;
            popupContainer.style.top = `${mouseY + 10}px`;

            console.log(data.totalRegistros)
            let htmlContent = `<span style="position: sticky; top: 0; background-color: rgb(24, 27, 31);text-align:center; display: flex; justify-content: space-between; font-size=23px"><button id="data-left" style="background: gray; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;"><</button><h4 id="indicador-registro"  style="float: center; font-weight:500;">Capa: ${aliasActualRef.current} <br/> Página: ${contador + 1}/${data.totalRegistros}</h4><button id="data-rigth" style="background: gray; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">></button></span>
      <div id="padre-tabla" style="max-height: 400px;">
      <table id="tabla-datos" style='width: 100%; magin-top="10px";border-collapse: collapse;'>`;

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
            detectarMouseHover("popup");
        } else {
            popupContainer?.remove();
        }
    }

    const crearHTMLPopUp = (registro, data) => {
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
            textoRegistro.innerHTML = `Capa: ${aliasActualRef.current} <br/> ${registro + 1}/${data.totalRegistros}`;
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
            <div className='cajaPanelHoveryWkt'>
                <div className='panelIconos'>
                    {/*funcion menu */}
                    {(funcionAcual === 'Menu') && (<>
                        {funcionalidaes.dibujar && (<Seleccion className='iconos' onClick={() => cambiarFuncion("Dibujar")} />)}
                        {funcionalidaes.hover && (<Mouse className='iconos' onClick={() => {cambiarFuncion("Hover");ativarHover(true);}} />)}
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
                            <div onMouseEnter={() => setMostrarCapas(true)} onMouseLeave={() => setMostrarCapas(false)}>
                                <Regreso className='iconos' onClick={() => { cambiarFuncion("Menu"); ativarHover(false) }} />
                                {/*Desglose de capas existentes*/}
                                {mostrarCapas && capasenMapa.map((capa, index) => {
                                    const [nomenclatura, nombreCapa] = capa.split(':');
                                    return (
                                        <div key={index} className='capas'>
                                            <input
                                                type="radio"
                                                name="capas"
                                                id={nombreCapa}
                                                value={nombreCapa}
                                                checked={capaSeleccionada == nombreCapa}
                                                onChange={(event) => {
                                                    if (event.target.checked) {
                                                        capaActualSeleccionar.current = nombreCapa;
                                                        colocarEvento();
                                                        setCapaSeleccionada(nombreCapa)
                                                        aliasActualRef.current = alias[index];
                                                    }
                                                }}
                                            />
                                            <label htmlFor={nombreCapa}>{alias[index]}</label>
                                        </div>
                                    );
                                })}
                            </div>)
                        }
                    </>)}
                </div>
            </div>

        </div>
    )
}

export default PanelControlMapa
