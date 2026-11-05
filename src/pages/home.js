import { addRings } from '../lib/rings.js';
import { NEXT_KEYS } from '../lib/controls.js';

addRings(document.querySelector('.stage.home'));

// Any "next" key (→, a clicker's forward button, ...) goes on to the warm up.
window.addEventListener('keydown', (e) => {
  if (!NEXT_KEYS.has(e.key)) return;
  e.preventDefault();
  location.assign('./tutorial/');
});
