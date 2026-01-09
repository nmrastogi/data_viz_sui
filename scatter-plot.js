// Global state for scatter plot
let rawData = [];
let processedData = {};
let selectedScatterYear = 'all';
let showTrendLine = true;
let showLabels = false;

// Initialize the scatter plot
async function init() {
    await loadData();
    setupScatterPlot();
    renderScatterPlot();
}

// Load and parse CSV data
async function loadData() {
    try {
        const response = await fetch('data-table.csv');
        const csvText = await response.text();
        rawData = d3.csvParse(csvText, d => {
            return {
                year: +d.Year,
                state: d.State,
                deaths: +d.Deaths,
                rate: +d['Age Adjusted Rate'],
                url: d.URL
            };
        });

        // Process data for efficient lookup
        processedData = {
            byState: {},
            byYear: {},
            allStates: [...new Set(rawData.map(d => d.state))].sort(),
            allYears: [...new Set(rawData.map(d => d.year))].sort()
        };

        rawData.forEach(d => {
            // Group by state
            if (!processedData.byState[d.state]) {
                processedData.byState[d.state] = [];
            }
            processedData.byState[d.state].push(d);

            // Group by year
            if (!processedData.byYear[d.year]) {
                processedData.byYear[d.year] = [];
            }
            processedData.byYear[d.year].push(d);
        });
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Setup scatter plot controls
function setupScatterPlot() {
    // Year toggle
    d3.selectAll('#scatter-year-toggle .toggle-btn').on('click', function() {
        d3.selectAll('#scatter-year-toggle .toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        selectedScatterYear = d3.select(this).attr('data-year');
        renderScatterPlot();
    });

    // Trend line checkbox
    d3.select('#show-trend-line').on('change', function() {
        showTrendLine = this.checked;
        renderScatterPlot();
    });

    // Labels checkbox
    d3.select('#show-labels').on('change', function() {
        showLabels = this.checked;
        renderScatterPlot();
    });
}

// Render scatter plot
function renderScatterPlot() {
    if (!rawData || rawData.length === 0) {
        return;
    }

    const container = d3.select('#scatter-container');
    const width = container.node().getBoundingClientRect().width - 40;
    const height = Math.max(600, width * 0.7);
    const margin = { top: 40, right: 40, bottom: 80, left: 80 };

    const svg = d3.select('#scatter-svg')
        .attr('width', width)
        .attr('height', height);

    svg.selectAll('*').remove();

    // Filter data by selected year
    let dataToPlot = rawData;
    if (selectedScatterYear !== 'all') {
        dataToPlot = rawData.filter(d => d.year === +selectedScatterYear);
    }

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataToPlot, d => d.deaths))
        .nice()
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(dataToPlot, d => d.rate))
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Color scale by year
    const yearColorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(processedData.allYears));

    // Size scale
    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(dataToPlot, d => d.deaths))
        .range([3, 12]);

    // Grid lines
    const xTicks = xScale.ticks(8);
    const yTicks = yScale.ticks(8);

    svg.append('g')
        .selectAll('line')
        .data(xTicks)
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom);

    svg.append('g')
        .selectAll('line')
        .data(yTicks)
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', margin.left)
        .attr('x2', width - margin.right)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d));

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d => {
        return d >= 1000 ? `${(d / 1000).toFixed(1)}k` : d;
    });
    const yAxis = d3.axisLeft(yScale).tickFormat(d => d.toFixed(1));

    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .attr('class', 'axis')
        .call(xAxis);

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr('class', 'axis')
        .call(yAxis);

    // Axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .text('Total Deaths');

    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Age Adjusted Rate (per 100,000)');

    // Trend line (linear regression)
    if (showTrendLine && dataToPlot.length > 0) {
        const trendData = calculateTrendLine(dataToPlot);
        if (trendData) {
            svg.append('line')
                .attr('class', 'trend-line')
                .attr('x1', xScale(trendData.x1))
                .attr('x2', xScale(trendData.x2))
                .attr('y1', yScale(trendData.y1))
                .attr('y2', yScale(trendData.y2));
        }
    }

    // Draw points
    const points = svg.append('g')
        .selectAll('.scatter-point')
        .data(dataToPlot)
        .enter()
        .append('circle')
        .attr('class', 'scatter-point')
        .attr('cx', d => xScale(d.deaths))
        .attr('cy', d => yScale(d.rate))
        .attr('r', d => sizeScale(d.deaths))
        .attr('fill', d => selectedScatterYear === 'all' ? yearColorScale(d.year) : '#4a90e2')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
            showTooltip(event, {
                title: d.state,
                items: [
                    { label: 'Year', value: d.year },
                    { label: 'Deaths', value: d.deaths.toLocaleString() },
                    { label: 'Age Adjusted Rate', value: d.rate.toFixed(2) }
                ]
            });
            d3.select(this).attr('opacity', 1).attr('r', d => sizeScale(d.deaths) + 2);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function(event, d) {
            hideTooltip();
            d3.select(this).attr('opacity', 0.7).attr('r', d => sizeScale(d.deaths));
        });

    // State labels
    if (showLabels) {
        svg.append('g')
            .selectAll('.state-label')
            .data(dataToPlot)
            .enter()
            .append('text')
            .attr('class', 'state-label')
            .attr('x', d => xScale(d.deaths))
            .attr('y', d => yScale(d.rate) - 8)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#333')
            .text(d => {
                const stateAbbr = getStateAbbr(d.state);
                return stateAbbr;
            });
    }

    // Legend for year colors (if showing all years)
    if (selectedScatterYear === 'all') {
        const legend = svg.append('g')
            .attr('transform', `translate(${width - margin.right - 100}, ${margin.top})`);

        const legendTitle = legend.append('text')
            .attr('font-size', '12px')
            .attr('font-weight', '600')
            .attr('fill', '#333')
            .text('Year');

        const legendScale = d3.scaleLinear()
            .domain(d3.extent(processedData.allYears))
            .range([0, 150]);

        const legendAxis = d3.axisBottom(legendScale)
            .tickFormat(d3.format('d'))
            .ticks(5);

        legend.append('g')
            .attr('transform', 'translate(0, 20)')
            .call(legendAxis);

        // Color gradient
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'year-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        processedData.allYears.forEach(year => {
            gradient.append('stop')
                .attr('offset', `${((year - processedData.allYears[0]) / (processedData.allYears[processedData.allYears.length - 1] - processedData.allYears[0])) * 100}%`)
                .attr('stop-color', yearColorScale(year));
        });

        legend.append('rect')
            .attr('x', 0)
            .attr('y', 5)
            .attr('width', 150)
            .attr('height', 10)
            .attr('fill', 'url(#year-gradient)');
    }
}

// Calculate trend line using linear regression
function calculateTrendLine(data) {
    if (data.length < 2) return null;

    const n = data.length;
    const sumX = d3.sum(data, d => d.deaths);
    const sumY = d3.sum(data, d => d.rate);
    const sumXY = d3.sum(data, d => d.deaths * d.rate);
    const sumXX = d3.sum(data, d => d.deaths * d.deaths);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const xMin = d3.min(data, d => d.deaths);
    const xMax = d3.max(data, d => d.deaths);
    const yMin = slope * xMin + intercept;
    const yMax = slope * xMax + intercept;

    return { x1: xMin, y1: yMin, x2: xMax, y2: yMax };
}

// Get state abbreviation
function getStateAbbr(stateName) {
    const stateNameMap = {
        'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
        'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
        'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
        'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
        'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
        'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
        'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
        'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
        'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
        'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
        'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
        'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
        'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateNameMap[stateName] || stateName.substring(0, 2).toUpperCase();
}

// Tooltip functions
function showTooltip(event, data) {
    const tooltip = d3.select('#tooltip');
    tooltip.selectAll('*').remove();

    tooltip.append('div')
        .attr('class', 'tooltip-title')
        .text(data.title);

    data.items.forEach(item => {
        tooltip.append('div')
            .attr('class', 'tooltip-item')
            .text(`${item.label}: ${item.value}`);
    });

    tooltip.classed('visible', true);
    moveTooltip(event);
}

function moveTooltip(event) {
    const tooltip = d3.select('#tooltip');
    const x = event.clientX;
    const y = event.clientY;
    const tooltipNode = tooltip.node();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let left = x + 15;
    let top = y + 15;
    
    if (left + tooltipRect.width > windowWidth) {
        left = x - tooltipRect.width - 15;
    }
    if (top + tooltipRect.height > windowHeight) {
        top = y - tooltipRect.height - 15;
    }
    
    if (left < 0) left = 10;
    if (top < 0) top = 10;
    
    tooltip
        .style('left', `${left}px`)
        .style('top', `${top}px`);
}

function hideTooltip() {
    d3.select('#tooltip').classed('visible', false);
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
