---
name: create-donut-chart
description: How to create a custom SVG donut chart (or pie chart) in React from scratch without relying on heavy chart libraries. Use this skill when the user asks for a pie chart, donut chart, data visualization, or a circular chart with a legend.
---

# Create Donut Chart

This skill enables you to create a high-quality, interactive, dependency-free SVG donut chart in React. Rather than reaching for heavy charting libraries like Recharts, Chart.js, or D3, use this approach to build a lightweight, beautiful chart component.

## When to use this approach
- The user asks for a donut chart or pie chart.
- The project needs lightweight data visualization.
- The design requires hover interactions between the chart segments and a legend.
- You need a central text display inside the donut chart.

## How it works

The core idea is to map data percentages to the circumference of an SVG `<circle>`. 
1. The radius is `R = 60`, giving a circumference `C = 2 * Math.PI * R` (approx 377).
2. We iterate over the data. For each slice, we calculate its fraction of the total (`value / total`).
3. We set `strokeDasharray` to `"slice_length remaining_length"` and `strokeDashoffset` to the cumulative offset.
4. We apply a sweeping animation on mount using `requestAnimationFrame`.

## Implementation details

You should provide the user with two files: a React component and a CSS Module. 
Check `references/examples/DonutChart.tsx` and `references/examples/DonutChart.module.css` to see the exact code.

### The React Component (`DonutChart.tsx`)
- Maintains a `hoverSlice` state to track which item is hovered (either via the chart segment or the legend).
- Uses `requestAnimationFrame` for a smooth 0→1 entrance sweep animation.
- Computes `strokeDasharray` dynamically for each segment.
- Maps over the data to render the SVG `<circle>` elements and the `<ul>` legend.

### The CSS (`DonutChart.module.css`)
- Defines the layout (flex column, chart on top, legend on bottom).
- Animates the `stroke-width` on hover to make the slice "pop".
- Provides custom fallback colors using CSS variables like `var(--bg-surface, #111114)`.

## Output generation

When requested to build a chart:
1. First, check if the user specified their own data. If not, generate a small set of mock data (e.g. 4-6 items).
2. Write the component and the CSS module.
3. If they are using Tailwind, you may convert the CSS module to Tailwind classes, but be careful to maintain the hover interactivity on the SVG stroke width.
4. Encourage the user to adapt the colors to their specific branding.
