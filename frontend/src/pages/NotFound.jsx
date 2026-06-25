function NotFound() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-center text-slate-200">
      <h1 className="text-5xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg">Page not found. Return to the home mission control.</p>
      <a href="/" className="mt-8 inline-block rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
        Back Home
      </a>
    </main>
  );
}

export default NotFound;
