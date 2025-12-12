import { Routes, Route } from 'react-router-dom'
import Landing from './components/Landing.jsx'
import Board from './components/Board.jsx'
import './App.css'

function App() {
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
              <Board />
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App
