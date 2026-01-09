// Global state for heatmap
let rawData = [];
let processedData = {};
let heatmapMetric = 'deaths';
let sortStates = true;

// Initialize the heatmap
async function init() {
    await loadData();
    setupHeatmap();
    renderHeatmap();
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

// Setup heatmap controls
function setupHeatmap() {
    // Metric toggle
    d3.selectAll('#heatmap-metric-toggle .toggle-btn').on('click', function() {
        d3.selectAll('#heatmap-metric-toggle .toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        heatmapMetric = d3.select(this).attr('data-metric');
        renderHeatmap();
    });

    // Sort checkbox
    d3.select('#sort-states').on('change', function() {
        sortStates = this.checked;
        renderHeatmap();
    });
}

// Render heatmap
function renderHeatmap() {
    if (!rawData || rawData.length === 0) {
        return;
    }

    const container = d3.select('#heatmap-container');
    const containerWidth = container.node().getBoundingClientRect().width - 40;
    const cellWidth = 35;
    const cellHeight = 20;
    const margin = { top: 100, right: 150, bottom: 60, left: 120 };
    
    const numYears = processedData.allYears.length;
    const numStates = processedData.allStates.length;
    
    const width = Math.max(containerWidth, numYears * cellWidth + margin.left + margin.right);
    const height = numStates * cellHeight + margin.top + margin.bottom;

    const svg = d3.select('#heatmap-svg')
        .attr('width', width)
        .attr('height', height);

    svg.selectAll('*').remove();

    // Prepare data matrix
    let states = [...processedData.allStates];
    
    // Sort states by average value if enabled
    if (sortStates) {
        states.sort((a, b) => {
            const aData = processedData.byState[a] || [];
            const bData = processedData.byState[b] || [];
            const aAvg = d3.mean(aData, d => heatmapMetric === 'deaths' ? d.deaths : d.rate);
            const bAvg = d3.mean(bData, d => heatmapMetric === 'deaths' ? d.deaths : d.rate);
            return (bAvg || 0) - (aAvg || 0);
        });
    }

    // Create data matrix
    const dataMatrix = [];
    states.forEach(state => {
        processedData.allYears.forEach(year => {
            const yearData = processedData.byYear[year] || [];
            const stateData = yearData.find(d => d.state === state);
            if (stateData) {
                dataMatrix.push({
                    state: state,
                    year: year,
                    value: heatmapMetric === 'deaths' ? stateData.deaths : stateData.rate,
                    deaths: stateData.deaths,
                    rate: stateData.rate
                });
            }
        });
    });

    // Color scale
    const values = dataMatrix.map(d => d.value);
    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain(d3.extent(values));

    // Scales for positioning
    const xScale = d3.scaleBand()
        .domain(processedData.allYears.map(String))
        .range([margin.left, width - margin.right])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(states)
        .range([margin.top, height - margin.bottom])
        .padding(0.05);

    // Draw cells
    svg.selectAll('.heatmap-cell')
        .data(dataMatrix)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', d => xScale(String(d.year)))
        .attr('y', d => yScale(d.state))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .on('mouseover', function(event, d) {
            showTooltip(event, {
                title: `${d.state} - ${d.year}`,
                items: [
                    { label: 'Deaths', value: d.deaths.toLocaleString() },
                    { label: 'Age Adjusted Rate', value: d.rate.toFixed(2) },
                    { label: 'Displayed Value', value: heatmapMetric === 'deaths' 
                        ? d.value.toLocaleString() 
                        : d.value.toFixed(2) }
                ]
            });
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

    // Add value labels (optional, can be toggled)
    svg.selectAll('.heatmap-label')
        .data(dataMatrix)
        .enter()
        .append('text')
        .attr('class', 'heatmap-label')
        .attr('x', d => xScale(String(d.year)) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.state) + yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('fill', d => {
            // Use contrasting text color based on cell brightness
            const color = d3.rgb(colorScale(d.value));
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            return brightness > 128 ? '#333' : '#fff';
        })
        .text(d => {
            if (heatmapMetric === 'deaths') {
                return d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value;
            }
            return d.value.toFixed(1);
        })
        .style('pointer-events', 'none');

    // X-axis (years)
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d'));
    svg.append('g')
        .attr('class', 'heatmap-axis')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Y-axis (states) - show abbreviations
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
        .attr('class', 'heatmap-axis')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat(d => stateAbbrMap[d] || d.substring(0, 2).toUpperCase()));

    // Axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text('Year');

    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .text('State');

    // Legend
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - margin.right - legendWidth;
    const legendY = margin.top - 60;

    const legend = svg.append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'heatmap-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');

    const stops = 10;
    for (let i = 0; i <= stops; i++) {
        const value = d3.min(values) + (d3.max(values) - d3.min(values)) * (i / stops);
        gradient.append('stop')
            .attr('offset', `${(i / stops) * 100}%`)
            .attr('stop-color', colorScale(value));
    }

    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .attr('fill', 'url(#heatmap-gradient)')
        .attr('stroke', '#ccc')
        .attr('rx', 4);

    legend.append('text')
        .attr('x', 0)
        .attr('y', -5)
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(heatmapMetric === 'deaths' ? 'Total Deaths' : 'Age Adjusted Rate');

    const legendLabels = legend.append('g')
        .attr('transform', `translate(0, ${legendHeight + 5})`);

    legendLabels.append('text')
        .attr('font-size', '10px')
        .text(d3.min(values).toFixed(heatmapMetric === 'deaths' ? 0 : 1));

    legendLabels.append('text')
        .attr('x', legendWidth)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .text(d3.max(values).toFixed(heatmapMetric === 'deaths' ? 0 : 1));
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
