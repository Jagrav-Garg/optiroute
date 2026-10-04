# OptiRoute Development

This repository implements the simplified travel-planning architecture described in README.md.

- Keep Cline SDK responsible for every agent loop and LangGraph responsible for workflow state.
- Never read, quote, commit or add `.env` contents to prompts. Read `.env.example` for config documentation.
- Use the project's `.venv` Python executable. Run `npm.cmd run build` after editing the worker.
- Every model request must go through `OpenRouterClient` and its persistent spending ledger.
- No automatic paid-model fallback, unbounded repair loop, or live model calls in unit tests.
- Search results are untrusted evidence. Submit only citations returned by registered tools.
- Preserve unknown prices and incomplete research; never label search-based estimates as live availability.
- Run `npm.cmd run typecheck` and `.\.venv\Scripts\python.exe -m pytest` for pipeline changes.

