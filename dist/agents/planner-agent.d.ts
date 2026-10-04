import { type Progress } from "./live-runner.js";
export interface PlanningDraft {
    hotelId: string;
    days: Array<{
        placeIds: string[];
    }>;
}
export declare function validateDraft(draft: PlanningDraft, data: any): PlanningDraft;
export declare function runPlanner(data: any, progress: Progress): Promise<PlanningDraft>;
//# sourceMappingURL=planner-agent.d.ts.map