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
import { createTool } from "@cline/core";
import { z } from "zod";
// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------
function validateBudget(plan) {
    const issues = [];
    const breakdown = plan.budgetBreakdown;
    const constraints = plan.constraints;
    if (!breakdown || !constraints)
        return issues;
    const budget = constraints.budget;
    const total = breakdown.total ?? 0;
    if (total > budget) {
        issues.push({
            severity: "error", category: "budget",
            message: `Total cost ($${total}) exceeds budget ($${budget}) by $${total - budget}`,
            suggestion: `Consider cheaper transit (~$${Math.round((total - budget) * 0.4)}) or lower-rated hotel (~$${Math.round((total - budget) * 0.3)})`,
        });
    }
    else if (total > budget * 0.9) {
        issues.push({
            severity: "warning", category: "budget",
            message: `Budget is tight — only $${Math.round(budget - total)} remaining (${Math.round(((budget - total) / budget) * 100)}%)`,
            suggestion: "Add a 10-15% buffer for unexpected expenses",
        });
    }
    else {
        issues.push({ severity: "info", category: "budget", message: `Budget healthy — $${Math.round(budget - total)} remaining` });
    }
    if ((breakdown.food ?? 0) === 0 && constraints.diet !== "any") {
        issues.push({ severity: "warning", category: "budget", message: "No food budget allocated but diet preference is set" });
    }
    return issues;
}
function validateTiming(plan) {
    const issues = [];
    const itinerary = plan.itinerary;
    if (!itinerary)
        return issues;
    for (const day of itinerary) {
        const places = day.places;
        if (!places || places.length < 2)
            continue;
        for (let i = 0; i < places.length - 1; i++) {
            const gap = (new Date(places[i + 1].startTime).getTime() - new Date(places[i].endTime).getTime()) / 60000;
            if (gap < 0) {
                issues.push({
                    severity: "error", category: "timing",
                    message: `Day ${day.day}: Overlap between "${places[i].name}" and "${places[i + 1].name}" (${Math.round(Math.abs(gap))}min)`,
                    suggestion: `Shift "${places[i + 1].name}" later or shorten "${places[i].name}"`,
                });
            }
            else if (gap < 15) {
                issues.push({
                    severity: "warning", category: "timing",
                    message: `Day ${day.day}: Only ${Math.round(gap)}min between "${places[i].name}" and "${places[i + 1].name}"`,
                });
            }
        }
    }
    return issues;
}
function validateOpeningHours(plan) {
    const issues = [];
    const allPlaces = plan.allPlaces;
    const itinerary = plan.itinerary;
    if (!allPlaces || !itinerary)
        return issues;
    const hoursMap = new Map();
    for (const p of allPlaces) {
        if (p.id && p.openingHours)
            hoursMap.set(p.id, p.openingHours);
    }
    for (const day of itinerary) {
        const places = day.places;
        if (!places)
            continue;
        for (const visit of places) {
            const hours = hoursMap.get(visit.placeId);
            if (!hours)
                continue;
            const dayOfWeek = new Date(day.date).toLocaleDateString("en-US", { weekday: "long" });
            if (hours.toLowerCase().includes(`${dayOfWeek.toLowerCase()}: closed`)) {
                issues.push({
                    severity: "error", category: "opening_hours",
                    message: `"${visit.name}" is closed on ${dayOfWeek} (Day ${day.day})`,
                    suggestion: "Reschedule or replace with an alternative",
                });
            }
        }
    }
    return issues;
}
function validateRouting(plan) {
    const issues = [];
    const itinerary = plan.itinerary;
    if (!itinerary)
        return issues;
    for (const day of itinerary) {
        const route = day.route;
        if (!route)
            continue;
        for (const segment of route) {
            const durSec = segment.durationSeconds;
            if (durSec !== undefined && durSec > 7200) {
                issues.push({
                    severity: "warning",
                    category: "routing",
                    message: `Day ${day.day}: Segment from "${segment.from?.name}" to "${segment.to?.name}" takes ${Math.round(durSec / 60)} minutes`,
                    suggestion: "Consider reordering stops or choosing closer alternatives",
                });
            }
        }
    }
    if (itinerary.length === 0) {
        issues.push({
            severity: "warning",
            category: "routing",
            message: "No itinerary days — routing not applicable",
        });
    }
    return issues;
}
// ---------------------------------------------------------------------------
// Plugin: validation-agent
// ---------------------------------------------------------------------------
const validationAgentPlugin = {
    name: "validation-agent",
    manifest: { capabilities: ["tools"] },
    setup(api) {
        api.registerTool(createTool({
            name: "validate_trip",
            description: "Run strict validation on a compiled trip plan. Checks budget compliance, " +
                "timing feasibility (no overlaps), opening hours alignment, and routing sanity. " +
                "Returns pass/fail with categorized issues and fix suggestions.",
            inputSchema: z.object({
                tripPlan: z.record(z.unknown()).describe("The compiled UnifiedTripPlan object to validate"),
            }),
            timeoutMs: 10_000,
            async execute(input) {
                const plan = input.tripPlan;
                const allIssues = [
                    ...validateBudget(plan),
                    ...validateTiming(plan),
                    ...validateOpeningHours(plan),
                    ...validateRouting(plan),
                ];
                const errors = allIssues.filter((i) => i.severity === "error");
                const warnings = allIssues.filter((i) => i.severity === "warning");
                return {
                    passed: errors.length === 0,
                    summary: {
                        errors: errors.length,
                        warnings: warnings.length,
                        infos: allIssues.filter((i) => i.severity === "info").length,
                    },
                    issues: allIssues,
                    recommendation: errors.length > 0
                        ? "Fix all errors before exporting. Critical budget or timing issues must be resolved."
                        : warnings.length > 0
                            ? "Plan is valid but has warnings. Review suggestions for a better experience."
                            : "Plan looks great! Ready for export.",
                };
            },
        }));
    },
};
export { validationAgentPlugin };
export default validationAgentPlugin;
//# sourceMappingURL=validation-agent.js.map