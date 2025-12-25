import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const bgUrl =
  'https://cf.geekdo-images.com/LQ8tVc8cPpCHfBukcdkW0w__small@2x/img/amYlf42m9DaeDN4VWevplUVUrkU=/fit-in/400x300/filters:strip_icc()/pic636912.jpg'

function Landing() {
  const [showOptions, setShowOptions] = useState(false)
  const [showSingleChoices, setShowSingleChoices] = useState(false)
  const navigate = useNavigate()

  const startSingle = (color) => {
    navigate(`/play?mode=single&you=${color}`)
  }

  return (
    <div className="landing">
      <div className="bg-layer" />
      <div
        className="bg-image"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(254, 251, 227, 0.92) 0%, rgba(254, 251, 227, 0.95) 50%, rgba(254, 251, 227, 0.98) 100%), url(${bgUrl})`,
        }}
      />
      
      {/* Decorative game graphics */}
      <div className="landing-graphics">
        {/* Horizontal walls (orange) */}
        <div className="decor-wall horizontal" style={{ top: '15%', left: '8%', width: '120px' }} />
        <div className="decor-wall horizontal" style={{ top: '25%', right: '12%', width: '100px' }} />
        <div className="decor-wall horizontal" style={{ bottom: '20%', left: '10%', width: '140px' }} />
        <div className="decor-wall horizontal" style={{ bottom: '30%', right: '8%', width: '110px' }} />
        
        {/* Vertical walls (blue) */}
        <div className="decor-wall vertical" style={{ top: '20%', left: '5%', height: '100px' }} />
        <div className="decor-wall vertical" style={{ top: '35%', right: '6%', height: '120px' }} />
        <div className="decor-wall vertical" style={{ bottom: '25%', left: '15%', height: '90px' }} />
        <div className="decor-wall vertical" style={{ bottom: '15%', right: '10%', height: '110px' }} />
        
        {/* Tokens */}
        <div className="decor-token black" style={{ top: '18%', left: '20%' }} />
        <div className="decor-token white" style={{ top: '22%', right: '18%' }} />
        <div className="decor-token black" style={{ bottom: '22%', left: '25%' }} />
        <div className="decor-token white" style={{ bottom: '18%', right: '22%' }} />
        
        {/* Grid pattern overlay */}
        <div className="decor-grid" />
      </div>
      
      <div className="landing-content">
        <p className="eyebrow">Tactical wall-placing duel</p>
        <h1 className="hero-title">Blockade</h1>
        <p className="hero-subtitle">
          Build walls, carve paths, and race your tokens to the enemy start. Fast, head-to-head strategy.
        </p>
        <div className="cta">
          {!showOptions ? (
            <button className="play-btn" onClick={() => setShowOptions(true)}>
              Play
            </button>
          ) : (
            <div className="play-stack">
              <div className="play-options">
                <button className="secondary" onClick={() => navigate('/play')}>
                  Play with Friend
                </button>
                <button className="secondary" onClick={() => setShowSingleChoices((v) => !v)}>
                  Single Player
                </button>
              </div>
              {showSingleChoices && (
                <div className="single-options">
                  <p className="single-label">Choose your side</p>
                  <div className="single-buttons">
                    <button className="secondary" onClick={() => startSingle('black')}>
                      Play as Black
                    </button>
                    <button className="secondary" onClick={() => startSingle('white')}>
                      Play as White
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Landing
