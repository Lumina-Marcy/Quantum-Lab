import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_BASE_URL } from '../apiBase';
import { authFetch } from '../authFetch';

const API = `${API_BASE_URL}/api/auth`;

const REMEMBER_ME_OPTIONS = [
  { value: '1_day', label: '1 day' },
  { value: '1_week', label: '1 week' },
  { value: '1_month', label: '1 month' },
];

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

function CurrentPasswordField({ value, onChange }) {
  return (
    <Field label="Current password">
      <input
        type="password"
        value={value}
        onChange={onChange}
        placeholder="Confirm with your current password"
        className={inputClass}
      />
    </Field>
  );
}

export default function Settings() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState('1_day');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [currentPasswordUsername, setCurrentPasswordUsername] = useState('');
  const [currentPasswordPassword, setCurrentPasswordPassword] = useState('');
  const [currentPasswordEmail, setCurrentPasswordEmail] = useState('');
  const [currentPasswordDelete, setCurrentPasswordDelete] = useState('');

  const [messages, setMessages] = useState({ username: '', password: '', email: '', rememberMe: '', delete: '' });
  const [loading, setLoading] = useState({ username: false, password: false, email: false, rememberMe: false, delete: false });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authFetch(`${API}/me`)
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setUsername(data.username);
        setEmail(data.email);
        setRememberMe(data.remember_me);
      });
  }, []);

  const setMsg = (key, text) => setMessages(m => ({ ...m, [key]: text }));
  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const patch = async (key, body) => {
    setMsg(key, '');
    setLoad(key, true);
    try {
      const res = await authFetch(`${API}/account`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(key, data.detail || 'Something went wrong'); return; }
      setProfile(data);
      login({ user_id: data.user_id, first_name: data.first_name, last_name: data.last_name, username: data.username, email: data.email }, data.token);
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
      const res = await authFetch(`${API}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPasswordDelete }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg('delete', data.detail || 'Failed to delete account');
        return;
      }
      logout();
      navigate('/');
    } catch {
      setMsg('delete', 'Could not reach the server');
    } finally {
      setLoad('delete', false);
      setCurrentPasswordDelete('');
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
          <div className="mt-4">
            <CurrentPasswordField
              value={currentPasswordUsername}
              onChange={e => setCurrentPasswordUsername(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              patch('username', { username, current_password: currentPasswordUsername });
              setCurrentPasswordUsername('');
            }}
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
          <div className="mt-4">
            <CurrentPasswordField
              value={currentPasswordPassword}
              onChange={e => setCurrentPasswordPassword(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              patch('password', { password, current_password: currentPasswordPassword });
              setPassword('');
              setCurrentPasswordPassword('');
            }}
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
          <div className="mt-4">
            <CurrentPasswordField
              value={currentPasswordEmail}
              onChange={e => setCurrentPasswordEmail(e.target.value)}
            />
          </div>
          <button
            onClick={() => {
              patch('email', { email, current_password: currentPasswordEmail });
              setCurrentPasswordEmail('');
            }}
            disabled={loading.email}
            className="mt-4 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
          >
            {loading.email && <LoadingSpinner />}
            {loading.email ? 'Saving…' : 'Save email'}
          </button>
        </Section>

        {/* Session duration */}
        <Section title="Stay signed in">
          <Field label="Keep me logged in for">
            <select
              value={rememberMe}
              onChange={e => setRememberMe(e.target.value)}
              className={inputClass}
            >
              {REMEMBER_ME_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
          <p className="mt-2 text-xs text-slate-500">
            Applies immediately to this session, and to future logins.
          </p>
          {messages.rememberMe && messages.rememberMe !== 'success' && (
            <p className="mt-2 text-sm text-red-400">{messages.rememberMe}</p>
          )}
          {messages.rememberMe === 'success' && (
            <p className="mt-2 text-sm text-green-400">Session duration updated.</p>
          )}
          <button
            onClick={() => patch('rememberMe', { remember_me: rememberMe })}
            disabled={loading.rememberMe}
            className="mt-4 rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
          >
            {loading.rememberMe ? 'Saving…' : 'Save session duration'}
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
            <div className="space-y-4">
              <CurrentPasswordField
                value={currentPasswordDelete}
                onChange={e => setCurrentPasswordDelete(e.target.value)}
              />
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
                onClick={() => { setConfirmDelete(false); setCurrentPasswordDelete(''); }}
                className="text-sm text-slate-400 hover:text-slate-300"
              >
                Cancel
              </button>
              </div>
            </div>
          )}
        </Section>

      </div>
    </main>
  );
}
