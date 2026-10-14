import { useEffect, useMemo, useRef, useState } from 'react'
import { solveWithAStar } from './algorithms/astar.js'
import './App.css'

const MIN_SIZE = 5
const MAX_SIZE = 40
const makeGrid = (size) => Array.from({ length: size }, () => Array.from({ length: size }, () => ({ wall: false })))
const sameCell = (a, b) => a?.row === b?.row && a?.col === b?.col
const modes = [['start', 'Set Start', 'S'], ['destination', 'Set Destination', 'E'], ['wall', 'Draw Walls', 'W'], ['erase', 'Erase Walls', 'E']]

function App() {
  const [size, setSize] = useState(15)
  const [grid, setGrid] = useState(() => makeGrid(15))
  const [start, setStart] = useState({ row: 0, col: 0 })
  const [destination, setDestination] = useState({ row: 14, col: 14 })
  const [mode, setMode] = useState('wall')
  const [speed, setSpeed] = useState(50)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Ready to map your maze.')
  const [result, setResult] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [animation, setAnimation] = useState({ stage: 'explore', index: 0 })
  const [pointerDown, setPointerDown] = useState(false)
  const timer = useRef(null)
  const locked = phase === 'running' || phase === 'paused'

  const explored = useMemo(() => {
    if (!result) return new Set()
    const count = animation.stage === 'explore' ? animation.index : result.exploredOrder.length
    return new Set(result.exploredOrder.slice(0, count).map((cell) => `${cell.row},${cell.col}`))
  }, [animation, result])
  const frontier = useMemo(() => new Set((result?.frontierOrder ?? []).map((cell) => `${cell.row},${cell.col}`)), [result])
  const path = useMemo(() => animation.stage === 'path' && result ? new Set(result.path.slice(0, animation.index).map((cell) => `${cell.row},${cell.col}`)) : new Set(), [animation, result])

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (phase !== 'running' || !result) return undefined
    timer.current = setTimeout(() => setAnimation((current) => {
      if (current.stage === 'explore' && current.index < result.exploredOrder.length) return { ...current, index: current.index + 1 }
      if (current.stage === 'explore') return { stage: 'path', index: 0 }
      if (current.index < result.path.length) return { ...current, index: current.index + 1 }
      setPhase('complete')
      setMessage(result.found ? 'Destination reached. Shortest path confirmed.' : 'The destination is unreachable from this maze.')
      return current
    }), Math.max(18, 160 - speed * 1.4))
    return () => clearTimeout(timer.current)
  }, [animation, phase, result, speed])

  const resetSearch = (nextMessage = 'Ready to map your maze.') => {
    clearTimeout(timer.current)
    setResult(null); setPhase('idle'); setAnimation({ stage: 'explore', index: 0 }); setMessage(nextMessage); setError('')
  }
  const generateGrid = () => {
    const nextSize = Number(size)
    if (!Number.isInteger(nextSize) || nextSize < MIN_SIZE || nextSize > MAX_SIZE) { setError(`Choose a whole number between ${MIN_SIZE} and ${MAX_SIZE}.`); return }
    setSize(nextSize); setGrid(makeGrid(nextSize)); setStart({ row: 0, col: 0 }); setDestination({ row: nextSize - 1, col: nextSize - 1 }); resetSearch(`Fresh ${nextSize} × ${nextSize} grid generated.`)
  }
  const updateCell = (row, col) => {
    if (locked) return
    const cell = { row, col }
    if (mode === 'start' && !sameCell(cell, destination)) { setStart(cell); setGrid((current) => current.map((line, r) => line.map((item, c) => r === row && c === col ? { wall: false } : item))); return }
    if (mode === 'destination' && !sameCell(cell, start)) { setDestination(cell); setGrid((current) => current.map((line, r) => line.map((item, c) => r === row && c === col ? { wall: false } : item))); return }
    if (sameCell(cell, start) || sameCell(cell, destination)) return
    setGrid((current) => current.map((line, r) => line.map((item, c) => r === row && c === col ? { wall: mode === 'wall' } : item)))
  }
  const solveMaze = () => {
    if (sameCell(start, destination)) { setError('Start and destination must be different cells.'); return }
    const nextResult = solveWithAStar(grid, start, destination)
    clearTimeout(timer.current); setError(''); setResult(nextResult); setAnimation({ stage: 'explore', index: 0 }); setPhase('running'); setMessage('A* is scanning the most promising cells...')
  }
  const clearWalls = () => { if (!locked) { setGrid((current) => current.map((line) => line.map(() => ({ wall: false })))); setMessage('All obstacles cleared.') } }
  const cellClass = (row, col) => {
    const key = `${row},${col}`; const classes = ['maze-cell']
    if (grid[row][col].wall) classes.push('wall')
    if (frontier.has(key) && !explored.has(key)) classes.push('frontier')
    if (explored.has(key)) classes.push('explored')
    if (path.has(key)) classes.push('path')
    if (sameCell({ row, col }, start)) classes.push('start')
    if (sameCell({ row, col }, destination)) classes.push('destination')
    return classes.join(' ')
  }
  const status = phase === 'complete' ? result?.found ? 'Solved' : 'No Path Found' : locked ? 'Searching' : 'Not run'
  const pathLength = phase === 'complete' && result?.found ? result.path.length - 1 : '—'

  return <main className="app-shell" onPointerUp={() => setPointerDown(false)} onPointerLeave={() => setPointerDown(false)}>
    <header className="topbar"><div className="brand-lockup"><span className="brand-mark">A*</span><div><p className="eyebrow">AISC / SEARCH LAB</p><h1>Intelligent Maze Solver</h1></div></div><div className="header-status"><span className="status-dot" />{locked ? 'Simulation active' : 'Editor ready'}</div></header>
    <section className="intro"><div><p className="eyebrow accent-text">USER-DEFINED ENVIRONMENT</p><h2>Map the problem.<br /><em>Let the heuristic lead.</em></h2></div><p className="intro-copy">Design a grid, set the constraints, and watch A* find the shortest route through your world.</p></section>
    <div className="workspace">
      <aside className="control-panel panel"><PanelHeading number="01" eyebrow="CONFIGURATION" title="Shape your maze" /><label className="field-label" htmlFor="grid-size">Grid dimensions</label><div className="size-input"><input id="grid-size" type="number" min={MIN_SIZE} max={MAX_SIZE} value={size} disabled={locked} onChange={(event) => { setSize(event.target.value); setError('') }} /><span>× {size}</span></div><button className="primary-button" type="button" onClick={generateGrid} disabled={locked}>Generate grid <b>↗</b></button><div className="divider" /><div className="mode-heading"><label className="field-label">Editing mode</label><span className="mode-hint">{locked ? 'Locked during search' : 'Click or drag'}</span></div><div className="mode-list">{modes.map(([value, label, icon]) => <button key={value} className={`mode-button ${mode === value ? 'selected' : ''}`} type="button" disabled={locked} onClick={() => setMode(value)}><i className={`mode-icon ${value}`}>{icon}</i>{label}<span className="mode-check">{mode === value ? '●' : '○'}</span></button>)}</div><div className="divider" /><label className="field-label" htmlFor="speed">Animation speed <span className="speed-value">{speed}%</span></label><input className="speed-slider" id="speed" type="range" min="10" max="100" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><div className="slider-labels"><span>Slow</span><span>Fast</span></div><div className="panel-actions"><button className="solve-button" type="button" onClick={solveMaze} disabled={locked}>Solve maze <b>→</b></button><div className="secondary-actions"><button type="button" onClick={clearWalls} disabled={locked}>Clear walls</button><button type="button" onClick={() => resetSearch()}>Reset grid</button></div></div></aside>
      <section className="maze-panel panel"><div className="maze-heading"><PanelHeading number="02" eyebrow="LIVE CANVAS" title="Build your environment" /><span className="dimension-tag">{size} × {size}</span></div><div className="maze-stage"><div className="maze-grid" style={{ '--grid-size': size }} role="grid" aria-label={`${size} by ${size} maze`}>{grid.map((line, row) => line.map((_, col) => <button key={`${row}-${col}`} className={cellClass(row, col)} type="button" role="gridcell" aria-label={`Row ${row + 1}, column ${col + 1}`} onPointerDown={() => { setPointerDown(true); updateCell(row, col) }} onPointerEnter={() => pointerDown && updateCell(row, col)}>{sameCell({ row, col }, start) && 'S'}{sameCell({ row, col }, destination) && 'E'}</button>))}</div></div><div className="maze-footer"><Legend /><p className="canvas-note">Four-directional movement · cost = 1</p></div></section>
      <aside className="results-panel panel"><PanelHeading number="03" eyebrow="ANALYSIS" title="Search results" /><div className={`result-banner ${phase === 'complete' ? result?.found ? 'success' : 'failure' : ''}`}><span className="result-icon">{phase === 'complete' ? result?.found ? '✓' : '!' : '◌'}</span><div><span className="result-label">STATUS</span><strong>{status}</strong></div></div>{error && <p className="error-message">{error}</p>}<p className="message">{message}</p>{phase === 'running' && <div className="animation-controls"><button type="button" onClick={() => setPhase('paused')}>Ⅱ Pause</button><span>{animation.stage === 'explore' ? 'Exploring' : 'Tracing path'}</span></div>}{phase === 'paused' && <div className="animation-controls"><button type="button" onClick={() => setPhase('running')}>▶ Resume</button><span>Paused</span></div>}<div className="stats-list"><Stat label="Algorithm" value="A* Search" /><Stat label="Grid dimensions" value={`${size} × ${size}`} /><Stat label="Nodes explored" value={result?.nodesExplored ?? '—'} /><Stat label="Path length (moves)" value={pathLength} /><Stat label="Computation time" value={result ? `${result.computationTime.toFixed(2)} ms` : '—'} /></div><div className="optimality"><span>✦</span><p><strong>Shortest path guaranteed</strong><br />Manhattan distance is admissible for this grid.</p></div></aside>
    </div><footer className="app-footer"><span>A* / MANHATTAN HEURISTIC</span><span>USER INPUT IS THE ENVIRONMENT</span></footer>
  </main>
}
function PanelHeading({ number, eyebrow, title }) { return <div className="panel-heading"><span className="section-number">{number}</span><div><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div></div> }
function Stat({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div> }
function Legend() { return <div className="legend">{[['start', 'Start'], ['destination', 'End'], ['wall', 'Wall'], ['explored', 'Explored'], ['frontier', 'Frontier'], ['path', 'Path']].map(([type, label]) => <span key={type}><i className={`legend-swatch ${type}`} />{label}</span>)}</div> }
export default App
