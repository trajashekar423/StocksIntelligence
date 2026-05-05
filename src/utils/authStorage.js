const KEY      = 'authToken';
const USER_KEY = 'authUser';

export const setToken    = (token) => localStorage.setItem(KEY, token);
export const getToken    = ()      => localStorage.getItem(KEY);
export const removeToken = ()      => localStorage.removeItem(KEY);

export const setUser     = (user)  => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const getUser     = ()      => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const removeUser  = ()      => localStorage.removeItem(USER_KEY);
