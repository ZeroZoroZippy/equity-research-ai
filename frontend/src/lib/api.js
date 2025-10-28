const API_BASE = '';

export class ResearchAPI {
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async researchStock(symbol, exchange = 'US') {
    const response = await fetch(`${API_BASE}/research/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, exchange }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start research');
    }

    return response.json();
  }

  static async researchSector(sector, exchange = 'US', numCompanies = 5) {
    const response = await fetch(`${API_BASE}/research/sector`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sector,
        exchange,
        num_companies: numCompanies
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start sector research');
    }

    return response.json();
  }

  static connectProgressStream(sessionId, onUpdate) {
    const url = `${API_BASE}/research/progress/${sessionId}`;
    console.log('🔌 Connecting to SSE stream for session:', sessionId);
    console.log('🔌 SSE URL:', url);
    console.log('🔌 Full URL:', window.location.origin + url);
    
    // Test if endpoint is reachable first
    fetch(url, { method: 'HEAD' }).then(response => {
      console.log('🔌 SSE endpoint HEAD check:', response.status);
    }).catch(err => {
      console.error('🔌 SSE endpoint not reachable:', err);
    });
    
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('SSE connection opened successfully');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE data received:', data);
        onUpdate(data);

        // Close connection on complete or error
        if (data.type === 'complete' || data.type === 'error') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
      console.error('EventSource readyState:', eventSource.readyState);
      console.error('EventSource url:', eventSource.url);
      
      // Don't close immediately on first error (might be connecting)
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE connection closed');
        eventSource.close();
        onUpdate({ type: 'error', error: 'Connection lost' });
      }
    };

    return () => eventSource.close();
  }
}

// Agent configuration for tracking
const AGENT_CONFIG = {
  stock: [
    { name: 'Financial Analyst', icon: '📊' },
    { name: 'Technical Analyst', icon: '📈' },
    { name: 'News Analyst', icon: '📰' },
    { name: 'Risk Analyst', icon: '🔍' },
    { name: 'Report Generator', icon: '📝' },
    { name: 'Strategic Analyst', icon: '🎯' },
  ],
  sector: [
    { name: 'Sector Analyst', icon: '🔍' },
    { name: 'Financial Analyst', icon: '📊' },
    { name: 'Technical Analyst', icon: '📈' },
    { name: 'Risk Analyst', icon: '⚠️' },
    { name: 'Report Generator', icon: '📝' },
    { name: 'Portfolio Strategist', icon: '💼' },
  ],
};

const STATUS_PRIORITY = {
  queued: 0,
  active: 1,
  error: 1,
  complete: 2,
};

const deriveAgentStatus = (message = '') => {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
    return 'error';
  }
  if (
    lowerMessage.includes('started') ||
    lowerMessage.includes('start') ||
    lowerMessage.includes('generating final report')
  ) {
    return 'active';
  }
  if (lowerMessage.includes('completed') || lowerMessage.includes('complete')) {
    return 'complete';
  }
  return null;
};

const promoteStatus = (currentStatus = 'queued', nextStatus) => {
  if (!nextStatus) {
    return currentStatus;
  }

  const currentRank = STATUS_PRIORITY[currentStatus] ?? 0;
  const nextRank = STATUS_PRIORITY[nextStatus] ?? 0;

  if (nextRank < currentRank) {
    return currentStatus;
  }

  // Do not downgrade a completed agent back to active.
  if (currentStatus === 'complete' && nextStatus === 'active') {
    return currentStatus;
  }

  return nextStatus;
};

export function createProgressStream(type, sessionId, onProgress) {
  console.log('=== Creating progress stream ===');
  console.log('Type:', type);
  console.log('Session ID:', sessionId);
  
  const agents = AGENT_CONFIG[type] || AGENT_CONFIG.stock;
  let startTime = Date.now();
  
  // Use an object to store state that needs to be accessed in callbacks
  const state = {
    agentStatuses: agents.map(a => ({ ...a, status: 'queued' })),
    logs: []
  };

  // Initial update with agents
  onProgress({
    progress: 0,
    agents: state.agentStatuses,
    elapsed: 0,
    logs: state.logs,
  });

  // Update elapsed time every second (don't send agents/logs to avoid overwriting SSE updates)
  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onProgress({
      elapsed,
    });
  }, 1000);

  // Connect to SSE for real updates
  console.log('=== Calling connectProgressStream ===');
  console.log('=== SessionID being passed:', sessionId);
  console.log('=== ResearchAPI.connectProgressStream exists?', typeof ResearchAPI.connectProgressStream);
  
  const cleanup = ResearchAPI.connectProgressStream(sessionId, (update) => {
    console.log('=== SSE UPDATE RECEIVED ===', update);

    if (update.type === 'connected') {
      console.log('SSE stream connected successfully');
      state.logs = ['Connected to research backend...', ...state.logs];
      onProgress({
        agents: state.agentStatuses,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
        logs: state.logs,
      });
    } else if (update.type === 'progress') {
      // Update agent status based on message
      const message = update.message || '';
      state.logs = [message, ...state.logs].slice(0, 50);

      // Determine which agent is active
      const agentName = update.agent;
      if (agentName) {
        console.log('Updating agent status for:', agentName, 'Message:', message);
        // Create a NEW array with NEW objects to ensure React detects the change
        state.agentStatuses = state.agentStatuses.map(agent => {
          if (agent.name !== agentName) {
            return { ...agent };
          }

          const nextStatus = deriveAgentStatus(message);
          const updatedStatus = promoteStatus(agent.status, nextStatus);
          console.log(`  -> Setting to ${updatedStatus.toUpperCase()}`);

          return {
            ...agent,
            status: updatedStatus,
          };
        });
      }

      // Calculate progress based on completed agents
      const completedCount = state.agentStatuses.filter(a => a.status === 'complete').length;
      const activeCount = state.agentStatuses.filter(
        a => a.status === 'active' || a.status === 'error'
      ).length;
      const progress = Math.min((completedCount / agents.length) * 100, 99);
      
      console.log(`Progress: ${completedCount}/${agents.length} complete, ${activeCount} active = ${progress}%`);
      console.log('Agent statuses being sent:', state.agentStatuses.map(a => `${a.name}: ${a.status}`));

      onProgress({
        progress,
        agents: state.agentStatuses,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
        logs: state.logs,
      });
    } else if (update.type === 'complete') {
      clearInterval(timerInterval);

      // Mark all agents as complete
      state.agentStatuses = state.agentStatuses.map(a => ({ ...a, status: 'complete' }));

      onProgress({
        progress: 100,
        agents: state.agentStatuses,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
        logs: state.logs,
        complete: true,
        result: update,
      });
    } else if (update.type === 'error') {
      clearInterval(timerInterval);
      onProgress({
        agents: state.agentStatuses,
        elapsed: Math.floor((Date.now() - startTime) / 1000),
        logs: state.logs,
        error: update.error,
      });
    }
  });

  return () => {
    clearInterval(timerInterval);
    cleanup();
  };
}
