// Disease-focus themes for the Lost Medical Breakthrough mission. Every field stays within the
// same C/H/N/O element set and 0-49-per-element range used everywhere else in that mission, so the
// "6,250,000 possible arrangements" framing never changes — only which formula counts as the target,
// its name, and the flavor text vary between playthroughs.
export const DISEASE_FOCI = [
  {
    id: 'antiviral',
    disease: 'a fast-spreading respiratory virus',
    compoundPrefix: 'QL',
    briefingLines: [
      'a fast-spreading respiratory virus with no effective treatment on file',
      'nitrogen-rich compounds that can bind to the viral receptor site',
    ],
  },
  {
    id: 'antimicrobial',
    disease: 'a drug-resistant bacterial infection',
    compoundPrefix: 'MR',
    briefingLines: [
      'a bacterial strain that has developed resistance to every antibiotic on file',
      'oxygen-rich compounds capable of disrupting the bacterial cell wall',
    ],
  },
  {
    id: 'oncology',
    disease: 'an aggressive, fast-dividing tumor line',
    compoundPrefix: 'ON',
    briefingLines: [
      'a tumor line that divides faster than current chemotherapy can suppress',
      'carbon-backbone compounds that can selectively target dividing cells',
    ],
  },
  {
    id: 'neuro',
    disease: 'a degenerative neurological condition',
    compoundPrefix: 'NX',
    briefingLines: [
      'a degenerative condition with no approved treatment that crosses the blood-brain barrier',
      'small, nitrogen-balanced compounds light enough to reach neural tissue',
    ],
  },
  {
    id: 'autoimmune',
    disease: 'an aggressive autoimmune disorder',
    compoundPrefix: 'AI',
    briefingLines: [
      'an autoimmune disorder causing the body to attack its own healthy tissue',
      'compounds that can selectively calm an overactive immune response',
    ],
  },
  {
    id: 'metabolic',
    disease: 'a rare inherited metabolic disorder',
    compoundPrefix: 'MB',
    briefingLines: [
      'a rare metabolic disorder affecting how the body processes essential nutrients',
      'compounds that can safely correct the underlying enzymatic imbalance',
    ],
  },
];

export function pickRandomFocus() {
  return DISEASE_FOCI[Math.floor(Math.random() * DISEASE_FOCI.length)];
}

// Kept within a "plausible small molecule" range (rather than the full 0-49 span used for the
// search-space-size framing) so the rendered molecule diagram stays a sane number of nodes.
export function randomTargetFormula() {
  return {
    c: 8 + Math.floor(Math.random() * 17), // 8-24
    h: 10 + Math.floor(Math.random() * 21), // 10-30
    n: 1 + Math.floor(Math.random() * 6), // 1-6
    o: 1 + Math.floor(Math.random() * 8), // 1-8
  };
}

export function randomTargetScore() {
  return 0.93 + Math.random() * 0.05;
}

export function randomTargetName(focus) {
  const num = 10 + Math.floor(Math.random() * 90);
  return `Compound ${focus.compoundPrefix}-${num}`;
}
