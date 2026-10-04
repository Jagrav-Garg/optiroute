/**
 * Compiler Agent Plugin
 *
 * Registers a `compile_trip` tool that merges outputs from Transit, Hotel,
 * and Places agents into a UnifiedTripPlan JSON with schema validation.
 */
import { type AgentPlugin } from "@cline/core";
declare const compilerAgentPlugin: AgentPlugin;
export { compilerAgentPlugin };
export default compilerAgentPlugin;
//# sourceMappingURL=compiler-agent.d.ts.map