# Agent Status Update Fix

## Problem
Agent statuses were being calculated correctly in the backend and received by the frontend, but the UI was not updating. All agents remained stuck in "Queued" state even though the console logs showed they should be "Active" or "Complete".

## Root Cause
The timer interval (which updates elapsed time every second) was also sending the initial `agentStatuses` array with every tick. This was overwriting the correct agent statuses that came from SSE messages.

**The conflict:**
1. SSE message arrives: "Financial Analyst started" → Updates agentStatuses → Calls onProgress with updated agents
2. 1 second later: Timer tick → Calls onProgress with OLD agentStatuses (still all "queued")
3. Result: UI shows the old state from the timer, not the new state from SSE

## Solution
**Changed the timer to only send elapsed time**, not agents or logs:

```javascript
// Before (WRONG):
const timerInterval = setInterval(() => {
  onProgress({
    agents: agentStatuses,  // ← Overwrites SSE updates!
    elapsed,
    logs,
  });
}, 1000);

// After (CORRECT):
const timerInterval = setInterval(() => {
  onProgress({
    elapsed,  // ← Only send elapsed time
  });
}, 1000);
```

## Why This Works
- **Timer updates:** Only elapsed time (every second)
- **SSE updates:** Agents, progress, logs (when backend sends them)
- **No conflicts:** Each update type has its own responsibility

## Testing
After this fix, you should see:
1. ✅ Elapsed time updates every second
2. ✅ Agent status changes from "Queued" → "Active" → "Complete" in real-time
3. ✅ Progress bar increases as agents complete
4. ✅ Live feed shows all messages
5. ✅ All 6 agents update correctly (not just Financial Analyst)

## Files Modified
1. `frontend/src/lib/api.js` - Removed agents/logs from timer interval
2. `frontend/src/pages/ResearchConsole.jsx` - Changed checks from `if (update.field)` to `if (update.field !== undefined)` for clarity
