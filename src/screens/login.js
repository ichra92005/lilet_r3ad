/**
 * src/screens/login.js
 * Login / Sign‑up screen (public route #/login).
 * Uses the existing design system – outlined cards, 3px outlines, rounded corners, Fredoka headings.
 */

import { el, append, empty } from '../utils/dom.js';
import { navigate } from '../app/router.js';
import { signIn, signUp, signInWithGoogle, getAuthState, onAuthChange } from '../lib/authProvider.js';
import { toInternalEmail } from '../lib/helpers.js';
import { createModal } from '../components/modal.js';

export function renderLogin(container) {
  container.className = 'screen login-screen';

  const wrapper = el('div', { cls: 'login-wrapper', attrs: { role: 'region', 'aria-label': 'Authentication' } });

  // Header with back link
  const header = el('div', { cls: 'login-header' });
  const backLink = el('a', {
    cls: 'login-back btn btn-ghost btn-sm',
    text: '← Back',
    attrs: { href: '#/', 'aria-label': 'Back to landing page' },
  });
  header.appendChild(backLink);

  // Title that switches based on mode
  const title = el('h1', { cls: 'login-title', text: 'Sign in' });

  // Form elements
  const form = el('form', { cls: 'login-form', attrs: { novalidate: true } });

  const usernameInput = el('input', {
    cls: 'input',
    attrs: { type: 'text', placeholder: 'Username', required: true, autocomplete: 'username' },
  });
  const passwordInput = el('input', {
    cls: 'input',
    attrs: { type: 'password', placeholder: 'Password', required: true, autocomplete: 'current-password' },
  });
  const togglePwdBtn = el('button', {
    cls: 'btn btn-ghost btn-sm',
    text: 'Show',
    attrs: { type: 'button', 'aria-label': 'Toggle password visibility' },
  });

  togglePwdBtn.addEventListener('click', () => {
    const hidden = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', hidden ? 'text' : 'password');
    togglePwdBtn.textContent = hidden ? 'Hide' : 'Show';
  });

  const submitBtn = el('button', {
    cls: 'btn btn-primary',
    text: 'Sign in',
    attrs: { type: 'submit', disabled: true },
  });

  const errorMsg = el('div', { cls: 'login-error', attrs: { role: 'alert' } });

  // Switch link for sign‑up
  const switchLink = el('a', {
    cls: 'login-switch btn btn-link',
    text: 'No account yet? Create one',
    attrs: { href: '#', 'aria-label': 'Switch to sign‑up form' },
  });

  // Helper to toggle mode (sign‑in / sign‑up)
  let mode = 'signIn'; // or 'signUp'
  const updateMode = () => {
    if (mode === 'signIn') {
      title.textContent = 'Sign in';
      submitBtn.textContent = 'Sign in';
      switchLink.textContent = 'No account yet? Create one';
    } else {
      title.textContent = 'Create profile';
      submitBtn.textContent = 'Create account';
      switchLink.textContent = 'Already have an account? Sign in';
    }
    errorMsg.textContent = '';
    passwordInput.value = '';
    usernameInput.value = '';
    submitBtn.disabled = true;
  };

  switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    mode = mode === 'signIn' ? 'signUp' : 'signIn';
    updateMode();
  });

  // Enable submit when fields are non‑empty
  const checkValidity = () => {
    const ok = usernameInput.value.trim() && passwordInput.value.trim();
    submitBtn.disabled = !ok;
  };
  usernameInput.addEventListener('input', checkValidity);
  passwordInput.addEventListener('input', checkValidity);

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'signIn' ? 'Signing in…' : 'Creating…';
    errorMsg.textContent = '';
    try {
      if (mode === 'signIn') {
        await signIn(usernameInput.value.trim(), passwordInput.value);
      } else {
        // Sign‑up validation
        const pwd = passwordInput.value;
        if (pwd.length < 8) throw new Error('PasswordTooShort');
        await signUp(usernameInput.value.trim(), pwd);
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Map errors to user‑friendly messages
      let msg = 'Something went wrong. Try again.';
      if (err.message.includes('Invalid login credentials')) msg = 'Wrong username or password.';
      else if (err.message.includes('User already registered')) msg = 'That username is already taken. Try another.';
      else if (err.message.includes('email not confirmed')) msg = 'Sign in is not set up yet. Turn off Confirm email in Supabase.';
      else if (err.message.includes('Database error saving new user')) msg = "We couldn't create your profile. Try again in a moment.";
      else if (err.message === 'PasswordTooShort') msg = 'Password must be at least 8 characters.';
      errorMsg.textContent = msg;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'signIn' ? 'Sign in' : 'Create account';
    }
  });

  // Google sign‑in button
  const googleBtn = el('button', {
    cls: 'btn btn-outline',
    text: 'Continue with Google',
    attrs: { type: 'button', 'aria-label': 'Sign in with Google' },
  });
  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign‑in error:', err);
      const modal = createModal(document.body, {
        title: 'Google sign‑in failed',
        body: el('p', { text: 'Could not complete Google sign‑in. Please try again later.' }),
        footerButtons: [],
      });
    }
  });

  // Assemble form
  append(form, usernameInput, passwordInput, togglePwdBtn, submitBtn, errorMsg, switchLink);

  // Divider + Google
  const divider = el('div', { cls: 'or-divider', text: 'or' });

  // Assemble wrapper
  append(wrapper, header, title, form, divider, googleBtn);
  container.appendChild(wrapper);

  // If the user becomes authenticated while on this page, navigate to dashboard.
  const unsubscribe = onAuthChange((state) => {
    if (state.status === 'user' || state.status === 'guest') {
      unsubscribe();
      navigate('/dashboard');
    }
  });
}
