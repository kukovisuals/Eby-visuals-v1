import * as d3 from "d3";

function simpleLineChart(data, classId) {
  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 1100 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3.select("#my_dataviz2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // console.clear()
  const newData = data.filter(d => d.name == 'instagram');

  const groupedData = Object.values(newData.reduce((acc, entry) => {
    const dateKey = new Date(entry.date); // Normalize to only the date part
    if (!acc[dateKey]) {
      acc[dateKey] = { date: dateKey, name: entry.name, totalSales: 0 };
    }
    acc[dateKey].totalSales += entry.totalSales;
    return acc;
  }, {}));

  // console.log("group data", groupedData);

  // console.log(newData);
  // const newData = data.map

  //Read the data
  // d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/connectedscatter.csv",
  //   // When reading the csv, I must format variables:
  //   function (d) {
  //     return { date: d3.timeParse("%Y-%m-%d")(d.date), value: d.value }
  //   }).then(
  //     // Now I can use this dataset:
  //     function (data) {
  // Add X axis --> it is a date format
  const x = d3.scaleTime()
    .domain(d3.extent(groupedData, d => d.date))
    .range([0, width]);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(groupedData, (d => d.totalSales))])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));
  // Add the line
  svg.append("path")
    .datum(groupedData)
    .attr("fill", "none")
    .attr("stroke", "#69b3a2")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(d => x(d.date))
      .y(d => y(d.totalSales))
    )
  // Add the points
  svg
    .append("g")
    .selectAll("dot")
    .data(groupedData)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.totalSales))
    .attr("r", 5)
    .attr("fill", "#69b3a2")
  // })
}

export default simpleLineChart;