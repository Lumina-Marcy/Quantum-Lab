// Single source of truth for mission metadata — shared by the Landing page,
// Mission Hub, and the per-mission onboarding page.
export const MISSIONS = [
  {
    id: '1',
    title: 'Password Vault',
    summary: "A quantum computer is trying to break into your vault. Can today's encryption survive tomorrow's technology?",
    estimatedTime: '5 min',
    difficulty: 'Beginner',
    status: 'available',
    terminalLines: ['Initializing...', 'Encryption Detected...', 'Threat Level: HIGH'],
  },
  {
    id: '2',
    title: 'Maze Search',
    summary: 'Trapped with no map and the clock running. Race to find the way out, and see why quantum search gets there faster.',
    estimatedTime: '5–7 min',
    difficulty: 'Beginner',
    status: 'coming-soon',
    terminalLines: ['Search Space: 1,000,000 Paths', 'Quantum Advantage: Expected'],
  },
  {
    id: '3',
    title: 'Lost Medical Breakthrough',
    summary: 'Somewhere in millions of molecular combinations is a cure. Find it before time runs out.',
    estimatedTime: '6 min',
    difficulty: 'Intermediate',
    status: 'coming-soon',
    terminalLines: ['Searching Molecular Structures...'],
  },
  {
    id: '4',
    title: 'The Supply Chain Crisis',
    summary: 'A global supply chain is collapsing under its own complexity. Reroute it before the crisis spreads.',
    estimatedTime: '6 min',
    difficulty: 'Intermediate',
    status: 'coming-soon',
    terminalLines: ['Optimization Ready'],
  },
  {
    id: '5',
    title: 'Government Files',
    summary: 'Classified files are under attack from a quantum-powered intrusion. Defend what has to stay secret.',
    estimatedTime: '5–6 min',
    difficulty: 'Advanced',
    status: 'coming-soon',
    terminalLines: ['Encryption Audit Pending...'],
  },
];

export const STATUS_LABELS = {
  available: 'Available',
  'coming-soon': 'Coming Soon',
};
