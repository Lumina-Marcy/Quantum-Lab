import MissionCard from './MissionCard';
import { MISSIONS } from '../data/missions';

/** Maps the shared mission list to MissionCards — reused by the Landing preview and the Mission Hub. */
function MissionGrid() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {MISSIONS.map((mission, i) => (
        <MissionCard key={mission.id} mission={mission} index={i} />
      ))}
    </div>
  );
}

export default MissionGrid;
