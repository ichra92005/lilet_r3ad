const KEY = "lilet_r3ad_doc";

export function saveDoc(doc) {
  try {
    localStorage.setItem(KEY, JSON.stringify(doc));
    return true;
  } catch (err) {
    console.error("Save failed:", err);
    return false;
  }
}

export function loadDoc() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDoc() {
  localStorage.removeItem(KEY);
}