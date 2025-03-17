export interface Cords {
    x: number;
    y: number;
}
type direction = 'north' | 'south' | 'east' | 'west';
/**
 * Pathfinding utility class that implements Dijkstra's algorithm and A*
 */
export declare class Pathfinding {
    private static directions;
    private static posKey;
    /**
     * Find the nearest position that satisfies the target condition
     */
    static findNearest(start: Cords, isTarget: (position: Cords) => boolean, isWalkable: (position: Cords) => boolean): Cords | null;
    /**
     * Find a path from start to end position using the A* algorithm
     * @param start Starting position
     * @param end Target position
     * @param isWalkable Function to check if a position is walkable
     * @returns Array of positions forming the path, or null if no path found
     */
    static findPath(start: Cords, end: Cords, isWalkable: (position: Cords) => boolean): direction[] | null;
    /**
     * Reconstruct the path by following the cameFrom map from end to start
     * @returns An array of direction strings ('north', 'south', 'east', 'west')
     */
    private static reconstructPath;
}
export {};
