// Data model for the post-breach triage loop (Password Mission, phase 2+).
// The master password is already cracked (see PasswordMission.jsx's breach cinematic).
// This is turn-based, not real-time: probabilities only move when the player deploys
// (or explicitly skips) a defense. Each such decision is one "round" — every account
// not being resolved that round has its percentage bumped by its own rate, then rolls
// to see if it gets stolen right then. A percentage never has to reach 100 to lose the
// roll — it's a chance, not a threshold.

// The displayed percentage is a risk *level*, not the literal roll odds — the actual
// steal chance is curved (squared) against it. This concentrates true randomness away
// from the extremes: staying low is reliably safer than the raw number implies, and
// letting something climb high is reliably more dangerous than the raw number implies.
// Good prioritization should read as "mostly earned," not a linear coin flip.
const STEAL_CURVE_EXPONENT = 2;

export function curvedStealChance(percentage) {
  return Math.pow(percentage / 100, STEAL_CURVE_EXPONENT) * 100;
}

// Cross-account coupling: an account can name another account (`cascadeFrom`) whose theft
// makes ITS climb rate worse — a shared weakness the attacker pivots through. The bonus is a
// ratio of the downstream account's own climb rate, not a flat number, so it scales sensibly
// with how exposed that account already was.
export const CASCADE_BONUS_RATIO = 0.5;

export const VALUE_META = {
  high: { label: 'High Value', cls: 'text-red-300 border-red-500/40 bg-red-950/30' },
  'medium-high': { label: 'Medium-High Value', cls: 'text-orange-300 border-orange-500/40 bg-orange-950/30' },
  medium: { label: 'Medium Value', cls: 'text-amber-300 border-amber-500/40 bg-amber-950/30' },
  low: { label: 'Low Value', cls: 'text-slate-300 border-slate-600/50 bg-slate-800/40' },
};

// How many points each value tier is worth toward the end-of-mission Quantum Readiness Score —
// losing a high-value account costs far more than losing a low-value one.
export const VALUE_WEIGHTS = { high: 4, 'medium-high': 3, medium: 2, low: 1 };

export const ACCOUNTS = [
  {
    id: 'bank',
    label: 'Bank Account',
    icon: '🏦',
    value: 'high',
    reversible: true,
    startProbability: 18,
    climbRate: 13,
    cascadeFrom: 'identity',
    naturalDefense: 'twofa',
    naturalDefenseHint: 'Already climbing fast — 2FA resolves it instantly, no time needed. Climbs even faster if your SSN falls first — banks lean on it for identity verification.',
    lostConsequence: 'Your checking account is drained overnight. The bank reverses some of the fraudulent charges after a claim, but it takes weeks, and you eat the overdraft fees in the meantime.',
    lockedOutConsequence: 'The quantum attacker never got in — but neither can you. Your bank now requires an in-branch identity check to restore access, which takes days.',
  },
  {
    id: 'identity',
    label: 'SSN / Identity',
    icon: '🪪',
    value: 'high',
    reversible: false,
    startProbability: 5,
    climbRate: 5,
    naturalDefense: 'manager',
    naturalDefenseHint: 'Climbs slowly, but there is no undo — that low number is deceptive.',
    lostConsequence: 'Your Social Security number is sold on a breach forum. Fraudulent accounts get opened in your name for years — this is not something a password reset ever fixes.',
    lockedOutConsequence: 'The vault holding your identity records is sealed shut, permanently, along with everything else in it.',
  },
  {
    id: 'medical',
    label: 'Medical Records',
    icon: '🩺',
    value: 'medium-high',
    reversible: false,
    startProbability: 10,
    climbRate: 8,
    naturalDefense: 'manager',
    naturalDefenseHint: 'Irreversible once leaked — the vault is built for exactly this.',
    lostConsequence: 'Your full medical history — diagnoses, prescriptions, mental health records — leaks permanently. Unlike a password, you can never rotate this away.',
    lockedOutConsequence: 'Your own medical portal locks you out along with the attacker. Reinstating access requires a notarized request to your provider.',
  },
  {
    id: 'social',
    label: 'Social Login',
    icon: '💬',
    value: 'medium',
    reversible: true,
    startProbability: 9,
    climbRate: 8,
    naturalDefense: 'biometric',
    naturalDefenseHint: 'Recoverable, but a face/fingerprint check stops it cold if it holds.',
    lostConsequence: 'Your social account posts scam links to everyone you know before you can log back in. Embarrassing and recoverable, but it takes a public apology post to undo the damage.',
    lockedOutConsequence: 'Your own face no longer unlocks the account — the biometric check can\'t be reset like a password. You start a support ticket that takes weeks.',
  },
  {
    id: 'shop',
    label: 'Shopping Account',
    icon: '🛒',
    value: 'low',
    reversible: true,
    startProbability: 20,
    climbRate: 14,
    cascadeFrom: 'social',
    naturalDefense: null,
    naturalDefenseHint: 'Lowest stakes here — often the right one to consciously let ride. Climbs even faster if your social login falls first — reused single-sign-on hands over the keys.',
    lostConsequence: 'A few fraudulent orders go through on stored payment info before the card issuer flags it. Annoying, refundable, and the least costly loss on this board.',
    lockedOutConsequence: 'You\'re locked out of a shopping account. A minor inconvenience — this is the cheapest place on the board to take a lockout risk.',
  },
  {
    id: 'email',
    label: 'Email Account',
    icon: '📧',
    value: 'high',
    reversible: true,
    startProbability: 14,
    climbRate: 11,
    naturalDefense: 'manager',
    naturalDefenseHint: 'The master key to every other account — a long, vaulted password is worth the slot.',
    lostConsequence: 'The attacker uses your inbox to trigger password resets on everything else you own, then locks you out by swapping the recovery email. You spend days chasing your other accounts through separate identity-verification queues just to get back in front of them.',
    lockedOutConsequence: "Your provider flags the sign-in as suspicious and freezes the account pending identity verification — including from you. You're staring at every other account's \"forgot password\" flow with no inbox left to receive the reset link.",
  },
  {
    id: 'crypto',
    label: 'Crypto Wallet',
    icon: '🪙',
    value: 'high',
    reversible: false,
    startProbability: 9,
    climbRate: 10,
    naturalDefense: 'twofa',
    naturalDefenseHint: "No password reset exists for a drained wallet — the exchange's 2FA is the only real gate before it's gone for good.",
    lostConsequence: "Your wallet is drained to an address you'll never trace back to a real person. There's no bank to call and no chargeback — blockchain transactions don't reverse, and neither does this loss.",
    lockedOutConsequence: 'The exchange freezes the account during a security review — you can\'t reach your own funds either, sometimes for weeks, while their support queue catches up.',
  },
  {
    id: 'cloud',
    label: 'Cloud Photo Backup',
    icon: '☁️',
    value: 'medium-high',
    reversible: false,
    startProbability: 13,
    climbRate: 9,
    naturalDefense: 'biometric',
    naturalDefenseHint: "Your phone's Face/Touch ID already gates this app — biometric protection here is nearly free.",
    lostConsequence: "Years of private photos and documents are exfiltrated in one sync. Deleting your account afterward doesn't undo the copy the attacker already has — once it's off your device, it's out of your hands permanently.",
    lockedOutConsequence: "The provider's abuse-detection system locks the account entirely rather than risk further exposure — leaving you unable to download or recover a single photo from your own backup.",
  },
  {
    id: 'work',
    label: 'Work Account',
    icon: '💼',
    value: 'medium-high',
    reversible: true,
    startProbability: 11,
    climbRate: 7,
    naturalDefense: 'manager',
    naturalDefenseHint: "IT already enforces rotation on this one, but a password manager buys the extra length Grover's algorithm can't shortcut.",
    lostConsequence: 'The attacker reads internal email and shared drives before IT catches the anomaly and forces a reset. Recoverable on paper, but you spend the next incident review explaining exactly what they had access to and for how long.',
    lockedOutConsequence: "IT suspends the account outright as a containment measure. You're locked out of your own job's systems until a manual security review clears you — which is its own kind of costly.",
  },
  {
    id: 'streaming',
    label: 'Streaming Account',
    icon: '📺',
    value: 'low',
    reversible: true,
    startProbability: 21,
    climbRate: 15,
    naturalDefense: null,
    naturalDefenseHint: 'Lowest stakes on the board — a fine one to consciously let ride if something else needs the attention more.',
    lostConsequence: 'Someone in another country starts watching on your dime and changes the billing email. Cheap to fix and mildly annoying — easily the least of your problems on this board.',
    lockedOutConsequence: "You're locked out of a streaming account. About as low-stakes as a lockout gets — mildly annoying, nothing more.",
  },
];

export const DEFENSES = {
  manager: {
    id: 'manager',
    icon: '🗝️',
    title: 'Password Manager',
    tagline: 'Vaults multiple accounts behind one long master key.',
    mode: 'vault',
    maxTargets: 2,
    minigame: 'reentry',
    failureMode: 'cascade',
    explain:
      "A password manager doesn't just hide a password, it replaces it with a much longer random one — Grover's algorithm only gets a square-root speedup, so a long enough key stays out of reach. Assembling the vault is free and doesn't cost a round; only sealing it does, which is what makes it the one tool that can resolve multiple accounts in a single round. The catch: everything inside falls together if the one master key is compromised.",
  },
  twofa: {
    id: 'twofa',
    icon: '🔐',
    title: '2FA',
    tagline: 'Simple, instant, protects one account.',
    mode: 'single',
    minigame: 'scamCode',
    failureMode: 'handOver',
    maxUses: 2,
    explain:
      "2FA doesn't stop the quantum search — it blocks what the search is worth. Even with the password cracked, the attacker still needs your one-time code. It only ever covers a single account, and a convincing enough scam can still talk you into handing the code over yourself. You only have 2 codes' worth of devices set up for this — spend them on the accounts that need it most.",
  },
  biometric: {
    id: 'biometric',
    icon: '👆',
    title: 'Biometric',
    tagline: 'Instant and strong — but unforgiving if spoofed.',
    mode: 'single',
    minigame: 'deepfakeQte',
    failureMode: 'permanentLockout',
    maxUses: 2,
    explain:
      "There's no password hash here at all for Grover to search, so biometric protection is immediate and total. The tradeoff: it's spoofable with a good enough deepfake, and you can't rotate your own face like a password. Fail this check and the account is gone from both sides, permanently. Only 2 of your accounts have biometric login set up at all — it isn't an option everywhere.",
  },
};
