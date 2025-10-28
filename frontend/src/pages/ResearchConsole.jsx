import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, X, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { AgentStatus } from '../components/AgentStatus';
import { ResearchAPI, createProgressStream } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/firebase';

export function ResearchConsole() {
  const location = useLocation();
  const navigate = useNavigate();
  const { symbol, sector, exchange } = location.state || {};
  const { getIdToken } = useAuth();

  const [progress, setProgress] = useState(0);
  const [agents, setAgents] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState([]);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [tokenReady, setTokenReady] = useState(false);

  const researchType = symbol ? 'stock' : 'sector';
  const title = symbol ? `${symbol} (${exchange})` : `${sector} Sector`;

  useEffect(() => {
    if (!symbol && !sector) {
      navigate('/');
    }
  }, [navigate, symbol, sector]);

  useEffect(() => {
    let isMounted = true;
    const obtainToken = async () => {
      try {
        const token = await getIdToken();
        if (isMounted) {
          setAuthToken(token);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Authentication failed. Please sign in again.');
        }
      } finally {
        if (isMounted) {
          setTokenReady(true);
        }
      }
    };

    obtainToken();
    return () => {
      isMounted = false;
    };
  }, [getIdToken]);

  useEffect(() => {
    if (!tokenReady) {
      return;
    }
    if (!authToken) {
      setError('Authentication token unavailable. Please sign in again.');
      return;
    }

    let cleanupFunction = null;

    const startResearch = async () => {
      try {
        let response;
        if (researchType === 'stock') {
          response = await ResearchAPI.researchStock({ symbol, exchange, token: authToken });
        } else {
          response = await ResearchAPI.researchSector({ sector, exchange, numCompanies: 5, token: authToken });
        }

        if (response.success && response.session_id) {
          console.log('Research started with session:', response.session_id);
          trackEvent('research_session_started', {
            type: researchType,
            session_id: response.session_id,
            symbol,
            sector,
            exchange,
          });

          cleanupFunction = createProgressStream(
            { type: researchType, sessionId: response.session_id, token: authToken },
            (update) => {
              if (update.progress !== undefined) {
                setProgress(update.progress);
              }
              if (update.agents !== undefined) {
                console.log('Setting agents:', update.agents.map(a => `${a.name}: ${a.status}`));
                setAgents(update.agents);
              }
              if (update.elapsed !== undefined) {
                setElapsed(update.elapsed);
              }
              if (update.logs !== undefined) {
                setLogs(update.logs);
              }
              if (update.complete) {
                setComplete(true);
                setResult(update.result);
                trackEvent('research_session_completed', {
                  type: researchType,
                  session_id: response.session_id,
                  symbol,
                  sector,
                });
              }
              if (update.error) {
                setError(update.error);
                trackEvent('research_session_failed', {
                  type: researchType,
                  session_id: response.session_id,
                });
              }
            }
          );
        }
      } catch (err) {
        console.error('Research start error:', err);
        setError(err.message);
        trackEvent('research_session_failed', {
          type: researchType,
          symbol,
          sector,
          exchange,
          reason: err.message,
        });
      }
    };

    startResearch();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [symbol, sector, exchange, researchType, authToken, tokenReady]);

  useEffect(() => {
    if (complete && result) {
      // Navigate to results
      setTimeout(() => {
        navigate('/report', {
          state: {
            report: result.report,
            sections: result.sections,
            analyses: result.analyses,
            sources: result.sources,
            metadata: result.metadata,
            companyReports: result.company_reports,
            symbol,
            sector,
            exchange,
            type: researchType,
          },
        });
      }, 2000);
    }
  }, [complete, result, navigate, symbol, sector, exchange, researchType]);

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this research?')) {
      navigate('/');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Research Failed</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft size={20} />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold font-mono">{title}</h1>
              <p className="text-sm text-text-secondary">
                {researchType === 'stock' ? 'Stock Analysis' : 'Sector Comparison'}
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleCancel}>
            <X size={16} />
            Cancel
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <ProgressBar progress={progress} />
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock size={16} />
                <span>
                  Elapsed: <span className="font-mono font-semibold">{formatTime(elapsed)}</span>
                </span>
              </div>
              <div className="text-text-secondary">
                Status: <span className="font-mono font-semibold">{complete ? 'Complete' : 'In Progress'}</span>
              </div>
            </div>
            {complete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 text-center text-success font-semibold"
              >
                ✅ Research Complete! Redirecting to report...
              </motion.div>
            )}
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Agent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🤖 Agent Activity
            </h2>
            <div className="space-y-3">
              {agents.map((agent, index) => (
                <AgentStatus key={agent.name} agent={agent} index={index} />
              ))}
            </div>
          </motion.div>

          {/* Live Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📡 Live Feed
            </h2>
            <Card className="h-[500px] overflow-y-auto font-mono text-sm">
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-text-secondary text-center py-8">
                    Waiting for updates...
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-text-secondary"
                    >
                      {log}
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
