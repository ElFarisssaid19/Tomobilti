# Tomobilti

## Dev servers

- I usually keep `npm run dev` running at the repo root to watch changes live (frontend http://localhost:5173, API http://localhost:8000).
- Before starting any dev server, check whether these ports already answer. If they do, use the running servers and never stop or restart them, even if a phase prompt says to stop the servers after checking.
- Only start your own servers when nothing is running, and stop only the ones you started.
- Always mention in your report when you ran `migrate:fresh`, because it resets the data and logs me out.

## Browser checks

- I want to watch your browser checks live. Always use the Playwright MCP tools (visible browser window) for browser verification, even when a phase prompt says "headless Chrome". Don't use headless scripts unless the Playwright MCP is unavailable, and tell me if that happens.
- Use the running dev servers, and resize the viewport for the 375px, 768px and 1280px checks.
