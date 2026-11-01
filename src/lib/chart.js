import * as d3 from 'd3';
import { color, grey } from './theme.js';

export function createChart(container, data, trackYears) {
  const svg = d3.select(container).append('svg');
  let currentYear = trackYears[0];

  function render() {
    const { width, height } = container.getBoundingClientRect();
    const fs = Math.min(width / 60, height / 32); // font size scales with the panel
    const m = { top: fs, right: fs * 1.5, bottom: fs * 2.5, left: fs * 3.5 };
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d.year))
      .range([m.left, width - m.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, (d) => d.gt)]).nice()
      .range([height - m.bottom, m.top]);

    svg.append('g')
      .attr('transform', `translate(0,${height - m.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8));
    svg.append('g')
      .attr('transform', `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(6));
    svg.selectAll('.domain, .tick line').attr('stroke', grey('mid'));

    // Track-year guides.
    svg.append('g').selectAll('line').data(trackYears).join('line')
      .attr('x1', (d) => x(d)).attr('x2', (d) => x(d))
      .attr('y1', m.top).attr('y2', height - m.bottom)
      .attr('stroke', grey('mid')).attr('stroke-dasharray', '3 4');

    const line = d3.line().x((d) => x(d.year)).y((d) => y(d.gt));
    const past = data.filter((d) => d.year <= currentYear);

    svg.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', grey('light')).attr('stroke-width', 2).attr('d', line);
    svg.append('path').datum(past)
      .attr('fill', 'none').attr('stroke', color('green')).attr('stroke-width', 4).attr('d', line);

    const cur = data.find((d) => d.year === currentYear);
    if (cur) {
      svg.append('circle')
        .attr('cx', x(cur.year)).attr('cy', y(cur.gt)).attr('r', fs * 0.6)
        .attr('fill', color('red')).attr('stroke', color('black')).attr('stroke-width', fs * 0.15);
      svg.append('text')
        .attr('x', x(cur.year)).attr('y', y(cur.gt) - fs * 1.2)
        .attr('text-anchor', x(cur.year) < width * 0.2 ? 'start' : x(cur.year) > width * 0.8 ? 'end' : 'middle')
        .style('font-size', `${fs * 1.6}px`).style('fill', color('black')).style('font-weight', 800)
        .text(`${cur.year}: ${cur.gt.toFixed(1)} Gt`);
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
