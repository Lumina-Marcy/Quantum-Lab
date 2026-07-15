function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ranges are chosen so quantum time is always far smaller than classical time —
// no runtime clamping needed between the two.
export function randomClassicalDuration() {
  const minutes = randomInt(8, 14);
  const seconds = randomInt(0, 59);
  return { minutes, seconds, label: `${minutes}m ${String(seconds).padStart(2, '0')}s` };
}

export function randomQuantumDuration() {
  const seconds = Math.round((8 + Math.random() * 7) * 10) / 10;
  return { seconds, label: `${seconds.toFixed(1)} seconds` };
}
