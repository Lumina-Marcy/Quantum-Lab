import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Nav from './components/Nav';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Mission from './pages/Mission';
import PasswordMission from './pages/PasswordMission';
import Sandbox from './pages/Sandbox';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mission/:id" element={<Mission />} />
        <Route path="/mission/1/play" element={<PasswordMission />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/mission/:id" element={<Mission />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
