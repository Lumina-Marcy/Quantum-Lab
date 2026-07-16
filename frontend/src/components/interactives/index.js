import BlochSphere from './BlochSphere';
import GroversAlgorithm from './GroversAlgorithm';
import WaveSuperposition from './WaveSuperposition';
import QuantumGates from './QuantumGates';
import Entanglement from './Entanglement';
import Interference from './Interference';

const interactives = {
  'bloch-sphere': BlochSphere,
  grovers: GroversAlgorithm,
  'wave-superposition': WaveSuperposition,
  'quantum-gates': QuantumGates,
  entanglement: Entanglement,
  interference: Interference,
};

export function getInteractive(key) {
  return interactives[key];
}
