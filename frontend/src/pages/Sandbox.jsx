import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Panel from '../components/Panel';
import Button from '../components/Button';
import SandboxCore from '../components/SandboxCore';
import SpaceBackdrop from '../components/SpaceBackdrop';
import { useAuth } from '../context/AuthContext';
import { askAi } from '../data/aiApi';
import LessonCard from '../components/LessonCard';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 7.5C10 11 8 14 12 15.5s3 2.5 5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const SIMULATIONS = [
  {
    key: 'encryption',
    icon: LockIcon,
    title: 'Encryption',
    copy: 'Watch a quantum attacker explore keys that would take classical computers millennia.',
    starterPrompt:
      'Explain conceptually how a quantum computer could speed up breaking classical encryption, without giving any hacking steps.',
  },
  {
    key: 'search',
    icon: SearchIcon,
    title: 'Search',
    copy: 'Compare classical and quantum search racing through the same maze of possibilities.',
    starterPrompt: "Explain how Grover's algorithm searches an unsorted list faster than a classical search.",
  },
  {
    key: 'optimization',
    icon: RouteIcon,
    title: 'Optimization',
    copy: 'See quantum-inspired optimization untangle a route problem in real time.',
    starterPrompt:
      'Explain how quantum-inspired optimization can find better solutions to routing problems than classical methods.',
  },
];

function Sandbox() {
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [relatedLessons, setRelatedLessons] = useState([]);

  async function handleAsk(promptText) {
    const value = (promptText ?? prompt).trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setRelatedLessons([]);
    try {
      const data = await askAi(value);
      setPrompt(value);
      setAnswer(data.answer);
      setRelatedLessons(data.relatedLessons ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate mx-auto max-w-5xl px-6 py-16">
      <SpaceBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-quantum-cyan/80">Quantum Sandbox</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
          Experiment with the unseen logic of quantum computing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Choose a simulation below, or ask the AI your own question, to explore how quantum behavior
          changes the way complex problems are solved.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
        className="my-16 flex justify-center"
      >
        <SandboxCore boosted={hoveredCard} />
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-3">
        {SIMULATIONS.map(({ key, icon: Icon, title, copy, starterPrompt }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 * i, ease: 'easeOut' }}
            onHoverStart={() => setHoveredCard(true)}
            onHoverEnd={() => setHoveredCard(false)}
            whileHover={{ y: -4 }}
          >
            <Panel
              as={user ? 'button' : 'div'}
              type={user ? 'button' : undefined}
              onClick={user ? () => handleAsk(starterPrompt) : undefined}
              disabled={user ? loading : undefined}
              className={`h-full w-full p-6 text-left transition-colors duration-300 hover:border-quantum-cyan/40 ${
                user ? 'disabled:opacity-50' : ''
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-quantum-cyan/30 bg-quantum-cyan/10">
                <Icon />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      <Panel className="mt-10 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-quantum-cyan/80">Ask the AI</p>
        <p className="mt-2 text-sm text-slate-400">
          This AI only gives theoretical explanations — it doesn't perform real quantum computation and
          won't provide hacking/attack instructions.
        </p>

        {!user ? (
          <p className="mt-4 text-slate-300">
            <Link to="/login" className="text-quantum-cyan hover:text-cyan-300">
              Sign in
            </Link>{' '}
            to ask the AI your own quantum computing question.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="mt-4"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder="Ask about a quantum computing concept, e.g. 'How does superposition help quantum search?'"
              className="w-full rounded-2xl border border-slate-700 bg-quantum-panel/80 p-4 text-slate-100 placeholder:text-slate-500 focus:border-quantum-cyan focus:outline-none"
            />
            <div className="mt-3 flex justify-end">
              <Button type="submit" disabled={loading || !prompt.trim()}>
                {loading ? 'Thinking…' : 'Ask'}
              </Button>
            </div>
          </form>
        )}

        {error && <p className="mt-4 text-slate-400">{error}</p>}

        {answer && (
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-slate-700 bg-quantum-panel/80 p-6">
              <p className="whitespace-pre-wrap text-slate-200">{answer}</p>
            </div>

            {relatedLessons.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-quantum-cyan/80">Related lessons</p>
                <div className="grid gap-6 lg:grid-cols-2">
                  {relatedLessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </main>
  );
}

export default Sandbox;
