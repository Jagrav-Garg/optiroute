import { Agent, type AgentPlugin } from "@cline/sdk";
export type Progress = (agent: string, status: string, action: string, detail?: Record<string, unknown>) => void;
export declare function boundedModel(model: {
    stream: (request: any) => any;
}): {
    stream(request: any): AsyncGenerator<any, void, unknown>;
};
export declare function extractTool(plugin: AgentPlugin): any;
export declare function retryAgent<T>(role: string, action: string, work: (attempt: number, previousFailure?: string) => Promise<T>, progress: Progress): Promise<T>;
export declare function publicOutput(role: string, progress: Progress, attempt: number): (event: any) => void;
export declare function runToolAgent(role: string, source: any, prompt: string, progress: Progress, createAgent?: (options: any) => Agent): Promise<any>;
export declare function runSpecialist(role: string, plugin: AgentPlugin, prompt: string, progress: Progress, createAgent?: (options: any) => Agent): Promise<any>;
export declare function coordinateRequest(message: string, trip: any, progress: Progress, history?: any[], currentDay?: number, createAgent?: (options: any) => Agent): Promise<any>;
//# sourceMappingURL=live-runner.d.ts.map