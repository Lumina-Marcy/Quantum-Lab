import { Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MissionProvider } from './context/MissionContext';
import Nav from './components/Nav';
import SpaceBackdrop from './components/SpaceBackdrop';
import Landing from './pages/Landing';
import MissionHub from './pages/MissionHub';
import Login from './pages/Login';
import Register from './pages/Register';
import Mission from './pages/Mission';
import PasswordMission from './pages/PasswordMission';
import LearnWhy from './pages/LearnWhy';
import VisualizeMore from './pages/VisualizeMore';
import Sandbox from './pages/Sandbox';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Every route gets the shared space backdrop for a cohesive feel, except the two that already
// mount their own: the homepage (Landing.jsx's AnimatedBackground is a richer, scroll-driven
// version of the same idea) and Sandbox (mounts the same shared SpaceBackdrop itself, since its
// layout needs it inside its own scrollable container rather than as a global sibling).
const ROUTES_WITH_OWN_BACKDROP = ['/', '/sandbox'];

function App() {
  const { pathname } = useLocation();

  return (
    <AuthProvider>
      <MissionProvider>
        {/* `relative isolate` matters here, not just decoration: a plain div with only a
            background-color doesn't establish its own stacking context, so a `fixed -z-10` child
            (SpaceBackdrop) ends up comparing against the ROOT stacking context instead of this
            div's — in practice that let the div's own `bg-quantum-navy` paint in front of the
            backdrop on routes like /missions, showing solid black instead of the space scene.
            `isolate` forces this div to be the stacking-context boundary, exactly matching the
            pattern Landing.jsx/Sandbox.jsx already use for their own backdrops. */}
        <div className="relative isolate min-h-screen bg-quantum-navy text-slate-100">
          {!ROUTES_WITH_OWN_BACKDROP.includes(pathname) && <SpaceBackdrop />}
          <Nav />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/missions" element={<MissionHub />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mission/:id" element={<Mission />} />
            <Route path="/mission/1/play" element={<PasswordMission />} />
            <Route path="/mission/1/learn-why" element={<LearnWhy />} />
            <Route path="/mission/1/visualize" element={<VisualizeMore />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </MissionProvider>
    </AuthProvider>
  );
}

export default App;
