/**
 * src/lib/authProvider.js
 * Simple auth provider that tracks Supabase session and guest mode.
 * Exposes status ("loading"|"user"|"guest"|"none"), user, profile and helper actions.
 */

import { supabase } from './supabaseClient.js';
import { onChange as onStateChange, setRoute } from '../app/state.js';

const _state = {
  status: 'loading', // loading until we check session
  user: null,
  profile: null, // { username, display_name }
};

const _listeners = new Set();

function _notify() {
  for (const cb of _listeners) cb({ ..._state });
}

// Helper to fetch profile from the "profiles" table.
async function _loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('username, display_name').eq('id', userId).single();
  if (error) console.error('Failed to load profile', error);
  return data || null;
}

// Init – check existing session and guest flag
export async function initAuth() {
  // Check Supabase session first
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const profile = await _loadProfile(session.user.id);
    _state.status = 'user';
    _state.user = session.user;
    _state.profile = profile;
    _notify();
    return;
  }
  // No Supabase session – check guest flag
  if (sessionStorage.getItem('guest') === '1') {
    _state.status = 'guest';
    _state.user = null;
    _state.profile = null;
    _notify();
    return;
  }
  // No auth at all
  _state.status = 'none';
  _notify();
}

// Listen to Supabase auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    const profile = await _loadProfile(session.user.id);
    _state.status = 'user';
    _state.user = session.user;
    _state.profile = profile;
    // Clean guest flag if it existed
    sessionStorage.removeItem('guest');
  } else {
    // Signed out
    if (sessionStorage.getItem('guest') === '1') {
      _state.status = 'guest';
      _state.user = null;
      _state.profile = null;
    } else {
      _state.status = 'none';
      _state.user = null;
      _state.profile = null;
    }
  }
  _notify();
});

export function onAuthChange(cb) {
  _listeners.add(cb);
  // Immediate call with current state
  cb({ ..._state });
  return () => _listeners.delete(cb);
}

export function getAuthState() {
  return { ..._state };
}


export async function signIn(username, password) {
  const email = `${username.toLowerCase()}@lilet-r3ad.app`;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(username, password) {
  const email = `${username.toLowerCase()}@lilet-r3ad.app`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function enterGuestMode() {
  sessionStorage.setItem('guest', '1');
  _state.status = 'guest';
  _state.user = null;
  _state.profile = null;
  _notify();
}

export function exitGuestMode() {
  sessionStorage.removeItem('guest');
  // also clear all guest storage keys (prefixed with "guest_")
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith('guest_')) sessionStorage.removeItem(key);
  }
  _state.status = 'none';
  _notify();
}

