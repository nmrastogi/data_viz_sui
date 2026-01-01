# US Suicide Statistics Visualization

An interactive web visualization showcasing suicide statistics by US state from 2014-2023.

## Features

- **Interactive Choropleth Map**: Color-coded US map showing suicide statistics by state
- **Time Series Chart**: Trends over time with support for comparing multiple states
- **Bar Chart**: State-by-state comparison for the selected year
- **Year Slider**: Filter data by year (2014-2023)
- **State Filter**: Multi-select dropdown to focus on specific states
- **Metric Toggle**: Switch between Total Deaths and Age Adjusted Rate
- **Comparison Mode**: Enable side-by-side comparison of multiple states
- **Interactive Tooltips**: Hover over any element for detailed information

## Getting Started

### Local Development

1. **Using a Local Server** (Recommended):
   - Python 3: `python -m http.server 8000`
   - Python 2: `python -m SimpleHTTPServer 8000`
   - Node.js: `npx http-server`
   - VS Code: Use the "Live Server" extension

2. Open your browser and navigate to `http://localhost:8000`

### Direct File Access

Due to CORS restrictions, you cannot simply open `index.html` directly in a browser. You must use a local web server.

## Usage

1. **Select a Year**: Use the year slider to view data for a specific year
2. **Choose a Metric**: Toggle between "Total Deaths" and "Age Adjusted Rate"
3. **Filter States**: Use the state dropdown to focus on specific states (hold Ctrl/Cmd to select multiple)
4. **Enable Comparison Mode**: Check the comparison mode checkbox, then click states on the map to compare them
5. **Hover for Details**: Move your mouse over any visualization element to see detailed information

## Data Source

The visualization uses data from `data-table.csv` with the following columns:
- Year (2014-2023)
- State (all 50 US states + DC)
- Deaths (total number of deaths)
- Age Adjusted Rate (per 100,000 population)
- URL (reference link)

## Technology Stack

- **D3.js v7**: For data visualization and map rendering
- **TopoJSON**: For US state boundaries
- **Vanilla JavaScript**: No build tools required
- **Modern CSS**: Responsive design with CSS Grid and Flexbox

## Browser Compatibility

Works best in modern browsers (Chrome, Firefox, Safari, Edge) that support:
- ES6+ JavaScript features
- SVG rendering
- CSS Grid and Flexbox

## Deployment

This is a static website that can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Simply upload all files (index.html, styles.css, script.js, data-table.csv) to your hosting service.

## Notes

- The map uses US state boundaries loaded from a CDN
- All data is loaded from the local CSV file
- The visualization is fully responsive and works on mobile devices

