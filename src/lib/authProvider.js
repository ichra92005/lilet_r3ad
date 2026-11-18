import { isSupabaseConfigured, requireSupabase } from "./supabaseClient.js";

const _state = {
  user: null,
  initialized: false,
};

const _listeners = new Set();
let _subscription = null;

function _notify() {
  for (const listener of _listeners) listener({ ..._state });
}

function _setUser(user) {
  _state.user = user;
  _state.initialized = true;
  _notify();
}

export async function initializeAuth() {
  if (!isSupabaseConfigured) {
    _state.initialized = true;
    _notify();
    return null;
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  _subscription?.unsubscribe();
  const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
    _setUser(session?.user || null);
  });
  _subscription = authListener.subscription;

  _setUser(data.session?.user || null);
  return _state.user;
}

export function getAuthState() {
  return { ..._state };
}

export function getCurrentUser() {
  return _state.user;
}

export function onAuthChange(callback) {
  _listeners.add(callback);
  callback({ ..._state });
  return () => _listeners.delete(callback);
}

export async function signIn(email, password) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  _setUser(data.user);
}

export async function signUp(email, password) {
  const { data, error } = await requireSupabase().auth.signUp({ email, password });
  if (error) throw error;
  if (data.session) _setUser(data.user);
  return { needsEmailConfirmation: !data.session };
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
  _setUser(null);
}
