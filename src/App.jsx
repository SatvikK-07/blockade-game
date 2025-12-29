import { Routes, Route, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import Landing from './components/Landing.jsx'
import Board from './components/Board.jsx'
import './App.css'

function App() {
  const [showRules, setShowRules] = useState(false)
  const [searchParams] = useSearchParams()
  const modeParam = searchParams.get('mode')
  const youParam = searchParams.get('you')
  const mode = modeParam === 'single' ? 'single' : 'pvp'
  const humanColor = youParam === 'white' ? 'white' : 'black'
  const aiColor = humanColor === 'black' ? 'white' : 'black'
  const ruleImg = (file) => `${import.meta.env.BASE_URL}${file}`

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/play"
          element={
            <div className="game-shell">
              <header className="header">
                <div className="header-row">
                  <div className="title-block">
                    <h1>Blockade</h1>
                  </div>
                  <button className="rules-btn" onClick={() => setShowRules(true)}>
                    Rules
                  </button>
                </div>
              </header>
              <Board mode={mode} humanColor={humanColor} aiColor={aiColor} />
              {showRules && (
                <div className="rules-overlay" onClick={() => setShowRules(false)}>
                  <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="close-btn" onClick={() => setShowRules(false)} aria-label="Close rules">
                      ✕
                    </button>
                    <h2>How to Play</h2>
                    <div className="rules-columns">
                      <div className="rules-text">
                        <h3>Goal</h3>
                        <p>Race one of your tokens onto any of your opponent’s start squares before they reach yours.</p>

                        <h3>On your turn</h3>
                        <ul>
                          <li><strong>Black moves first.</strong></li>
                          <li><strong>Move one token</strong>: up/down/left/right (1 or 2 spaces) or diagonally if one clear two-leg path is open. You can hop over other tokens as long as the landing cell is empty.</li>
                          <li><strong>Then place one wall</strong> of your chosen orientation (horizontal or vertical), unless you’re out of walls.</li>
                        </ul>

                        <h3>Movement details</h3>
                        <ul>
                          <li>You can’t land on another token.</li>
                          <li>Diagonal moves work only if one row-first or column-first route is fully clear (no walls blocking either leg).</li>
                          <li>Tokens can jump over each other on any legal move if the destination square is empty.</li>
                        </ul>

                        <h3>Walls</h3>
                        <ul>
                          <li>Walls are two-edge long: horizontals span two columns; verticals span two rows.</li>
                          <li>No overlapping: you can’t share wall segments or stack walls. T- or L-touching at endpoints is fine; crossings are not.</li>
                          <li>You must always leave at least one path for <em>each</em> player to reach any opponent start square; otherwise the wall is rejected.</li>
                        </ul>

                        <h3>Ending the game</h3>
                        <p>The moment a token lands on any opponent start square, that player wins.</p>
                      </div>
                      <div className="rules-images">
                        <figure>
                          <img src={ruleImg('rules-setup.png')} alt="Starting setup" />
                          <figcaption>Starting setup: four tokens, wall supply on each side.</figcaption>
                        </figure>
                        <figure>
                          <img src={ruleImg('rules-moves.png')} alt="Movement options for a token" />
                          <figcaption>Grey dots show possible destinations for a token.</figcaption>
                        </figure>
                        <figure>
                          <img src={ruleImg('rules-jump.png')} alt="Jumping over pieces" />
                          <figcaption>Tokens can hop over another token into an empty space.</figcaption>
                        </figure>
                        <figure>
                          <img src={ruleImg('rules-example-board.png')} alt="Example board with walls" />
                          <figcaption>Walls shape paths; protect your route while blocking theirs.</figcaption>
                        </figure>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App
