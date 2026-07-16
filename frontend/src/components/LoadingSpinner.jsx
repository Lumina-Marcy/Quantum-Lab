import QuantumCore from './QuantumCore';

/** Shared loading indicator — a small pulsing Quantum Core, in place of a generic spinner glyph. */
function LoadingSpinner({ className = 'h-4 w-4' }) {
  return <QuantumCore stage="loading" className={className} particleCount={4} detail="minimal" />;
}

export default LoadingSpinner;
