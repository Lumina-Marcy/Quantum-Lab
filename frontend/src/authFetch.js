const SESSION_EXPIRED_KEY = 'sessionExpiredMessage';

export function markSessionExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.setItem(SESSION_EXPIRED_KEY, 'Your session expired — please log in again.');
}

export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    markSessionExpired();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return res;
}

export function consumeSessionExpiredMessage() {
  const message = sessionStorage.getItem(SESSION_EXPIRED_KEY);
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return message;
}
