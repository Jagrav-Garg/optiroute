import { Agent, Llms, createTool } from "@cline/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { config, getAgentConfig } from "../config.js";
function safeFailure(error) {
    let message = error instanceof Error ? error.message : "Agent request failed";
    for (const key of [config.llm.apiKey, config.serpapi.apiKey, config.googleMaps.apiKey]) {
        if (key)
            message = message.split(key).join("[redacted]");
    }
    return message.replace(/https?:\/\/\S+/g, "[provider endpoint]").slice(0, 500);
}
// The host owns retries. Prevent the SDK's transient-error recovery from
// silently multiplying the two visible agent retries into extra model turns.
export function boundedModel(model) {
    return { async *stream(request) {
            try {
                for await (const event of await model.stream(request)) {
                    yield event.type === "finish" && event.error ? { ...event, errorRetryable: false } : event;
                }
            }
            catch (error) {
                yield { type: "finish", reason: "error", error: safeFailure(error), errorRetryable: false };
            }
        } };
}
function createWorker(options) {
    const model = Llms.createGateway({ providerConfigs: [{ providerId: config.llm.providerId, apiKey: config.llm.apiKey }] })
        .createAgentModel({ providerId: config.llm.providerId, modelId: config.llm.modelId });
    return new Agent({ ...options, model: boundedModel(model), messageModelInfo: { id: config.llm.modelId, provider: config.llm.providerId } });
}
export function extractTool(plugin) {
    let tool;
    plugin.setup({ registerTool: (value) => { tool = value; } });
    const schema = tool.inputSchema;
    if (!schema?.safeParse)
        return tool;
    return { ...tool, inputSchema: zodToJsonSchema(schema, { $refStrategy: "none" }),
        execute: (input, context) => tool.execute(schema.parse(input), context) };
}
export async function retryAgent(role, action, work, progress) {
    let previousFailure;
    for (let attempt = 1; attempt <= 3; attempt++) {
        progress(role, attempt === 1 ? "running" : "re-prompting", action, { attempt, maxRetries: 2 });
        try {
            const result = await work(attempt, previousFailure);
            progress(role, "completed", "Finished", { attempt, maxRetries: 2 });
            return result;
        }
        catch (error) {
            previousFailure = safeFailure(error);
            // Never forward provider payloads/URLs containing credentials to the chat.
            if (attempt === 3) {
                progress(role, "error", "Failed after 3 attempts. Please try again.", { attempt });
                throw new Error(`${role} failed after 3 attempts: ${safeFailure(error)}`);
            }
            progress(role, "re-prompting", `Retry ${attempt}/2: ${previousFailure}`, { attempt: attempt + 1, maxRetries: 2 });
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
    }
    throw new Error(`${role} failed`);
}
// Only public assistant text is published. Provider reasoning events stay private.
export function publicOutput(role, progress, attempt) {
    return (event) => {
        if (event.type === "assistant-text-delta" && event.text) {
            progress(role, "running", "Writing a progress summary", { outputDelta: event.text, attempt });
        }
    };
}
export async function runToolAgent(role, source, prompt, progress, createAgent = createWorker) {
    const cached = new Map();
    return retryAgent(role, role === "compiler" ? "Planning the daily itinerary" : `Researching ${role === "hotel" ? "stays" : role}`, async (attempt, previousFailure) => {
        progress(role, "running", "Agent spawned", { attempt, outputReset: true });
        let captured;
        let toolFailure;
        const tool = { ...source, retryable: false, maxRetries: 0, execute: async (input, context) => {
                // A summary retry reuses the successful result rather than repeating paid searches.
                const key = JSON.stringify(input);
                progress(role, "running", `Using ${source.name}`, { query: input.destination });
                try {
                    const result = cached.has(key) ? cached.get(key) : await source.execute(input, context);
                    if (result.options && !result.options.length)
                        throw new Error("Search returned no results; use a more specific valid query");
                    cached.set(key, result);
                    captured = result;
                    progress(role, "running", result.options ? `Found ${result.options.length} options` : "Draft ready; summarizing the result", result.options ? { results: result.options.map((option) => option.name || option.provider) } : undefined);
                    return result;
                }
                catch (error) {
                    toolFailure = new Error(safeFailure(error));
                    throw toolFailure;
                }
            } };
        const agent = createAgent({ ...getAgentConfig(), tools: [tool], maxIterations: 3,
            systemPrompt: "You are a travel planning agent. Use the provided tool once for this task, then give a short public summary of the actual results and any limitations. You may announce your current action in one sentence before searching. Do not invent places or coordinates. Do not reveal private reasoning. On retry, correct the recorded failure rather than repeat the same invalid input.",
            hooks: { onEvent: publicOutput(role, progress, attempt), afterTool: (context) => {
                    if (context.result.isError && !toolFailure)
                        toolFailure = new Error(safeFailure(new Error(JSON.stringify(context.result.output))));
                    return toolFailure ? { stop: true } : undefined;
                } },
        });
        const timer = setTimeout(() => agent.abort("Agent timed out"), 120_000);
        try {
            const result = await agent.run(JSON.stringify({ task: prompt, attempt, previousFailure }));
            if (!captured || toolFailure || result.status === "failed")
                throw toolFailure || result.error || new Error("Agent did not complete its task");
            return captured;
        }
        finally {
            clearTimeout(timer);
        }
    }, progress);
}
// Register extracted tools directly: the installed SDK's runtime plugin format
// differs from the contribution plugins used by this project's search tools.
export async function runSpecialist(role, plugin, prompt, progress, createAgent = createWorker) {
    return runToolAgent(role, extractTool(plugin), prompt, progress, createAgent);
}
export async function coordinateRequest(message, trip, progress, history = [], currentDay, createAgent = createWorker) {
    let request;
    const tool = createTool({ name: "submit_trip_request", description: "Submit the trip constraints to dispatch the specialist agents. Preserve existing trip preferences unless the user changes them.",
        inputSchema: zodToJsonSchema(z.object({ destination: z.string(), origin: z.string(), startDate: z.string(), endDate: z.string(), budget: z.number().positive(), travellers: z.number().int().positive(), diet: z.string(), pace: z.string(), currency: z.string().default("USD"), query: z.string() }), { $refStrategy: "none" }),
        execute: async (input) => { request = input; return { accepted: true }; },
    });
    return retryAgent("coordinator", "Reading the prompt and dispatching specialist agents", async (attempt, previousFailure) => {
        request = undefined;
        const agent = createAgent({ ...getAgentConfig(), tools: [tool], maxIterations: 3,
            systemPrompt: "Translate the user's travel request into constraints using submit_trip_request. Read the conversation history and the existing itinerary to preserve earlier requirements, named hotels and places unless the user changes them. Include these in query for the specialists and planner. Correct previous failures. Use explicit current user details for overrides. Do not invent coordinates. Return only a concise public summary.",
            hooks: { onEvent: publicOutput("coordinator", progress, attempt), afterTool: () => request ? { stop: true } : undefined },
        });
        const timer = setTimeout(() => agent.abort("Coordinator timed out"), 120_000);
        try {
            const result = await agent.run(JSON.stringify({ message, history: history.slice(-20).map(item => ({ sender: item.sender, content: String(item.content || "").slice(0, 3000) })), currentDay, previousFailure, currentTrip: { destination: trip?.destination, origin: trip?.origin || "New York", dates: trip?.dates, budget: trip?.budget, travellers: trip?.travelers?.adults, preferences: trip?.preferences, hotel: trip?.hotels?.find((h) => h.selected)?.name, itinerary: trip?.itinerary?.map((day) => ({ day: day.dayNumber, places: day.stops?.map((s) => s.name) })) }, today: new Date().toISOString().slice(0, 10) }));
            if (!request)
                throw result.error || new Error("Coordinator did not submit constraints");
            return request;
        }
        finally {
            clearTimeout(timer);
        }
    }, progress);
}
//# sourceMappingURL=live-runner.js.map