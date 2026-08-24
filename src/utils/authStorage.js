const KEY      = 'authToken';
const USER_KEY = 'authUser';

const isBrowser = typeof window !== 'undefined';

export const setToken    = (token) => { if (isBrowser) localStorage.setItem(KEY, token); };
export const getToken    = ()      => { if (isBrowser) return localStorage.getItem(KEY); return null; };
export const removeToken = ()      => { if (isBrowser) localStorage.removeItem(KEY); };

export const setUser     = (user)  => { if (isBrowser) localStorage.setItem(USER_KEY, JSON.stringify(user)); };
export const getUser     = ()      => {
  if (!isBrowser) return null;
  try {
    const item = localStorage.getItem(USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};
export const removeUser  = ()      => { if (isBrowser) localStorage.removeItem(USER_KEY); };
