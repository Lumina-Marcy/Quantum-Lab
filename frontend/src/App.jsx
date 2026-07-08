import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MissionProvider } from './context/MissionContext';
import Nav from './components/Nav';
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

function App() {
  return (
    <AuthProvider>
      <MissionProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100">
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
