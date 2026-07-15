import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/missions', label: 'Missions' },
  { to: '/sandbox', label: 'Sandbox' },
  { to: '/resources', label: 'Resources' },
];

const SOON_LINKS = ['Learn', 'About'];

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
      <Link to="/" className="text-lg font-bold tracking-tight text-white">
        ⚛ Quantum Lab
      </Link>

      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `rounded-full px-3 py-1.5 text-sm transition ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
        {SOON_LINKS.map((label) => (
          <span
            key={label}
            aria-disabled="true"
            title="Coming soon"
            className="cursor-not-allowed rounded-full px-3 py-1.5 text-sm text-slate-600"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-slate-300">
              Hi, <span className="font-semibold text-cyan-400">{user.username}</span>
            </span>
            <Link
              to="/settings"
              className="rounded-full border border-slate-600 px-4 py-1.5 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-600 px-4 py-1.5 text-sm text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Create account
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Nav;
