import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-bold text-white tracking-tight">
          Quantum Lab
        </Link>
        <Link to="/resources" className="text-sm text-slate-300 transition hover:text-white">
          Resources
        </Link>
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
