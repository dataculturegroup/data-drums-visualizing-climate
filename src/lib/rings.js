// Background animation: thick arc rings in the brand colors, echoing the Data Drums logo,
// slowly rotating behind a page. Positions are in cqh like .blob (stage is 177.8cqh wide).
// Each ring: radius and width in a 100×100 box, arcs as [color, start %, end %] of the circle.
const RING_SETS = [
  // Bottom-right corner, turning counterclockwise.
  {
    x: 118, y: 40, d: 120, secs: 110, reverse: true,
    rings: [
      { r: 42, w: 12, arcs: [['green', 0, 30], ['white', 34, 52], ['red', 56, 78], ['darkbrown', 82, 96]] },
      { r: 25, w: 10, arcs: [['red', 5, 25], ['darkbrown', 30, 60], ['green', 65, 90]] },
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
  for (const { x, y, d, secs, reverse, rings } of RING_SETS) {
    const svg = el('svg', { viewBox: '0 0 100 100', class: 'blob rings', 'aria-hidden': 'true' });
    svg.style.cssText = `--x: ${x}; --y: ${y}; --d: ${d}; --secs: ${secs}s`;
    if (reverse) svg.classList.add('rings-reverse');
    for (const { r, w, arcs } of rings) {
      for (const [color, start, end] of arcs) {
        // pathLength 100 makes the dash pattern read as percentages of the circle.
        svg.append(el('circle', {
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
