import * as d3 from 'd3';
import { color, grey } from './theme.js';

// Emissions line chart with a dotted guide at each track year. The current year's guide is light
// brown, with the year at its top, its emissions above that, then a short dotted line up to the
// year's note.
export function createChart(container, data, trackYears) {
  const svg = d3.select(container).append('svg');
  const note = d3.select(container).append('p').attr('class', 'chart-note');
  let currentYear = trackYears[0];

  function render() {
    const { width, height } = container.getBoundingClientRect();
    const fs = Math.min(width / 60, height / 32); // font size scales with the panel
    const ink = getComputedStyle(container).color; // the axis follows the panel's text color
    const hi = color('lightbrown'); // the current year's guide, labels and line so far
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    // Above the plot, top to bottom: room for three lines of note, a short dotted line, the
    // emissions, the year.
    const noteH = 3 * parseFloat(getComputedStyle(note.node()).lineHeight);
    const stem = fs * 2.5;
    const labelSize = fs * 2;
    const gtSize = fs * 1.3;
    const gap = fs * 0.5;
    const m = {
      top: noteH + gap + stem + gap + gtSize + gap + labelSize + gap,
      right: fs * 1.5, bottom: fs * 2.5, left: fs * 1.5,
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

    // Track-year guides: faded grey, except the current one in light brown and thicker.
    svg.append('g').selectAll('line').data(trackYears).join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d))
      .attr('y1', m.top).attr('y2', height - m.bottom)
      .attr('stroke', (d) => (d === currentYear ? hi : grey('light')))
      .attr('stroke-width', (d) => (d === currentYear ? 2 : 1)).attr('stroke-dasharray', '3 4');

    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.gt));
    const past = data.filter((d) => d.year <= currentYear);

    // Whole series in dark brown, with everything up to the current year drawn over it in light brown.
    svg.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', color('darkbrown')).attr('stroke-width', 3).attr('d', line);
    svg.append('path').datum(past)
      .attr('fill', 'none').attr('stroke', hi).attr('stroke-width', 7).attr('d', line);

    const cur = data.find((d) => d.year === currentYear);
    if (!cur) return;
    const cx = x(cur.year);
    svg.append('circle')
      .attr('cx', cx).attr('cy', y(cur.gt)).attr('r', fs * 0.6)
      .attr('fill', color('red')).attr('stroke', color('black')).attr('stroke-width', fs * 0.15);

    // Year at the top of its guide with its emissions above (both nudged in from the chart
    // edges), then a short dotted line up to the note.
    const yearBase = m.top - gap;
    const gtBase = yearBase - labelSize - gap;
    const labels = [[cur.year, yearBase, labelSize, 800], [`${cur.gt.toFixed(1)} Gt`, gtBase, gtSize, 600]];
    for (const [text, base, size, weight] of labels) {
      const label = svg.append('text')
        .attr('y', base).attr('text-anchor', 'middle')
        .style('font-size', `${size}px`).style('font-weight', weight).style('fill', hi)
        .text(text);
      const half = label.node().getComputedTextLength() / 2;
      label.attr('x', Math.max(half, Math.min(width - half, cx)));
    }
    svg.append('line')
      .attr('x1', cx).attr('x2', cx).attr('y1', noteH + gap).attr('y2', gtBase - gtSize - gap)
      .attr('stroke', hi).attr('stroke-width', 2).attr('stroke-dasharray', '3 4');

    // Note sits centered over the guide, kept inside the chart (aligned to the edge it hits).
    const noteW = Math.min(width * 0.45, width);
    const left = Math.max(0, Math.min(width - noteW, cx - noteW / 2));
    note
      .style('left', `${left}px`).style('width', `${noteW}px`).style('height', `${noteH}px`)
      .style('text-align', left === 0 ? 'left' : left === width - noteW ? 'right' : 'center');
  }

  new ResizeObserver(render).observe(container);

  return {
    update(year, text) {
      currentYear = year;
      note.text(text);
      render();
    },
  };
}
