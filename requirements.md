# Obsidian Graph View - Requirements

## 1. Node Positioning & Hierarchy

### Sequential Relations (Top-to-Bottom)
- If node A has a directed relation to node B (A -> B), then A **must** be positioned above B
- Vertical ordering reflects the sequence/direction of relationships
- This is a hard constraint on layout algorithm

## 2. Edge Types

| Relation Type | Line Style | Description |
|---------------|------------|-------------|
| **Direct/Strong** | Solid line | Concrete dependency, sequence, or direct link |
| **Semantic/Weak** | Dotted line | Conceptually related, loosely associated |

- Edge type is determined by **relationship strength**, not location
- Both intra-circle (same context) and inter-circle (cross-context) edges use the same rule
- If A→B is direct: solid line regardless of whether they're in same or different circles
- If A is related to B semantically: dotted line

## 3. Circle-Based Layout

### Circle Assignment
- Each node has explicit `context` field (e.g., `"tech"`, `"content"`, `"devops"`)
- Backend sends the data with context; frontend groups by context
- One circle per unique context value

### Circle Positioning
- **Force-directed**: circles repel each other, spread organically
- Circles with more connections between them are pulled closer
- Equilibrium emerges from forces, not fixed positions

### Radius
- Dynamic per circle: `baseRadius + (nodeCount * spacingFactor)`
- More nodes in a circle → larger circumference

### Isolated Nodes
- Nodes with no context or no connections go to an **outer ring**
- Outer ring positioned at viewport edge

### Visual Representation
- **Halo**: subtle ring/arc at circle boundary showing grouping
- **Per-circle accent color**: each context circle has its own accent color for:
  - Halo glow
  - Node border/glow on selection
  - Could use: tech=blue, content=purple, devops=orange, etc.

## 4. Canvas Boundaries

### Scroll Limits
- Prevent user from panning/scrolling infinitely
- Implement **virtual bounds** that limit how far the user can scroll
- Canvas should feel contained, not boundless
- Soft bounce or hard stop at boundaries

## 5. Collision System

### Node Separation
- Nodes must **not stack on top of each other**
- Implement collision detection to keep nodes physically separate
- Minimum distance maintained between all nodes
- When nodes would overlap, apply repulsion force to separate them
- Smooth animation when nodes are pushed apart

## 6. Sequence & Vertical Stacking

### Within a Circle
- All directed connected nodes (solid lines) exist in **one circle only** — no inter-circle sequences
- A→B→C in same circle means: A at top, C at bottom (vertical stack)
- This vertical ordering is **locked** — user cannot break it by dragging
- Even if user moves nodes, the vertical sequence is preserved

### Collision Within Circle
- Nodes in the vertical stack still have collision avoidance
- They maintain minimum distance between each other
- The vertical order is maintained but spacing is enforced

## 7. Force-Directed System

### Circle-Level Forces
- Circles repel each other (like charged particles)
- Circles with connections between them have attraction force
- Circles settle into equilibrium positions

### Node-Level Forces (within circles)
- Vertical stacking enforces sequence order
- Collision repulsion prevents node overlap
- User can drag nodes but vertical sequence constraint applies

## Summary of Constraints

| Constraint | Implementation |
|------------|----------------|
| Sequential positioning | A → B means A is above B (within same circle only) |
| Solid lines | Direct/strong relation (also means same circle) |
| Dotted lines | Semantic/weak relation (cross-circle or same circle) |
| Circle layout | Force-directed with repulsion + inter-circle attraction |
| Circle radius | Dynamic based on node count |
| Isolated nodes | Outer ring |
| Canvas limits | Bounded viewport with pan limits |
| Collision prevention | Repulsion forces for nodes within circles |
| Sequence lock | Vertical order maintained even after user drag |
| Visual distinction | Per-circle accent color + halo |