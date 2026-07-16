import AmbientParticles from './AmbientParticles';

/**
 * The shared "deep space" ambient backdrop for every page except the homepage — Landing.jsx has
 * its own richer, scroll-driven AnimatedBackground (a whole awakening narrative tied to its
 * specific content), which doesn't apply anywhere else. This is the lightweight version: soft
 * glow blobs + drifting particles, no scroll-tied logic, no Core — just enough atmosphere that
 * every other page (Mission Hub, Sandbox, Login, Register, Settings, etc.) still feels like part
 * of the same place instead of a plain dark rectangle. Originally lived inline in Sandbox.jsx;
 * extracted here once it needed to be shared app-wide rather than duplicated per page.
 */
function SpaceBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-quantum-navy">
      <div className="absolute -left-1/4 -top-1/4 h-[55vw] w-[55vw] rounded-full bg-blue-600/15 blur-3xl" />
      <div className="absolute -right-1/4 top-1/3 h-[50vw] w-[50vw] rounded-full bg-violet-600/12 blur-3xl" />
      <AmbientParticles />
    </div>
  );
}

export default SpaceBackdrop;
