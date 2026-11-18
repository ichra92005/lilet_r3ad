// Helper utilities for the auth provider and other modules.
// Currently only provides toInternalEmail, which normalizes an email address.
// This function is imported in src/screens/login.js but not used; we provide a simple implementation.
export function toInternalEmail(email) {
  // Ensure the email is a string and convert to lowercase.
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}
