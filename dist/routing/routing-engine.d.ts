/**
 * Routing Engine
 *
 * Registers an `optimize_route` tool that:
 *   1. Calls Google Maps Distance Matrix API to get travel times
 *   2. Uses Held-Karp DP TSP for ≤ 10 stops (exact optimal)
 *   3. Falls back to nearest-neighbour greedy for larger sets
 */
import { type AgentPlugin } from "@cline/core";
/** Held-Karp TSP solver — exact, O(n²·2ⁿ), feasible for n ≤ 12 */
export declare function heldKarpTsp(dist: number[][]): number[];
/** Nearest-neighbour fallback for n > 12 */
export declare function nearestNeighbourTsp(dist: number[][]): number[];
declare const routingEnginePlugin: AgentPlugin;
export { routingEnginePlugin };
export default routingEnginePlugin;
//# sourceMappingURL=routing-engine.d.ts.map