import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, animate, motion } from 'framer-motion';
import ProbabilityParticleField from '../components/ProbabilityParticleField';
import ProbabilityGauge from '../components/ProbabilityGauge';
import StepCard from '../components/StepCard';
import EducationalCard from '../components/EducationalCard';
import InfoSection from '../components/InfoSection';
import ComplexityTable from '../components/ComplexityTable';
import GroverDiagram from '../components/GroverDiagram';
import BlochSphereMini from '../components/BlochSphereMini';
import GlossaryTerm from '../components/GlossaryTerm';
import {
  PROBABILITY_STEPS,
  SEARCH_SPACE_LABEL,
  TOTAL_ITERATIONS,
  GROVER_STEPS,
  GROVER_SECTIONS,
  GROVER_COMPLEXITY,
  GROVER_TAKEAWAY,
  QUBIT_STATES,
  QUBIT_SECTIONS,
  QUBIT_TAKEAWAY,
  PROBABILITY_TAKEAWAY,
  EDUCATIONAL_NOTE,
} from '../data/visualizeData';

const TABS = [
  { id: 'probability', label: 'Probability' },
  { id: 'grover', label: "Grover's Algorithm" },
  { id: 'qubits', label: 'Qubit States' },
];

const FINAL_PROBABILITY = PROBABILITY_STEPS[PROBABILITY_STEPS.length - 1].probability;

// Screen 6 — tabbed, step-through visualization of the intuition behind Grover's Algorithm.
function VisualizeMore() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('probability');
  const [step, setStep] = useState(1);
  const [iterationsDisplay, setIterationsDisplay] = useState(0);

  const current = PROBABILITY_STEPS[step - 1];
  const iterations = Math.round((step / PROBABILITY_STEPS.length) * TOTAL_ITERATIONS);
  const gaugeValue = activeTab === 'probability' ? current.probability : FINAL_PROBABILITY;

  useEffect(() => {
    const controls = animate(iterationsDisplay, iterations, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setIterationsDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iterations]);

  function goToStep(next) {
    setStep(Math.min(PROBABILITY_STEPS.length, Math.max(1, next)));
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">Mission 1 — Password Vault</p>
        <h1 className="mt-3 text-4xl font-bold text-white">Visualize It Even More</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Explore the concepts behind quantum search. This is an educational visualization, not a physics simulator.
        </p>
      </motion.div>

      <div className="relative mt-8 flex justify-center gap-2 border-b border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
          <AnimatePresence mode="wait">
            {activeTab === 'probability' && (
              <motion.div
                key="probability"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-slate-400">
                  Every dot represents a possible password. The <GlossaryTerm id="oracle" /> marks the correct one,
                  and <GlossaryTerm id="amplitude" /> amplification raises its <GlossaryTerm id="probability" />{' '}
                  until <GlossaryTerm id="measurement" /> reveals it.
                </p>

                <div className="mt-4 rounded-xl bg-slate-950/60 p-2">
                  <ProbabilityParticleField step={step} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={step}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 text-center text-base font-medium text-cyan-200"
                  >
                    {current.caption}
                  </motion.p>
                </AnimatePresence>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PROBABILITY_STEPS.map((s) => (
                    <StepCard
                      key={s.id}
                      number={s.id}
                      title={`Step ${s.id}`}
                      description={s.caption}
                      active={step === s.id}
                    />
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => goToStep(step - 1)}
                    disabled={step === 1}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-2">
                    {PROBABILITY_STEPS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goToStep(s.id)}
                        aria-label={`Go to step ${s.id}`}
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${
                          step === s.id ? 'bg-purple-400' : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => goToStep(step + 1)}
                    disabled={step === PROBABILITY_STEPS.length}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>

                <div className="mt-6">
                  <EducationalCard title="💡 What Should I Remember?">
                    <p>{PROBABILITY_TAKEAWAY}</p>
                  </EducationalCard>
                </div>
              </motion.div>
            )}

            {activeTab === 'grover' && (
              <motion.div
                key="grover"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-slate-400">
                  A simplified look at the four stages of a single <GlossaryTerm id="groverIteration" />.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {GROVER_STEPS.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                    >
                      <StepCard number={s.id} title={s.title} description={s.description} />
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <GroverDiagram />
                </div>

                <div className="mt-6 space-y-4">
                  {GROVER_SECTIONS.map((section) => (
                    <InfoSection key={section.id} title={section.title}>
                      <p>{section.body}</p>
                    </InfoSection>
                  ))}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">Example Search Complexity</p>
                  <ComplexityTable classical={GROVER_COMPLEXITY.classical} quantum={GROVER_COMPLEXITY.quantum} />
                </div>

                <div className="mt-6">
                  <EducationalCard title="💡 What Should I Remember?">
                    <p>{GROVER_TAKEAWAY}</p>
                  </EducationalCard>
                </div>
              </motion.div>
            )}

            {activeTab === 'qubits' && (
              <motion.div
                key="qubits"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-slate-400">
                  A <GlossaryTerm id="qubit" /> can represent 0, 1, or a <GlossaryTerm id="superposition" /> of both
                  until it's measured.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {QUBIT_STATES.map((qs, i) => (
                    <motion.div
                      key={qs.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className="rounded-xl border border-slate-700 bg-slate-950/60 p-5 text-center"
                    >
                      <p className="font-mono text-2xl text-cyan-300">{qs.label}</p>
                      <p className="mt-3 text-xs leading-relaxed text-slate-400">{qs.description}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
                  <div className="space-y-4">
                    {QUBIT_SECTIONS.map((section) => (
                      <InfoSection key={section.id} title={section.title}>
                        <p>{section.body}</p>
                      </InfoSection>
                    ))}
                  </div>
                  <div className="flex items-start justify-center rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                    <BlochSphereMini />
                  </div>
                </div>

                <div className="mt-6">
                  <EducationalCard title="💡 What Should I Remember?">
                    <p>{QUBIT_TAKEAWAY}</p>
                  </EducationalCard>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-center shadow-xl">
            <ProbabilityGauge value={gaugeValue} />
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Search Space</span>
              <span className="font-mono text-cyan-200">{SEARCH_SPACE_LABEL}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-400">Iterations</span>
              <span className="font-mono text-cyan-200">{iterationsDisplay.toLocaleString()}</span>
            </div>
          </div>

          <EducationalCard>
            <p>{EDUCATIONAL_NOTE}</p>
          </EducationalCard>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/mission/1/learn-why')}
          className="rounded-full bg-slate-800 px-6 py-3 text-slate-200 transition-colors hover:bg-slate-700"
        >
          ← Previous
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/sandbox')}
          className="rounded-full bg-purple-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-colors hover:bg-purple-400"
        >
          Go To Sandbox
        </motion.button>
      </div>
    </main>
  );
}

export default VisualizeMore;
