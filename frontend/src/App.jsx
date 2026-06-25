import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Mission from './pages/Mission';
import Sandbox from './pages/Sandbox';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mission/:id" element={<Mission />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
