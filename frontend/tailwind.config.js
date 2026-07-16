export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        quantum: {
          navy: '#050816', // primary background — rich midnight navy
          surface: '#101827', // secondary surface — deep slate
          panel: '#0d1020', // legacy panel tone — kept for spots still referencing it directly
          cyan: '#3b82f6', // primary accent — electric blue, interactive elements only (token name kept for compatibility)
          violet: '#8b5cf6', // secondary accent — quantum violet, discovery moments only, minority usage
          emerald: '#34d399', // success — soft emerald
          amber: '#f59e0b', // warning
          crimson: '#b91c1c', // error / danger — reserved for breach moments only
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(59, 130, 246, 0.3)',
        'glow-violet': '0 0 30px rgba(139, 92, 246, 0.25)',
        // A distinctly brighter hover-only step (not just swapping between two similarly-subtle
        // resting glows) — this is what makes button hover actually read as "the button lit up"
        // rather than a barely-perceptible color shift.
        'glow-cyan-lg': '0 0 45px rgba(59, 130, 246, 0.5)',
      },
      backgroundImage: {
        // Blue-dominant — blue is the primary/interactive color, violet only a subtle starting hint.
        'quantum-gradient': 'linear-gradient(135deg, #6366f1 0%, #3b82f6 55%, #60a5fa 100%)',
      },
    },
  },
  plugins: [],
};
