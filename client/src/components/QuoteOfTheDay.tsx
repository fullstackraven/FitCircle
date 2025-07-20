import { useQuote } from '@/hooks/use-quote';
import { RefreshCw, Quote } from 'lucide-react';

export default function QuoteOfTheDay() {
  const { quote, loading, error, refresh } = useQuote();

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center space-x-2 mb-2">
          <Quote className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Quote of the Day</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded mb-2"></div>
          <div className="h-3 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Quote className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Quote of the Day</span>
        </div>
        <button
          onClick={refresh}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Refresh quote"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <blockquote className="text-slate-200 text-sm leading-relaxed mb-3 italic">
        "{quote.text}"
      </blockquote>
      
      <div className="flex items-center justify-between">
        <cite className="text-xs text-slate-400 not-italic">
          — {quote.author}
        </cite>
        {error && (
          <span className="text-xs text-amber-400" title="Using offline quote">
            Offline
          </span>
        )}
      </div>
    </div>
  );
}