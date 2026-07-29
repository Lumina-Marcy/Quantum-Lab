// A fictional but realistic-looking SSN, generated once per vault — never something the user
// has to type in themselves, which removes the hesitation of entering a real one.
function pad(n, length) {
  return String(n).padStart(length, '0');
}

export function generateFictionalSsn() {
  const area = pad(Math.floor(Math.random() * 899) + 100, 3); // 100-998, avoids 000/666
  const group = pad(Math.floor(Math.random() * 99) + 1, 2);
  const serial = pad(Math.floor(Math.random() * 9999) + 1, 4);
  return `${area}-${group}-${serial}`;
}
