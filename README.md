# US Suicide Statistics Visualization

An interactive web visualization showcasing suicide statistics by US state from 2014-2023.

## Features

### Main Dashboard (`index.html`)
- **Interactive Choropleth Map**: Color-coded US map showing suicide statistics by state with state name labels
- **Time Series Chart**: Trends over time with support for comparing multiple states
- **Bar Chart**: State-by-state comparison for the selected year
- **Year Slider**: Filter data by year (2014-2023)
- **State Filter**: Multi-select dropdown to focus on specific states
- **Metric Toggle**: Switch between Total Deaths and Age Adjusted Rate
- **Comparison Mode**: Enable side-by-side comparison of multiple states
- **Interactive Tooltips**: Hover over any element for detailed information

### Additional Visualizations
- **Bar Chart Race** (`bar-race.html`): Animated ranking of states over time with smooth transitions
- **Line Graph Race** (`line-race.html`): Select states and watch animated line graphs showing trends from 2014-2023
- **Animated Map** (`animated-map.html`): Watch state colors change over time with automatic year progression
- **Scatter Plot** (`scatter-plot.html`): Explore the relationship between Total Deaths and Age Adjusted Rate
- **Heatmap** (`heatmap.html`): Comprehensive State × Year overview with color-coded intensity
- **Percentage Change** (`percentage-change.html`): Visualize which states increased or decreased most from 2014 to 2023

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

### Main Dashboard
1. **Select a Year**: Use the year slider to view data for a specific year
2. **Choose a Metric**: Toggle between "Total Deaths" and "Age Adjusted Rate"
3. **Filter States**: Use the state dropdown to focus on specific states (hold Ctrl/Cmd to select multiple)
4. **Enable Comparison Mode**: Check the comparison mode checkbox, then click states on the map to compare them
5. **Hover for Details**: Move your mouse over any visualization element to see detailed information

### Additional Visualizations
- **Bar Chart Race**: Click "Open Bar Chart Race" to see animated state rankings. Use controls to play/pause, adjust speed, and filter states.
- **Line Graph Race**: Click "Open Line Graph Race" to compare selected states over time. Select states from the dropdown and watch animated line graphs.
- **Animated Map**: Click "Open Animated Map" to see an automatically progressing map showing year-by-year changes with play/pause controls.
- **Scatter Plot**: Explore relationships between metrics with year filters and optional trend lines.
- **Heatmap**: View all states and years simultaneously with sortable options.
- **Percentage Change**: See which states changed most from 2014 to 2023 with detailed change metrics.

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

## File Structure

```
data_viz_sui/
├── index.html              # Main dashboard
├── animated-map.html       # Animated map visualization
├── animated-map.js         # Animated map logic
├── bar-race.html          # Bar chart race visualization
├── bar-race.js            # Bar chart race logic
├── line-race.html         # Line graph race visualization
├── line-race.js           # Line graph race logic
├── scatter-plot.html      # Scatter plot visualization
├── scatter-plot.js        # Scatter plot logic
├── heatmap.html           # Heatmap visualization
├── heatmap.js             # Heatmap logic
├── percentage-change.html # Percentage change visualization
├── percentage-change.js   # Percentage change logic
├── script.js              # Main dashboard logic
├── styles.css             # Shared styles
├── data-table.csv         # Data source
└── README.md              # This file
```

## Deployment

This is a static website that can be deployed to:
- **GitHub Pages** (Recommended): See deployment instructions below
- Netlify
- Vercel
- Any static hosting service

### GitHub Pages Deployment

1. Create a GitHub repository
2. Push all files to the repository
3. Go to Settings → Pages
4. Select "Deploy from a branch" → Choose `main` branch and `/ (root)` folder
5. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

**Important**: Make sure `data-table.csv` is included in your repository as it's required for all visualizations.

## Key Features

- **State Labels on Maps**: All maps display state abbreviations (CA, AZ, etc.) with readable labels
- **Animated Visualizations**: Multiple animated views showing temporal changes
- **Interactive Controls**: Play/pause, speed adjustment, and filtering options
- **Multiple View Types**: Maps, charts, races, scatter plots, heatmaps, and change analysis
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **No Build Required**: Pure HTML, CSS, and JavaScript - just open and view

## Notes

- The map uses US state boundaries loaded from a CDN (TopoJSON)
- All data is loaded from the local CSV file (`data-table.csv`)
- All visualizations are fully responsive and work on mobile devices
- State name abbreviations are automatically mapped for better readability
- Color scales are optimized for accessibility and visual clarity



