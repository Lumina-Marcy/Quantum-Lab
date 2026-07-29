// Mission metadata itself now lives in the `missions` DB table (fetched via missionsApi.js) — this
// file is just the small UI label lookup that isn't part of that data.
export const STATUS_LABELS = {
  available: 'Available',
  'coming-soon': 'Coming Soon',
};
