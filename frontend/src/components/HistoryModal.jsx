import { X, Trash2 } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export function HistoryModal({
  open,
  onClose,
  entries = [],
  loading = false,
  error = null,
  onSelect,
  onRefresh,
  busy = false,
  onDelete,
  deletingId = null,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Recent Research History</h2>
            <p className="text-sm text-text-secondary">
              Access your saved reports instantly. Click a session to reopen the full report.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary"
              aria-label="Close history"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {busy && (
            <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center text-text-secondary text-sm font-medium">
              {deletingId ? 'Deleting entry…' : 'Loading report…'}
            </div>
          )}
          {loading && (
            <div className="text-center text-text-secondary py-12">Loading history…</div>
          )}
          {error && (
            <div className="text-danger bg-danger/10 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="text-center text-text-secondary py-12">
              No research history yet. Run your first analysis to populate this list.
            </div>
          )}
          {!loading && !error && entries.map((entry) => (
            <button
              key={entry.session_id}
              onClick={() => onSelect?.(entry)}
              disabled={busy || entry.status !== 'complete'}
              className={`w-full text-left border border-border rounded-lg px-4 py-3 transition-all ${
                busy || entry.status !== 'complete'
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-accent hover:bg-accent/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {entry.type === 'sector' ? '📊' : '📈'}
                  </span>
                  <div>
                    <div className="font-semibold text-text-primary">
                      {entry.type === 'sector'
                        ? `${entry.sector} Sector`
                        : entry.symbol}
                    </div>
                    <div className={`text-xs ${entry.status === 'complete' ? 'text-text-secondary' : entry.status === 'cancelled' ? 'text-warning' : 'text-text-secondary'}`}>
                      {entry.exchange} • {entry.status?.toUpperCase() || 'UNKNOWN'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-text-secondary font-mono">
                    {entry.completed_at || entry.started_at}
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      className="p-2 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(entry);
                      }}
                      disabled={busy || deletingId === entry.session_id}
                      aria-label="Delete history entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
