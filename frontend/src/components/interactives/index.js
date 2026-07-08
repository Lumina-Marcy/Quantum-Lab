import BlochSphere from './BlochSphere';
import GroversAlgorithm from './GroversAlgorithm';
import WaveSuperposition from './WaveSuperposition';

const interactives = {
  'bloch-sphere': BlochSphere,
  grovers: GroversAlgorithm,
  'wave-superposition': WaveSuperposition,
};

export function getInteractive(key) {
  return interactives[key];
}
