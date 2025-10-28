import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';
import { Login } from './Login';

const agentHighlights = [
  {
    name: 'Financial Analyst',
    emoji: '📊',
    summary: 'Distils balance sheets and valuation ratios into crisp takeaways.',
  },
  {
    name: 'Technical Analyst',
    emoji: '📈',
    summary: 'Reads price action, identifies momentum shifts, and flags levels to watch.',
  },
  {
    name: 'News Analyst',
    emoji: '📰',
    summary: 'Scans the web for fresh catalysts, keeping a strict 30-day lens.',
  },
  {
    name: 'Strategic Analyst',
    emoji: '🎯',
    summary: 'Connects every insight into a bold, plain-language recommendation.',
  },
];

const journeySteps = [
  {
    title: '1. Set the Brief',
    description:
      'Pick a ticker or sector. The console prepares the agent roster and tailors prompts automatically.',
  },
  {
    title: '2. Live Progress',
    description:
      'Watch specialists come online, run their analysis, and report back — all in a single timeline.',
  },
  {
    title: '3. Unified Report',
    description:
      'A polished investment memo and strategy take land in your history, ready to revisit anytime.',
  },
];

const sampleInsights = [
  '“Revenue growth re-accelerated to 18% YoY as the cloud backlog expanded. Cash flow now fully funds capex.”',
  '“Momentum flipped positive above the 200-day average; buyers defended $112 three straight sessions.”',
  '“Three new supply deals announced this month point to stronger Q1 guidance; management hinted at a margin reset.”',
];

export function Landing() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const primaryCta = () => {
    if (user) {
      window.location.href = '/dashboard';
    } else {
      setShowLogin(true);
    }
  };

  const secondaryCta = () => {
    const featureSection = document.getElementById('journey');
    if (featureSection) {
      featureSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const heroCtaLabel = useMemo(
    () => (user ? 'Enter dashboard' : 'Sign in with Google'),
    [user],
  );

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary">
      <AnimatePresence>
        {showLogin && !user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 bg-black/20 backdrop-blur-md z-40"
              onClick={() => setShowLogin(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                duration: 0.4
              }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="relative w-full max-w-md pointer-events-auto">
                <Login
                  onSuccess={() => {
                    setShowLogin(false);
                    window.location.href = '/dashboard';
                  }}
                  onCancel={() => setShowLogin(false)}
                  onClose={() => setShowLogin(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-bg-secondary/40 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-text-secondary">
                Trusted AI analysts working together
              </span>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                Research-grade equity reports, crafted in minutes.
              </h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
                Watch a team of specialised agents gather financials, technicals, news, and strategy,
                then weave everything into an actionable memo. Explore the flow below, then unlock the live console
                when you&apos;re ready.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={primaryCta}>
                  {heroCtaLabel}
                </Button>
                <Button size="lg" variant="ghost" onClick={secondaryCta}>
                  See how it works
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="bg-bg-secondary/60 border border-border rounded-2xl p-6 space-y-5 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Live session preview</h2>
                <span className="text-xs font-mono text-text-secondary">TSLA • US Market</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Financial Analyst', status: 'complete', detail: 'Income statement digested' },
                  { label: 'Technical Analyst', status: 'active', detail: 'Scanning price momentum' },
                  { label: 'News Analyst', status: 'queued', detail: 'Queuing recent catalysts' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border bg-bg-secondary/40 px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-text-secondary">{item.detail}</div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        item.status === 'complete'
                          ? 'text-success'
                          : item.status === 'active'
                            ? 'text-accent'
                            : 'text-text-secondary'
                      }`}
                    >
                      {item.status === 'complete' ? '✓ Done' : item.status === 'active' ? 'In flight' : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-bg-tertiary/60 border border-border px-4 py-3 text-sm text-text-secondary font-mono">
                <p>[LOG] Strategist ready • awaiting teammate updates…</p>
                <p>[LOG] Report draft ETA: 02:14 minutes</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Journey */}
      <section id="journey" className="border-t border-border bg-bg-secondary/40 py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold">See the research journey</h2>
              <p className="text-text-secondary max-w-2xl">
                Every run follows the same transparent arc. You stay in the loop from kickoff to final report.
              </p>
            </div>
            <Button variant="secondary" onClick={primaryCta}>
              {user ? 'Head to dashboard' : 'Unlock live console'}
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {journeySteps.map((step) => (
              <Card key={step.title} className="h-full p-6 border border-border/60 bg-bg-primary/80">
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <h2 className="text-3xl font-bold">Meet your multi-agent team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentHighlights.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full border border-border/60 bg-bg-secondary/60 p-5 space-y-3">
                  <div className="text-2xl">{agent.emoji}</div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{agent.summary}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample insights */}
      <section className="bg-bg-secondary/30 border-t border-border border-b py-16">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <h2 className="text-3xl font-bold">The tone of the final report</h2>
          <p className="text-text-secondary max-w-3xl">
            Every report stitches together fundamentals, technicals, news, and strategy in clear language.
            Here&apos;s the style you can expect:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {sampleInsights.map((quote, index) => (
              <Card key={index} className="p-5 bg-bg-primary/80 border border-border/60">
                <p className="text-sm text-text-secondary leading-relaxed italic">&ldquo;{quote}&rdquo;</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to run your own research?</h2>
          <p className="text-text-secondary">
            Signing in lets us save your history securely and resume reports instantly. We use Google OAuth only —
            no passwords to manage.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={primaryCta}>
              {heroCtaLabel}
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setShowLogin(true)}
              >
                Why sign-in?
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
