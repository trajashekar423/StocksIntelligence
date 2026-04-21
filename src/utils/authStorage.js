const KEY = 'authToken';

export const setToken    = (token) => localStorage.setItem(KEY, token);
export const getToken    = ()      => localStorage.getItem(KEY);
export const removeToken = ()      => localStorage.removeItem(KEY);
