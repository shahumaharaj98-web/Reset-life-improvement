import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashDateKey,
  getDailyMotivationQuote,
  MOTIVATION_QUOTES,
} from './motivationQuotes.ts';

test('hashDateKey produces consistent positive integers for given date strings', () => {
  const hash1 = hashDateKey('2026-10-25');
  const hash2 = hashDateKey('2026-10-25');
  const hash3 = hashDateKey('2026-10-26');

  assert.equal(hash1, hash2);
  assert.ok(hash1 >= 0);
  assert.notEqual(hash1, hash3);
});

test('getDailyMotivationQuote returns a valid quote for any date string', () => {
  const quote = getDailyMotivationQuote('2026-10-25');
  assert.ok(quote.id);
  assert.ok(quote.quote.length > 10);
  assert.ok(quote.author.length > 0);
});

test('getDailyMotivationQuote returns the same quote deterministically throughout the day', () => {
  const q1 = getDailyMotivationQuote('2026-10-25');
  const q2 = getDailyMotivationQuote('2026-10-25');
  assert.equal(q1.id, q2.id);
  assert.equal(q1.quote, q2.quote);
});

test('getDailyMotivationQuote cycles properly with offsetIndex', () => {
  const q0 = getDailyMotivationQuote('2026-10-25', 0);
  const q1 = getDailyMotivationQuote('2026-10-25', 1);
  assert.notEqual(q0.id, q1.id);

  // Cycling by total length wraps back
  const total = MOTIVATION_QUOTES.length;
  const qWrapped = getDailyMotivationQuote('2026-10-25', total);
  assert.equal(q0.id, qWrapped.id);
});
