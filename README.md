# Intelligent Maze Solver

A user-defined maze-solving application for the AISC course. Users create an N x N grid, position the start and destination, draw obstacles, and watch A\* Search explore the resulting environment.

## Problem Statement

Given a user-created square grid with four-directional movement, find a shortest collision-free route from the start cell to the destination. Walls are impassable and every move costs 1.

## PEAS Formulation

- **Performance:** Reach the destination with the fewest moves while avoiding walls.
- **Environment:** A user-defined N x N grid, with N from 5 to 40, containing empty cells, walls, a start, and a destination.
- **Actuators:** Move to neighboring cells and render explored, frontier, and path states.
- **Sensors:** Grid dimensions, cell contents, start position, destination position, and search state.

## Why A\*?

A\* combines the exact cost already paid, `g(n)`, with an estimate of the remaining cost, `h(n)`:

`f(n) = g(n) + h(n)`

For this grid, Manhattan distance is admissible because movement is restricted to four directions:

`h(n) = |row - goalRow| + |column - goalColumn|`

The heuristic never overestimates the remaining number of moves. Therefore, with unit edge costs, A\* guarantees an optimal shortest path when one exists.

## Workflow

1. Enter a grid size from 5 to 40 and select **Generate grid**.
2. Choose **Set Start** or **Set Destination** to reposition endpoints.
3. Choose **Draw Walls** or **Erase Walls**, then click or drag over cells.
4. Adjust animation speed and select **Solve maze**.
5. Pause or resume the visualization as A\* explores the grid and traces the final path.
6. Review status, explored nodes, path length in moves, and computation time.

## Complexity

For `V = N^2` cells and `E` four-directional neighbor edges, the algorithm stores `O(V)` search state. A conventional binary-heap open set gives `O((V + E) log V)` time. This implementation keeps the open set as an array and sorts it on each selection, so its worst-case practical time is `O(V^2 log V)` and its space complexity is `O(V)`.

## Testing

The project has been verified with `npm run build` and `npm run lint`. Focused A\* checks also cover an open grid's shortest path length, an unreachable destination, and a route that avoids walls.

## Installation and Run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with:

```bash
npm run build
```

## Known Limitations

- The solver supports four-directional movement only; diagonal movement is not modeled.
- Maze edits are disabled during an active visualization and become available after reset or completion.
- The animation visualizes a precomputed search result, so its duration is separate from the measured A\* computation time.
- The interface uses Google Fonts when network access is available and falls back to the configured font family otherwise.

## Live Deployment

Coming soon: `<LIVE_DEPLOYMENT_URL>`
