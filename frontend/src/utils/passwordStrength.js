const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'passw0rd', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'abc123', '111111', '123123', 'letmein', 'welcome', 'monkey',
  'dragon', 'iloveyou', 'admin', 'trustno1', 'sunshine', 'princess', 'football',
  'baseball', 'master', 'superman', 'starwars', 'whatever', 'qazwsx', 'shadow',
  'michael', 'jennifer', '000000', '123321', 'freedom', 'whatever1',
]);

const KEYBOARD_SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function hasSequentialRun(lower, minRun = 4) {
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let i = 0; i <= seq.length - minRun; i++) {
      const forward = seq.slice(i, i + minRun);
      const backward = [...forward].reverse().join('');
      if (lower.includes(forward) || lower.includes(backward)) return true;
    }
  }
  return false;
}

function hasRepeatedRun(str, minRun = 3) {
  return new RegExp(`(.)\\1{${minRun - 1},}`).test(str);
}

// Rule-based read on a password: how large its keyspace is (entropy) and whether it's the
// kind of predictable pattern Grover's speedup chews through instantly.
export function evaluatePassword(password, username = '', email = '') {
  const length = password.length;
  const lower = password.toLowerCase();
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const categoryCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 32;
  poolSize = poolSize || 26;

  const entropyBits = length > 0 ? Math.round(length * Math.log2(poolSize)) : 0;
  const effectiveBits = Math.round(entropyBits / 2);

  const emailLocal = (email.split('@')[0] || '').toLowerCase();
  const reasons = [];

  const isCommon = COMMON_PASSWORDS.has(lower);
  if (isCommon) reasons.push('it matches a known top-breached password list');

  const containsIdentity =
    (username && username.length > 2 && lower.includes(username.toLowerCase())) ||
    (emailLocal.length > 2 && lower.includes(emailLocal));
  if (containsIdentity) reasons.push('it contains your username or email');

  const sequential = hasSequentialRun(lower);
  if (sequential) reasons.push('it contains a keyboard or alphabetic/numeric sequence');

  const repeated = hasRepeatedRun(password);
  if (repeated) reasons.push('it repeats the same character too many times in a row');

  if (length < 12) reasons.push('it is shorter than 12 characters');
  if (categoryCount < 3) reasons.push('it uses fewer than 3 character types (lowercase, uppercase, digits, symbols)');

  const predictable = isCommon || containsIdentity || sequential || repeated;
  const quantumResistant = length > 0 && !predictable && length >= 12 && categoryCount >= 3;

  return { length, entropyBits, effectiveBits, poolSize, categoryCount, predictable, quantumResistant, reasons };
}
