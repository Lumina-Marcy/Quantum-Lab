import { API_BASE_URL } from '../apiBase';
import { authFetch } from '../authFetch';

const API = `${API_BASE_URL}/api/ai`;

export async function askAi(prompt) {
  const res = await authFetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    let message = 'Failed to get an answer from the AI';
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore parse failure, use default message
    }
    throw new Error(message);
  }

  return res.json();
}
