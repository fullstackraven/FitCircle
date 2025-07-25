import { useState, useEffect, useRef } from 'react';

interface Quote {
  text: string;
  author: string;
}

const QUOTE_STORAGE_KEY = 'fitcircle_daily_quote';
const QUOTE_DATE_KEY = 'fitcircle_quote_date';

// Inspirational quotes for daily motivation
const DAILY_QUOTES: Quote[] = [
  { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "What we do now echoes in eternity.", author: "Marcus Aurelius" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Discipline is the soul of an army.", author: "George Washington" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The body achieves what the mind believes.", author: "Napoleon Hill" },
  { text: "Champions aren't made in the gyms. Champions are made from something deep inside them - a desire, a dream, a vision.", author: "Muhammad Ali" },
  { text: "Pain is temporary. It may last a minute, or an hour, or a day, or a year, but eventually it will subside and something else will take its place. If I quit, however, it lasts forever.", author: "Lance Armstrong" },
  { text: "The fear of death follows from the fear of life. A man who lives fully is prepared to die at any time.", author: "Mark Twain" },
  { text: "The world ain't all sunshine and rainbows. It is a very mean and nasty place and it will beat you to your knees and keep you there permanently if you let it. You, me, or nobody is gonna hit as hard as life. But it ain't how hard you hit; it's about how hard you can get hit, and keep moving forward.", author: "Rocky Balboa" },
  { text: "You have enemies? Good. That means you've stood up for something, sometime in your life.", author: "Winston S. Churchill" },
  { text: "The question isn't who is going to let me: it's who is going to stop me.", author: "Ayn Rand" },
  { text: "It wasn't raining when Noah built the ark.", author: "Howard Ruff" },
  { text: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman" },
  { text: "Do today what others won't and achieve tomorrow what others can't.", author: "Jerry Rice" },
  { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin" },
  { text: "You create opportunities by performing, not complaining.", author: "Muriel Siebert" },
  { text: "Train yourself to let go of everything you fear to lose.", author: "Yoda" },
  { text: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "Push that snooze button and you'll end up working for someone who didn't.", author: "Eric Thomas" },
  { text: "The characteristic feature of the loser is to bemoan, in general terms, mankind's flaws, biases, contradictions, and irrationality-without exploiting them for fun and profit.", author: "Nassim Nicholas Taleb" },
  { text: "The people who are crazy enough to think they can change the world, are the ones who do.", author: "Steve Jobs" },
  { text: "The best is the enemy of the good.", author: "Voltaire" },
  { text: "The three most harmful addictions are heroin, carbohydrates, and a monthly salary.", author: "Nassim Nicholas Taleb" },
  { text: "If you hear a voice within you say 'you cannot paint,' then by all means paint, and that voice will be silenced.", author: "Van Gogh" },
  { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
  { text: "Limitations live only in our minds. But if we use our imaginations, our possibilities become limitless.", author: "Jamie Paolinetti" },
  { text: "There is only one way to avoid criticism: do nothing, say nothing, and be nothing.", author: "Aristotle" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "I am thankful for all of those who said NO to me. Its because of them I'm doing it myself.", author: "Albert Einstein" },
  { text: "Nobody ever wrote down a plan to be broke, fat, lazy, or stupid. Those things are what happen when you don't have a plan.", author: "Larry Winget" },
  { text: "Tough times never last, but tough people do.", author: "Dr. Robert Schuller" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Obsessed is just a word the lazy use to describe the dedicated.", author: "Russell Warren" },
  { text: "Someday is not a day of the week.", author: "Denise Brennan-Nelson" },
  { text: "If you can't outplay them, outwork them.", author: "Ben Hogan" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "Change your thoughts and you change your world.", author: "Norman Vincent Peale" },
  { text: "I will go anywhere as long as it is forward.", author: "David Livingston" },
  { text: "If you aren't going all the way, why go at all?", author: "Joe Namath" },
  { text: "Don't wish it were easier, wish you were better.", author: "Jim Rohn" },
  { text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.", author: "David Goggins" },
  { text: "It's a lot more than mind over matter. It takes relentless self-discipline to schedule suffering into your day, every day.", author: "David Goggins" },
  { text: "Denial is the ultimate comfort zone.", author: "David Goggins" },
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.", author: "David Goggins" }
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

  const getDailyQuote = (date: string): Quote => {
    // Use date to create a deterministic but seemingly random selection
    const dateHash = date.split('-').reduce((acc, part) => acc + parseInt(part), 0);
    const quoteIndex = dateHash % DAILY_QUOTES.length;
    return DAILY_QUOTES[quoteIndex];
  };

  const getRandomQuote = (): Quote => {
    const randomIndex = Math.floor(Math.random() * DAILY_QUOTES.length);
    return DAILY_QUOTES[randomIndex];
  };

  const getTodaysQuote = (forceRefresh = false) => {
    const today = getESTDate();
    const savedDate = localStorage.getItem(QUOTE_DATE_KEY);
    const savedQuote = localStorage.getItem(QUOTE_STORAGE_KEY);



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

    // Get a new quote
    setLoading(true);
    setError(null);

    let todaysQuote: Quote;

    if (forceRefresh) {
      // For manual refresh, get a random quote
      todaysQuote = getRandomQuote();
    } else {
      // For daily refresh, get deterministic daily quote
      todaysQuote = getDailyQuote(today);
    }

    // Save the quote for today
    localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(todaysQuote));
    localStorage.setItem(QUOTE_DATE_KEY, today);
    
    setQuote(todaysQuote);
    setLoading(false);
  };

  // Setup midnight refresh timer
  const setupMidnightRefresh = () => {
    // Clear existing timeout
    if (midnightTimeoutRef.current) {
      clearTimeout(midnightTimeoutRef.current);
    }

    const msUntilMidnight = getMillisecondsUntilMidnightEST();
    
    midnightTimeoutRef.current = setTimeout(() => {
      getTodaysQuote(false); // Get new daily quote at midnight (not force refresh)
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