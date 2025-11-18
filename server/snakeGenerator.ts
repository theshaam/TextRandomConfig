import type { SnakeShape, Position, Direction } from "@shared/schema";

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
 * Get direction of a snake based on its first two positions
 * Direction points AWAY from the tail (where the snake is "looking")
 * Returns null for single-cell snakes (no direction)
 */
function getSnakeDirection(snake: Position[]): Direction | null {
  if (snake.length < 2) {
    return null; // Single-cell snakes have no direction
  }
  
  const head = snake[0];
  const next = snake[1]; // First body segment
  
  // Direction is OPPOSITE of where the body is
  // If body is to the right, snake faces left (away from body)
  if (next.x > head.x) return "left";
  if (next.x < head.x) return "right";
  if (next.y > head.y) return "up";
  return "down";
}

/**
 * Check if two snakes face each other on the same row or column
 * Returns false if either snake is single-cell (no direction)
 */
function snakesFaceEachOther(
  snake1: Position[],
  dir1: Direction | null,
  snake2: Position[],
  dir2: Direction | null
): boolean {
  // Skip check if either snake has no direction (single-cell)
  if (snake1.length === 0 || snake2.length === 0) return false;
  if (dir1 === null || dir2 === null) return false;
  
  const head1 = snake1[0];
  const head2 = snake2[0];
  
  // Check same row
  if (head1.y === head2.y) {
    // One facing left, one facing right
    if ((dir1 === "left" && dir2 === "right") || (dir1 === "right" && dir2 === "left")) {
      // Check if they're actually facing each other (not back-to-back)
      if (dir1 === "left" && head1.x > head2.x) return true;
      if (dir1 === "right" && head1.x < head2.x) return true;
    }
  }
  
  // Check same column
  if (head1.x === head2.x) {
    // One facing up, one facing down
    if ((dir1 === "up" && dir2 === "down") || (dir1 === "down" && dir2 === "up")) {
      // Check if they're actually facing each other (not back-to-back)
      if (dir1 === "up" && head1.y > head2.y) return true;
      if (dir1 === "down" && head1.y < head2.y) return true;
    }
  }
  
  return false;
}

/**
 * Generate a single greedy snake path (much faster than generating all possibilities)
 * Tries to create snakes of varying lengths randomly
 */
function generateGreedySnake(
  start: Position,
  tiles: Set<string>,
  usedGlobal: Set<string>,
  minLen: number,
  maxLen: number,
  rng?: SeededRandom
): Position[] | null {
  const path: Position[] = [start];
  const usedLocal = new Set([posKey(start.x, start.y)]);
  
  // Randomly decide target length for this snake
  const targetLen = minLen + Math.floor((rng ? rng.next() : Math.random()) * (maxLen - minLen + 1));
  
  while (path.length < targetLen) {
    const current = path[path.length - 1];
    const allNeighbors = neighbors(current, tiles);
    const candidates = allNeighbors.filter(n => {
      const key = posKey(n.x, n.y);
      return !usedGlobal.has(key) && !usedLocal.has(key);
    });
    
    if (candidates.length === 0) {
      break; // Can't extend further
    }
    
    // Pick a random neighbor
    const randomIndex = Math.floor((rng ? rng.next() : Math.random()) * candidates.length);
    const next = candidates[randomIndex];
    
    path.push(next);
    usedLocal.add(posKey(next.x, next.y));
  }
  
  // Return the snake if it meets minimum length
  return path.length >= minLen ? path : null;
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
 * Optimized greedy solver - much faster than full backtracking
 * Uses a greedy approach with limited retries instead of exploring all possibilities
 */
function solveWithGreedy(
  tiles: Set<string>,
  minLen: number,
  maxLen: number,
  rng?: SeededRandom,
  maxAttempts: number = 50
): Position[][] | null {
  const unused = new Set(tiles);
  const snakes: Position[][] = [];
  const directions: (Direction | null)[] = [];
  let attempts = 0;
  
  while (unused.size > 0 && attempts < maxAttempts) {
    attempts++;
    
    // Find the starting position with fewest neighbors (corners/edges first)
    const unusedArray = Array.from(unused);
    unusedArray.sort((a, b) => {
      const aNeighbors = countNeighbors(a, tiles);
      const bNeighbors = countNeighbors(b, tiles);
      return aNeighbors - bNeighbors;
    });
    
    // Always start from the most constrained position (fewest neighbors)
    const startKey = unusedArray[0];
    const start = parseKey(startKey);
    
    // Build used global set
    const usedGlobal = new Set(tiles);
    unused.forEach(key => usedGlobal.delete(key));
    
    // Try to generate a snake a few times
    let snake: Position[] | null = null;
    let attempts2 = 0;
    const maxSnakeAttempts = 10;
    
    while (attempts2 < maxSnakeAttempts && !snake) {
      attempts2++;
      const candidate = generateGreedySnake(start, tiles, usedGlobal, minLen, maxLen, rng);
      
      if (!candidate) continue;
      
      // Check direction constraint
      const newDirection = getSnakeDirection(candidate);
      let violatesDirection = false;
      
      for (let i = 0; i < snakes.length; i++) {
        if (snakesFaceEachOther(candidate, newDirection, snakes[i], directions[i])) {
          violatesDirection = true;
          break;
        }
      }
      
      if (!violatesDirection) {
        snake = candidate;
      }
    }
    
    if (!snake) {
      // Can't place a valid snake, backtrack last snake if we have any
      if (snakes.length > 0) {
        const lastSnake = snakes.pop()!;
        directions.pop();
        lastSnake.forEach(pos => unused.add(posKey(pos.x, pos.y)));
      } else {
        return null; // Failed to find solution
      }
      continue;
    }
    
    // Place the snake
    const snakeKeys = snake.map(pos => posKey(pos.x, pos.y));
    snakeKeys.forEach(key => unused.delete(key));
    snakes.push(snake);
    directions.push(getSnakeDirection(snake));
  }
  
  // Success if all tiles are used
  return unused.size === 0 ? snakes : null;
}

/**
 * Generate snakes for a shape using optimized greedy algorithm
 */
export function generateSnakesForShape(
  asciiShape: string,
  minSnakeLen: number,
  maxSnakeLen: number,
  randomSeed?: number,
  maxAttempts: number = 20
): { snakes: Position[][] | null; attempts: number } {
  const { tiles } = parseShape(asciiShape);

  // Create request-scoped random number generator if seed provided
  const rng = randomSeed !== undefined ? new SeededRandom(randomSeed) : undefined;

  // Try greedy algorithm multiple times with different random choices
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const snakes = solveWithGreedy(tiles, minSnakeLen, maxSnakeLen, rng, 100);
    if (snakes !== null) {
      return { snakes, attempts: attempt };
    }
  }

  return { snakes: null, attempts: maxAttempts };
}

/**
 * Calculate the position the snake is looking at based on head and direction
 */
function getLookingAtPosition(head: Position, direction: Direction | null): Position | null {
  if (direction === null) {
    return null;
  }
  
  const lookingAt = { ...head };
  
  switch (direction) {
    case "up":
      lookingAt.y -= 1;
      break;
    case "down":
      lookingAt.y += 1;
      break;
    case "left":
      lookingAt.x -= 1;
      break;
    case "right":
      lookingAt.x += 1;
      break;
  }
  
  return lookingAt;
}

/**
 * Convert snakes to JSON format
 */
export function snakesToJSON(snakes: Position[][]): SnakeShape[] {
  return snakes.map((snake, i) => {
    const direction = getSnakeDirection(snake);
    const head = snake[0];
    const lookingAt = getLookingAtPosition(head, direction);
    
    return {
      type: `Snake${i + 1}`,
      startPos: { x: 0, y: 0 },
      direction,
      lookingAt,
      positions: snake,
    };
  });
}
