import { useQuote } from '@/hooks/use-quote';
import { RefreshCw, Quote } from 'lucide-react';

export default function QuoteOfTheDay({ compact = false }: { compact?: boolean }) {
  const { quote, loading, error, refresh } = useQuote();

  if (compact && loading) {
    return <aside aria-label="Quote of the Day" className="rounded-xl bg-surface/40 p-3 mb-6" aria-busy="true"><p className="text-xs text-muted-foreground">Loading today’s quote…</p></aside>;
  }

  if (loading) {
    return (
      <div className="glass-panel bg-surface/50 rounded-xl p-4 mb-6 border border-separator/50">
        <div className="flex items-center space-x-2 mb-2">
          <Quote className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Quote of the Day</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-surface-secondary rounded mb-2"></div>
          <div className="h-3 bg-surface-secondary rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  if (compact) {
    return (
      <aside aria-label="Quote of the Day" className="flex items-start gap-3 rounded-xl bg-surface/40 p-3 mb-6 border border-separator/40">
        <Quote className="w-5 h-5 shrink-0 text-dim mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <blockquote className="text-[13px] leading-relaxed italic text-muted-foreground">“{quote.text}”</blockquote>
          <cite className="block text-xs text-muted-foreground not-italic mt-1">— {quote.author}</cite>
          {error && <span className="text-xs text-feature-amber" title="Using offline quote">Offline</span>}
        </div>
        <button onClick={refresh} className="min-h-11 min-w-11 -my-1.5 -mr-1.5 flex items-center justify-center text-muted-foreground hover:text-strong transition-colors" title="Refresh quote" aria-label="Refresh quote">
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </aside>
    );
  }

  return (
    <div className="glass-panel bg-surface/50 rounded-xl p-4 mb-6 border border-separator/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Quote className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Quote of the Day</span>
        </div>
        <button
          onClick={refresh}
          className="text-muted-foreground hover:text-strong transition-colors p-1"
          title="Refresh quote"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <blockquote className="text-subtle text-sm leading-relaxed mb-3 italic">
        "{quote.text}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <cite className="text-xs text-muted-foreground not-italic">
          — {quote.author}
        </cite>
        {error && (
          <span className="text-xs text-feature-amber" title="Using offline quote">
            Offline
          </span>
        )}
      </div>
    </div>
  );
}
