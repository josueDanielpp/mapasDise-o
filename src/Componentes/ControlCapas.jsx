import React, { useEffect, useRef, useState } from 'react'
import OlLayerTile from 'ol/layer/Tile';
import OlSourceOsm from 'ol/source/OSM';
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceXYZ from 'ol/source/XYZ';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { Map, View } from 'ol';
import OMS from '../assets/img/ImagenesCapasFondo/OSM HOT.png';
import BKG from '../assets/img/ImagenesCapasFondo/Bundesamt.png';
import Terrestris from '../assets/img/ImagenesCapasFondo/Terrestris OSM.png';
import ArcGIS from '../assets/img/ImagenesCapasFondo/ArcGIS Imagery.png';
import CartoDB from '../assets/img/ImagenesCapasFondo/CartoDB Positron.png';
import OpenStreetMap from '../assets/img/ImagenesCapasFondo/OpenStreetMap.png';
import { set } from 'ol/transform';
import CarruselCapas from './CarruselCapas';
const ControlCapas = ({ mapaParametro }) => {
    const [mapaSeleccionado, setMapaSeleccionado] = useState(null);
    const [capaFondoSeleccionada, setCapaFondoSeleccionada] = useState(null);
    const [mostarOpciones, setMostrarOpciones] = useState(false);
    const referenciamapaSeleccionado = useRef("");
    const opcionCapas = [
        new OlLayerTile({
            source: new OlSourceOsm(),
            properties: {
                name: 'OSM',
                isBackgroundLayer: true,
                type: 'OpenStreetMap',
                image: OpenStreetMap,
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
                image: BKG,
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
                image: OMS,
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
                image: Terrestris,
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
                image: ArcGIS,
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
                image: CartoDB,
                description: 'CartoDB Positron base layer',
                minZoom: 0,
                maxZoom: 20,
                opacity: 1.0,
                attributions: '© CartoDB'
            }
        }),
        new OlLayerTile({
            source: new OlSourceXYZ({
                url: 'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
            }),
            properties: {
                name: 'CartoDB Dark Matter',
                isBackgroundLayer: true,
                type: 'XYZ',
                description: 'CartoDB Dark Matter base layer',
                minZoom: 0,
                maxZoom: 20,
                opacity: 1.0,
                attributions: '© CartoDB'
            }
        }),
        
        new OlLayerTile({
            source: new OlSourceXYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            }),
            properties: {
                name: 'Esri Dark Gray Canvas',
                isBackgroundLayer: true,
                type: 'XYZ',
                description: 'Esri Dark Gray Canvas base layer',
                minZoom: 0,
                maxZoom: 16,
                opacity: 1.0,
                attributions: '© Esri, HERE, Garmin, FAO, USGS, NGA, EPA, NPS'
            }
        }),
        new OlLayerTile({
            source: new OlSourceXYZ({
                url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
            }),
            properties: {
                name: 'OpenTopoMap Dark',
                isBackgroundLayer: true,
                type: 'XYZ',
                description: 'OpenTopoMap Dark base layer',
                minZoom: 0,
                maxZoom: 17,
                opacity: 1.0,
                attributions: '© OpenStreetMap contributors'
            }
        })






    ];
    useEffect(() => {
        if (mapaParametro != null && mapaParametro != undefined && mapaParametro != "") {
            const vista = mapaParametro.getView();
            const capaFondo = opcionCapas[0];
            const nuevoMapa = new Map({
                target: referenciamapaSeleccionado.current,
                layers: [capaFondo],
                view: vista ? vista : new View({
                    center: [0, 0],
                    zoom: 2,
                }),
                controls: defaultControls({ zoom: false }),
                interactions: defaultInteractions({ mouseWheelZoom: false, dragPan: false })

            });

            setMapaSeleccionado(nuevoMapa);
        }

    }, [mapaParametro])
    const dejarRaton = () => {
        setMostrarOpciones(false);
    }
    const entarRaton = () => {
        setMostrarOpciones(true);
    }
    const cambiarfondo = (index) => {
        console.log("index", index);

        if (mapaSeleccionado != null) {
            const capas = mapaSeleccionado.getLayers().getArray();
            if (capas.length > 0) {
                mapaSeleccionado.removeLayer(capas[0]);
            }

            const capaspara = mapaParametro.getLayers().getArray();
            if (capaspara.length > 0) {
                mapaParametro.removeLayer(capaspara[0]);
            }

            // Crea nuevas instancias de capas para ambos mapas
            const nuevaCapaMapaSeleccionado = new OlLayerTile({
                source: opcionCapas[index].getSource(), // Usa la misma fuente de la capa seleccionada
                properties: opcionCapas[index].getProperties()
            });

            const nuevaCapaMapaParametro = new OlLayerTile({
                source: opcionCapas[index].getSource(),
                properties: opcionCapas[index].getProperties()
            });

            nuevaCapaMapaSeleccionado.setVisible(true);
            nuevaCapaMapaParametro.setVisible(true);

            mapaSeleccionado.getLayers().insertAt(0, nuevaCapaMapaSeleccionado);
            mapaParametro.getLayers().insertAt(0, nuevaCapaMapaParametro);
        }
    };

    return (
        <div className='panelControl' onMouseLeave={dejarRaton} >
            <div className='marcoMapa' onMouseEnter={entarRaton} >
                <div ref={referenciamapaSeleccionado} style={{ width: '60px', height: '60px' }} ></div>
            </div>
            {mostarOpciones && (
                
                <div className='menuCapas'>
                    <CarruselCapas capas={opcionCapas} mapaPara={mapaParametro} mapaSele={mapaSeleccionado} />
                </div>

            )
            }

        </div>
    )
}

export default ControlCapas
