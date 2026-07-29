import { useEffect } from 'react';
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
import MoleculeMission from './pages/MoleculeMission';
import SupplyChainMission from './pages/SupplyChainMission';
import GovernmentFilesMission from './pages/GovernmentFilesMission';
import LearnWhy from './pages/LearnWhy';
import VisualizeMore from './pages/VisualizeMore';
import MazeMission from './pages/MazeMission';
import Sandbox from './pages/Sandbox';
import Settings from './pages/Settings';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import NotFound from './pages/NotFound';

// Every route gets the shared space backdrop for a cohesive feel, except the two that already
// mount their own: the homepage (Landing.jsx's AnimatedBackground is a richer, scroll-driven
// version of the same idea) and Sandbox (mounts the same shared SpaceBackdrop itself, since its
// layout needs it inside its own scrollable container rather than as a global sibling).
const ROUTES_WITH_OWN_BACKDROP = ['/', '/sandbox'];

function App() {
  const { pathname } = useLocation();

  // React Router doesn't reset scroll position on navigation by default (unlike a full page
  // load) — without this, going from partway down a long page (e.g. Resources) straight into a
  // new route leaves the new page scrolled to that same spot instead of starting at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
            <Route path="/mission/1/play" element={<MoleculeMission />} />
            <Route path="/mission/2/play" element={<MazeMission />} />
            <Route path="/mission/3/play" element={<PasswordMission />} />
            <Route path="/mission/3/learn-why" element={<LearnWhy />} />
            <Route path="/mission/3/visualize" element={<VisualizeMore />} />
            <Route path="/mission/4/play" element={<SupplyChainMission />} />
            <Route path="/mission/5/play" element={<GovernmentFilesMission />} />
            <Route path="/sandbox" element={<Sandbox />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </MissionProvider>
    </AuthProvider>
  );
}

export default App;
