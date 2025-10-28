import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Settings, History, LogOut } from 'lucide-react';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { HistoryModal } from '../components/HistoryModal';
import { useAuth } from '../context/AuthContext';
import { ResearchAPI } from '../lib/api';
import { trackEvent } from '../lib/firebase';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, getIdToken } = useAuth();
  const [stockSymbol, setStockSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [exchange, setExchange] = useState('US');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEntryLoading, setHistoryEntryLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const exchanges = [
    { value: 'US', label: 'US Markets (NYSE/NASDAQ)' },
    { value: 'NSE', label: 'NSE (India)' },
    { value: 'BSE', label: 'BSE (India)' },
  ];

  const popularSectors = [
    'Technology',
    'Healthcare',
    'Financial Services',
    'Energy',
    'Consumer Cyclical',
    'Industrials',
  ];

  const userInitial = useMemo(() => {
    if (!user?.displayName) {
      return user?.email?.[0]?.toUpperCase() || 'U';
    }
    return user.displayName[0]?.toUpperCase() || 'U';
  }, [user]);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const token = await getIdToken();
      const response = await ResearchAPI.fetchHistory({ token });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch history');
      }
      setHistoryEntries(response.history || []);
    } catch (err) {
      setHistoryError(err.message || 'Failed to fetch history');
    } finally {
      setHistoryLoading(false);
    }
  }, [getIdToken]);

  const handleOpenHistory = useCallback(() => {
    setHistoryOpen(true);
    trackEvent('history_opened');
    loadHistory();
  }, [loadHistory]);

  const handleCloseHistory = useCallback(() => {
    setHistoryOpen(false);
    setHistoryError(null);
    setHistoryEntryLoading(false);
    setDeletingId(null);
  }, []);

  const handleHistorySelect = useCallback(async (entry) => {
    try {
      setHistoryEntryLoading(true);
      setHistoryError(null);
      if (entry.status !== 'complete') {
        throw new Error('This research did not finish, so no report is available. Start a new run to generate results.');
      }
      const token = await getIdToken();
      const response = await ResearchAPI.fetchHistoryEntry({
        token,
        sessionId: entry.session_id,
      });
      if (!response.success) {
        throw new Error(response.error || 'Unable to load history entry');
      }

      trackEvent('history_entry_opened', {
        session_id: entry.session_id,
        type: entry.type,
        symbol: entry.symbol,
        sector: entry.sector,
      });

      handleCloseHistory();

      const payload = response.entry || {};
      if (!payload.report) {
        throw new Error('Report content is not available for this record.');
      }
      navigate('/report', {
        state: {
          report: payload.report,
          sections: payload.sections,
          analyses: payload.analyses,
          sources: payload.sources,
          metadata: payload.metadata,
          symbol: payload.symbol || entry.symbol,
          sector: payload.sector || entry.sector,
          exchange: payload.exchange || entry.exchange,
          type: entry.type,
        },
      });
    } catch (err) {
      setHistoryError(err.message || 'Failed to open history entry');
    } finally {
      setHistoryEntryLoading(false);
    }
  }, [getIdToken, handleCloseHistory, navigate]);

  const handleDeleteHistory = useCallback(async (entry) => {
    if (!entry?.session_id) {
      return;
    }
    if (!window.confirm('Delete this research from history? This cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(entry.session_id);
      setHistoryError(null);
      const token = await getIdToken();
      const response = await ResearchAPI.deleteHistoryEntry({
        token,
        sessionId: entry.session_id,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete history entry');
      }
      trackEvent('history_entry_deleted', {
        session_id: entry.session_id,
        type: entry.type,
        symbol: entry.symbol,
        sector: entry.sector,
      });
      setHistoryEntries((prev) =>
        prev.filter((item) => item.session_id !== entry.session_id)
      );
    } catch (err) {
      setHistoryError(err.message || 'Failed to delete history entry');
    } finally {
      setDeletingId(null);
    }
  }, [getIdToken]);

  const handleStockResearch = useCallback(() => {
    if (!stockSymbol.trim()) return;
    const cleanedSymbol = stockSymbol.trim().toUpperCase();
    trackEvent('research_start', { type: 'stock', symbol: cleanedSymbol, exchange });
    navigate('/research/stock', { state: { symbol: cleanedSymbol, exchange } });
  }, [exchange, navigate, stockSymbol]);

  const handleSectorResearch = useCallback(() => {
    if (!sector.trim()) return;
    const cleanedSector = sector.trim();
    trackEvent('research_start', { type: 'sector', sector: cleanedSector, exchange });
    navigate('/research/sector', { state: { sector: cleanedSector, exchange } });
  }, [exchange, navigate, sector]);

  const handleLogout = useCallback(async () => {
    trackEvent('logout_clicked');
    await logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-accent" size={32} />
            <h1 className="text-2xl font-bold tracking-tight">
              EQUITY RESEARCH AI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenHistory}
              className="flex items-center gap-2"
            >
              <History size={16} />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-tertiary">
              <span className="font-semibold">{user?.displayName || user?.email}</span>
              <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                {userInitial}
              </span>
            </div>
            <button className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
              <Settings className="text-text-secondary" size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-hero font-bold mb-4">
            AI-Powered Investment Research
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Deep multi-agent analysis combining financial data, technical indicators,
            and market sentiment in minutes.
          </p>
        </motion.div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Stock Research Card */}
          <Card hover className="group">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <BarChart3 className="text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Single Stock Analysis</h3>
              <p className="text-text-secondary">
                Deep dive into one company with comprehensive analysis
              </p>
              <div className="inline-block px-3 py-1 bg-bg-tertiary rounded-full text-sm text-text-secondary mt-2">
                ⏱️ 3-5 minutes
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Stock Symbol"
                placeholder="e.g., AAPL, TSLA, MSFT"
                value={stockSymbol}
                onChange={setStockSymbol}
                uppercase
                icon={BarChart3}
              />
              <Select
                label="Exchange"
                value={exchange}
                onChange={setExchange}
                options={exchanges}
              />
              <Button
                onClick={handleStockResearch}
                disabled={!stockSymbol.trim()}
                className="w-full"
              >
                Start Analysis
              </Button>
            </div>
          </Card>

          {/* Sector Research Card */}
          <Card hover className="group">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="text-accent" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Sector Comparison</h3>
              <p className="text-text-secondary">
                Compare top companies in a sector with portfolio recommendations
              </p>
              <div className="inline-block px-3 py-1 bg-bg-tertiary rounded-full text-sm text-text-secondary mt-2">
                ⏱️ 10-20 minutes
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm font-medium mb-2">
                  Select Sector
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {popularSectors.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSector(s)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        sector === s
                          ? 'bg-accent text-bg-primary'
                          : 'bg-bg-tertiary text-text-secondary hover:bg-border'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or enter custom sector..."
                  value={sector}
                  onChange={setSector}
                />
              </div>
              <Select
                label="Exchange"
                value={exchange}
                onChange={setExchange}
                options={exchanges}
              />
              <Button
                onClick={handleSectorResearch}
                disabled={!sector.trim()}
                className="w-full"
              >
                Start Comparison
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6"
        >
          <Card className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="font-semibold mb-2">8 AI Agents</h4>
            <p className="text-sm text-text-secondary">
              Parallel processing with specialized agents for comprehensive analysis
            </p>
          </Card>
          <Card className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="font-semibold mb-2">Real-Time Updates</h4>
            <p className="text-sm text-text-secondary">
              Watch agent progress with live status updates and logs
            </p>
          </Card>
          <Card className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="font-semibold mb-2">Actionable Reports</h4>
            <p className="text-sm text-text-secondary">
              Clear buy/hold/sell recommendations with detailed reasoning
            </p>
          </Card>
        </motion.div>
      </main>

      <HistoryModal
        open={historyOpen}
        onClose={handleCloseHistory}
        entries={historyEntries}
        loading={historyLoading}
        error={historyError}
        onSelect={handleHistorySelect}
        onRefresh={loadHistory}
        busy={historyEntryLoading || Boolean(deletingId)}
        onDelete={handleDeleteHistory}
        deletingId={deletingId}
      />
    </div>
  );
}
