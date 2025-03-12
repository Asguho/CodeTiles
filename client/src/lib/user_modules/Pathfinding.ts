// Define a Cords interface to match the game's position structure
export interface Cords {
  x: number;
  y: number;
}

// Node used in the pathfinding algorithm
interface PathNode {
  position: Cords;
  distance: number;
  prev: PathNode | null;
}

export class Pathfinding {
  private directions: Cords[] = [
    { x: 0, y: -1 }, // north
    { x: 0, y: 1 },  // south
    { x: 1, y: 0 },  // east
    { x: -1, y: 0 }, // west
  ];

  /**
   * Find the nearest position that satisfies the given condition
   * @param start Starting position
   * @param isTarget Function to determine if a position is the target
   * @param isWalkable Function to check if a position is walkable
   * @returns The nearest position that satisfies the condition, or null if none found
   */
  findNearest(
    start: Cords,
    isTarget: (position: Cords) => boolean,
    isWalkable: (position: Cords) => boolean
  ): Cords | null {
    // Priority queue implemented as array sorted by distance
    const queue: PathNode[] = [];
    const visited = new Map<string, boolean>();
    const posKey = (pos: Cords) => `${pos.x},${pos.y}`;
    
    // Add starting node
    const startNode: PathNode = { position: start, distance: 0, prev: null };
    queue.push(startNode);
    
    while (queue.length > 0) {
      // Sort and get the node with the smallest distance
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      const currentKey = posKey(current.position);
      
      // If we've already visited this node, skip
      if (visited.has(currentKey)) continue;
      visited.set(currentKey, true);
      
      // Check if this position is a target
      if (isTarget(current.position)) {
        return current.position;
      }
      
      // Explore each direction
      for (const dir of this.directions) {
        const nextPos: Cords = {
          x: current.position.x + dir.x,
          y: current.position.y + dir.y
        };
        const nextKey = posKey(nextPos);
        
        // Skip if we've visited this position or it's not walkable
        if (visited.has(nextKey) || !isWalkable(nextPos)) continue;
        
        // Create next node with distance one more than current
        const nextNode: PathNode = {
          position: nextPos,
          distance: current.distance + 1,
          prev: current
        };
        
        queue.push(nextNode);
      }
    }
    
    // No target found
    return null;
  }
}