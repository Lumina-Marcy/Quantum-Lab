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

// Builds the breach-reveal list from exactly what the player entered/selected during vault
// setup — nothing is invented. A field or service group that was left blank simply never
// produces an item, so the reveal only ever shows what actually belongs to this player's vault.
export function buildBreachItems(vault) {
  if (!vault) return [];
  const items = [{ id: 'password', actionLabel: 'Verifying credentials...', resultLabel: 'Password Compromised' }];

  if (vault.fullName) {
    items.push({ id: 'identity', actionLabel: 'Accessing account...', resultLabel: 'Identity Confirmed', value: vault.fullName });
  }
  if (vault.email) {
    items.push({ id: 'email', actionLabel: 'Retrieving contact info...', resultLabel: 'Email Retrieved', value: vault.email });
  }
  if (vault.phone) {
    items.push({ id: 'phone', actionLabel: 'Retrieving phone number...', resultLabel: 'Phone Number Retrieved', value: vault.phone });
  }
  if (vault.ssn) {
    items.push({ id: 'ssn', actionLabel: 'Searching identity records...', resultLabel: 'SSN Exposed', value: vault.ssn });
  }
  if (vault.address) {
    items.push({ id: 'address', actionLabel: 'Locating home address...', resultLabel: 'Home Address Retrieved', value: vault.address });
  }
  if (vault.bankName && vault.accountNumber) {
    const masked = `${vault.bankName} — Account ${'•'.repeat(Math.max(0, vault.accountNumber.length - 4))}${vault.accountNumber.slice(-4)}`;
    items.push({ id: 'bank', actionLabel: 'Searching stored payment methods...', resultLabel: 'Bank Account Retrieved', value: masked });
  }
  if (vault.cardNickname) {
    items.push({ id: 'card', actionLabel: 'Scanning stored cards...', resultLabel: 'Credit Card Retrieved', value: vault.cardNickname });
  }
  if (vault.investmentAccount) {
    items.push({ id: 'investment', actionLabel: 'Searching investment platforms...', resultLabel: 'Investment Account Retrieved', value: vault.investmentAccount });
  }
  const medicalDetails = [vault.doctorName, vault.primaryHospital, vault.insuranceProvider, vault.medicalPortal].filter(Boolean);
  if (medicalDetails.length > 0) {
    items.push({ id: 'medical', actionLabel: 'Accessing medical portal...', resultLabel: 'Medical Records Retrieved', value: medicalDetails.join(' · ') });
  }
  if (vault.streaming?.length > 0) {
    items.push({ id: 'streaming', actionLabel: 'Checking connected services...', resultLabel: 'Streaming Accounts Found', value: vault.streaming.join(', ') });
  }
  if (vault.social?.length > 0) {
    items.push({ id: 'social', actionLabel: 'Checking social accounts...', resultLabel: 'Social Accounts Found', value: vault.social.join(', ') });
  }
  if (vault.gaming?.length > 0) {
    items.push({ id: 'gaming', actionLabel: 'Checking gaming platforms...', resultLabel: 'Gaming Accounts Found', value: vault.gaming.join(', ') });
  }
  if (vault.work?.length > 0) {
    items.push({ id: 'work', actionLabel: 'Checking work accounts...', resultLabel: 'Work Accounts Found', value: vault.work.join(', ') });
  }

  return items;
}
