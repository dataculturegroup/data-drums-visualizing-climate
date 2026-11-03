// Background animation: thick arc rings in the brand colors, echoing the Data Drums logo,
// slowly rotating behind a page. Positions are in cqh like .blob (stage is 177.8cqh wide).
// Each ring: radius and width in a 100×100 box, seconds per turn, arcs as [color, start %, end %].
const RING_SETS = [
  // Bottom-right corner, turning counterclockwise.
  {
    x: 118, y: 40, d: 120, reverse: true,
    rings: [
      { r: 42, w: 12, secs: 62, arcs: [['green', 0, 30], ['white', 34, 52], ['red', 56, 78], ['darkbrown', 82, 96]] },
      { r: 25, w: 10, secs: 110, arcs: [['red', 5, 25], ['darkbrown', 30, 60], ['green', 65, 90]] },
    ],
  },
];

const SVG_NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

// Adds the rings to `container` (the home stage, or a page's start overlay), behind its content.
export function addRings(container) {
  for (const { x, y, d, reverse, rings } of RING_SETS) {
    const svg = el('svg', { viewBox: '0 0 100 100', class: 'blob rings', 'aria-hidden': 'true' });
    svg.style.cssText = `--x: ${x}; --y: ${y}; --d: ${d}`;
    if (reverse) svg.classList.add('rings-reverse');
    for (const { r, w, secs, arcs } of rings) {
      // A random negative delay starts each ring at a different point in its turn on every load.
      const ring = el('g', { style: `--secs: ${secs}s; animation-delay: ${-Math.random() * secs}s` });
      svg.append(ring);
      for (const [color, start, end] of arcs) {
        // pathLength 100 makes the dash pattern read as percentages of the circle.
        ring.append(el('circle', {
          cx: 50, cy: 50, r, fill: 'none', 'stroke-width': w, pathLength: 100,
          'stroke-dasharray': `${end - start} ${100 - (end - start)}`,
          'stroke-dashoffset': -start,
          style: `stroke: var(--color-${color})`,
        }));
      }
    }
    container.prepend(svg); // behind everything else
  }
}
