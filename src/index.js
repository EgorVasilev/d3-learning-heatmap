'use strict';
import {
    select,
    scaleLinear,
    scaleSequential,
    interpolateRdYlBu,
    axisBottom,
    axisLeft,
    min,
    max,
    range,
} from 'd3';

/* check #plot aspect-ratio in CSS as well if you want to change it */
const plotWidth = 1000;
const plotHeight = 500;
const plotPadding = 60;
const plotBottomPadding = 100;

function fetchHeatData() {
    return fetch(
        'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
    ).then((response) => response.json());
}

function setPlotSize() {
    select('#plot').attr('viewBox', `0 0 ${plotWidth} ${plotHeight}`);
}

function handleMouseOver(event, { year, month, variance }, base) {
    const offset = 10;

    select('.tooltip')
        .html(
            `<span>${year} - ${new Date(2000, month, 1).toLocaleString(
                'default',
                {
                    month: 'long',
                }
            )}</span>
            <span>${(base + variance).toFixed(1)}&#8451;</span>`
        )
        .style('top', `${event.clientY + offset}px`)
        .style('left', `${event.clientX + offset}px`)
        .attr('data-year', year)
        .classed('hidden', false);
}

function handleMouseOut() {
    select('.tooltip').classed('hidden', true);
}

function getXScale(data) {
    return scaleLinear()
        .domain([data[0].year, data[data.length - 1].year + 1])
        .range([plotPadding, plotWidth - plotPadding]);
}

function getYScale() {
    return scaleLinear()
        .domain([1, 13])
        .range([plotPadding, plotHeight - plotBottomPadding]);
}

function getColorScale(data) {
    const minDelta = min(data, (data) => data.variance);
    const maxDelta = max(data, (data) => data.variance);

    return scaleSequential(interpolateRdYlBu).domain([maxDelta, minDelta]);
}

function renderXAxis(xScale) {
    const xAxis = axisBottom(xScale).tickFormat((year) => year);

    select('#plot')
        .append('g')
        .attr('id', 'x-axis')
        .attr('transform', `translate(0, ${plotHeight - plotBottomPadding})`)
        .call(xAxis);
}

function renderYAxis() {
    const yAxisScale = scaleLinear()
        .domain([-0.5, 11.5])
        .range([0, plotHeight - plotPadding - plotBottomPadding]);
    const yAxis = axisLeft(yAxisScale).tickFormat((month) =>
        new Date(2000, month, 1).toLocaleString('default', { month: 'long' })
    );
    select('#plot')
        .append('g')
        .attr('id', 'y-axis')
        .attr('transform', `translate(${plotPadding}, ${plotPadding})`)
        .call(yAxis);
}

function renderHeatMap({ baseTemperature: base, monthlyVariance: data }) {
    const cellHeight = (plotHeight - plotPadding - plotBottomPadding) / 12; // 12 is months count
    const xScale = getXScale(data);
    const yScale = getYScale(data);
    const colorScale = getColorScale(data);

    select('#plot')
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('data-month', ({ month }) => month - 1)
        .attr('data-year', ({ year }) => year)
        .attr('data-temp', ({ variance }) => base + variance)
        .attr('class', 'cell')
        .attr('height', cellHeight)
        .attr('width', 4)
        .attr('x', ({ year }) => xScale(year))
        .attr('y', ({ month }) => yScale(month))
        .attr('fill', ({ variance }) => colorScale(variance))
        .on('mouseover', (event, data) => handleMouseOver(event, data, base))
        .on('mouseout', handleMouseOut);

    renderXAxis(xScale);
    renderYAxis();
}

function renderLegend({ baseTemperature: base, monthlyVariance: data }) {
    const plot = select('#plot');
    const cellSize = 25;
    const minDelta = min(data, (data) => data.variance);
    const maxDelta = max(data, (data) => data.variance);
    const scaling = scaleSequential(interpolateRdYlBu).domain([
        maxDelta,
        minDelta,
    ]);
    const cellsCount = 9;
    const stepOfGrade = (Math.abs(minDelta) + maxDelta) / cellsCount;
    const grades = range(minDelta, maxDelta, stepOfGrade);

    plot.append('g').attr('id', 'legend');
    plot.select('#legend')
        .selectAll('legend')
        .data(grades)
        .enter()
        .append('rect')
        .attr('x', (_, index) => plotPadding + cellSize * index)
        .attr('y', plotHeight - plotPadding)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', (index) => scaling(index));

    const xAxis = axisBottom(scaling.range([cellSize * cellsCount, 0]))
        .tickValues(range(minDelta, maxDelta + stepOfGrade, stepOfGrade))
        .tickFormat((d) => Number(base + d).toFixed(1));

    select('#plot')
        .append('g')
        .attr('id', 'legend-x-axis')
        .attr(
            'transform',
            `translate(${plotPadding}, ${plotHeight - plotPadding + cellSize})`
        )
        .call(xAxis);
}

setPlotSize();

fetchHeatData()
    .then((result) => {
        renderHeatMap(result);
        renderLegend(result);
    })
    .catch((error) => {
        console.error('rendering failed:', error);
    });
