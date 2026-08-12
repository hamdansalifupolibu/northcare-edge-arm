import { resolveStops } from '../AppLinearGradient';

describe('AppLinearGradient transparent stops', () => {
  it('maps CSS transparent to zero opacity (not opaque black)', () => {
    const stops = resolveStops(['transparent', 'rgba(6, 78, 73, 0.72)', '#064E49']);
    expect(stops[0]?.opacity).toBe(0);
    expect(stops[1]?.opacity).toBe(0.72);
    expect(stops[2]?.opacity).toBe(1);
  });
});
