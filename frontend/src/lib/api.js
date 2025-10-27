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
}

// Mock progress updates for demo - replace with real SSE/WebSocket
export function createProgressStream(type, onProgress) {
  const agents = type === 'stock'
    ? [
        { name: 'Financial Analyst', icon: '📊', duration: 45 },
        { name: 'Technical Analyst', icon: '📈', duration: 30 },
        { name: 'News Analyst', icon: '📰', duration: 35 },
        { name: 'Comparative Analyst', icon: '🔍', duration: 40 },
        { name: 'Report Generator', icon: '📝', duration: 30 },
      ]
    : [
        { name: 'Company Researcher', icon: '🔍', duration: 120 },
        { name: 'Financial Analyst', icon: '📊', duration: 90 },
        { name: 'Technical Analyst', icon: '📈', duration: 60 },
        { name: 'Comparative Analyst', icon: '🔄', duration: 80 },
        { name: 'Portfolio Optimizer', icon: '💼', duration: 50 },
      ];

  let currentAgent = 0;
  let progress = 0;
  const totalDuration = agents.reduce((sum, a) => sum + a.duration, 0);
  let elapsed = 0;

  const interval = setInterval(() => {
    elapsed += 1;
    progress = Math.min((elapsed / totalDuration) * 100, 99);

    const completedDuration = agents
      .slice(0, currentAgent)
      .reduce((sum, a) => sum + a.duration, 0);

    if (elapsed >= completedDuration + agents[currentAgent].duration) {
      currentAgent++;
    }

    const agentStatuses = agents.map((agent, i) => ({
      ...agent,
      status: i < currentAgent ? 'complete' : i === currentAgent ? 'active' : 'queued',
    }));

    onProgress({
      progress,
      agents: agentStatuses,
      elapsed,
      estimated: totalDuration,
      logs: [
        `[${new Date().toLocaleTimeString()}] ${agents[currentAgent]?.name || 'Processing'}: Analyzing data...`,
      ],
    });

    if (currentAgent >= agents.length) {
      clearInterval(interval);
      onProgress({
        progress: 100,
        agents: agentStatuses,
        elapsed: totalDuration,
        estimated: totalDuration,
        complete: true,
      });
    }
  }, 1000);

  return () => clearInterval(interval);
}
