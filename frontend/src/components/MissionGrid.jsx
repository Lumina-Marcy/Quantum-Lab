import { useEffect, useState } from 'react';
import MissionCard from './MissionCard';
import { fetchMissions } from '../data/missionsApi';

/** Maps the shared mission list to MissionCards — reused by the Landing preview and the Mission Hub. */
function MissionGrid() {
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMissions()
      .then(setMissions)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-center text-slate-400">Couldn't load missions. Is the backend running?</p>;
  if (!missions) return <p className="text-center text-slate-400">Loading…</p>;

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {missions.map((mission, i) => (
        <MissionCard key={mission.id} mission={mission} index={i} />
      ))}
    </div>
  );
}

export default MissionGrid;
