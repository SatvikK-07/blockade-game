import { useEffect, useMemo, useState } from 'react'

const ROWS = 11
const COLS = 14
const CELL_SIZE = 47

const startPositions = {
  black: [
    { r: 3, c: 3 },
    { r: 7, c: 3 },
  ],
  white: [
    { r: 3, c: 10 },
    { r: 7, c: 10 },
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

  const orthDirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  const opponentStarts = startPositions[opponents[player]]

  orthDirs.forEach(([dr, dc]) => {
    const lengths = [2, 1] // prefer 2-step moves; allow 1-step only if winning
    lengths.forEach((len) => {
      const dest = { r: pos.r + dr * len, c: pos.c + dc * len }
      if (!isWithinBoard(dest.r, dest.c)) return
      if (
        len === 1 &&
        !opponentStarts.some((p) => p.r === dest.r && p.c === dest.c)
      ) {
        return
      }
      if (!canMoveTo(dest, positions)) return
      let ok = true
      let prev = pos
      for (let step = 1; step <= len; step += 1) {
        const next = { r: pos.r + dr * step, c: pos.c + dc * step }
        if (!pathClear(prev, next, wallSets)) {
          ok = false
          break
        }
        prev = next
      }
      if (ok) moves.push(dest)
    })
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
    const pathViaA = pathClear(pos, stepA, wallSets) && pathClear(stepA, dest, wallSets)
    const pathViaB = pathClear(pos, stepB, wallSets) && pathClear(stepB, dest, wallSets)
    if (!pathViaA && !pathViaB) return
    moves.push(dest)
  })

  return moves
}

function adjacencyForPath(pos, walls, targets) {
  // For connectivity checks; ignores occupied tokens.
  const wallSets = buildWallSets(walls)
  const moves = []

  const orth1 = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  const targetKeys = new Set(targets || [])

  orth1.forEach(([dr, dc]) => {
    // allow 2-step moves generally, and 1-step only if it lands on a target
    const lengths = [2, 1]
    lengths.forEach((len) => {
      const dest = { r: pos.r + dr * len, c: pos.c + dc * len }
      if (!isWithinBoard(dest.r, dest.c)) return
      if (len === 1 && targetKeys.size > 0 && !targetKeys.has(posKey(dest.r, dest.c))) return
      let ok = true
      let prev = pos
      for (let step = 1; step <= len; step += 1) {
        const next = { r: pos.r + dr * step, c: pos.c + dc * step }
        if (!pathClear(prev, next, wallSets)) {
          ok = false
          break
        }
        prev = next
      }
      if (ok) moves.push(dest)
    })
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
    const pathViaA = pathClear(pos, stepA, wallSets) && pathClear(stepA, dest, wallSets)
    const pathViaB = pathClear(pos, stepB, wallSets) && pathClear(stepB, dest, wallSets)
    if (!pathViaA && !pathViaB) return
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
    adjacencyForPath(current, walls, targets).forEach((next) => {
      const nKey = posKey(next.r, next.c)
      if (!visited.has(nKey)) queue.push(next)
    })
  }

  return false
}

function clonePositions(positions) {
  return {
    black: positions.black.map((p) => ({ ...p })),
    white: positions.white.map((p) => ({ ...p })),
  }
}

function shortestPathDistanceToGoal(player, positions, walls) {
  const targets = startPositions[opponents[player]].map((p) => posKey(p.r, p.c))
  let best = Infinity

  const bfs = (start) => {
    const visited = new Set()
    const queue = [{ ...start, d: 0 }]
    while (queue.length) {
      const current = queue.shift()
      const key = posKey(current.r, current.c)
      if (visited.has(key)) continue
      visited.add(key)
      if (targets.includes(key)) return current.d
      adjacencyForPath(current, walls, targets).forEach((next) => {
        const nKey = posKey(next.r, next.c)
        if (!visited.has(nKey)) queue.push({ ...next, d: current.d + 1 })
      })
    }
    return Infinity
  }

  positions[player].forEach((start) => {
    const dist = bfs(start)
    if (dist < best) best = dist
  })

  return best
}

function chooseAiMove(state, aiPlayer) {
  let best = null
  const wallSets = buildWallSets(state.walls)

  state.positions[aiPlayer].forEach((pos, index) => {
    const moves = computeLegalMoves(aiPlayer, index, state.positions, state.walls)
    moves.forEach((dest) => {
      const candidatePositions = clonePositions(state.positions)
      candidatePositions[aiPlayer][index] = dest
      const myDist = shortestPathDistanceToGoal(aiPlayer, candidatePositions, state.walls)
      const oppDist = shortestPathDistanceToGoal(opponents[aiPlayer], candidatePositions, state.walls)
      const centerBias =
        -0.3 * (Math.abs(dest.r - ROWS / 2) + Math.abs(dest.c - COLS / 2))
      const blockedPenalty = isStepBlocked(pos, dest, wallSets) ? 5 : 0
      const score = (oppDist - myDist) + centerBias - blockedPenalty + Math.random() * 0.2
      if (!best || score > best.score) {
        best = { index, dest, score }
      }
    })
  })

  return best
}

function chooseAiWall(state, positionsAfterMove, aiPlayer) {
  const baseOpponentDist = shortestPathDistanceToGoal(
    opponents[aiPlayer],
    positionsAfterMove,
    state.walls,
  )
  const baseSelfDist = shortestPathDistanceToGoal(aiPlayer, positionsAfterMove, state.walls)
  const opponentPositions = positionsAfterMove[opponents[aiPlayer]]

  const evaluateCandidate = (orientation, row, col) => {
    const check = canPlaceWall(orientation, row, col, aiPlayer, {
      ...state,
      positions: positionsAfterMove,
    })
    if (!check.ok) return null
    const nextWalls = check.nextWalls
    const oppDist = shortestPathDistanceToGoal(
      opponents[aiPlayer],
      positionsAfterMove,
      nextWalls,
    )
    const selfDist = shortestPathDistanceToGoal(aiPlayer, positionsAfterMove, nextWalls)
    const distGain = oppDist - baseOpponentDist
    const selfPenalty = Math.max(0, selfDist - baseSelfDist)
    const nearestOpponent = Math.min(
      ...opponentPositions.map((p) => Math.abs(p.r - row) + Math.abs(p.c - col)),
      12,
    )
    const proximityBonus = Math.max(0, 6 - nearestOpponent) * 0.4
    const score = distGain * 2 - selfPenalty + proximityBonus + Math.random() * 0.1
    return { score, nextWalls, orientation, row, col }
  }

  let best = null
  const orientations = ['horizontal', 'vertical']
  orientations.forEach((orientation) => {
    if (state.inventory[aiPlayer][orientation] <= 0) return
    const rowStart = orientation === 'horizontal' ? 1 : 0
    const rowEnd = orientation === 'horizontal' ? ROWS - 1 : ROWS - 2
    const colStart = orientation === 'horizontal' ? 0 : 1
    const colEnd = orientation === 'horizontal' ? COLS - 2 : COLS - 1
    for (let row = rowStart; row <= rowEnd; row += 1) {
      for (let col = colStart; col <= colEnd; col += 1) {
        const result = evaluateCandidate(orientation, row, col)
        if (result && (!best || result.score > best.score)) {
          best = result
        }
      }
    }
  })

  if (!best) return null

  const nextInventory = {
    ...state.inventory,
    [aiPlayer]: {
      ...state.inventory[aiPlayer],
      [best.orientation]: state.inventory[aiPlayer][best.orientation] - 1,
    },
  }

  return { nextWalls: best.nextWalls, nextInventory, placement: best }
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

function wallsCross(newWall, existingWall) {
  if (newWall.orientation === existingWall.orientation) return false
  const h = newWall.orientation === 'horizontal' ? newWall : existingWall
  const v = newWall.orientation === 'vertical' ? newWall : existingWall
  // Horizontal wall spans columns [c, c+2) at row h.row
  // Vertical wall spans rows [r, r+2) at col v.col
  // Allow touching at endpoints (T/L). Block only true crossings.
  return h.col < v.col && v.col < h.col + 2 && v.row < h.row && h.row < v.row + 2
}

function wallSegments(wall) {
  if (wall.orientation === 'horizontal') {
    return [`h:${wall.row}:${wall.col}`, `h:${wall.row}:${wall.col + 1}`]
  }
  return [`v:${wall.row}:${wall.col}`, `v:${wall.row + 1}:${wall.col}`]
}

function canPlaceWall(orientation, row, col, player, state) {
  if (!wallWithinBounds(orientation, row, col)) return { ok: false, reason: 'Out of bounds' }
  const key = wallKey(orientation, row, col)
  const wallSets = buildWallSets(state.walls)
  if (wallSets[orientation].has(key)) return { ok: false, reason: 'Wall already placed there' }
  if (state.inventory[player][orientation] <= 0)
    return { ok: false, reason: 'No walls of that type left' }
  const newWall = { orientation, row, col }
  const newSegments = wallSegments(newWall)
  const overlaps =
    state.walls.horizontal.some((w) => {
      if (w.orientation === newWall.orientation && w.row === newWall.row && w.col === newWall.col) return true
      if (w.orientation === newWall.orientation) {
        const segs = wallSegments(w)
        if (segs.some((s) => newSegments.includes(s))) return true
      }
      return wallsCross(newWall, { ...w })
    }) ||
    state.walls.vertical.some((w) => {
      if (w.orientation === newWall.orientation && w.row === newWall.row && w.col === newWall.col) return true
      if (w.orientation === newWall.orientation) {
        const segs = wallSegments(w)
        if (segs.some((s) => newSegments.includes(s))) return true
      }
      return wallsCross(newWall, { ...w })
    })
  if (overlaps) return { ok: false, reason: 'Wall overlaps an existing wall' }

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

function Board({ mode = 'pvp', humanColor = 'black', aiColor = 'white' }) {
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
  const [message, setMessage] = useState('Choose one of the black tokens to start.')
  const [pendingOrientation, setPendingOrientation] = useState('horizontal')
  const [aiThinking, setAiThinking] = useState(false)
  const [boardScale, setBoardScale] = useState(1)
  const [celebrating, setCelebrating] = useState(false)

  const isSingle = mode === 'single'
  const isHumanTurn = !isSingle || state.turn === humanColor
  const isAiTurn = isSingle && state.turn === aiColor

  const boardBaseWidth = COLS * CELL_SIZE
  const boardBaseHeight = ROWS * CELL_SIZE

  const occupied = useMemo(() => {
    const map = new Map()
    state.positions.black.forEach((p, idx) => map.set(posKey(p.r, p.c), { player: 'black', index: idx }))
    state.positions.white.forEach((p, idx) => map.set(posKey(p.r, p.c), { player: 'white', index: idx }))
    return map
  }, [state.positions])

  const cellClick = (r, c) => {
    if (state.winner) return
    if (!isHumanTurn) return
    if (aiThinking) return
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
      setCelebrating(true)
      setSelected(null)
      setMoves([])
      setMessage(`${selected.player === 'black' ? 'Black' : 'White'} wins by reaching the start space!`)
      return
    }

    const remainingWalls =
      state.inventory[selected.player].horizontal + state.inventory[selected.player].vertical
    if (remainingWalls === 0) {
      setState((prev) => ({
        ...prev,
        positions: nextPositions,
        turn: opponents[selected.player],
        mode: 'select',
      }))
      setSelected(null)
      setMoves([])
      setPendingOrientation('horizontal')
      setMessage('No walls left to place. Turn passes to the opponent.')
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
    if (!isHumanTurn) return
    if (aiThinking) return
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
    setMessage('Choose one of the black tokens to start.')
    setPendingOrientation('horizontal')
    setAiThinking(false)
    setCelebrating(false)
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

  useEffect(() => {
    if (!isSingle) return
    if (state.winner) return
    if (!isAiTurn) return
    if (aiThinking) return

    setAiThinking(true)
    setMessage('AI thinking...')
    const timer = setTimeout(() => {
      const moveChoice = chooseAiMove(state, aiColor)
      const nextPositions = clonePositions(state.positions)
      setSelected(null)
      setMoves([])

      if (!moveChoice) {
        setState((prev) => ({
          ...prev,
          turn: opponents[aiColor],
          mode: 'select',
        }))
        setMessage('AI passes its move. Your turn.')
        setAiThinking(false)
        return
      }

      nextPositions[aiColor][moveChoice.index] = { r: moveChoice.dest.r, c: moveChoice.dest.c }
      const reachedGoal = startPositions[opponents[aiColor]].some(
        (p) => p.r === moveChoice.dest.r && p.c === moveChoice.dest.c,
      )

      if (reachedGoal) {
        setState((prev) => ({
          ...prev,
          positions: nextPositions,
          winner: aiColor,
        }))
        setCelebrating(true)
        setMessage('AI reached your start and wins.')
        setAiThinking(false)
        return
      }

      const wallDecision = chooseAiWall(state, nextPositions, aiColor)
      const nextWalls = wallDecision ? wallDecision.nextWalls : state.walls
      const nextInventory = wallDecision ? wallDecision.nextInventory : state.inventory

      setState((prev) => ({
        ...prev,
        positions: nextPositions,
        walls: nextWalls,
        inventory: nextInventory,
        turn: opponents[aiColor],
        mode: 'select',
      }))
      setMessage(`AI moved${wallDecision ? ' and placed a wall' : ' and skipped wall placement'}. Your turn.`)
      setAiThinking(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [aiColor, isAiTurn, isSingle, state])

  useEffect(() => {
    const computeScale = () => {
      if (typeof window === 'undefined') return
      const padding = 24
      const available = Math.max(320, window.innerWidth - padding)
      const scale = Math.min(1, Math.max(0.5, available / (boardBaseWidth + 60)))
      setBoardScale(scale)
    }
    computeScale()
    window.addEventListener('resize', computeScale)
    return () => window.removeEventListener('resize', computeScale)
  }, [boardBaseWidth])

  const hotspots = wallHotspots()
  const wallSets = buildWallSets(state.walls)

  const cellSizePx = `${CELL_SIZE}px`
  const boardStyle = {
    width: `${boardBaseWidth}px`,
    height: `${boardBaseHeight}px`,
    gridTemplateColumns: `repeat(${COLS}, ${cellSizePx})`,
    gridTemplateRows: `repeat(${ROWS}, ${cellSizePx})`,
  }
  const scaledBoardStyle = {
    ...boardStyle,
    transform: `scale(${boardScale})`,
    transformOrigin: 'top left',
  }
  const boardWrapperStyle = {
    width: `${boardBaseWidth * boardScale}px`,
    height: `${boardBaseHeight * boardScale}px`,
  }

  const renderBars = (player, orientation) => {
    const count = state.inventory[player][orientation]
    return [...Array(count)].map((_, idx) => (
      <span
        key={`${player}-${orientation}-${idx}`}
        className={`supply-bar ${orientation} ${player}`}
      />
    ))
  }

  return (
    <div className="board-layout">
      <div className="board-container">
        <div className="wall-stack-column left">
          <div className="wall-stack horizontal-stack black-stack">
            {renderBars('black', 'horizontal')}
          </div>
          <div className="wall-stack vertical-stack black-stack">
            {renderBars('black', 'vertical')}
          </div>
        </div>

        <div className="board-stack">
          <div className="control-strip">
            <div className="turn-chip">
              Turn:{' '}
              <span className={state.turn === 'black' ? 'black-text' : 'white-text'}>
                {state.turn}
              </span>
            </div>
            <div className="control-buttons">
              <button
                className={pendingOrientation === 'horizontal' ? 'selected' : ''}
                onClick={() => setPendingOrientation('horizontal')}
                disabled={state.mode !== 'placeWall'}
              >
                Horizontal
              </button>
              <button
                className={pendingOrientation === 'vertical' ? 'selected' : ''}
                onClick={() => setPendingOrientation('vertical')}
                disabled={state.mode !== 'placeWall'}
              >
                Vertical
              </button>
              <button onClick={resetGame}>Reset</button>
            </div>
          </div>
          {message && <p className="message">{message}</p>}

          <div className="board-wrapper" style={boardWrapperStyle}>
            {celebrating && state.winner && (
              <div className="celebration-overlay">
                <div className="celebration-card">
                  <div className="celebration-title">{state.winner} wins!</div>
                  <div className="celebration-sub">Game over — reset to play again.</div>
                </div>
              </div>
            )}
            <div className="board" style={scaledBoardStyle}>
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
          </div>
        </div>

        <div className="wall-stack-column right">
          <div className="wall-stack horizontal-stack white-stack">
            {renderBars('white', 'horizontal')}
          </div>
          <div className="wall-stack vertical-stack white-stack">
            {renderBars('white', 'vertical')}
          </div>
        </div>
      </div>

      <div className="wall-inventory-cards">
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
  )
}

export default Board
