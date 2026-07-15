// Single source of truth for mission metadata — shared by the Landing page,
// Mission Hub, and the per-mission onboarding page.
export const MISSIONS = [
  {
    id: '1',
    title: 'Password Vault',
    summary: 'Learn how encryption works and why quantum computing challenges current security systems.',
    estimatedTime: '5 min',
    difficulty: 'Beginner',
    status: 'available',
  },
  {
    id: '2',
    title: 'Maze Search',
    summary: 'Navigate a maze using both classical and quantum search strategies.',
    estimatedTime: '5–7 min',
    difficulty: 'Beginner',
    status: 'coming-soon',
  },
  {
    id: '3',
    title: 'Lost Medical Breakthrough',
    summary: 'Search millions of molecular combinations to find a life-saving treatment.',
    estimatedTime: '6 min',
    difficulty: 'Intermediate',
    status: 'coming-soon',
  },
  {
    id: '4',
    title: 'The Supply Chain Crisis',
    summary: 'Optimize routes and deliveries through a complex logistics network.',
    estimatedTime: '6 min',
    difficulty: 'Intermediate',
    status: 'coming-soon',
  },
  {
    id: '5',
    title: 'Government Files',
    summary: 'Protect sensitive data from a quantum-powered intrusion attempt.',
    estimatedTime: '5–6 min',
    difficulty: 'Advanced',
    status: 'coming-soon',
  },
];

export const STATUS_LABELS = {
  available: 'Available',
  'coming-soon': 'Coming Soon',
};
