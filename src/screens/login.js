/**
 * src/screens/login.js
 * Login / Sign‑up screen (public route #/login).
 * Supports username or email authentication, Google OAuth, and guest mode fallback.
 */

import { el, append } from '../utils/dom.js';
import { navigate } from '../app/router.js';
import { signIn, signUp, signInWithGoogle, enterGuestMode, onAuthChange } from '../lib/authProvider.js';
import { createModal } from '../components/modal.js';

export function renderLogin(container) {
  container.className = 'screen login-screen';

  // ── Blurred background image matching landing & dashboard ──
  const bgDiv = el('div', { cls: 'landing-bg', attrs: { 'aria-hidden': 'true' } });
  const bgImg = el('img', {
    cls: 'landing-bg-img',
    attrs: { src: '/assets/___3__26dcc747.jpeg', alt: '' },
  });
  bgImg.onerror = () => { bgImg.style.display = 'none'; };
  const bgOverlay = el('div', { cls: 'landing-bg-overlay' });
  append(bgDiv, bgImg, bgOverlay);
  container.appendChild(bgDiv);

  const wrapper = el('div', { cls: 'login-wrapper', attrs: { role: 'region', 'aria-label': 'Authentication' } });

  // Header with back link and brand
  const header = el('div', { cls: 'login-header' });
  const backLink = el('a', {
    cls: 'login-back btn btn-ghost btn-sm',
    text: '← Back to Home',
    attrs: { href: '#/', 'aria-label': 'Back to landing page' },
  });
  const brandImg = el('img', {
    cls: 'login-brand-img',
    attrs: { src: '/assets/p2logo3_ba527f4c.png', alt: 'Lilet_r3ad logo' },
  });
  append(header, backLink, brandImg);

  // Title that switches based on mode
  const title = el('h1', { cls: 'login-title', text: 'Welcome back' });
  const subtitle = el('p', { cls: 'login-subtitle text-muted', text: 'Sign in to access your saved courses and progress.' });

  // Form elements
  const form = el('form', { cls: 'login-form', attrs: { novalidate: true } });

  const usernameInput = el('input', {
    cls: 'input login-input',
    attrs: { type: 'text', placeholder: 'Username or email', required: true, autocomplete: 'username' },
  });

  const pwdWrap = el('div', { cls: 'login-pwd-wrap' });
  const passwordInput = el('input', {
    cls: 'input login-input',
    attrs: { type: 'password', placeholder: 'Password', required: true, autocomplete: 'current-password', style: 'flex:1;' },
  });
  const togglePwdBtn = el('button', {
    cls: 'btn btn-ghost btn-sm login-toggle-pwd',
    text: 'Show',
    attrs: { type: 'button', 'aria-label': 'Toggle password visibility' },
  });

  togglePwdBtn.addEventListener('click', () => {
    const hidden = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', hidden ? 'text' : 'password');
    togglePwdBtn.textContent = hidden ? 'Hide' : 'Show';
  });
  append(pwdWrap, passwordInput, togglePwdBtn);

  const submitBtn = el('button', {
    cls: 'btn btn-primary login-submit-btn',
    text: 'Sign in',
    attrs: { type: 'submit', disabled: true },
  });

  const errorMsg = el('div', { cls: 'login-error', attrs: { role: 'alert' } });

  // Switch link for sign‑up
  const switchLink = el('button', {
    cls: 'login-switch btn btn-ghost btn-sm',
    text: "Don't have an account? Create one",
    attrs: { type: 'button', 'aria-label': 'Switch to sign‑up form' },
  });

  // Helper to toggle mode (sign‑in / sign‑up)
  let mode = 'signIn'; // or 'signUp'
  const updateMode = () => {
    if (mode === 'signIn') {
      title.textContent = 'Welcome back';
      subtitle.textContent = 'Sign in to access your saved courses and progress.';
      submitBtn.textContent = 'Sign in';
      switchLink.textContent = "Don't have an account? Create one";
    } else {
      title.textContent = 'Create your account';
      subtitle.textContent = 'Start organizing your courses and study materials.';
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
    const uname = usernameInput.value.trim();
    const pwd = passwordInput.value;
    if (!uname || !pwd) return;

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'signIn' ? 'Signing in…' : 'Creating…';
    errorMsg.textContent = '';

    try {
      if (mode === 'signIn') {
        await signIn(uname, pwd);
        navigate('/dashboard');
      } else {
        if (pwd.length < 8) throw new Error('PasswordTooShort');
        await signUp(uname, pwd);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      let msg = 'Something went wrong. Try again.';
      const errMsg = err?.message || '';
      if (errMsg.includes('Invalid login credentials')) msg = 'Wrong username or password.';
      else if (errMsg.includes('User already registered')) msg = 'That username is already taken. Try another.';
      else if (errMsg.includes('email not confirmed')) msg = 'Sign in is not set up yet. Turn off Confirm email in Supabase.';
      else if (errMsg.includes('Database error saving new user')) msg = "We couldn't create your profile. Try again in a moment.";
      else if (errMsg === 'PasswordTooShort') msg = 'Password must be at least 8 characters.';
      else if (errMsg) msg = errMsg;
      errorMsg.textContent = msg;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'signIn' ? 'Sign in' : 'Create account';
    }
  });

  // Google sign‑in button
  const googleBtn = el('button', {
    cls: 'btn btn-outline login-google-btn',
    attrs: { type: 'button', 'aria-label': 'Sign in with Google' },
  });
  googleBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right:8px;vertical-align:middle;">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
    <span>Continue with Google</span>
  `;
  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign‑in error:', err);
      createModal(document.body, {
        title: 'Google sign‑in failed',
        body: el('p', { text: 'Could not complete Google sign‑in. Please try again or continue as guest.' }),
        footerButtons: [],
      });
    }
  });

  // Guest mode button
  const guestBtn = el('button', {
    cls: 'btn btn-ghost login-guest-btn',
    text: 'Continue as Guest (No account needed) →',
    attrs: { type: 'button', 'aria-label': 'Continue as guest' },
  });
  guestBtn.addEventListener('click', () => {
    enterGuestMode();
    navigate('/dashboard');
  });

  // Assemble form
  append(form, usernameInput, pwdWrap, submitBtn, errorMsg, switchLink);

  // Divider
  const divider = el('div', { cls: 'or-divider', text: 'or' });

  // Assemble wrapper
  append(wrapper, header, title, subtitle, form, divider, googleBtn, guestBtn);
  container.appendChild(wrapper);

  // If the user becomes authenticated while on this page, navigate to dashboard.
  const unsubscribe = onAuthChange((state) => {
    if (state.status === 'user' || state.status === 'guest') {
      unsubscribe();
      navigate('/dashboard');
    }
  });
}
