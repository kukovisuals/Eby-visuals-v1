import * as d3 from "d3";

function drawChart(data, classId, typeData) {
  // Set dimensions and margins
  //  console.log(data)
  const margin = { top: 10, right: 300, bottom: 30, left: 60 },
    width = 1500 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // Append the SVG object to the page
  const svg = d3.select(classId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


  // 1️⃣ Group the data by `name` (Landing Page Path)
  const groupedCVRData = d3.group(data, d => d.name);

  data.forEach(d => {
    d.year = new Date(d.year);  // If you want to treat it as time
    d[typeData] = +d[typeData];              // Ensure `n` is a number
    d.cvr = d.cvr;
  });

  // 3) GET ALL UNIQUE 'name' VALUES (these become stacked "keys")
  const allNames = Array.from(new Set(data.map(d => d.name)));
  const dataByYear = d3.rollups(
    data,
    (v) => {
      // v is the array of rows for this particular year
      // Build an object that has each "name" as a property
      const rowObj = {};
      v.forEach(d => {
        rowObj[d.name] = d[typeData];
      });
      rowObj.cvr = d3.mean(v, d => d.cvr);
      // We'll also store the actual date (or year string) itself
      rowObj.year = v[0].year;
      return rowObj;
    },
    d => d.year
  )
    // rollups() returns an array of [key, value], so map it to just the objects:
    .map(([year, obj]) => obj);

  // 5) SORT dataByYear by date if needed
  dataByYear.sort((a, b) => a.year - b.year);

  // 6) CREATE THE STACK GENERATOR
  const stack = d3.stack()
    .keys(allNames)                 // all the "name" fields
    .value((d, key) => d[key] || 0) // handle missing keys safely

  const stackedData = stack(dataByYear);

  // 7) CREATE SCALES
  //    X scale -> time scale from earliest to latest
  const x = d3.scaleTime()
    .domain(d3.extent(dataByYear, d => d.year))
    .range([0, width]);

  //    Y scale -> from 0 up to the max of stacked sums
  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, layer => d3.max(layer, d => d[1]))])
    .range([height, 0]);


  // 8) ADD AXES
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).ticks(5));

  svg.append("g")
    .call(d3.axisLeft(y));
  const myColors = [
    "#E63946", // Vibrant Red
    "#F4A261", // Orange
    "#E9C46A", // Yellow
    "#2A9D8F", // Teal
    "#264653", // Deep Blue
    "#D7263D", // Strong Red
    "#3A86FF", // Bright Blue
    "#8338EC", // Deep Purple
    "#FF006E", // Hot Pink
    "#FB5607", // Fiery Orange
    "#06D6A0", // Bright Green
    "#118AB2", // Ocean Blue
    "#73A857", // Leaf Green
    "#FFBE0B", // Golden Yellow
    "#8E44AD", // Royal Purple
    "#3498DB", // Sky Blue
    "#D81159", // Rose Red
    "#FF4500", // Strong Orange
    "#00A6ED", // Electric Blue
    "#FF4D6D"  // Soft Coral
  ];


  // 9) COLOR PALETTE FOR THE LAYERS
  const color = d3.scaleOrdinal()
    .domain(allNames)
    .range(myColors);  // or any palette you like

  // 10) DRAW THE STACKED AREAS
  svg.selectAll(".layer")
    .data(stackedData)
    .join("path")
    .attr("class", "layer")
    .style("fill", d => color(d.key))
    .attr("d", d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
    );


  // The label text

  const legend = svg.selectAll(".legend")
    .data(allNames)
    .enter()
    .append("g")
    .attr("class", "legend")
    // Shift each item downward so they don't overlap
    .attr("transform", (d, i) => `translate(30, ${i * 20})`);

  // 2) Draw a small colored square for each name
  legend.append("rect")
    .attr("x", width + 10)    // position to the right of the chart
    .attr("y", 10)            // small top margin
    .attr("width", 10)
    .attr("height", 10)
    .style("fill", d => color(d));

  // 3) Add text labels next to each colored square
  legend.append("text")
    .attr("x", width + 30)   // a bit more to the right of the rectangle
    .attr("y", 18)           // roughly in the middle of the rectangle
    .attr("text-anchor", "start")
    .style("alignment-baseline", "middle")
    .style("font-size", "12px")
    .text(d => d);





  const yRight = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.cvr) * 1.2])  // Scale up for better spacing
    .range([height, 0]);

  // 1️⃣ Append the right Y-axis for CVR
  svg.append("g")
    .attr("class", "axisRight")
    .attr("transform", `translate(${width}, 0)`)  // Moves the axis to the right side
    .call(d3.axisRight(yRight)); // Call the right-side axis


  // 1️⃣ Create a tooltip div (hidden by default)
  const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none") // Ensures it doesn't interfere with mouse events
    .style("opacity", 0); // Initially hidden

  // 2️⃣ Draw a separate line for each name
  groupedCVRData.forEach((values, name) => {

    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5")
      .attr("d", d3.line()
        .x(d => x(d.year))
        .y(d => yRight(d.cvr))
      );

    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", color(name))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", d3.line()
        .x(d => x(d.year))
        .y(d => yRight(d.cvr))
      );

    // 3️⃣ Add Circles for Each Data Point
    svg.selectAll(`.cvr-dot-${name.replace(/\W/g, "")}`)
      .data(values)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => yRight(d.cvr))
      .attr("r", 6) // Increase radius for better hover interaction
      .attr("fill", color(name))
      .attr("stroke", "white")
      .attr("stroke-width", 1)

      // 🎯 Add tooltip event listeners
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>Page:</strong> ${name}<br>
            <strong>CVR:</strong> ${d.cvr.toFixed(2)}%
          `);
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  });

  // 4️⃣ Legend
  const cvrLegend = svg.append("g")
    .attr("transform", `translate(${width + 20}, 20)`);

  groupedCVRData.forEach((_, name, i) => {
    const legendRow = cvrLegend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", color(name))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
  });


}

export default drawChart;