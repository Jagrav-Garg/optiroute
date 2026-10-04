/**
 * Validation Agent Plugin
 *
 * Registers a `validate_trip` tool that performs strict validation:
 *   - Budget compliance (total ≤ user budget)
 *   - Timing feasibility (no overlaps, enough time between stops)
 *   - Opening hours alignment
 *   - Routing sanity checks
 *
 * Returns pass/fail with categorized issues and fix suggestions.
 */
import { type AgentPlugin } from "@cline/core";
declare const validationAgentPlugin: AgentPlugin;
export { validationAgentPlugin };
export default validationAgentPlugin;
//# sourceMappingURL=validation-agent.d.ts.map