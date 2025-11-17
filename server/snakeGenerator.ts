import type { SnakeShape, Position } from "@shared/schema";

interface Tile {
  x: number;
  y: number;
}

interface ShapeData {
  tiles: Set<string>;
  width: number;
  height: number;
}

// Convert position to string key for Set operations
function posKey(x: number, y: number): string {
  return `${x},${y}`;
}

// Parse position key back to coordinates
function parseKey(key: string): Position {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Parse ASCII shape into tiles and dimensions
 */
function parseShape(asciiMask: string): ShapeData {
  const tiles = new Set<string>();
  const rows = asciiMask.split('\n');
  const height = rows.length;
  const width = Math.max(...rows.map(r => r.length));

  rows.forEach((row, y) => {
    const paddedRow = row.padEnd(width, ' ');
    for (let x = 0; x < paddedRow.length; x++) {
      if (paddedRow[x] === '#') {
        tiles.add(posKey(x, y));
      }
    }
  });

  return { tiles, width, height };
}

/**
 * Get 4-directional neighbors of a position that are inside tiles
 */
function neighbors(pos: Position, tiles: Set<string>): Position[] {
  const { x, y } = pos;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const result: Position[] = [];
  
  for (const [dx, dy] of directions) {
    const np = { x: x + dx, y: y + dy };
    if (tiles.has(posKey(np.x, np.y))) {
      result.push(np);
    }
  }
  
  return result;
}

/**
 * Simple seeded random number generator
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Shuffle array in place using optional seeded random
 */
function shuffle<T>(array: T[], rng?: SeededRandom): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng.next() : Math.random()) * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Try to build a single snake starting from `start`
 */
function buildSnake(
  start: Position,
  tiles: Set<string>,
  usedGlobal: Set<string>,
  minLen: number,
  maxLen: number,
  rng?: SeededRandom
): Position[] | null {
  const path: Position[] = [start];
  const usedLocal = new Set<string>([posKey(start.x, start.y)]);

  for (let i = 0; i < maxLen - 1; i++) {
    const current = path[path.length - 1];
    
    // Get candidate neighbors: in shape, not used globally, not used in this snake
    const allNeighbors = neighbors(current, tiles);
    const candidates = allNeighbors.filter(n => {
      const key = posKey(n.x, n.y);
      return !usedGlobal.has(key) && !usedLocal.has(key);
    });

    if (candidates.length === 0) {
      break;
    }

    shuffle(candidates, rng);
    const chosen = candidates[0];

    path.push(chosen);
    usedLocal.add(posKey(chosen.x, chosen.y));

    if (path.length >= maxLen) {
      break;
    }
  }

  if (path.length >= minLen) {
    return path;
  }
  return null;
}

/**
 * Count neighbors for a position to prioritize starting positions
 * Positions with fewer neighbors (corners, edges) are harder to reach
 */
function countNeighbors(key: string, tiles: Set<string>): number {
  const pos = parseKey(key);
  return neighbors(pos, tiles).length;
}

/**
 * Attempt to cover all tiles with non-overlapping snakes in one pass
 */
function tryFillOnce(
  tiles: Set<string>,
  minLen: number,
  maxLen: number,
  rng?: SeededRandom
): Position[][] | null {
  const unused = new Set(tiles);
  const usedGlobal = new Set<string>();
  const snakes: Position[][] = [];

  while (unused.size > 0) {
    // Prioritize starting from positions with fewer neighbors (corners/edges)
    // This prevents getting stuck with isolated hard-to-reach tiles
    const unusedArray = Array.from(unused);
    
    // Sort by neighbor count (ascending) so corners/edges come first
    unusedArray.sort((a, b) => {
      const aNeighbors = countNeighbors(a, tiles);
      const bNeighbors = countNeighbors(b, tiles);
      return aNeighbors - bNeighbors;
    });
    
    // Pick from the first few positions (with fewest neighbors) to add some randomness
    const topCandidates = Math.min(3, unusedArray.length);
    const randomIndex = Math.floor((rng ? rng.next() : Math.random()) * topCandidates);
    const randomKey = unusedArray[randomIndex];
    const start = parseKey(randomKey);

    const snake = buildSnake(start, tiles, usedGlobal, minLen, maxLen, rng);
    if (snake === null) {
      // Could not grow a valid snake from this starting layout
      return null;
    }

    // Reserve its cells globally
    for (const pos of snake) {
      const key = posKey(pos.x, pos.y);
      if (usedGlobal.has(key)) {
        // Overlap case → invalid
        return null;
      }
      usedGlobal.add(key);
      unused.delete(key);
    }

    snakes.push(snake);
  }

  return snakes;
}

/**
 * Generate snakes for a shape with retry logic
 */
export function generateSnakesForShape(
  asciiShape: string,
  minSnakeLen: number,
  maxSnakeLen: number,
  randomSeed?: number,
  maxAttempts: number = 10000
): { snakes: Position[][] | null; attempts: number } {
  const { tiles } = parseShape(asciiShape);

  // Create request-scoped random number generator if seed provided
  const rng = randomSeed !== undefined ? new SeededRandom(randomSeed) : undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const snakes = tryFillOnce(tiles, minSnakeLen, maxSnakeLen, rng);
    if (snakes !== null) {
      return { snakes, attempts: attempt };
    }
  }

  return { snakes: null, attempts: maxAttempts };
}

/**
 * Convert snakes to JSON format
 */
export function snakesToJSON(snakes: Position[][]): SnakeShape[] {
  return snakes.map((snake, i) => ({
    type: `Snake${i + 1}`,
    startPos: { x: 0, y: 0 },
    positions: snake,
  }));
}
