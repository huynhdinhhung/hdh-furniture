import { expect, it } from 'vitest';
import { formatVnd } from '../../apps/web/src/lib/api';
it('formats large VND integers without rounding', () => {
  expect(formatVnd('999999999999999999').replace(/\s/g, '')).toBe('999.999.999.999.999.999₫');
});
