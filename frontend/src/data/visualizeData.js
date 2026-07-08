export const PROBABILITY_STEPS = [
  { id: 1, caption: 'Many possibilities exist — every password starts equally likely.', probability: 25 },
  { id: 2, caption: 'The oracle marks the correct one; a probability wave begins to ripple outward.', probability: 50 },
  { id: 3, caption: 'The algorithm amplifies the correct probability while neighbors dim.', probability: 75 },
  { id: 4, caption: 'The correct answer becomes increasingly likely — measurement reveals it.', probability: 94 },
];

export const SEARCH_SPACE_LABEL = '1,000,000 possibilities';

// Educational approximation: ~sqrt(N) iterations for N = 1,000,000, per Grover's Algorithm.
export const TOTAL_ITERATIONS = 1000;

export const GROVER_STEPS = [
  { id: 1, title: 'Superposition', description: 'All possibilities have equal chance.' },
  { id: 2, title: 'Oracle Check', description: 'Correct one gets marked.' },
  { id: 3, title: 'Amplitude Amplification', description: 'Correct one gets higher probability.' },
  { id: 4, title: 'Measurement', description: 'We find the answer!' },
];

export const GROVER_SECTIONS = [
  {
    id: 'problem',
    title: 'What Problem Does It Solve?',
    body: "Grover's Algorithm speeds up the search for a specific item hidden among many unsorted possibilities — like finding one correct password among millions, when there's no shortcut like alphabetical order to help.",
  },
  {
    id: 'how',
    title: 'How It Works (High Level)',
    body: 'A quantum computer starts every possibility off equally likely at once. An "oracle" step marks the correct answer without revealing it directly, and repeated amplification rounds nudge the odds toward that marked answer until it stands out.',
  },
  {
    id: 'why-faster',
    title: 'Why It Is Faster',
    body: 'A classical computer typically has to check possibilities one at a time. Grover\'s Algorithm needs roughly the square root of that many steps — so searching a million possibilities takes on the order of a thousand quantum steps instead of a million classical ones.',
  },
  {
    id: 'limitations',
    title: 'Limitations',
    body: "It only offers this speedup for unstructured search-style problems, and the advantage is quadratic, not magical — it does not make quantum computers instantly solve every hard problem, and today's hardware is far too limited and error-prone to run it against real-world encryption.",
  },
  {
    id: 'impact',
    title: 'Real World Impact',
    body: "Because it could someday reduce the effective strength of certain cryptographic keys, it's a key reason researchers are designing quantum-resistant encryption today, well before large-scale quantum computers exist.",
  },
];

export const GROVER_COMPLEXITY = { classical: 'O(N)', quantum: 'O(√N)' };

export const GROVER_TAKEAWAY =
  "Grover's Algorithm does not instantly guess passwords. Instead, it reduces the number of search steps required for certain types of problems, making large searches more efficient on a sufficiently capable quantum computer.";

export const QUBIT_STATES = [
  { id: 'zero', label: '|0⟩', description: 'A qubit measured with certainty as 0.' },
  { id: 'one', label: '|1⟩', description: 'A qubit measured with certainty as 1.' },
  {
    id: 'superposition',
    label: 'α|0⟩ + β|1⟩',
    description: 'A qubit in superposition — both states are possible until measured.',
  },
];

export const QUBIT_SECTIONS = [
  {
    id: 'what-is',
    title: 'What Is A Qubit?',
    body: 'A qubit ("quantum bit") is the basic unit of information in a quantum computer — the quantum equivalent of the bits that classical computers use.',
  },
  {
    id: 'bit-vs-qubit',
    title: 'Classical Bit vs. Qubit',
    body: 'A classical bit is always exactly 0 or 1. A qubit can be 0, 1, or — while unobserved — a blend of both at once, which lets quantum computers explore many combinations in parallel.',
  },
  {
    id: 'superposition',
    title: 'Superposition',
    body: "Superposition is what makes that blend possible: a qubit can hold a mix of 0-ness and 1-ness simultaneously, with each outcome carrying its own probability, until something forces it to settle on one.",
  },
  {
    id: 'measurement',
    title: 'Measurement',
    body: 'Measuring a qubit is that forcing moment — the superposition "collapses" and you get a plain 0 or 1, with the odds of each outcome set by the probabilities it held beforehand.',
  },
  {
    id: 'why-matters',
    title: 'Why This Matters',
    body: 'Combining many qubits in superposition lets a quantum computer represent an enormous number of possibilities at once, which is the raw material algorithms like Grover\'s use to search faster.',
  },
  {
    id: 'real-world',
    title: 'Real World Example',
    body: 'It\'s a bit like flipping a coin and covering it before it lands — while it\'s hidden, "heads" and "tails" are both still possible; lifting your hand to look is the measurement that forces one real answer.',
  },
];

export const QUBIT_TAKEAWAY =
  'A qubit isn\'t "0 and 1 at the same time" in a way you could ever directly see — it holds probabilities for each outcome until measured, and measuring always yields one definite classical result.';

export const PROBABILITY_TAKEAWAY =
  'The glowing dot isn\'t "the computer checking harder" — the whole cloud of possibilities is manipulated together, so the correct answer\'s probability rises while every other possibility\'s probability falls.';

export const EDUCATIONAL_NOTE =
  "This visualization demonstrates the intuition behind Grover's Algorithm. Rather than checking every possibility one-by-one, quantum algorithms manipulate probability amplitudes so the correct answer becomes more likely when measured.";

export const GLOSSARY = {
  qubit: {
    term: 'Qubit',
    definition: 'The basic unit of quantum information — like a bit, but able to hold a blend of 0 and 1 until measured.',
  },
  superposition: {
    term: 'Superposition',
    definition: 'A quantum state representing multiple possibilities at once, each with its own probability.',
  },
  amplitude: {
    term: 'Amplitude',
    definition: "A number describing how likely a quantum outcome is — its square gives the probability you'll measure that outcome.",
  },
  measurement: {
    term: 'Measurement',
    definition: 'The act of observing a qubit, which collapses its superposition into one definite classical result.',
  },
  oracle: {
    term: 'Oracle',
    definition: "A step that can recognize the correct answer among many, without needing to reveal it up front.",
  },
  groverIteration: {
    term: 'Grover Iteration',
    definition: 'One round of oracle-marking plus amplification — repeating this a few times is what raises the correct answer\'s probability.',
  },
  probability: {
    term: 'Probability',
    definition: 'The chance of a particular outcome when a qubit is measured, ranging from 0% to 100%.',
  },
};
