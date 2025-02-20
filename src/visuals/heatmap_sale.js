import * as d3 from "d3";

function drawHeatMap(data) {

    // Increase left margin to allow space for longer x-axis labels
    const margin = { top: 30, right: 30, bottom: 60, left: 100 }, // Increased left and bottom margin
        width = 1000 - margin.left - margin.right,
        height = 700 - margin.top - margin.bottom;

    // Append the svg object
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Build X scales and axis:
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.date))
        .padding(0.01);

    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text") // Select x-axis labels
        .attr("dx", "0.5em") // Move right
        .attr("dy", "1.5em"); // Move down slightly

    // Build Y scales and axis:
    const y = d3.scaleBand()
        .range([height, 0]) // Y-axis goes from bottom to top
        .domain(data.map(d => d.states)) // Extracts all state names
        .padding(0.01);

    svg.append("g")
        .call(d3.axisLeft(y));



    // Define a color scale for total sales
    const myColor = d3.scaleSequential(d3.interpolateBlues)
        .domain([d3.min(data, d => d.totalSales), d3.max(data, d => d.totalSales)]);

    // Draw the heat map
    svg.selectAll("rect")
        .data(data, function (d) { return d.date + ':' + d.states; }) // Unique key
        .join("rect")
        .attr("x", function (d) { return x(d.date); }) // Map date to x-axis
        .attr("y", function (d) { return y(d.states); }) // Map state to y-axis
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function (d) { return myColor(d.totalSales); }); // Use total sales for color


    // Create a tooltip div
    const tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

    // Add tooltip interactions to the heatmap
    svg.selectAll("rect")
        .on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Date:</strong> ${d.date}<br><strong>State:</strong> ${d.states}<br><strong>Sales:</strong> $${d.totalSales.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
            d3.select(this).style("stroke", "#000").style("stroke-width", "1px"); // Highlight the hovered cell
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
            d3.select(this).style("stroke", "none"); // Remove highlight
        });
}

export default drawHeatMap;