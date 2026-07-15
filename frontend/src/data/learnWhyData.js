export const CLASSICAL_SEARCH_SPACE_LABEL = '10,000,000 possibilities';

export const QUANTUM_MESSAGES = [
  'Loading dictionary...',
  'Initializing superposition...',
  'Exploring many possibilities...',
  'Amplifying likely solution...',
  'Measuring final state...',
  'Password located.',
];

export const QUANTUM_SEARCH_SPACE_LABEL = '~√N possibilities (educational approximation)';

export const KEY_TAKEAWAY_POINTS = [
  'Classical computers generally evaluate possibilities sequentially.',
  'Quantum algorithms can use quantum properties to reduce the number of search steps for certain problems.',
  'This is why researchers are preparing quantum-resistant cryptography.',
];

export const GROVER_NOTE =
  "Visualization inspired by Grover's Algorithm. Actual quantum attacks require additional practical considerations.";

// Fallbacks only — used if someone reaches this screen without having filled in the
// onboarding vault fields (e.g. an old/partial session), so the cascade is never blank.
export const FICTIONAL_BREACH_EXTRAS = {
  fullName: 'Jordan Sample',
  bankValue: 'Sample Bank — Account •••• 8823 (sample data — not a real account)',
  addressValue: '742 Evergreen Terrace (sample data)',
};

export function buildBreachItems({ email, fullName, address, bankName, accountNumber, extras = FICTIONAL_BREACH_EXTRAS }) {
  const bankValue =
    bankName && accountNumber
      ? `${bankName} — Account ${'•'.repeat(Math.max(0, accountNumber.length - 4))}${accountNumber.slice(-4)}`
      : extras.bankValue;

  return [
    { id: 'password', actionLabel: 'Verifying credentials...', resultLabel: 'Password Compromised' },
    { id: 'identity', actionLabel: 'Accessing account...', resultLabel: 'Identity Confirmed', value: fullName || extras.fullName },
    { id: 'email', actionLabel: 'Retrieving contact info...', resultLabel: 'Email Retrieved', value: email },
    { id: 'bank', actionLabel: 'Searching stored payment methods...', resultLabel: 'Bank Account Retrieved', value: bankValue },
    { id: 'address', actionLabel: 'Locating home address...', resultLabel: 'Home Address Retrieved', value: address || extras.addressValue },
  ];
}
