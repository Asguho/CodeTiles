export interface Cords {
  x: number;
  y: number;
}

type direction = 'north' | 'south' | 'east' | 'west';
// Node used in the pathfinding algorithm
interface PathNode {
  position: Cords;
  distance: number;
  prev: PathNode | null;
}

/**
 * Pathfinding utility class that implements Dijkstra's algorithm and A*
 */
export class Pathfinding {
  // Directions for movement: north, south, east, west
  private static directions: Cords[] = [
    { x: 0, y: -1 }, // north
    { x: 0, y: 1 },  // south
    { x: 1, y: 0 },  // east 
    { x: -1, y: 0 }, // west
  ];

  // Helper function to generate position key for maps
  private static posKey(pos: Cords): string {
    return `${pos.x},${pos.y}`;
  }

  /**
   * Find the nearest position that satisfies the target condition
   */
  static findNearest(
    start: Cords,
    isTarget: (position: Cords) => boolean,
    isWalkable: (position: Cords) => boolean
  ): Cords | null {
    // Priority queue implemented as array sorted by distance
    const queue: PathNode[] = [];
    const visited = new Map<string, boolean>();
    
    // Add starting node
    const startNode: PathNode = { position: start, distance: 0, prev: null };
    queue.push(startNode);
    
    while (queue.length > 0) {
      // Sort and get the node with the smallest distance
      queue.sort((a, b) => a.distance - b.distance);
      const current = queue.shift()!;
      const currentKey = this.posKey(current.position);
      
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
        const nextKey = this.posKey(nextPos);
        
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

  /**
   * Find a path from start to end position using the A* algorithm
   * @param start Starting position
   * @param end Target position
   * @param isWalkable Function to check if a position is walkable
   * @returns Array of positions forming the path, or null if no path found
   */
  static findPath(
    start: Cords,
    end: Cords,
    isWalkable: (position: Cords) => boolean
  ): direction[] | null {
    // Calculate Manhattan distance heuristic
    const heuristic = (a: Cords, b: Cords): number => 
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    const startKey = this.posKey(start);
    const openSet = new Set<string>([startKey]);
    const closedSet = new Set<string>();
    
    // Maps for tracking scores and path reconstruction
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, Cords>();
    // Map from keys to actual coordinates to avoid parsing strings
    const coordsMap = new Map<string, Cords>();
    
    // Initialize maps with start position
    coordsMap.set(startKey, start);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, end));
    
    while (openSet.size > 0) {
      // Find node with lowest fScore in openSet
      let currentKey = '';
      let lowestScore = Infinity;
      
      for (const key of openSet) {
        const score = fScore.get(key) || Infinity;
        if (score < lowestScore) {
          lowestScore = score;
          currentKey = key;
        }
      }
      
      // Get coordinates from map instead of parsing
      const current = coordsMap.get(currentKey)!;
      
      // If we've reached the target, reconstruct and return the path
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current, cameFrom);
      }
      
      // Move current node from openSet to closedSet
      openSet.delete(currentKey);
      closedSet.add(currentKey);
      
      // Explore neighbors
      for (const dir of this.directions) {
        const neighbor: Cords = {
          x: current.x + dir.x,
          y: current.y + dir.y
        };
        const neighborKey = this.posKey(neighbor);
        coordsMap.set(neighborKey, neighbor);
        
        // Skip if neighbor is in closed set or not walkable
        if (closedSet.has(neighborKey) || !isWalkable(neighbor)) {
          continue;
        }
        
        // Calculate tentative gScore
        const tentativeGScore = (gScore.get(currentKey)!) + 1;
    
        // If neighbor is not in openSet, add it
        if (!openSet.has(neighborKey)) {
          openSet.add(neighborKey);
        } 
        // If this path to neighbor is not better than previous, skip
        else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }
        
        // This path is the best so far, record it
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
      }
    }
    
    // No path found
    return null;
  }

  /**
   * Reconstruct the path by following the cameFrom map from end to start
   * @returns An array of direction strings ('north', 'south', 'east', 'west')
   */
  private static reconstructPath(end: Cords, cameFrom: Map<string, Cords>): direction[] {
    const directions: direction[] = [];
    let current = end;
    
    // First build the path of coordinates from end to start
    const coordPath: Cords[] = [end];
    while (cameFrom.has(this.posKey(current))) {
      current = cameFrom.get(this.posKey(current))!;
      coordPath.unshift(current);
    }
    
    // Now convert adjacent coordinates to directions
    for (let i = 0; i < coordPath.length - 1; i++) {
      const current = coordPath[i];
      const next = coordPath[i + 1];
      
      // Determine direction based on coordinate change
      if (next.y < current.y) {
        directions.push('north');
      } else if (next.y > current.y) {
        directions.push('south');
      } else if (next.x > current.x) {
        directions.push('east');
      } else if (next.x < current.x) {
        directions.push('west');
      }
    }
    
    return directions;
  }
}
