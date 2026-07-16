import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { askAi } from '../data/aiApi';
import LessonCard from '../components/LessonCard';

const sandboxOptions = [
  {
    title: 'Encryption',
    description: 'Simulate how classical and quantum attackers explore keys.',
    starterPrompt:
      'Explain conceptually how a quantum computer could speed up breaking classical encryption, without giving any hacking steps.',
  },
  {
    title: 'Search',
    description: 'Compare classical and quantum search behavior in a maze.',
    starterPrompt: "Explain how Grover's algorithm searches an unsorted list faster than a classical search.",
  },
  {
    title: 'Optimization',
    description: 'See how quantum-inspired optimization finds better routes.',
    starterPrompt:
      'Explain how quantum-inspired optimization can find better solutions to routing problems than classical methods.',
  },
];

function Sandbox() {
  const { user } = useAuth();
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
    <main className="mx-auto max-w-5xl px-6 py-10">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Quantum Sandbox</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Experiment with the unseen logic of quantum computing</h1>
        <p className="mt-4 text-slate-300">Choose a simulation and explore how quantum behavior changes the way problems are solved.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {sandboxOptions.map((option) =>
            user ? (
              <button
                key={option.title}
                type="button"
                onClick={() => handleAsk(option.starterPrompt)}
                disabled={loading}
                className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 text-left text-slate-200 transition hover:border-cyan-500/50 disabled:opacity-50"
              >
                <h2 className="text-2xl font-semibold text-cyan-300">{option.title}</h2>
                <p className="mt-3 text-slate-400">{option.description}</p>
              </button>
            ) : (
              <div key={option.title} className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 text-slate-200">
                <h2 className="text-2xl font-semibold text-cyan-300">{option.title}</h2>
                <p className="mt-3 text-slate-400">{option.description}</p>
              </div>
            )
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Ask the AI</p>
          <p className="mt-2 text-sm text-slate-400">
            This AI only gives theoretical explanations — it doesn't perform real quantum computation and
            won't provide hacking/attack instructions.
          </p>

          {!user ? (
            <p className="mt-4 text-slate-300">
              <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
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
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="rounded-full bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  {loading ? 'Thinking…' : 'Ask'}
                </button>
              </div>
            </form>
          )}

          {error && <p className="mt-4 text-slate-400">{error}</p>}

          {answer && (
            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
                <p className="whitespace-pre-wrap text-slate-200">{answer}</p>
              </div>

              {relatedLessons.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Related lessons</p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {relatedLessons.map((lesson) => (
                      <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </main>
  );
}

export default Sandbox;
