import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const missionData = {
  1: {
    title: 'Password Vault',
    summary: 'Learn how encryption works and why quantum computing challenges current security systems.',
  },
  2: {
    title: 'Find the Exit',
    summary: 'Navigate a maze using both classical and quantum search strategies.',
  },
  3: {
    title: 'Lost Medical Breakthrough',
    summary: 'Search millions of molecular combinations to find a life-saving treatment.',
  },
  4: {
    title: 'The Supply Chain Crisis',
    summary: 'Optimize routes and deliveries through a complex logistics network.',
  },
};

function UserDataForm({ profile, setProfile }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setProfile({ username: form.username, email: form.email, passwordLength: form.password.length });
  }

  function handleReset() {
    setProfile(null);
    setForm({ username: '', email: '', password: '' });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20"
    >
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Your Data</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">What's at Stake</h2>
      <p className="mt-2 text-slate-400">
        Enter sample personal information below. This data will be used throughout the mission to make the cybersecurity risks feel real and personal.
      </p>

      {!user ? (
        <div className="mt-6 rounded-2xl bg-slate-950/70 p-5">
          <p className="text-sm text-slate-400">
            Please{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
              log in
            </Link>{' '}
            to continue this mission.
          </p>
        </div>
      ) : profile ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-slate-950/70 p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Username</span>
              <span className="font-mono text-cyan-300">{profile.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Email</span>
              <span className="font-mono text-cyan-300">{profile.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Password</span>
              <span className="font-mono text-cyan-300">{'•'.repeat(profile.passwordLength)}</span>
            </div>
          </div>
          <p className="text-xs text-emerald-400/80">Data saved to the vault. Ready to start.</p>
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 underline hover:text-slate-300"
          >
            Change data
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. agent_42"
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. you@example.com"
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Choose a sample password"
              className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-4 py-3 text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!form.username || !form.email || !form.password}
            className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
          >
            Lock In My Data
          </button>
        </form>
      )}
    </motion.div>
  );
}

function Mission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mission = missionData[id] || missionData[1];
  const isPasswordMission = id === '1';

  const [profile, setProfile] = useState(null);

  function handleStart() {
    if (isPasswordMission) {
      navigate('/mission/1/play', { state: profile });
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <UserDataForm profile={profile} setProfile={setProfile} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Mission {id}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{mission.title}</h1>
        <p className="mt-4 text-slate-300">{mission.summary}</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">1-Minute Interactive Experience</h2>
            <p className="mt-2 text-slate-300">Play through a scenario and make decisions that shape the outcome.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">Decision Point</h2>
            <p className="mt-2 text-slate-300">Choose strategies, then see consequences unfold in real time.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">How Did The Computer Think?</h2>
            <p className="mt-2 text-slate-300">Compare classical and quantum explanations side by side.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/" className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
            Back to Home
          </Link>

          {isPasswordMission ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleStart}
                disabled={!profile}
                className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Mission
              </button>
              {!profile && (
                <p className="text-sm text-slate-500">Fill in your data above to begin.</p>
              )}
            </div>
          ) : (
            <button className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
              Start Mission
            </button>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default Mission;
