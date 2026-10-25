export interface MotivationQuote {
  id: string;
  quote: string;
  author: string;
  context?: string;
}

export const MOTIVATION_QUOTES: MotivationQuote[] = [
  {
    id: 'quote-1',
    quote: 'Between stimulus and response there is a space. In that space is our power to choose our response. In our response lies our growth and our freedom.',
    author: 'Viktor E. Frankl',
    context: 'The fundamental pause behind urge surfing.',
  },
  {
    id: 'quote-2',
    quote: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    context: 'Stoic resilience against transient cravings.',
  },
  {
    id: 'quote-3',
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    context: 'Anchor habits outlast fleeting motivation.',
  },
  {
    id: 'quote-4',
    quote: 'He who conquers himself is the mightiest warrior.',
    author: 'Confucius',
    context: 'Internal mastery over impulsive desires.',
  },
  {
    id: 'quote-5',
    quote: 'The first and greatest victory is to conquer yourself; to be conquered by your own nature is of all things most shameful and vile.',
    author: 'Plato',
    context: 'Choosing conscious reason over biological autopilot.',
  },
  {
    id: 'quote-6',
    quote: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
    author: 'Carl Jung',
    context: 'Awareness is the antidote to automatic habit loops.',
  },
  {
    id: 'quote-7',
    quote: 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.',
    author: 'Seneca',
    context: 'Discomfort is the price of admission to a new baseline.',
  },
  {
    id: 'quote-8',
    quote: 'Cravings are like ocean waves: they peak within five minutes and break on the shore. You only have to surf them.',
    author: 'Alan Marlatt',
    context: 'The neurobiological reality of urge duration.',
  },
  {
    id: 'quote-9',
    quote: 'Freedom is not the lack of restraint, but the capacity to choose the right restraint.',
    author: 'Abraham Joshua Heschel',
    context: 'Voluntary boundaries create true sovereignty.',
  },
  {
    id: 'quote-10',
    quote: 'Dopamine is not about pleasure; it is about the anticipation of pleasure. Recognize the mirage.',
    author: 'Neuroscience Maxim',
    context: 'Seeing the mechanism of craving clearly.',
  },
  {
    id: 'quote-11',
    quote: 'Do not seek that things should happen as you wish, but wish for them to happen as they do, and you will go on well.',
    author: 'Epictetus',
    context: 'Accepting present discomfort without escaping into compulsion.',
  },
  {
    id: 'quote-12',
    quote: 'Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.',
    author: 'John C. Maxwell',
    context: 'Daily 3-habit compound interest.',
  },
  {
    id: 'quote-13',
    quote: 'Peace is the result of retraining your mind to process life as it is, rather than as you think it should be.',
    author: 'Wayne Dyer',
    context: 'Neutral awareness without reactive numbness.',
  },
  {
    id: 'quote-14',
    quote: 'A man who suffers before it is necessary, suffers more than is necessary.',
    author: 'Seneca',
    context: 'Do not manufacture anticipatory anxiety about future urges.',
  },
];

/**
 * Hash a string (e.g. '2026-10-25') to a deterministic integer index.
 */
export function hashDateKey(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    const char = dateKey.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic quote for a given date key (e.g. '2026-10-25'),
 * optionally offset by an index for the "new quote" shuffle button.
 */
export function getDailyMotivationQuote(
  dateKey: string,
  offsetIndex: number = 0
): MotivationQuote {
  const baseIndex = hashDateKey(dateKey);
  const total = MOTIVATION_QUOTES.length;
  const targetIndex = (baseIndex + offsetIndex) % total;
  return MOTIVATION_QUOTES[targetIndex];
}
