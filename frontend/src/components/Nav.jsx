import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { navReadySignal } from '../utils/systemReadySignal';
import { hasCompletedOnboarding } from '../utils/onboardingState';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/missions', label: 'Mission Control' },
  { to: '/sandbox', label: 'Sandbox' },
  { to: '/resources', label: 'Resources' },
];

const SOON_LINKS = ['Resources'];

/**
 * Hidden until the homepage's entry gate resolves — the nav appearing is part of "Quantum Lab
 * has come online," not a fixture that was there the whole time. Scoped to `/` only: every other
 * route's Nav is unaffected. Keys off `navReadySignal` specifically (not `systemReadySignal`,
 * which stays scoped to the New User boot sequence) — this fires for BOTH entry paths, so a
 * returning user mid-login (or one who never submits) still gets Nav rather than being stuck.
 * Also falls back to `hasCompletedOnboarding()` (sessionStorage) so a hard refresh doesn't hide
 * Nav again for someone who already completed onboarding earlier this session — `navReadySignal`
 * alone is in-memory and wouldn't survive that, but the session flag does.
 */
function useNavReady() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(pathname !== '/' || navReadySignal.get() >= 1 || hasCompletedOnboarding());

  useEffect(() => {
    if (pathname !== '/') {
      setReady(true);
      return undefined;
    }
    return navReadySignal.on('change', (value) => {
      if (value >= 1) setReady(true);
    });
  }, [pathname]);

  return ready;
}

/**
 * Transparent at the top of the page, gradually becoming a blurred, darker glass surface with a
 * subtle border as the user scrolls — driven by a motion value's `style`, not React state, so it
 * costs nothing per scroll frame. Window-level `useScroll()` (no `target`), the same no-target
 * idiom `AnimatedBackground.jsx` already uses, so this behaves correctly on every route.
 */
function useGlassOnScroll() {
  const { scrollY } = useScroll();
  return useTransform(scrollY, [0, 80], [0, 1]);
}

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ready = useNavReady();
  const glassOpacity = useGlassOnScroll();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!ready) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-40"
    >
      {/* A separate layer for the glass surface, so `backdrop-blur` genuinely reads as absent at
          the top of the page (no faint blur nobody asked for) and fades in independently of the
          nav's own one-time entrance animation above. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 border-b border-white/10 bg-quantum-navy/80 backdrop-blur-md"
        style={{ opacity: glassOpacity }}
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4 px-6 py-4">
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
                Hi, <span className="font-semibold text-white">{user.username}</span>
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
      </div>
    </motion.nav>
  );
}

export default Nav;
