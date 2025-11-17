# Snake Puzzle Generator - Design Guidelines

## Design Approach

**Selected Approach**: Design System (Productivity Tool Pattern)  
**Primary References**: Linear (clean workspace), Figma (canvas-based tools), VS Code (code editor patterns)  
**Rationale**: This is a utility-focused tool for puzzle creators requiring clear parameter controls, code input, and visual output. Prioritize functionality, clarity, and efficient workflow over decorative elements.

## Layout Architecture

**Two-Panel Split Layout** (Desktop):
- Left Panel (40% width): Controls and input area
- Right Panel (60% width): Visual canvas and output
- Mobile: Stack vertically (controls → canvas)

**Container Structure**:
- Full viewport height application (h-screen)
- Fixed header with app title and export controls
- Scrollable panels as needed (overflow-auto)

## Typography System

**Font Stack**:
- Primary: 'Inter' via Google Fonts for UI elements
- Monospace: 'JetBrains Mono' for ASCII input and code display

**Type Scale**:
- Page title: text-2xl font-semibold
- Section headers: text-lg font-medium
- Body/labels: text-sm font-normal
- Code/input: text-sm font-mono
- Helper text: text-xs

## Spacing System

**Tailwind Units**: Use 4, 6, 8, 12 as primary spacing values
- Component padding: p-6
- Section gaps: space-y-6
- Tight spacing: gap-4
- Element margins: mb-4, mt-8
- Canvas padding: p-8

## Component Library

### Header Bar
- Full-width sticky header
- App title (left): "Snake Puzzle Generator"
- Export JSON button (right): Primary action button with download icon
- Bottom border separator

### Left Panel - Controls Section

**ASCII Shape Input**:
- Label: "Shape Input (use # for cells)"
- Textarea: min-h-64, monospace font, border, rounded corners
- Default heart shape pre-filled
- Clear visual focus state

**Parameter Controls** (stacked vertically):
- Min Snake Length: Number input with label, range 3-11
- Max Snake Length: Number input with label, range 3-11  
- Random Seed: Text input (optional field), placeholder "Leave empty for random"
- Use form control styling: border, rounded, focus ring

**Generate Button**:
- Large, prominent primary button
- Full width of panel
- "Generate Snake Pattern" text
- Loading state with spinner when processing

**Status Display**:
- Success message: "Success! Generated X snakes in Y attempts"
- Error message: "Failed to generate pattern. Try adjusting parameters."
- Use appropriate semantic styling

### Right Panel - Visualization Canvas

**Canvas Container**:
- Centered canvas element with border
- Grid-based rendering of snake patterns
- Each snake rendered in distinct, vibrant colors
- Snake head indicators (slightly larger or different shape)
- Grid cells: 24px × 24px minimum
- Clear cell borders for structure

**Color Palette for Snakes**:
Use vibrant, distinct colors from Material Design palette:
- Snake 1: Blue (500)
- Snake 2: Red (500)
- Snake 3: Green (500)
- Snake 4: Purple (500)
- Snake 5: Orange (500)
- Continue with Pink, Teal, Amber, etc.

**Empty State**:
- Centered message: "Click Generate to create snake pattern"
- Icon placeholder

### JSON Output Display (Below Canvas)
- Collapsible section: "View JSON Output"
- Code block with syntax highlighting
- Copy to clipboard button
- Monospace font, contained in rounded border box

## Interactive States

**Buttons**:
- Default: Solid fill, rounded corners
- Hover: Slight brightness increase
- Active: Slight scale reduction
- Disabled: Reduced opacity

**Form Inputs**:
- Focus: Border highlight with ring
- Error: Red border with error message below
- Disabled: Reduced opacity

**Canvas Cells**:
- Hover: Subtle highlight to show interactivity
- No click interactions (view-only visualization)

## Animations

**Minimal, Purposeful Only**:
- Generate button: Spinner animation during processing
- Canvas rendering: Fade-in when pattern loads
- Panel transitions: Smooth slide on mobile
- No unnecessary decorative animations

## Accessibility

- Proper label associations for all inputs
- ARIA labels for icon-only buttons
- Keyboard navigation support (Tab order: inputs → generate → export)
- Focus visible indicators on all interactive elements
- Sufficient contrast ratios for text and borders

## Responsive Behavior

**Desktop (≥1024px)**:
- Side-by-side two-panel layout
- Canvas scales proportionally

**Tablet (768px - 1023px)**:
- Narrow left panel or stack vertically
- Reduce canvas scale

**Mobile (<768px)**:
- Full vertical stack: Header → Controls → Canvas → Output
- Reduce padding to p-4
- Full-width buttons and inputs

## Images

**No hero image required**. This is a functional tool where the workspace itself is the primary interface. The canvas visualization serves as the visual focal point.