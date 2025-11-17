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

**November 17, 2025**
- Implemented complete snake puzzle generator MVP
- Created beautiful two-panel interface following design guidelines
- Ported Python snake generation algorithm to TypeScript
- Added request-scoped seeded random number generation
- Implemented JSON output viewer with copy functionality
- Added comprehensive error handling and loading states
- Increased max generation attempts to 10,000 for better success rate
- Changed default shape to reliable 8x8 grid
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
  - Request-scoped SeededRandom for deterministic generation
  - Retry logic with up to 10,000 attempts
  - Correct snake head position tracking
- **storage.ts** - Storage interface (currently unused, ready for future features)

### Shared (`shared/`)
- **schema.ts** - Zod schemas and TypeScript types for API contracts

## Technical Details

### Snake Generation Algorithm
1. Parse ASCII shape into grid of tiles
2. Randomly select starting position for each snake
3. Grow snakes along 4-directional neighbors
4. Ensure no overlapping between snakes
5. Retry if unable to fill entire shape
6. Return JSON with snake positions

### API Contract

**POST /api/generate**
```typescript
// Request
{
  asciiShape: string;      // ASCII art with '#' for cells
  minSnakeLen: number;     // 3-11
  maxSnakeLen: number;     // 3-11
  randomSeed?: number;     // Optional for deterministic results
}

// Response
{
  success: boolean;
  shapes?: SnakeShape[];   // Array of snakes with positions
  attempts?: number;       // How many tries needed
  error?: string;          // Error message if failed
}
```

### Design System
- Primary color: Blue (HSL 217 91% 48%)
- Spacing: 4px, 6px, 8px, 12px units
- Fonts: Inter (UI), JetBrains Mono (code)
- Two-panel layout: 40% controls, 60% visualization
- Responsive breakpoints: mobile (<768px), tablet (768-1023px), desktop (≥1024px)

## Known Limitations

- Complex shapes (e.g., heart, intricate patterns) may fail to generate if no valid snake tiling exists
- Algorithm uses greedy random search, not guaranteed to find solution for all shapes
- Default 8x8 grid and simple rectangular shapes work reliably
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
