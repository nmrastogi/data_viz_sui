// Global state for animated map
let rawData = [];
let processedData = {};
let usStates = null;
let animatedMetric = 'rate';
let currentAnimatedYear = 2014;
let isAnimatedPlaying = true;
let animatedInterval = null;
let animatedSpeed = 1500; // milliseconds per year
let colorScale = null;

// State name mapping for TopoJSON
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

// Initialize the animated map
async function init() {
    await loadData();
    await loadMap();
    setupAnimatedMap();
    updateColorScale();
    renderAnimatedMap();
    startAnimatedMap();
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

// Load US states TopoJSON
async function loadMap() {
    try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        const us = await response.json();
        usStates = topojson.feature(us, us.objects.states);
    } catch (error) {
        console.error('Error loading map:', error);
        // Fallback
        try {
            const response = await fetch('https://raw.githubusercontent.com/topojson/us-atlas/master/states-10m.json');
            const us = await response.json();
            usStates = topojson.feature(us, us.objects.states);
        } catch (error2) {
            console.error('Error loading map from fallback:', error2);
        }
    }
}

// Setup animated map controls
function setupAnimatedMap() {
    // Metric toggle
    d3.selectAll('#animated-metric-toggle .toggle-btn').on('click', function() {
        d3.selectAll('#animated-metric-toggle .toggle-btn').classed('active', false);
        d3.select(this).classed('active', true);
        animatedMetric = d3.select(this).attr('data-metric');
        updateColorScale();
        renderAnimatedMap();
    });

    // Play/Pause button
    d3.select('#animated-play-pause-btn').on('click', function() {
        isAnimatedPlaying = !isAnimatedPlaying;
        updateAnimatedPlayPauseButton();
        if (isAnimatedPlaying) {
            startAnimatedMap();
        } else {
            stopAnimatedMap();
        }
    });

    // Speed slider
    const speedSlider = d3.select('#animated-speed-slider');
    const speedDisplay = d3.select('#animated-speed-display');
    
    speedSlider.on('input', function() {
        animatedSpeed = +this.value;
        speedDisplay.text(`${animatedSpeed}ms`);
        if (isAnimatedPlaying) {
            stopAnimatedMap();
            startAnimatedMap();
        }
    });

    updateAnimatedPlayPauseButton();
}

// Update color scale based on all years data
function updateColorScale() {
    const allYearsData = processedData.allYears.flatMap(year => 
        processedData.byYear[year] || []
    );
    const values = allYearsData.map(d => animatedMetric === 'deaths' ? d.deaths : d.rate);
    const min = d3.min(values);
    const max = d3.max(values);

    colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([min, max]);
}

// Start animation
function startAnimatedMap() {
    if (animatedInterval) {
        clearInterval(animatedInterval);
    }
    
    animatedInterval = setInterval(function() {
        if (isAnimatedPlaying) {
            currentAnimatedYear++;
            if (currentAnimatedYear > 2023) {
                currentAnimatedYear = 2014; // Loop back
            }
            renderAnimatedMap();
        }
    }, animatedSpeed);
}

// Stop animation
function stopAnimatedMap() {
    if (animatedInterval) {
        clearInterval(animatedInterval);
        animatedInterval = null;
    }
}

// Update play/pause button
function updateAnimatedPlayPauseButton() {
    const btn = d3.select('#animated-play-pause-btn');
    const text = d3.select('#animated-play-pause-text');
    if (isAnimatedPlaying) {
        text.text('Pause');
        btn.classed('active', false);
    } else {
        text.text('Play');
        btn.classed('active', true);
    }
}

// Render animated map
function renderAnimatedMap() {
    if (!usStates) {
        d3.select('#animated-map-loading').style('display', 'block');
        return;
    }

    d3.select('#animated-map-loading').style('display', 'none');

    const container = d3.select('#animated-map-container');
    const width = container.node().getBoundingClientRect().width;
    const height = Math.max(450, width * 0.5);

    const svg = d3.select('#animated-map-svg')
        .attr('width', width)
        .attr('height', height);

    // Update color scale if needed
    if (!colorScale) {
        updateColorScale();
    }

    const projection = d3.geoAlbersUsa()
        .fitSize([width - 40, height - 40], usStates);

    const path = d3.geoPath().projection(projection);

    const currentData = processedData.byYear[currentAnimatedYear] || [];
    const dataMap = new Map(currentData.map(d => [d.state, d]));

    const featuresWithData = usStates.features.map(feature => {
        const stateName = feature.properties.name;
        const data = dataMap.get(stateName);
        return { feature, stateName, data };
    });

    // Update or create paths
    const paths = svg.selectAll('.state-path')
        .data(featuresWithData, d => d.stateName);

    // Enter: new paths
    const pathsEnter = paths.enter()
        .append('path')
        .attr('class', 'state-path')
        .attr('d', d => path(d.feature))
        .attr('fill', d => {
            if (!d.data) return '#e0e0e0';
            const value = animatedMetric === 'deaths' ? d.data.deaths : d.data.rate;
            return colorScale(value);
        })
        .attr('stroke', 'white')
        .attr('stroke-width', 1)
        .attr('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            if (d.data) {
                showTooltip(event, {
                    title: d.stateName,
                    items: [
                        { label: 'Year', value: currentAnimatedYear },
                        { label: 'Deaths', value: d.data.deaths.toLocaleString() },
                        { label: 'Age Adjusted Rate', value: d.data.rate.toFixed(2) }
                    ]
                });
            }
            d3.select(this).attr('stroke-width', 2);
        })
        .on('mousemove', moveTooltip)
        .on('mouseout', function() {
            hideTooltip();
            d3.select(this).attr('stroke-width', 1);
        });

    // Update: smooth color transitions
    pathsEnter.merge(paths)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('fill', d => {
            if (!d.data) return '#e0e0e0';
            const value = animatedMetric === 'deaths' ? d.data.deaths : d.data.rate;
            return colorScale(value);
        });

    paths.exit().remove();

    // Update or create state labels with backgrounds
    const labelGroups = svg.selectAll('.state-label-group')
        .data(featuresWithData, d => d.stateName);

    // Enter: new label groups
    const labelGroupsEnter = labelGroups.enter()
        .append('g')
        .attr('class', 'state-label-group')
        .attr('pointer-events', 'none');

    // Add background circle
    labelGroupsEnter.append('circle')
        .attr('class', 'state-label-bg')
        .attr('r', 12)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.85)
        .attr('stroke', 'rgba(0, 0, 0, 0.2)')
        .attr('stroke-width', '0.5px');

    // Add text
    labelGroupsEnter.append('text')
        .attr('class', 'state-label')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1a1a1a')
        .text(d => {
            const stateAbbr = stateNameMap[d.stateName] || d.stateName.substring(0, 2).toUpperCase();
            return stateAbbr;
        });

    // Update: position label groups
    labelGroupsEnter.merge(labelGroups)
        .attr('transform', d => {
            const centroid = path.centroid(d.feature);
            return `translate(${centroid[0]}, ${centroid[1]})`;
        });

    labelGroups.exit().remove();

    // Update legend
    renderAnimatedLegend();

    // Update year indicator
    d3.select('#animated-year-display').text(currentAnimatedYear);
    d3.select('#animated-year-progress').text(
        `Year ${currentAnimatedYear - 2013} of 10 (2014-2023)`
    );
    
    // Calculate and display total
    const total = animatedMetric === 'deaths' 
        ? currentData.reduce((sum, d) => sum + d.deaths, 0)
        : currentData.reduce((sum, d) => sum + d.rate, 0) / currentData.length;
    
    d3.select('#animated-total-display').text(
        animatedMetric === 'deaths' 
            ? `Total: ${total.toLocaleString()}`
            : `Average: ${total.toFixed(2)}`
    );
}

// Render legend
function renderAnimatedLegend() {
    const legend = d3.select('#animated-map-legend');
    legend.selectAll('*').remove();

    const allYearsData = processedData.allYears.flatMap(year => 
        processedData.byYear[year] || []
    );
    const values = allYearsData.map(d => animatedMetric === 'deaths' ? d.deaths : d.rate);
    const min = d3.min(values);
    const max = d3.max(values);

    legend.append('div')
        .attr('class', 'legend-title')
        .text(animatedMetric === 'deaths' ? 'Total Deaths' : 'Age Adjusted Rate');

    const gradient = legend.append('div')
        .attr('class', 'legend-scale');

    const svg = gradient.append('svg')
        .attr('width', 200)
        .attr('height', 20);

    const defs = svg.append('defs');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'animated-legend-gradient');

    const stops = 10;
    for (let i = 0; i <= stops; i++) {
        const value = min + (max - min) * (i / stops);
        const color = colorScale(value);
        linearGradient.append('stop')
            .attr('offset', `${(i / stops) * 100}%`)
            .attr('stop-color', color);
    }

    svg.append('rect')
        .attr('width', 200)
        .attr('height', 20)
        .attr('fill', 'url(#animated-legend-gradient)')
        .attr('stroke', '#ccc')
        .attr('rx', 4);

    const labels = legend.append('div')
        .attr('class', 'legend-labels');

    labels.append('span').text(min.toFixed(animatedMetric === 'deaths' ? 0 : 1));
    labels.append('span').text(max.toFixed(animatedMetric === 'deaths' ? 0 : 1));
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

