import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Share2, Copy, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Target,
  DollarSign, Activity, Calendar, ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { trackEvent } from '../lib/firebase';

export function ReportViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, symbol, sector, exchange, type } = location.state || {};

  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    action: true,
  });

  const sectionsData = location.state?.sections || {};
  const analysesData = location.state?.analyses || {};
  const sourcesData = location.state?.sources || {};
  const metadata = location.state?.metadata || {};
  const companyReports = location.state?.companyReports || {};

  const isSectorReport = type === 'sector';
  const newsLinks = sourcesData.news_links || [];

  // Extract recommendation from report
  const recommendation = useMemo(() => {
    const content = report || sectionsData.synthesis || sectionsData.executive_summary || '';
    const upperContent = content.toUpperCase();

    if (upperContent.includes('STRONG BUY') || upperContent.includes('STRONGBUY')) {
      return { action: 'STRONG BUY', confidence: 'HIGH', color: 'success' };
    } else if (upperContent.includes('BUY') && !upperContent.includes('NOT BUY')) {
      return { action: 'BUY', confidence: 'MODERATE', color: 'success' };
    } else if (upperContent.includes('SELL')) {
      return { action: 'SELL', confidence: 'MODERATE', color: 'danger' };
    } else if (upperContent.includes('HOLD')) {
      return { action: 'HOLD', confidence: 'MODERATE', color: 'warning' };
    }
    return { action: 'HOLD', confidence: 'LOW', color: 'warning' };
  }, [report, sectionsData]);

  // Extract key metrics from report
  const keyMetrics = useMemo(() => {
    const content = report || '';
    const metrics = {};

    // Try to extract price target
    const priceMatch = content.match(/price target[:\s]+\$?([\d,]+\.?\d*)/i) ||
                       content.match(/target price[:\s]+\$?([\d,]+\.?\d*)/i) ||
                       content.match(/\$?([\d,]+\.?\d*)\s*price target/i);
    if (priceMatch) {
      metrics.priceTarget = `$${priceMatch[1]}`;
    }

    // Extract risk level
    const riskMatch = content.match(/risk[:\s]+(high|medium|moderate|low)/i);
    if (riskMatch) {
      metrics.riskLevel = riskMatch[1].toUpperCase();
    }

    // Extract time horizon
    const timeMatch = content.match(/(short|medium|long)[-\s]term/i);
    if (timeMatch) {
      metrics.timeHorizon = timeMatch[1].charAt(0).toUpperCase() + timeMatch[1].slice(1) + '-term';
    }

    return metrics;
  }, [report]);

  const markdownComponents = useMemo(() => ({
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mb-4 text-text-primary border-b border-border pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold mt-6 mb-3 text-text-primary">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-5 mb-2 text-text-primary">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold mt-4 mb-2 text-text-primary">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="text-text-secondary leading-relaxed mb-3">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1.5 mb-3 text-text-secondary">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1.5 mb-3 text-text-secondary">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="ml-4">{children}</li>
    ),
    code: ({ inline, children }) =>
      inline ? (
        <code className="bg-accent/20 text-accent px-1.5 py-0.5 rounded font-mono text-sm">
          {children}
        </code>
      ) : (
        <code className="block bg-bg-tertiary p-3 rounded-lg font-mono text-sm overflow-x-auto mb-3">
          {children}
        </code>
      ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4 rounded-lg border border-border">
        <table className="w-full border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-bg-tertiary">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-border">{children}</tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-bg-tertiary/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2.5 text-left font-semibold text-text-primary text-sm">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2.5 text-text-secondary text-sm">{children}</td>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-accent pl-4 italic text-text-secondary my-3 bg-accent/5 py-2 rounded-r">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-text-primary">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-accent">{children}</em>
    ),
  }), []);

  const tabs = useMemo(() => {
    if (isSectorReport) {
      return [
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'portfolio', icon: '💼', label: 'Portfolio Strategy' },
        { id: 'companies', icon: '🏢', label: 'Company Analysis' },
      ];
    }
    return [
      { id: 'overview', icon: '📊', label: 'Overview' },
      { id: 'technical', icon: '📈', label: 'Technical' },
      { id: 'news', icon: '📰', label: 'News & Sentiment' },
      { id: 'comparison', icon: '🔍', label: 'Peer Comparison' },
      { id: 'strategy', icon: '🎯', label: 'Strategy' },
    ];
  }, [isSectorReport]);

  const tabContent = useMemo(() => {
    if (isSectorReport) {
      const companyMarkdown = Object.entries(companyReports || {})
        .map(([ticker, data]) => {
          const content = data?.full_report || '';
          return `## ${ticker}\n\n${content}`;
        })
        .join('\n\n---\n\n');

      return {
        overview: sectionsData.sector_summary || sectionsData.executive_summary || report || 'Sector overview not available.',
        portfolio: sectionsData.portfolio || sectionsData.strategic || 'Portfolio strategy not available.',
        companies: companyMarkdown || 'Detailed company reports not available.',
      };
    }

    return {
      overview: sectionsData.executive_summary || analysesData.financial || 'Overview not available.',
      technical: sectionsData.technical || analysesData.technical || 'Technical analysis unavailable.',
      news: sectionsData.news || analysesData.news || 'News analysis unavailable.',
      comparison: sectionsData.comparison || analysesData.comparative || 'Peer comparison unavailable.',
      strategy: sectionsData.strategic || analysesData.strategic || 'Strategic insights unavailable.',
    };
  }, [analysesData, companyReports, isSectorReport, report, sectionsData]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report || tabContent.overview || '');
    setCopied(true);
    trackEvent('report_copied', { type, symbol, sector });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!report) {
    navigate('/');
    return null;
  }

  const title = symbol ? symbol : sector;
  const subtitle = symbol ? `${exchange} Stock Analysis` : `${exchange} Sector Analysis`;
  const generatedAt = metadata.generated_at;
  const activeContent = tabContent[activeTab] || 'No content available for this section.';

  const getRecommendationIcon = () => {
    if (recommendation.action.includes('BUY')) return <TrendingUp size={32} />;
    if (recommendation.action === 'SELL') return <TrendingDown size={32} />;
    return <Minus size={32} />;
  };

  const getRecommendationColors = () => {
    switch (recommendation.color) {
      case 'success':
        return 'bg-green-500/20 border-green-500 text-green-400';
      case 'danger':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      default:
        return 'bg-accent/20 border-accent text-accent';
    }
  };

  const getRiskColor = (risk) => {
    if (!risk) return 'text-text-secondary';
    const upperRisk = risk.toUpperCase();
    if (upperRisk === 'HIGH') return 'text-red-400';
    if (upperRisk === 'MEDIUM' || upperRisk === 'MODERATE') return 'text-yellow-400';
    if (upperRisk === 'LOW') return 'text-green-400';
    return 'text-text-secondary';
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
                <p className="text-xs sm:text-sm text-text-secondary">
                  {subtitle} {generatedAt ? `• ${generatedAt}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                {copied ? '✓ Copied' : <><Copy size={14} /> <span className="hidden sm:inline">Copy</span></>}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 sm:flex-none">
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
                <Download size={14} />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section - Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 ${getRecommendationColors()}`}>
                  {getRecommendationIcon()}
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-text-secondary uppercase tracking-wider mb-1">
                    Analyst Recommendation
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold mb-1 ${
                    recommendation.color === 'success' ? 'text-green-400' :
                    recommendation.color === 'danger' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {recommendation.action}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">
                    Confidence: {recommendation.confidence}
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
                {keyMetrics.priceTarget && (
                  <div className="text-center bg-bg-tertiary/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[100px]">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-accent" />
                    <div className="text-xs text-text-secondary mb-0.5">Target</div>
                    <div className="text-sm sm:text-lg font-bold text-text-primary">{keyMetrics.priceTarget}</div>
                  </div>
                )}
                {keyMetrics.riskLevel && (
                  <div className="text-center bg-bg-tertiary/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[100px]">
                    <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 ${getRiskColor(keyMetrics.riskLevel)}`} />
                    <div className="text-xs text-text-secondary mb-0.5">Risk</div>
                    <div className={`text-sm sm:text-lg font-bold ${getRiskColor(keyMetrics.riskLevel)}`}>
                      {keyMetrics.riskLevel}
                    </div>
                  </div>
                )}
                {keyMetrics.timeHorizon && (
                  <div className="text-center bg-bg-tertiary/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 min-w-[100px]">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-accent" />
                    <div className="text-xs text-text-secondary mb-0.5">Horizon</div>
                    <div className="text-sm sm:text-lg font-bold text-text-primary">{keyMetrics.timeHorizon}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="overflow-x-auto">
            <div className="flex gap-2 min-w-max sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    trackEvent('report_tab_selected', {
                      tab: tab.id,
                      type,
                      symbol,
                      sector,
                    });
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-accent text-bg-primary shadow-lg'
                      : 'bg-bg-tertiary/50 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="prose prose-invert max-w-none">
                  <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="text-2xl">{tabs.find(t => t.id === activeTab)?.icon}</span>
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {activeContent}
                  </ReactMarkdown>

                  {activeTab === 'news' && newsLinks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <ExternalLink size={18} />
                        News Sources
                      </h3>
                      <ul className="space-y-2">
                        {newsLinks.map((link, idx) => (
                          <li key={idx} className="text-sm">
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:text-accent/80 underline break-all inline-flex items-center gap-1"
                            >
                              <ExternalLink size={12} />
                              {link.length > 80 ? link.substring(0, 80) + '...' : link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar - Quick Sections */}
          <div className="space-y-4">
            {/* Executive Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <button
                  onClick={() => toggleSection('summary')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                    📋 Executive Summary
                  </h3>
                  {expandedSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <AnimatePresence>
                  {expandedSections.summary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 text-sm text-text-secondary leading-relaxed max-h-60 overflow-y-auto prose prose-invert prose-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {sectionsData.executive_summary || tabContent.overview}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Action Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <button
                  onClick={() => toggleSection('action')}
                  className="w-full flex items-center justify-between text-left group"
                >
                  <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                    🎯 Action Plan
                  </h3>
                  {expandedSections.action ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <AnimatePresence>
                  {expandedSections.action && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 text-sm text-text-secondary leading-relaxed max-h-60 overflow-y-auto prose prose-invert prose-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {sectionsData.synthesis || sectionsData.strategic || 'Action plan not available'}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Risk Analysis Card */}
            {sectionsData.risk && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <button
                    onClick={() => toggleSection('risk')}
                    className="w-full flex items-center justify-between text-left group"
                  >
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                      ⚠️ Risk Analysis
                    </h3>
                    {expandedSections.risk ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <AnimatePresence>
                    {expandedSections.risk && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 text-sm text-text-secondary leading-relaxed max-h-60 overflow-y-auto prose prose-invert prose-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {sectionsData.risk}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}

            {/* Report Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="bg-bg-tertiary/30">
                <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">
                  Report Details
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Type:</dt>
                    <dd className="text-text-primary font-medium">
                      {type === 'sector' ? 'Sector Analysis' : 'Stock Analysis'}
                    </dd>
                  </div>
                  {symbol && (
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Symbol:</dt>
                      <dd className="text-text-primary font-medium font-mono">{symbol}</dd>
                    </div>
                  )}
                  {sector && (
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Sector:</dt>
                      <dd className="text-text-primary font-medium">{sector}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Exchange:</dt>
                    <dd className="text-text-primary font-medium">{exchange}</dd>
                  </div>
                  {generatedAt && (
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Generated:</dt>
                      <dd className="text-text-primary font-medium text-xs">{generatedAt}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
