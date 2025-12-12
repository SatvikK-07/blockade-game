import { useMemo, useState } from 'react'

const ROWS = 14
const COLS = 17
const CELL_SIZE = 48

const startPositions = {
  black: [
    { r: 5, c: 4 },
    { r: 8, c: 4 },
  ],
  white: [
    { r: 5, c: 12 },
    { r: 8, c: 12 },
  ],
}

const initialInventory = {
  black: { horizontal: 9, vertical: 9 },
  white: { horizontal: 9, vertical: 9 },
}

const orientationColor = {
  horizontal: '#e4873e',
  vertical: '#2c8dd8',
}

const opponents = { black: 'white', white: 'black' }

const posKey = (r, c) => `${r},${c}`
const wallKey = (orientation, row, col) => `${orientation}:${row}:${col}`

function buildWallSets(walls) {
  const horizontal = new Set()
  const vertical = new Set()
  walls.horizontal.forEach((w) => horizontal.add(wallKey('horizontal', w.row, w.col)))
  walls.vertical.forEach((w) => vertical.add(wallKey('vertical', w.row, w.col)))
  return { horizontal, vertical }
}

function isWithinBoard(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

function hasTokenAt(positions, r, c) {
  const key = posKey(r, c)
  return (
    positions.black.some((p) => posKey(p.r, p.c) === key) ||
    positions.white.some((p) => posKey(p.r, p.c) === key)
  )
}

function isStepBlocked(a, b, wallSets) {
  if (a.r === b.r) {
    const minCol = Math.min(a.c, b.c)
    const colEdge = minCol + 1
    const rowsToCheck = [a.r, a.r - 1]
    return rowsToCheck.some((row) => wallSets.vertical.has(wallKey('vertical', row, colEdge)))
  }

  if (a.c === b.c) {
    const minRow = Math.min(a.r, b.r)
    const rowEdge = minRow + 1
    const colsToCheck = [a.c, a.c - 1]
    return colsToCheck.some((col) => wallSets.horizontal.has(wallKey('horizontal', rowEdge, col)))
  }

  return false
}

function canMoveTo(dest, positions) {
  return !hasTokenAt(positions, dest.r, dest.c)
}

function pathClear(from, to, wallSets) {
  return !isStepBlocked(from, to, wallSets)
}

function computeLegalMoves(player, index, positions, walls) {
  const wallSets = buildWallSets(walls)
  const pos = positions[player][index]
  const moves = []

  const orthDeltas = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]

  orthDeltas.forEach(([dr, dc]) => {
    const mid = { r: pos.r + dr / 2, c: pos.c + dc / 2 }
    const dest = { r: pos.r + dr, c: pos.c + dc }
    if (!isWithinBoard(dest.r, dest.c)) return
    if (!canMoveTo(dest, positions)) return
    const step1 = { r: pos.r + dr / 2, c: pos.c + dc / 2 }
    if (!isWithinBoard(step1.r, step1.c)) return
    if (!pathClear(pos, step1, wallSets)) return
    if (!pathClear(step1, dest, wallSets)) return
    moves.push(dest)
  })

  const diagDeltas = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]

  diagDeltas.forEach(([dr, dc]) => {
    const dest = { r: pos.r + dr, c: pos.c + dc }
    if (!isWithinBoard(dest.r, dest.c)) return
    if (!canMoveTo(dest, positions)) return
    const stepA = { r: pos.r, c: pos.c + dc }
    const stepB = { r: pos.r + dr, c: pos.c }
    if (!pathClear(pos, stepA, wallSets)) return
    if (!pathClear(pos, stepB, wallSets)) return
    if (!pathClear(stepA, dest, wallSets)) return
    if (!pathClear(stepB, dest, wallSets)) return
    moves.push(dest)
  })

  return moves
}

function adjacencyForPath(pos, walls) {
  // For connectivity checks; ignores occupied tokens.
  const wallSets = buildWallSets(walls)
  const moves = []
  const orthSteps = [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ]

  orthSteps.forEach(([dr, dc]) => {
    const mid = { r: pos.r + dr / 2, c: pos.c + dc / 2 }
    const dest = { r: pos.r + dr, c: pos.c + dc }
    if (!isWithinBoard(dest.r, dest.c)) return
    if (!isWithinBoard(mid.r, mid.c)) return
    if (!pathClear(pos, mid, wallSets)) return
    if (!pathClear(mid, dest, wallSets)) return
    moves.push(dest)
  })

  const diagSteps = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ]

  diagSteps.forEach(([dr, dc]) => {
    const dest = { r: pos.r + dr, c: pos.c + dc }
    if (!isWithinBoard(dest.r, dest.c)) return
    const stepA = { r: pos.r, c: pos.c + dc }
    const stepB = { r: pos.r + dr, c: pos.c }
    if (!pathClear(pos, stepA, wallSets)) return
    if (!pathClear(pos, stepB, wallSets)) return
    if (!pathClear(stepA, dest, wallSets)) return
    if (!pathClear(stepB, dest, wallSets)) return
    moves.push(dest)
  })

  return moves
}

function pathExists(player, positions, walls) {
  const targets = startPositions[opponents[player]].map((p) => posKey(p.r, p.c))
  const visited = new Set()
  const queue = [...positions[player]]

  while (queue.length) {
    const current = queue.shift()
    const key = posKey(current.r, current.c)
    if (visited.has(key)) continue
    visited.add(key)
    if (targets.includes(key)) return true
    adjacencyForPath(current, walls).forEach((next) => {
      const nKey = posKey(next.r, next.c)
      if (!visited.has(nKey)) queue.push(next)
    })
  }

  return false
}

function wallWithinBounds(orientation, row, col) {
  if (orientation === 'horizontal') {
    return row >= 1 && row <= ROWS - 1 && col >= 0 && col <= COLS - 2
  }
  if (orientation === 'vertical') {
    return row >= 0 && row <= ROWS - 2 && col >= 1 && col <= COLS - 1
  }
  return false
}

function canPlaceWall(orientation, row, col, player, state) {
  if (!wallWithinBounds(orientation, row, col)) return { ok: false, reason: 'Out of bounds' }
  const key = wallKey(orientation, row, col)
  const wallSets = buildWallSets(state.walls)
  if (wallSets[orientation].has(key)) return { ok: false, reason: 'Wall already placed there' }
  if (state.inventory[player][orientation] <= 0)
    return { ok: false, reason: 'No walls of that type left' }

  const nextWalls = {
    horizontal: [...state.walls.horizontal],
    vertical: [...state.walls.vertical],
  }
  nextWalls[orientation].push({ row, col, orientation, owner: player })

  if (!pathExists('black', state.positions, nextWalls) || !pathExists('white', state.positions, nextWalls)) {
    return { ok: false, reason: 'Must leave a path open to a start space' }
  }

  return { ok: true, nextWalls }
}

function Board() {
  const initialState = useMemo(
    () => ({
      positions: {
        black: startPositions.black.map((p) => ({ ...p })),
        white: startPositions.white.map((p) => ({ ...p })),
      },
      walls: { horizontal: [], vertical: [] },
      inventory: {
        black: { ...initialInventory.black },
        white: { ...initialInventory.white },
      },
      turn: 'black',
      mode: 'select',
      winner: null,
    }),
    [],
  )

  const [state, setState] = useState(initialState)
  const [selected, setSelected] = useState(null) // { player, index }
  const [moves, setMoves] = useState([])
  const [message, setMessage] = useState('')
  const [pendingOrientation, setPendingOrientation] = useState('horizontal')

  const occupied = useMemo(() => {
    const map = new Map()
    state.positions.black.forEach((p, idx) => map.set(posKey(p.r, p.c), { player: 'black', index: idx }))
    state.positions.white.forEach((p, idx) => map.set(posKey(p.r, p.c), { player: 'white', index: idx }))
    return map
  }, [state.positions])

  const cellClick = (r, c) => {
    if (state.winner) return
    if (state.mode === 'placeWall') return
    const occupant = occupied.get(posKey(r, c))
    const isMoveTarget = moves.some((m) => m.r === r && m.c === c)

    if (isMoveTarget && selected) {
      executeMove(r, c)
      return
    }

    if (occupant && occupant.player === state.turn) {
      const nextMoves = computeLegalMoves(occupant.player, occupant.index, state.positions, state.walls)
      setSelected({ player: occupant.player, index: occupant.index })
      setMoves(nextMoves)
      setMessage(nextMoves.length ? 'Select a destination for this token.' : 'No legal moves available from here.')
    } else {
      setSelected(null)
      setMoves([])
    }
  }

  const executeMove = (r, c) => {
    if (!selected) return
    const nextPositions = {
      black: [...state.positions.black.map((p) => ({ ...p }))],
      white: [...state.positions.white.map((p) => ({ ...p }))],
    }
    nextPositions[selected.player][selected.index] = { r, c }
    const reachedGoal = startPositions[opponents[selected.player]].some((p) => p.r === r && p.c === c)

    if (reachedGoal) {
      setState((prev) => ({
        ...prev,
        positions: nextPositions,
        winner: selected.player,
      }))
      setSelected(null)
      setMoves([])
      setMessage(`${selected.player === 'black' ? 'Black' : 'White'} wins by reaching the start space!`)
      return
    }

    setState((prev) => ({
      ...prev,
      positions: nextPositions,
      mode: 'placeWall',
    }))
    setSelected(null)
    setMoves([])
    setMessage('Place a wall of your choice. Toggle orientation if needed.')
  }

  const tryPlaceWall = (orientation, row, col) => {
    if (state.mode !== 'placeWall' || state.winner) return
    const check = canPlaceWall(orientation, row, col, state.turn, state)
    if (!check.ok) {
      setMessage(check.reason)
      return
    }

    const nextInventory = {
      ...state.inventory,
      [state.turn]: {
        ...state.inventory[state.turn],
        [orientation]: state.inventory[state.turn][orientation] - 1,
      },
    }

    setState((prev) => ({
      ...prev,
      walls: check.nextWalls,
      inventory: nextInventory,
      turn: opponents[state.turn],
      mode: 'select',
    }))
    setPendingOrientation('horizontal')
    setMessage('Wall placed. Next player to move.')
  }

  const resetGame = () => {
    setState(initialState)
    setSelected(null)
    setMoves([])
    setMessage('')
    setPendingOrientation('horizontal')
  }

  const wallHotspots = () => {
    if (state.mode !== 'placeWall' || state.winner) return null
    if (pendingOrientation === 'horizontal') {
      const spots = []
      for (let row = 1; row <= ROWS - 1; row += 1) {
        for (let col = 0; col <= COLS - 2; col += 1) {
          spots.push({ row, col, orientation: 'horizontal' })
        }
      }
      return spots
    }
    const spots = []
    for (let row = 0; row <= ROWS - 2; row += 1) {
      for (let col = 1; col <= COLS - 1; col += 1) {
        spots.push({ row, col, orientation: 'vertical' })
      }
    }
    return spots
  }

  const hotspots = wallHotspots()
  const wallSets = buildWallSets(state.walls)

  const cellSizePx = `${CELL_SIZE}px`
  const boardStyle = {
    width: `${COLS * CELL_SIZE}px`,
    height: `${ROWS * CELL_SIZE}px`,
    gridTemplateColumns: `repeat(${COLS}, ${cellSizePx})`,
    gridTemplateRows: `repeat(${ROWS}, ${cellSizePx})`,
  }

  return (
    <div className="board-layout">
      <div className="panel">
        <h2>Blockade</h2>
        <div className="turn-line">
          Turn: <span className={state.turn === 'black' ? 'black-text' : 'white-text'}>{state.turn}</span>
        </div>
        <div className="controls">
          <button
            className={pendingOrientation === 'horizontal' ? 'selected' : ''}
            onClick={() => setPendingOrientation('horizontal')}
            disabled={state.mode !== 'placeWall'}
          >
            Horizontal wall
          </button>
          <button
            className={pendingOrientation === 'vertical' ? 'selected' : ''}
            onClick={() => setPendingOrientation('vertical')}
            disabled={state.mode !== 'placeWall'}
          >
            Vertical wall
          </button>
          <button onClick={resetGame}>Reset</button>
        </div>
        {state.mode === 'placeWall' && <p className="hint">Select a spot on the board to place a wall.</p>}
        {message && <p className="message">{message}</p>}
        {state.winner && <p className="winner">{state.winner} wins!</p>}
        <div className="legend">
          <p>Click your token to see legal moves (2 orthogonal, 1 diagonal).</p>
          <p>After moving, place one wall (orange = horizontal, blue = vertical).</p>
          <p>Walls may not seal all paths to an opponent start space.</p>
        </div>
      </div>

      <div className="board-container">
        <div className="board" style={boardStyle}>
        {[...Array(ROWS)].map((_, r) =>
          [...Array(COLS)].map((__, c) => {
            const isStartBlack = startPositions.black.some((p) => p.r === r && p.c === c)
            const isStartWhite = startPositions.white.some((p) => p.r === r && p.c === c)
            const isMove = moves.some((m) => m.r === r && m.c === c)
            return (
              <div
                key={posKey(r, c)}
                className={`cell ${isStartBlack ? 'start start-black' : ''} ${
                  isStartWhite ? 'start start-white' : ''
                }`}
                onClick={() => cellClick(r, c)}
              >
                {isMove && <span className="move-dot" />}
              </div>
            )
          }),
        )}

        {state.walls.horizontal.map((w) => (
          <div
            key={wallKey('horizontal', w.row, w.col)}
            className="wall horizontal"
            style={{
              top: w.row * CELL_SIZE - 5,
              left: w.col * CELL_SIZE,
              width: CELL_SIZE * 2,
              height: 10,
              background: orientationColor.horizontal,
            }}
          />
        ))}
        {state.walls.vertical.map((w) => (
          <div
            key={wallKey('vertical', w.row, w.col)}
            className="wall vertical"
            style={{
              top: w.row * CELL_SIZE,
              left: w.col * CELL_SIZE - 5,
              width: 10,
              height: CELL_SIZE * 2,
              background: orientationColor.vertical,
            }}
          />
        ))}

        {hotspots &&
          hotspots.map((spot) => (
            <button
              key={wallKey(spot.orientation, spot.row, spot.col)}
              className={`wall-hotspot ${spot.orientation}`}
              style={
                spot.orientation === 'horizontal'
                  ? {
                      top: spot.row * CELL_SIZE - 5,
                      left: spot.col * CELL_SIZE,
                      width: CELL_SIZE * 2,
                      height: 10,
                    }
                  : {
                      top: spot.row * CELL_SIZE,
                      left: spot.col * CELL_SIZE - 5,
                      width: 10,
                      height: CELL_SIZE * 2,
                    }
              }
              onClick={() => tryPlaceWall(spot.orientation, spot.row, spot.col)}
            />
          ))}

        {state.positions.black.map((p, idx) => (
          <div
            key={`b-${idx}`}
            className={`token black ${selected?.player === 'black' && selected?.index === idx ? 'active' : ''}`}
            style={{
              top: p.r * CELL_SIZE + CELL_SIZE / 2,
              left: p.c * CELL_SIZE + CELL_SIZE / 2,
            }}
            onClick={() => cellClick(p.r, p.c)}
          />
        ))}
        {state.positions.white.map((p, idx) => (
          <div
            key={`w-${idx}`}
            className={`token white ${selected?.player === 'white' && selected?.index === idx ? 'active' : ''}`}
            style={{
              top: p.r * CELL_SIZE + CELL_SIZE / 2,
              left: p.c * CELL_SIZE + CELL_SIZE / 2,
            }}
            onClick={() => cellClick(p.r, p.c)}
          />
        ))}
        </div>
        
        <div className="wall-inventory">
          <div className="wall-count black-walls">
            <div className="wall-label">Black</div>
            <div className="wall-numbers">
              <span className="wall-type">H: {state.inventory.black.horizontal}</span>
              <span className="wall-type">V: {state.inventory.black.vertical}</span>
            </div>
          </div>
          <div className="wall-count white-walls">
            <div className="wall-label">White</div>
            <div className="wall-numbers">
              <span className="wall-type">H: {state.inventory.white.horizontal}</span>
              <span className="wall-type">V: {state.inventory.white.vertical}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Board

