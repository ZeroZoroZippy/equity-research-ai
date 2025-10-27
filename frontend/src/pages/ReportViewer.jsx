import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Share2, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function ReportViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, symbol, sector, exchange, type } = location.state || {};

  const [activeSection, setActiveSection] = useState(null);
  const [copied, setCopied] = useState(false);

  const sections = [
    { id: 'summary', icon: '📊', label: 'Summary' },
    { id: 'technical', icon: '📈', label: 'Technical' },
    { id: 'news', icon: '📰', label: 'News' },
    { id: 'compare', icon: '🔍', label: 'Compare' },
    { id: 'strategy', icon: '🎯', label: 'Strategy' },
    { id: 'action', icon: '💼', label: 'Action' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!report) {
    navigate('/');
    return null;
  }

  const title = symbol ? `${symbol} Research Report` : `${sector} Sector Analysis`;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold font-mono">{title}</h1>
                <p className="text-sm text-text-secondary">{exchange} Exchange</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : <><Copy size={16} /> Copy</>}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 size={16} />
                Share
              </Button>
              <Button variant="secondary" size="sm">
                <Download size={16} />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-64 sticky top-20 h-[calc(100vh-5rem)] p-6 border-r border-border hidden lg:block">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-accent/10 text-accent border-l-4 border-accent'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <span className="text-xl">{section.icon}</span>
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-4xl font-bold mb-6 text-text-primary border-b border-border pb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children, node }) => {
                    const id = children.toString().toLowerCase().replace(/\s+/g, '-');
                    return (
                      <h2
                        id={id}
                        className="text-3xl font-bold mt-12 mb-4 text-text-primary scroll-mt-24"
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 className="text-2xl font-semibold mt-8 mb-3 text-text-primary">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-text-secondary leading-relaxed mb-4">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-text-secondary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-text-secondary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="ml-4">{children}</li>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-accent/20 text-accent px-2 py-1 rounded font-mono text-sm">
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-bg-tertiary p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                        {children}
                      </code>
                    ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-6">
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
                    <th className="px-4 py-3 text-left font-semibold text-text-primary">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-text-secondary">{children}</td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent pl-4 italic text-text-secondary my-4">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-text-primary">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-accent">{children}</em>
                  ),
                }}
              >
                {report}
              </ReactMarkdown>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
