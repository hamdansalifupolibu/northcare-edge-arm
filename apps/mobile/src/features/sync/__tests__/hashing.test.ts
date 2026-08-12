import { canonicalJson, canonicalJsonSha256 } from '../domain/hashing';

describe('sync canonical hashing', () => {
  it('is stable regardless of object key insertion order', () => {
    expect(canonicalJson({ b: 2, a: { z: true, y: null } }))
      .toBe(canonicalJson({ a: { y: null, z: true }, b: 2 }));
    expect(canonicalJsonSha256({ b: 2, a: 1 })).toBe(canonicalJsonSha256({ a: 1, b: 2 }));
  });
});
