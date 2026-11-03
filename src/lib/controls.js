// Shared stage controls: Space start/stop, ←/→ tracks, ↑/↓ tempo, 1–9 jump, M mute.
const DEFAULT_BPM = 90;
const MIN_BPM = 40;
const MAX_BPM = 160;

// opts.onPastEnd: called when → is pressed on the last track (e.g. leave the page).
// opts.bpm: starting tempo for this page.
export function bindControls(engine, tracks, { onPastEnd, bpm: startBpm = DEFAULT_BPM } = {}) {
  const $ = (id) => document.getElementById(id);
  const overlay = $('overlay');
  let bpm = startBpm;

  function setBpm(next) {
    bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, next));
    engine.setBpm(bpm);
  }
  setBpm(bpm);

  async function togglePlay() {
    overlay.hidden = true;
    if (engine.state.playing) engine.stop();
    else await engine.start();
  }
  overlay.addEventListener('click', togglePlay);

  // The key hints start hidden behind a small (?) button in the bottom-right corner.
  const help = document.querySelector('.help');
  if (help) {
    help.hidden = true;
    const button = document.createElement('button');
    button.className = 'help-toggle';
    button.textContent = '?';
    button.setAttribute('aria-label', 'Show keyboard controls');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
      help.hidden = !help.hidden;
      button.setAttribute('aria-expanded', String(!help.hidden));
    });
    help.after(button);
  }

  function step(d) {
    const next = engine.pendingTrack() + d;
    if (next >= tracks.length && onPastEnd) {
      engine.stop();
      onPastEnd();
      return;
    }
    engine.setTrack(Math.max(0, Math.min(tracks.length - 1, next)));
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (e.repeat && k === ' ') return;
    if (k === ' ') togglePlay();
    else if (k === 'ArrowRight') step(1);
    else if (k === 'ArrowLeft') step(-1);
    else if (k === 'ArrowUp') setBpm(bpm + 5);
    else if (k === 'ArrowDown') setBpm(bpm - 5);
    else if (k === 'm' || k === 'M') engine.toggleMute();
    else if (k >= '1' && k <= String(Math.min(9, tracks.length))) engine.setTrack(+k - 1);
    else return;
    e.preventDefault();
  }, { capture: true });
}
