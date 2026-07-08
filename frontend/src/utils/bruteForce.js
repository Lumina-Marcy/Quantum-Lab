const BASE_CHARSET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function buildCharset(password) {
  const extra = [...password].filter((c) => !BASE_CHARSET.includes(c.toLowerCase()));
  return BASE_CHARSET + extra.join('');
}

function randomString(length, charset) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
}

/**
 * Builds a fake brute-force attempt log ending in the real password: a flurry of
 * unrelated misses, then a short "converging" tail that shares a growing prefix
 * with the real password, so the final entries visually close in on the answer.
 */
export function generateCandidateSequence(password) {
  const length = password.length;
  const charset = buildCharset(password);

  const missCount = Math.floor(Math.random() * 7) + 16; // 16-22
  const misses = [];
  while (misses.length < missCount) {
    const candidate = randomString(length, charset);
    if (candidate !== password) misses.push(candidate);
  }

  const tailCount = Math.floor(Math.random() * 3) + 4; // 4-6
  const tail = [];
  for (let i = 1; i < tailCount; i += 1) {
    const prefixLen = Math.min(length - 1, Math.round((i / tailCount) * length));
    const candidate = password.slice(0, prefixLen) + randomString(length - prefixLen, charset);
    if (candidate !== password) tail.push(candidate);
  }

  const attempts = [...misses, ...tail, password];

  return attempts.map((candidate, i) => ({
    id: i,
    text: `Checking password: ${candidate}`,
    isMatch: i === attempts.length - 1,
  }));
}
