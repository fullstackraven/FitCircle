import { useState, useEffect } from 'react';

interface Quote {
  text: string;
  author: string;
}

const QUOTE_STORAGE_KEY = 'fitcircle_daily_quote';
const QUOTE_DATE_KEY = 'fitcircle_quote_date';

// Fallback quotes in case API fails
const FALLBACK_QUOTES: Quote[] = [
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "What we do now echoes in eternity.", author: "Marcus Aurelius" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Discipline is the soul of an army.", author: "George Washington" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "Champions aren't made in the gyms. Champions are made from something deep inside them - a desire, a dream, a vision.", author: "Muhammad Ali" }
];

export function useQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getRandomFallbackQuote = (): Quote => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  };

  const fetchQuoteFromAPI = async (): Promise<Quote | null> => {
    try {
      // Try ZenQuotes API first
      const response = await fetch('https://zenquotes.io/api/today');
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].q && data[0].a) {
          return {
            text: data[0].q,
            author: data[0].a
          };
        }
      }
      
      // Fallback to quotable.io API
      const fallbackResponse = await fetch('https://api.quotable.io/random?tags=motivational|inspirational|wisdom');
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.content && fallbackData.author) {
          return {
            text: fallbackData.content,
            author: fallbackData.author
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching quote from API:', error);
      return null;
    }
  };

  const getTodaysQuote = async () => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(QUOTE_DATE_KEY);
    const savedQuote = localStorage.getItem(QUOTE_STORAGE_KEY);

    // If we have a quote for today, use it
    if (savedDate === today && savedQuote) {
      try {
        const parsedQuote = JSON.parse(savedQuote);
        setQuote(parsedQuote);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing saved quote:', error);
      }
    }

    // Otherwise, fetch a new quote
    setLoading(true);
    setError(null);

    try {
      const apiQuote = await fetchQuoteFromAPI();
      let todaysQuote: Quote;

      if (apiQuote) {
        todaysQuote = apiQuote;
      } else {
        // Use fallback quote if API fails
        todaysQuote = getRandomFallbackQuote();
        setError('Using offline quote');
      }

      // Save the quote for today
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(todaysQuote));
      localStorage.setItem(QUOTE_DATE_KEY, today);
      
      setQuote(todaysQuote);
    } catch (error) {
      console.error('Error getting quote:', error);
      const fallbackQuote = getRandomFallbackQuote();
      setQuote(fallbackQuote);
      setError('Using offline quote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTodaysQuote();
  }, []);

  return {
    quote,
    loading,
    error,
    refresh: getTodaysQuote
  };
}