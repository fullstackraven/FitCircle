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
  { text: "The most important conversations you'll ever have are the ones you'll have with yourself.", author: "David Goggins" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "You have power over your mind—not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { text: "If it is not right, do not do it; if it is not true, do not say it.", author: "Marcus Aurelius" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "Don’t explain your philosophy. Embody it.", author: "Epictetus" },
  { text: "Difficulties show men what they are.", author: "Epictetus" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "He who is brave is free.", author: "Seneca" },
  { text: "Sometimes even to live is an act of courage.", author: "Seneca" },
  { text: "Man conquers the world by conquering himself.", author: "Zeno of Citium" },
  { text: "Practice yourself, for heaven’s sake, in little things; and thence proceed to greater.", author: "Epictetus" },
  { text: "The more we value things outside our control, the less control we have.", author: "Epictetus" },
  { text: "To bear trials with a calm mind robs misfortune of its strength.", author: "Seneca" },
  { text: "If you want to improve, be content to be thought foolish and stupid.", author: "Epictetus" },
  { text: "A gem cannot be polished without friction, nor a man perfected without trials.", author: "Seneca" },
  { text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "There is more wisdom in your body than in your deepest philosophy.", author: "Friedrich Nietzsche" },
  { text: "Become who you are.", author: "Friedrich Nietzsche" },
  { text: "The last of the human freedoms—to choose one’s attitude in any given set of circumstances.", author: "Viktor E. Frankl" },
  { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor E. Frankl" },
  { text: "Between stimulus and response there is a space… in that space is our power to choose our response.", author: "Viktor E. Frankl" },
  { text: "Life is never made unbearable by circumstances, but only by lack of meaning and purpose.", author: "Viktor E. Frankl" },
  { text: "We must embrace pain and burn it as fuel for our journey.", author: "Kenji Miyazawa" },
  { text: "The only way to define your limits is by going beyond them.", author: "Arthur C. Clarke" },
  { text: "It is not the mountain we conquer but ourselves.", author: "Sir Edmund Hillary" },
  { text: "What hurts today makes you stronger tomorrow.", author: "Jay Cutler" },
  { text: "The resistance you fight in the gym and in life builds a strong character.", author: "Arnold Schwarzenegger" },
  { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
  { text: "If something stands between you and your success, move it. Never be denied.", author: "Dwayne Johnson" },
  { text: "Sweat is fat crying.", author: "UNKNOWN" },
  { text: "Once you learn to quit, it becomes a habit.", author: "Vince Lombardi" },
  { text: "The will must be stronger than the skill.", author: "Muhammad Ali" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Go the extra mile. It’s never crowded.", author: "Wayne Dyer" },
  { text: "Physical fitness can neither be achieved by wishful thinking nor outright purchase.", author: "Joseph Pilates" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "The more difficult the victory, the greater the happiness in winning.", author: "Pelé" },
  { text: "Don’t let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { text: "Be quick, but don’t hurry.", author: "John Wooden" },
  { text: "Never let the fear of striking out keep you from playing the game.", author: "Babe Ruth" },
  { text: "Do not let what you cannot control interfere with what you can control.", author: "John Wooden" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "Fall seven times, stand up eight.", author: "UNKNOWN" },
  { text: "A river cuts through rock, not because of its power, but because of its persistence.", author: "James N. Watkins" },
  { text: "The only bad workout is the one that didn’t happen.", author: "UNKNOWN" },
  { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { text: "You miss 100% of the shots you don’t take.", author: "Wayne Gretzky" },
  { text: "It’s not whether you get knocked down; it’s whether you get up.", author: "Vince Lombardi" },
  { text: "Champions behave like champions before they’re champions.", author: "Bill Walsh" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
  { text: "Fatigue makes cowards of us all.", author: "Vince Lombardi" },
  { text: "The best motivation always comes from within.", author: "UNKNOWN" },
  { text: "Excellence is not a singular act but a habit. You are what you repeatedly do.", author: "Aristotle" },
  { text: "Strength is the product of struggle.", author: "Napoleon Hill" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
  { text: "Success is usually the culmination of controlling failure.", author: "Sylvester Stallone" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
  { text: "Pain is inevitable. Suffering is optional.", author: "Haruki Murakami" },
  { text: "Obsessed is a word the lazy use to describe the dedicated.", author: "UNKNOWN" },
  { text: "Strive for progress, not perfection.", author: "UNKNOWN" },
  { text: "If you’re tired of starting over, stop giving up.", author: "Shia LaBeouf" },
  { text: "If it doesn’t challenge you, it won’t change you.", author: "Fred DeVito" },
  { text: "Train hard, turn up, run your best and the rest will take care of itself.", author: "Usain Bolt" },
  { text: "Be stronger than your excuses.", author: "UNKNOWN" },
  { text: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
  { text: "Work hard in silence. Let success be your noise.", author: "Frank Ocean" },
  { text: "Champions aren’t born, they’re made.", author: "UNKNOWN" },
  { text: "A little progress each day adds up to big results.", author: "UNKNOWN" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Will Durant" },
  { text: "The more you sweat in training, the less you bleed in battle.", author: "UNKNOWN" },
  { text: "Good things come to those who sweat.", author: "UNKNOWN" },
  { text: "The clock is ticking. Are you becoming the person you want to be?", author: "Greg Plitt" },
  { text: "Make yourself a priority.", author: "UNKNOWN" },
  { text: "Strong people are harder to kill and more useful in general.", author: "Mark Rippetoe" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "The more you seek the uncomfortable, the more you become comfortable.", author: "Conor McGregor" },
  { text: "If you want to be the best, you have to do things that other people aren’t willing to do.", author: "Michael Phelps" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The hard days are the best because that’s when champions are made.", author: "Gabby Douglas" },
  { text: "Once you are exercising regularly, the hardest thing is to stop it.", author: "Erin Gray" },
  { text: "If you think lifting is dangerous, try being weak. Being weak is dangerous.", author: "Bret Contreras" },
  { text: "What gets measured gets improved.", author: "Peter Drucker" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "One day or day one. You decide.", author: "UNKNOWN" },
  { text: "Fitness is not about being better than someone else; it’s about being better than you used to be.", author: "UNKNOWN" },
  { text: "Success is not for the chosen few, but for the few who choose.", author: "UNKNOWN" }
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