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

import { type AgentPlugin, createTool } from "@cline/core";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: "budget" | "timing" | "opening_hours" | "routing" | "other";
  message: string;
  suggestion?: string;
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

function validateBudget(plan: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const breakdown = plan.budgetBreakdown as Record<string, number> | undefined;
  const constraints = plan.constraints as Record<string, unknown> | undefined;
  if (!breakdown || !constraints) return issues;

  const budget = constraints.budget as number;
  const total = breakdown.total ?? 0;

  if (total > budget) {
    issues.push({
      severity: "error", category: "budget",
      message: `Total cost ($${total}) exceeds budget ($${budget}) by $${total - budget}`,
      suggestion: `Consider cheaper transit (~$${Math.round((total - budget) * 0.4)}) or lower-rated hotel (~$${Math.round((total - budget) * 0.3)})`,
    });
  } else if (total > budget * 0.9) {
    issues.push({
      severity: "warning", category: "budget",
      message: `Budget is tight — only $${Math.round(budget - total)} remaining (${Math.round(((budget - total) / budget) * 100)}%)`,
      suggestion: "Add a 10-15% buffer for unexpected expenses",
    });
  } else {
    issues.push({ severity: "info", category: "budget", message: `Budget healthy — $${Math.round(budget - total)} remaining` });
  }

  if ((breakdown.food ?? 0) === 0 && constraints.diet !== "any") {
    issues.push({ severity: "warning", category: "budget", message: "No food budget allocated but diet preference is set" });
  }

  return issues;
}

function validateTiming(plan: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const itinerary = plan.itinerary as Array<Record<string, unknown>> | undefined;
  if (!itinerary) return issues;

  for (const day of itinerary) {
    const places = day.places as Array<Record<string, string>> | undefined;
    if (!places || places.length < 2) continue;
    for (let i = 0; i < places.length - 1; i++) {
      const gap = (new Date(places[i + 1].startTime).getTime() - new Date(places[i].endTime).getTime()) / 60000;
      if (gap < 0) {
        issues.push({
          severity: "error", category: "timing",
          message: `Day ${day.day}: Overlap between "${places[i].name}" and "${places[i + 1].name}" (${Math.round(Math.abs(gap))}min)`,
          suggestion: `Shift "${places[i + 1].name}" later or shorten "${places[i].name}"`,
        });
      } else if (gap < 15) {
        issues.push({
          severity: "warning", category: "timing",
          message: `Day ${day.day}: Only ${Math.round(gap)}min between "${places[i].name}" and "${places[i + 1].name}"`,
        });
      }
    }
  }
  return issues;
}

function validateOpeningHours(plan: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allPlaces = plan.allPlaces as Array<Record<string, unknown>> | undefined;
  const itinerary = plan.itinerary as Array<Record<string, unknown>> | undefined;
  if (!allPlaces || !itinerary) return issues;

  const hoursMap = new Map<string, string>();
  for (const p of allPlaces) {
    if (p.id && p.openingHours) hoursMap.set(p.id as string, p.openingHours as string);
  }

  for (const day of itinerary) {
    const places = day.places as Array<Record<string, string>> | undefined;
    if (!places) continue;
    for (const visit of places) {
      const hours = hoursMap.get(visit.placeId);
      if (!hours) continue;
      const dayOfWeek = new Date(day.date as string).toLocaleDateString("en-US", { weekday: "long" });
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

function validateRouting(plan: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const itinerary = plan.itinerary as Array<Record<string, unknown>> | undefined;
  if (!itinerary) return issues;

  for (const day of itinerary) {
    const route = day.route as Array<Record<string, unknown>> | undefined;
    if (!route) continue;
    for (const segment of route) {
      const durSec = segment.durationSeconds as number | undefined;
      if (durSec !== undefined && durSec > 7200) {
        issues.push({
          severity: "warning",
          category: "routing",
          message: `Day ${day.day}: Segment from "${(segment.from as Record<string, unknown>)?.name}" to "${(segment.to as Record<string, unknown>)?.name}" takes ${Math.round(durSec / 60)} minutes`,
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

const validationAgentPlugin: AgentPlugin = {
  name: "validation-agent",
  manifest: { capabilities: ["tools"] },

  setup(api: any) {
    api.registerTool(
      createTool({
        name: "validate_trip",
        description:
          "Run strict validation on a compiled trip plan. Checks budget compliance, " +
          "timing feasibility (no overlaps), opening hours alignment, and routing sanity. " +
          "Returns pass/fail with categorized issues and fix suggestions.",
        inputSchema: z.object({
          tripPlan: z.record(z.unknown()).describe("The compiled UnifiedTripPlan object to validate"),
        }),
        timeoutMs: 10_000,

        async execute(input: { tripPlan: Record<string, unknown> }) {
          const plan = input.tripPlan;
          const allIssues: ValidationIssue[] = [
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
      }),
    );
  },
};

export { validationAgentPlugin };
export default validationAgentPlugin;
