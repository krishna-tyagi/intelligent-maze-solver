const DIRECTIONS = [[-1, 0], [1, 0], [0, -1], [0, 1]]

const keyFor = (row, col) => `${row},${col}`

export function solveWithAStar(grid, start, destination) {
  const startedAt = performance.now()
  const size = grid.length
  const destinationKey = keyFor(destination.row, destination.col)
  const openSet = [{ row: start.row, col: start.col, g: 0, f: 0 }]
  const scores = new Map([[keyFor(start.row, start.col), 0]])
  const parents = new Map()
  const closed = new Set()
  const exploredOrder = []
  const frontierOrder = []

  const heuristic = (row, col) =>
    Math.abs(row - destination.row) + Math.abs(col - destination.col)

  while (openSet.length) {
    openSet.sort((first, second) => second.f - first.f || second.g - first.g)
    const current = openSet.pop()
    const currentKey = keyFor(current.row, current.col)
    if (closed.has(currentKey)) continue
    closed.add(currentKey)
    exploredOrder.push({ row: current.row, col: current.col })

    if (currentKey === destinationKey) {
      const path = []
      let pathKey = destinationKey
      while (pathKey) {
        const [row, col] = pathKey.split(',').map(Number)
        path.unshift({ row, col })
        pathKey = parents.get(pathKey)
      }
      return {
        found: true,
        path,
        exploredOrder,
        frontierOrder,
        nodesExplored: exploredOrder.length,
        computationTime: performance.now() - startedAt,
      }
    }

    for (const [rowOffset, colOffset] of DIRECTIONS) {
      const row = current.row + rowOffset
      const col = current.col + colOffset
      if (row < 0 || row >= size || col < 0 || col >= size || grid[row][col].wall) continue
      const neighborKey = keyFor(row, col)
      if (closed.has(neighborKey)) continue
      const nextG = current.g + 1
      if (scores.has(neighborKey) && nextG >= scores.get(neighborKey)) continue
      parents.set(neighborKey, currentKey)
      scores.set(neighborKey, nextG)
      openSet.push({ row, col, g: nextG, f: nextG + heuristic(row, col) })
      frontierOrder.push({ row, col })
    }
  }

  return {
    found: false,
    path: [],
    exploredOrder,
    frontierOrder,
    nodesExplored: exploredOrder.length,
    computationTime: performance.now() - startedAt,
  }
}