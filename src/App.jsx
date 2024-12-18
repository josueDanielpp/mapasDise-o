import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Mapa from './Componentes/Mapa'
import Digitalizacion from './Componentes/Digitalizacion'
import Poligono from './Componentes/Poligono'
import DrawShapesWithHoles from './Componentes/DrawShapesWithHoles'
import DrawShapesExample from './Componentes/DrawShapesExample'
import MasFiguras from './Componentes/MasFiguras'
import DibujarPorligono from './Componentes/DibujarPorligono'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Ejercicio de mapas:</h1>
      {/*  <Mapa/> */}
      {/*   <Digitalizacion/> */}
      {/*  <Poligono/> */}
      {/*  <DrawShapesWithHoles /> */}
      {/*      <DrawShapesExample/>
 */}
       <MasFiguras/>
     {/*  <DibujarPorligono /> */}


    </>
  )
}

export default App
