import { API_BASE_URL } from '../apiBase';

const API = `${API_BASE_URL}/api/missions`;

export async function fetchMissions() {
  const res = await fetch(API);
  if (!res.ok) throw new Error('Failed to load missions');
  return res.json();
}

export async function fetchMissionById(id) {
  const res = await fetch(`${API}/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load mission');
  return res.json();
}
