import { navigate } from "../app/router.js";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";
import { signIn, signUp } from "../lib/authProvider.js";
import { el, append } from "../utils/dom.js";

export function renderLogin(container) {
  container.className = "screen account-screen";

  const card = el("section", { cls: "account-card", attrs: { "aria-labelledby": "account-title" } });
  const home = el("a", { cls: "account-home", text: "← Lilet Raad", attrs: { href: "#/" } });
  const title = el("h1", { attrs: { id: "account-title" }, text: "Your study space" });
  const description = el("p", { text: "Sign in or create an account to keep your books synced across devices." });
  const form = el("form", { cls: "account-form" });
  const emailLabel = el("label", { text: "Email address" });
  const email = el("input", { attrs: { type: "email", required: "", autocomplete: "email", placeholder: "you@example.com" } });
  emailLabel.appendChild(email);
  const passwordLabel = el("label", { text: "Password" });
  const password = el("input", { attrs: { type: "password", required: "", minlength: "6", autocomplete: "current-password" } });
  passwordLabel.appendChild(password);
  const message = el("p", { cls: "account-message", attrs: { role: "status", "aria-live": "polite" } });
  const submit = el("button", { cls: "account-submit", text: "Sign in", attrs: { type: "submit" } });
  const toggle = el("button", { cls: "account-toggle", text: "Need an account? Create one", attrs: { type: "button" } });
  let creating = false;

  if (!isSupabaseConfigured) {
    message.textContent = "Account service is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the deployment environment.";
    message.classList.add("account-message--error");
    submit.disabled = true;
    toggle.disabled = true;
  }

  toggle.addEventListener("click", () => {
    creating = !creating;
    submit.textContent = creating ? "Create account" : "Sign in";
    password.autocomplete = creating ? "new-password" : "current-password";
    toggle.textContent = creating ? "Already have an account? Sign in" : "Need an account? Create one";
    message.textContent = "";
    message.classList.remove("account-message--error");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) return;
    submit.disabled = true;
    message.textContent = creating ? "Creating account…" : "Signing in…";
    message.classList.remove("account-message--error");
    try {
      if (creating) {
        const result = await signUp(email.value.trim(), password.value);
        if (result.needsEmailConfirmation) {
          message.textContent = "Check your email to confirm your account, then sign in.";
          return;
        }
      } else {
        await signIn(email.value.trim(), password.value);
      }
      navigate("/dashboard");
    } catch (error) {
      message.textContent = error.message || "Account request failed. Please try again.";
      message.classList.add("account-message--error");
    } finally {
      submit.disabled = false;
    }
  });

  append(form, emailLabel, passwordLabel, message, submit, toggle);
  append(card, home, title, description, form);
  container.replaceChildren(card);
}
