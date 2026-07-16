import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API = '/api/auth';

function daysUntilUsernameChange(username_changed_at) {
  if (!username_changed_at) return 0;
  const changed = new Date(username_changed_at);
  const unlockDate = new Date(changed.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diff = Math.ceil((unlockDate - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6">
      <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-40';

export default function Settings() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [messages, setMessages] = useState({ username: '', password: '', email: '', delete: '' });
  const [loading, setLoading] = useState({ username: false, password: false, email: false, delete: false });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setUsername(data.username);
        setEmail(data.email);
      });
  }, []);

  const setMsg = (key, text) => setMessages(m => ({ ...m, [key]: text }));
  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const patch = async (key, body) => {
    setMsg(key, '');
    setLoad(key, true);
    try {
      const res = await fetch(`${API}/account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(key, data.detail || 'Something went wrong'); return; }
      setProfile(data);
      login({ user_id: data.user_id, first_name: data.first_name, last_name: data.last_name, username: data.username, email: data.email }, token);
      setMsg(key, 'success');
    } catch {
      setMsg(key, 'Could not reach the server');
    } finally {
      setLoad(key, false);
    }
  };

  const handleDeleteAccount = async () => {
    setMsg('delete', '');
    setLoad('delete', true);
    try {
      const res = await fetch(`${API}/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setMsg('delete', 'Failed to delete account'); return; }
      logout();
      navigate('/');
    } catch {
      setMsg('delete', 'Could not reach the server');
    } finally {
      setLoad('delete', false);
    }
  };

  const daysLeft = profile ? daysUntilUsernameChange(profile.username_changed_at) : 0;
  const usernameLocked = daysLeft > 0;

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-3xl font-bold text-white"
      >
        Account settings
      </motion.h1>

      <div className="space-y-6">

        {/* Username */}
        <Section title="Change username">
          {usernameLocked && (
            <p className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-300">
              You can change your username again in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.
            </p>
          )}
          <Field label="New username">
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={usernameLocked}
              className={inputClass}
            />
          </Field>
          {messages.username && messages.username !== 'success' && (
            <p className="mt-2 text-sm text-red-400">{messages.username}</p>
          )}
          {messages.username === 'success' && (
            <p className="mt-2 text-sm text-green-400">Username updated.</p>
          )}
          <button
            onClick={() => patch('username', { username })}
            disabled={usernameLocked || loading.username}
            className="mt-4 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
          >
            {loading.username && <LoadingSpinner />}
            {loading.username ? 'Saving…' : 'Save username'}
          </button>
        </Section>

        {/* Password */}
        <Section title="Change password">
          <Field label="New password">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="at least 8 characters"
              className={inputClass}
            />
          </Field>
          {messages.password && messages.password !== 'success' && (
            <p className="mt-2 text-sm text-red-400">{messages.password}</p>
          )}
          {messages.password === 'success' && (
            <p className="mt-2 text-sm text-green-400">Password updated.</p>
          )}
          <button
            onClick={() => { patch('password', { password }); setPassword(''); }}
            disabled={loading.password}
            className="mt-4 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
          >
            {loading.password && <LoadingSpinner />}
            {loading.password ? 'Saving…' : 'Save password'}
          </button>
        </Section>

        {/* Email */}
        <Section title="Change email">
          <Field label="New email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          {messages.email && messages.email !== 'success' && (
            <p className="mt-2 text-sm text-red-400">{messages.email}</p>
          )}
          {messages.email === 'success' && (
            <p className="mt-2 text-sm text-green-400">Email updated.</p>
          )}
          <button
            onClick={() => patch('email', { email })}
            disabled={loading.email}
            className="mt-4 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
          >
            {loading.email && <LoadingSpinner />}
            {loading.email ? 'Saving…' : 'Save email'}
          </button>
        </Section>

        {/* Delete account */}
        <Section title="Delete account">
          <p className="mb-4 text-sm text-slate-400">
            This permanently deletes your account and all your data. This cannot be undone.
          </p>
          {messages.delete && (
            <p className="mb-3 text-sm text-red-400">{messages.delete}</p>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded-full border border-red-500/50 px-5 py-2 text-sm font-semibold text-red-400 transition hover:border-red-400 hover:text-red-300"
            >
              Delete my account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={loading.delete}
                className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {loading.delete && <LoadingSpinner />}
                {loading.delete ? 'Deleting…' : 'Yes, delete it'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
        </Section>

      </div>
    </main>
  );
}
