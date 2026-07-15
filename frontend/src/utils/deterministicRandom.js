// Sine-based PRNG so generated layouts look organic without changing between renders or reloads.
export function jitter(seed) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}
