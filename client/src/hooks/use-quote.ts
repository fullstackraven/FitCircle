import { useState, useEffect, useRef } from 'react';

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

// Helper function to get current date in EST/EDT timezone
const getESTDate = (): string => {
  const now = new Date();
  // Use America/New_York timezone to handle DST automatically
  const estDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to calculate milliseconds until next midnight EST/EDT
const getMillisecondsUntilMidnightEST = (): number => {
  const now = new Date();
  
  // Get current time in EST/EDT
  const currentEstTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  
  // Create tomorrow's date at midnight in EST
  const tomorrowEst = new Date(currentEstTime);
  tomorrowEst.setDate(tomorrowEst.getDate() + 1);
  tomorrowEst.setHours(0, 0, 0, 0);
  
  // Calculate the difference
  return tomorrowEst.getTime() - currentEstTime.getTime();
};

export function useQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const midnightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomFallbackQuote = (): Quote => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  };

  const fetchQuoteFromAPI = async (): Promise<Quote | null> => {
    try {
      console.log('Attempting to fetch quote from backend API...');
      // Use our backend endpoint to bypass CORS issues
      const response = await fetch('/api/quote');
      console.log('Backend API response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend API data:', data);
        if (data && data.text && data.author) {
          console.log('Successfully got quote from backend API, source:', data.source);
          return {
            text: data.text,
            author: data.author
          };
        }
      }
      
      console.log('Backend API failed to return valid quote');
      return null;
    } catch (error) {
      console.error('Error fetching quote from backend API:', error);
      return null;
    }
  };

  const getTodaysQuote = async (forceRefresh = false) => {
    const today = getESTDate();
    const savedDate = localStorage.getItem(QUOTE_DATE_KEY);
    const savedQuote = localStorage.getItem(QUOTE_STORAGE_KEY);

    console.log('Quote system:', { today, savedDate, forceRefresh, hasSavedQuote: !!savedQuote });

    // If we have a quote for today and not forcing refresh, use it
    if (!forceRefresh && savedDate === today && savedQuote) {
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
      console.log('Fetching new quote from API...');
      const apiQuote = await fetchQuoteFromAPI();
      let todaysQuote: Quote;

      if (apiQuote) {
        console.log('Using API quote:', apiQuote);
        todaysQuote = apiQuote;
        setError(null); // Clear any previous error
      } else {
        console.log('API failed, using fallback quote');
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

  // Setup midnight refresh timer
  const setupMidnightRefresh = () => {
    // Clear existing timeout
    if (midnightTimeoutRef.current) {
      clearTimeout(midnightTimeoutRef.current);
    }

    const msUntilMidnight = getMillisecondsUntilMidnightEST();
    
    midnightTimeoutRef.current = setTimeout(() => {
      getTodaysQuote(true); // Force refresh at midnight
      setupMidnightRefresh(); // Setup next day's timer
    }, msUntilMidnight);
  };

  useEffect(() => {
    getTodaysQuote();
    setupMidnightRefresh();

    // Cleanup timeout on unmount
    return () => {
      if (midnightTimeoutRef.current) {
        clearTimeout(midnightTimeoutRef.current);
      }
    };
  }, []);

  const forceRefresh = () => {
    // Clear saved quote to force API fetch
    localStorage.removeItem(QUOTE_STORAGE_KEY);
    localStorage.removeItem(QUOTE_DATE_KEY);
    getTodaysQuote(true);
  };

  return {
    quote,
    loading,
    error,
    refresh: forceRefresh
  };
}