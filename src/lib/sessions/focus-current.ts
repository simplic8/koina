/** Scroll to and focus the Current sessions block on /sessions. */
export function focusCurrentSessions() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("jv:expand-current-sessions"));
  }
  const el = document.getElementById("current-sessions");
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.focus({ preventScroll: true });
  return true;
}
