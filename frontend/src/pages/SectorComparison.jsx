import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function SectorComparison() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sector, exchange } = location.state || {};

  // Mock data - replace with actual API data
  const companies = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      rating: 'BUY',
      score: 92,
      price: 175.43,
      change: 2.34,
      marketCap: '2.8T',
      pe: 28.5,
      scores: { valuation: 85, growth: 95, quality: 96 },
      allocation: 30,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      rating: 'BUY',
      score: 90,
      price: 378.91,
      change: 1.87,
      marketCap: '2.8T',
      pe: 34.2,
      scores: { valuation: 82, growth: 92, quality: 96 },
      allocation: 28,
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      rating: 'BUY',
      score: 88,
      price: 141.80,
      change: -0.45,
      marketCap: '1.8T',
      pe: 26.3,
      scores: { valuation: 90, growth: 85, quality: 89 },
      allocation: 25,
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      rating: 'HOLD',
      score: 75,
      price: 312.54,
      change: 0.92,
      marketCap: '790B',
      pe: 25.8,
      scores: { valuation: 78, growth: 72, quality: 75 },
      allocation: 12,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      rating: 'HOLD',
      score: 72,
      price: 485.62,
      change: -1.23,
      marketCap: '1.2T',
      pe: 68.5,
      scores: { valuation: 65, growth: 88, quality: 80 },
      allocation: 5,
    },
  ];

  const topPick = companies[0];

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'BUY':
        return 'text-success bg-success/10 border-success/30';
      case 'HOLD':
        return 'text-warning bg-warning/10 border-warning/30';
      case 'AVOID':
        return 'text-danger bg-danger/10 border-danger/30';
      default:
        return 'text-text-secondary bg-bg-tertiary border-border';
    }
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'BUY':
        return <TrendingUp size={16} />;
      case 'HOLD':
        return <Minus size={16} />;
      case 'AVOID':
        return <TrendingDown size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold">{sector} Sector Analysis</h1>
                <p className="text-sm text-text-secondary">{exchange} Exchange • {companies.length} Companies</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Pick */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🏆 Top Pick
          </h2>
          <Card className="border-2 border-accent/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-bold font-mono">{topPick.symbol}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-1 ${getRatingColor(topPick.rating)}`}>
                    {getRatingIcon(topPick.rating)}
                    {topPick.rating}
                  </span>
                </div>
                <p className="text-text-secondary text-lg">{topPick.name}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold font-mono">${topPick.price}</div>
                <div className={`text-sm font-semibold ${topPick.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {topPick.change >= 0 ? '+' : ''}{topPick.change}%
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm text-text-secondary mb-1">Market Cap</div>
                <div className="text-xl font-semibold">${topPick.marketCap}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">P/E Ratio</div>
                <div className="text-xl font-semibold">{topPick.pe}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary mb-1">Overall Score</div>
                <div className="text-xl font-semibold text-accent">{topPick.score}/100</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-text-secondary mb-2">Score Breakdown</div>
              {Object.entries(topPick.scores).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize text-text-secondary">{key}</span>
                    <span className="font-mono font-semibold text-accent">{value}/100</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-accent to-success"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* All Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">All Companies</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company, index) => (
              <motion.div
                key={company.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold font-mono mb-1">{company.symbol}</h3>
                      <p className="text-sm text-text-secondary">{company.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${getRatingColor(company.rating)}`}>
                      {getRatingIcon(company.rating)}
                      {company.rating}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Price</span>
                      <span className="font-mono font-semibold">${company.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Change</span>
                      <span className={`font-mono font-semibold ${company.change >= 0 ? 'text-success' : 'text-danger'}`}>
                        {company.change >= 0 ? '+' : ''}{company.change}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Score</span>
                      <span className="font-mono font-semibold text-accent">{company.score}/100</span>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm" className="w-full">
                    View Report
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Allocation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-4">Recommended Portfolio Allocation ($10,000)</h2>
          <Card>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companies}>
                <XAxis dataKey="symbol" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C2128',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Bar dataKey="allocation" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid md:grid-cols-5 gap-4 mt-6">
              {companies.map((company) => (
                <div key={company.symbol} className="text-center">
                  <div className="font-mono font-bold text-lg text-accent mb-1">
                    ${(10000 * company.allocation / 100).toLocaleString()}
                  </div>
                  <div className="text-sm text-text-secondary">{company.symbol} ({company.allocation}%)</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
