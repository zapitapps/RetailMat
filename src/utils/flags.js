/**
 * Feature Flags & Demo Mode Control
 * Created during 2026-07-09 refactor
 */

const SHOW_DEMO = process.env.SHOW_DEMO_DATA === 'true' || false;

function isDemoMode() {
  return SHOW_DEMO;
}

function wrapDemo(text) {
  if (isDemoMode()) {
    return `${text}\n\n_⚠️ Demo mode — data is simulated_`;
  }
  return text;
}

module.exports = {
  isDemoMode,
  wrapDemo
};
