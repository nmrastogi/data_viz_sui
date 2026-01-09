// Global state for percentage change
let rawData = [];
let processedData = {};
let changeMetric = 'deaths';
let sortByChange = true;

// Initialize the percentage change visualization
async function init() {
    await loadData();
    setupPercentageChange();
    renderPercentageChange();
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

// Setup percentage change controls
function setupPercentageChange() {
    // Metric toggle
    d3.selectAll('#change-metric-toggle .toggle-btn').on('click', function() {
        d3.selectAll('#change-metric-toggle .toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        changeMetric = d3.select(this).attr('data-metric');
        renderPercentageChange();
    });

    // Sort checkbox
    d3.select('#sort-by-change').on('change', function() {
        sortByChange = this.checked;
        renderPercentageChange();
    });
}

// Calculate percentage change for each state
function calculatePercentageChanges() {
    const changes = [];
    const startYear = 2014;
    const endYear = 2023;

    processedData.allStates.forEach(state => {
        const stateData = processedData.byState[state] || [];
        const startData = stateData.find(d => d.year === startYear);
        const endData = stateData.find(d => d.year === endYear);

        if (startData && endData) {
            const startValue = changeMetric === 'deaths' ? startData.deaths : startData.rate;
            const endValue = changeMetric === 'deaths' ? endData.deaths : endData.rate;
            const change = ((endValue - startValue) / startValue) * 100;
            const absoluteChange = endValue - startValue;

            changes.push({
                state: state,
                startValue: startValue,
                endValue: endValue,
                change: change,
                absoluteChange: absoluteChange,
                startDeaths: startData.deaths,
                endDeaths: endData.deaths,
                startRate: startData.rate,
                endRate: endData.rate
            });
        }
    });

    return changes;
}

// Render percentage change visualization
function renderPercentageChange() {
    if (!rawData || rawData.length === 0) {
        return;
    }

    const container = d3.select('#change-container');
    const width = container.node().getBoundingClientRect().width - 40;
    const height = Math.max(600, processedData.allStates.length * 20 + 200);
    const margin = { top: 40, right: 200, bottom: 60, left: 120 };

    const svg = d3.select('#change-svg')
        .attr('width', width)
        .attr('height', height);

    svg.selectAll('*').remove();

    // Calculate changes
    let changes = calculatePercentageChanges();

    // Sort by change if enabled
    if (sortByChange) {
        changes.sort((a, b) => b.change - a.change);
    } else {
        changes.sort((a, b) => a.state.localeCompare(b.state));
    }

    // Create scales
    const maxChange = d3.max(changes, d => Math.abs(d.change));
    const xScale = d3.scaleLinear()
        .domain([-maxChange, maxChange])
        .range([margin.left, width - margin.right])
        .nice();

    const yScale = d3.scaleBand()
        .domain(changes.map(d => d.state))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    // Grid lines
    const xTicks = xScale.ticks(10);
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

    // Zero line
    svg.append('line')
        .attr('class', 'zero-line')
        .attr('x1', xScale(0))
        .attr('x2', xScale(0))
        .attr('y1', margin.top)
        .attr('y2', height - margin.bottom);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d => `${d > 0 ? '+' : ''}${d.toFixed(1)}%`);
    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .attr('class', 'axis')
        .call(xAxis);

    // Y-axis with state abbreviations
    const stateAbbrMap = {
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

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale).tickFormat(d => stateAbbrMap[d] || d.substring(0, 2).toUpperCase()));

    // Axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .text('Percentage Change (2014 → 2023)');

    // Arrow marker for positive/negative
    const defs = svg.append('defs');
    defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 0 10 10')
        .attr('refX', 5)
        .attr('refY', 5)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .append('path')
        .attr('d', 'M 0 0 L 10 5 L 0 10 z');

    // Draw bars
    const bars = svg.selectAll('.change-bar')
        .data(changes)
        .enter()
        .append('rect')
        .attr('class', 'change-bar')
        .attr('x', d => d.change < 0 ? xScale(d.change) : xScale(0))
        .attr('y', d => yScale(d.state))
        .attr('width', d => Math.abs(xScale(d.change) - xScale(0)))
        .attr('height', yScale.bandwidth())
        .attr('fill', d => d.change >= 0 ? '#d32f2f' : '#2e7d32')
        .on('mouseover', function(event, d) {
            showTooltip(event, {
                title: d.state,
                items: [
                    { label: '2014 Value', value: changeMetric === 'deaths' 
                        ? d.startValue.toLocaleString() 
                        : d.startValue.toFixed(2) },
                    { label: '2023 Value', value: changeMetric === 'deaths' 
                        ? d.endValue.toLocaleString() 
                        : d.endValue.toFixed(2) },
                    { label: 'Change', value: `${d.change > 0 ? '+' : ''}${d.change.toFixed(2)}%` },
                    { label: 'Absolute Change', value: changeMetric === 'deaths'
                        ? `${d.absoluteChange > 0 ? '+' : ''}${d.absoluteChange.toLocaleString()}`
                        : `${d.absoluteChange > 0 ? '+' : ''}${d.absoluteChange.toFixed(2)}` }
                ]
            });
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

    // Add percentage labels
    svg.selectAll('.change-label')
        .data(changes)
        .enter()
        .append('text')
        .attr('class', 'change-label')
        .attr('x', d => xScale(d.change) + (d.change >= 0 ? 5 : -5))
        .attr('y', d => yScale(d.state) + yScale.bandwidth() / 2)
        .attr('text-anchor', d => d.change >= 0 ? 'start' : 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#333')
        .text(d => `${d.change > 0 ? '+' : ''}${d.change.toFixed(1)}%`);

    // Add value labels on the right
    svg.selectAll('.value-label')
        .data(changes)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', width - margin.right + 10)
        .attr('y', d => yScale(d.state) + yScale.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(d => {
            if (changeMetric === 'deaths') {
                return `${d.startValue.toLocaleString()} → ${d.endValue.toLocaleString()}`;
            }
            return `${d.startValue.toFixed(1)} → ${d.endValue.toFixed(1)}`;
        });

    // Summary statistics
    const avgChange = d3.mean(changes, d => d.change);
    const maxIncrease = d3.max(changes, d => d.change);
    const maxDecrease = d3.min(changes, d => d.change);
    const statesIncreased = changes.filter(d => d.change > 0).length;
    const statesDecreased = changes.filter(d => d.change < 0).length;

    const summary = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top - 30})`);

    summary.append('text')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text('Summary: ');

    summary.append('text')
        .attr('x', 80)
        .attr('font-size', '12px')
        .text(`Avg Change: ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(2)}% | `);

    summary.append('text')
        .attr('x', 200)
        .attr('font-size', '12px')
        .text(`Increased: ${statesIncreased} states | `);

    summary.append('text')
        .attr('x', 320)
        .attr('font-size', '12px')
        .text(`Decreased: ${statesDecreased} states`);
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
