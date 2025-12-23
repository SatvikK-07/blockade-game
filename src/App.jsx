import { Routes, Route, useSearchParams } from 'react-router-dom'
import Landing from './components/Landing.jsx'
import Board from './components/Board.jsx'
import './App.css'

function App() {
  const [searchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const youParam = searchParams.get('you')
  const mode = modeParam === 'single' ? 'single' : 'pvp'
  const humanColor = youParam === 'white' ? 'white' : 'black'
  const aiColor = humanColor === 'black' ? 'white' : 'black'

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/play"
          element={
            <div className="game-shell">
              <header className="header">
                <h1>Blockade</h1>
                <p className="subtitle">Race to the opponent start while walling smartly.</p>
              </header>
              <Board mode={mode} humanColor={humanColor} aiColor={aiColor} />
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App
