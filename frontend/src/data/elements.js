// Shared element metadata for the Lost Medical Breakthrough mission — used by both the atom-catching
// mechanic (MoleculeMission.jsx) and the molecule bond-graph renderer (MoleculeDiagram.jsx) so their
// element colors always agree.
export const ELEMENT_KEYS = ['c', 'h', 'n', 'o'];

export const ELEMENT_META = {
  c: { symbol: 'C', name: 'Carbon', color: '#94a3b8' },
  h: { symbol: 'H', name: 'Hydrogen', color: '#60a5fa' },
  n: { symbol: 'N', name: 'Nitrogen', color: '#34d399' },
  o: { symbol: 'O', name: 'Oxygen', color: '#f87171' },
};
