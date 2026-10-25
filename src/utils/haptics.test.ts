import test from 'node:test';
import assert from 'node:assert';
import { haptics } from './haptics.ts';

test('haptics controller initializes and executes methods safely without crashing in any environment', () => {
  assert.doesNotThrow(() => {
    haptics.light();
    haptics.medium();
    haptics.success();
    haptics.warning();
    haptics.dragStart();
    haptics.drop();
  });
});
