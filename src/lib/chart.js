import * as d3 from 'd3';
import { color, grey } from './theme.js';

// Emissions line chart with a dotted guide at each track year. The current year's guide is light
// brown, with its emissions at the top. opts.connectTo: an element (the highway's year) that a
// dotted line runs to from above the emissions: up, then right to the panel's edge, level with
// that element's connector (see .highway-year in common.css).
export function createChart(container, data, trackYears, { connectTo } = {}) {
  const svg = d3.select(container).append('svg');
  let currentYear = trackYears[0];

  function render() {
    const { width, height } = container.getBoundingClientRect();
    const fs = Math.min(width / 30, height / 32); // font size scales with the panel
    const ink = getComputedStyle(container).color; // the axis follows the panel's text color
    const hi = color('lightbrown'); // the current year's guide, label and connector
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Above the plot: the emissions, with the connector rising from just above them.
    const gtSize = fs * 1.6;
    const gap = fs * 0.5;
    const m = {
      top: gap + gtSize + gap * 2,
      right: fs * 2, bottom: fs * 2.2, left: fs * 2, // room for the end tick labels
    };

    const x = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([m.left, width - m.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.gt)]).nice()
      .range([height - m.bottom, m.top]);

    svg.append('g')
      .attr('transform', `translate(0,${height - m.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
    svg.selectAll('.domain, .tick line').attr('stroke', ink);
    // Lets the axis title under the chart line up with the first tick label ("1880").
    const firstTick = svg.select('.tick text').node();
    container.parentElement.style.setProperty('--axis-start', `${firstTick.getBBox().x + x.range()[0]}px`);

    // Track-year guides: faded grey, except the current one in light brown and thicker.
    svg.append('g').selectAll('line').data(trackYears).join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d))
      .attr('y1', m.top).attr('y2', height - m.bottom)
      .attr('stroke', (d) => (d === currentYear ? hi : grey('light')))
      .attr('stroke-width', (d) => (d === currentYear ? 2 : 1)).attr('stroke-dasharray', '3 4');

    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.gt));
    const past = data.filter((d) => d.year <= currentYear);

    // Whole series in dark brown, with everything up to the current year drawn over it in red.
    svg.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', color('darkbrown')).attr('stroke-width', 3).attr('d', line);
    svg.append('path').datum(past)
      .attr('fill', 'none').attr('stroke', color('red')).attr('stroke-width', 7).attr('d', line);

    const cur = data.find((d) => d.year === currentYear);
    if (!cur) return;
    const cx = x(cur.year);
    svg.append('circle')
      .attr('cx', cx).attr('cy', y(cur.gt)).attr('r', fs * 0.6)
      .attr('fill', color('red')).attr('stroke', color('black')).attr('stroke-width', fs * 0.15);

    // Emissions at the top of the guide (nudged in from the chart edges).
    const gtBase = m.top - gap;
    const label = svg.append('text')
      .attr('y', gtBase).attr('text-anchor', 'middle')
      .style('font-size', `${gtSize}px`).style('font-weight', 700).style('fill', hi)
      .text(`${cur.gt.toFixed(1)} Gt`);
    const half = label.node().getComputedTextLength() / 2;
    label.attr('x', Math.max(half, Math.min(width - half, cx)));

    if (connectTo) {
      // Up from the emissions, then right to the panel's edge, level with the year's own
      // connector (its middle, less 1cqh because Teko digits sit high in the line).
      const box = container.getBoundingClientRect();
      const target = connectTo.getBoundingClientRect();
      const cqh = container.closest('.stage').getBoundingClientRect().height / 100;
      const ly = target.top + target.height / 2 - cqh - box.top;
      const lx = container.parentElement.getBoundingClientRect().right - box.left;
      svg.append('path')
        .attr('d', `M${cx},${gtBase - gtSize - gap}V${ly}H${lx}`)
        .attr('fill', 'none').attr('stroke', hi).attr('stroke-width', 2).attr('stroke-dasharray', '3 4');
    }
  }

  new ResizeObserver(render).observe(container);

  return {
    update(year) {
      currentYear = year;
      render();
    },
  };
}
