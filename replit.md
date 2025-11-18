# Snake Puzzle Generator

A professional web application for puzzle creators to generate snake patterns from ASCII shapes with colorful visualization and JSON export capabilities.

## Overview

This tool allows users to:
- Input custom ASCII shapes using '#' characters
- Adjust snake generation parameters (min/max length, random seed)
- Generate non-overlapping snake patterns that fill the entire shape
- Visualize results with distinct colors for each snake
- Export patterns to JSON format
- Copy JSON output to clipboard

## Recent Changes

**November 18, 2025**
- Changed minimum snake length from 3 to 1 (supports single-cell snakes)
- Implemented backtracking algorithm for reliable complex shape generation
- Added direction parameter to each snake (up/down/left/right or null for single-cell)
- Added constraint: snake heads on same row/column cannot face each other directly
- Direction is calculated from first two positions and included in JSON output
- Single-cell snakes (direction: null) bypass the facing constraint

**November 17, 2025**
- Implemented complete snake puzzle generator MVP
- Created beautiful two-panel interface following design guidelines
- Ported Python snake generation algorithm to TypeScript
- Added request-scoped seeded random number generation
- Implemented JSON output viewer with copy functionality
- Added comprehensive error handling and loading states
- All end-to-end tests passing

## User Preferences

- Clean, productivity-focused design aesthetic
- Professional tools interface (similar to Linear, Figma)
- Inter font for UI elements, JetBrains Mono for code
- Minimal, purposeful animations
- Consistent spacing and visual hierarchy

## Project Architecture

### Frontend (`client/src/`)
- **pages/home.tsx** - Main application page with two-panel layout
- **App.tsx** - Root app component with routing
- **index.css** - Design system tokens and elevation utilities
- **components/ui/** - Shadcn UI component library

### Backend (`server/`)
- **routes.ts** - API endpoint for snake generation (`POST /api/generate`)
- **snakeGenerator.ts** - Core algorithm for filling shapes with snakes
  - Backtracking algorithm with most-constrained-variable-first heuristic
  - Request-scoped SeededRandom for deterministic generation
  - Direction calculation and face-to-face constraint enforcement
  - 100,000 iteration limit to prevent runaway searches
  - Retry logic with up to 10 attempts
- **storage.ts** - Storage interface (currently unused, ready for future features)

### Shared (`shared/`)
- **schema.ts** - Zod schemas and TypeScript types for API contracts

## Technical Details

### Snake Generation Algorithm
1. Parse ASCII shape into grid of tiles
2. Use backtracking to place snakes:
   - Always start from most constrained position (fewest neighbors)
   - Generate all possible snake paths from start position
   - Calculate direction from first two positions (up/down/left/right)
   - Check direction constraint: reject if snake would face an existing snake on same row/column
   - Place snake and recurse to fill remaining tiles
   - Backtrack if no valid placement exists
3. Single-cell snakes have direction: null and bypass facing constraint
4. Return JSON with snake positions and directions

### API Contract

**POST /api/generate**
```typescript
// Request
{
  asciiShape: string;      // ASCII art with '#' for cells
  minSnakeLen: number;     // 1-11 (now supports single-cell snakes)
  maxSnakeLen: number;     // 1-11
  randomSeed?: number;     // Optional for deterministic results
}

// Response
{
  success: boolean;
  shapes?: SnakeShape[];   // Array of snakes with positions and directions
  attempts?: number;       // How many tries needed
  error?: string;          // Error message if failed
}

// SnakeShape
{
  type: string;            // e.g., "Snake1"
  startPos: Position;      // Always {x: 0, y: 0} (normalized)
  direction: Direction | null; // "up"|"down"|"left"|"right" or null for single-cell
  positions: Position[];   // Array of {x, y} coordinates
}
```

### Design System
- Primary color: Blue (HSL 217 91% 48%)
- Spacing: 4px, 6px, 8px, 12px units
- Fonts: Inter (UI), JetBrains Mono (code)
- Two-panel layout: 40% controls, 60% visualization
- Responsive breakpoints: mobile (<768px), tablet (768-1023px), desktop (≥1024px)

## Known Limitations

- Direction constraint may prevent generation of certain configurations:
  - Example: A single row with strictly 2-cell snakes will fail (they'd face each other)
  - Solution: Allow single-cell snakes (min=1) or increase max length for flexibility
- Backtracking algorithm is exhaustive but capped at 100,000 iterations
- Some valid tilings may not be found if search space is too large
- Users can adjust parameters or simplify shapes if generation fails

## Future Enhancements

- Syntax highlighting for JSON output
- Dark mode support (infrastructure in place, needs testing)
- Preset shape library (heart, star, circle templates)
- Interactive shape drawing tool
- Export to multiple formats (PNG, SVG)
- Animation showing generation process
- Undo/redo for shape editing
- Parameter history

## Running the Project

The application is configured to run with:
```bash
npm run dev
```

This starts both the Express backend server and Vite frontend development server on port 5000.
