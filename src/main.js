import * as d3 from "d3";
import mainLandingPages from "./components/landingPages";
import drawHeatMap from "./visuals/heatmap_sale";
import saleObj from "./components/saleState";
import marketingObj from "./components/marketingCh";
import simpleLineChart from "./visuals/lineChart_ig";
import createCheckboxes from "./utilities/checkBoxes";

mainLandingPages();
drawHeatMap(saleObj)
simpleLineChart(marketingObj);


import { fileOrders } from "./utilities/allFiles";
import parseName from "./utilities/productName";
import { productSales } from "./utilities/typeHeaders";

// Function to load all CSVs and transform data
async function loadDataTwo() {

  const allFileOrders = await productSales(fileOrders)

  const groupedData = d3.rollup(
    allFileOrders,
    v => d3.sum(v, d => d.quantity),  // Sum the quantity per variant
    d => d.date,
    d => d.name,  // Group by product name
    d => d.variant, // Then group by variant
  );

  // Convert the Map into a structured array
  const groupedArray = [];

  for (const [date, nameMap] of groupedData) {
    for (const [name, variantMap] of nameMap) {
      // Build an array of { variant, totalQuantity }
      const variantsArr = Array.from(variantMap, ([variant, totalQuantity]) => ({
        variant,
        totalQuantity
      }));

      // Push the new object into finalData
      groupedArray.push({
        date,
        name,
        variants: variantsArr
      });
    }
  }

  const filteredProducts = groupedArray.filter(product =>
    /Balconette|Bra|Bralette/i.test(product.name) // Case-insensitive regex match
  );

  // (2) Convert your data so each entry has { product, color }
  function preprocessData(data) {
    return data.map(d => {
      const { product, color } = parseName(d.name);
      return {
        ...d,
        product,
        color,
      };
    });
  }

  // 6) Create a new dataset with product/color fields
  const originalData = preprocessData(filteredProducts);

  // 7) Identify unique products & colors from the data
  //    (We'll use these to build the checkboxes)
  window.allProducts = Array.from(new Set(originalData.map(d => d.product)));
  window.allColors = Array.from(new Set(originalData.map(d => d.color)));
  // (Using window.* is just one way to make them accessible in your updateChart function. 
  //  You could also define them in an outer scope.)

  // 8) Build the UI (the checkboxes), passing updateChart as the callback
  createCheckboxes("#product-filters", allProducts, updateChart);
  createCheckboxes("#color-filters", allColors, updateChart);
  // 4) Build date filter
  d3.select("#daysSelector").on("change", updateChart);

  
  
  drawMultipleStackedBars(originalData)

  function updateChart() {
    // 1) which products are selected?
    const selectedProducts = [];
    d3.selectAll("#product-filters input[type=checkbox]")
      .each(function (d) {
        if (d3.select(this).property("checked")) {
          selectedProducts.push(d3.select(this).attr("value"));
        }
      });
    // 2) which colors are selected?
    const selectedColors = [];
    d3.selectAll("#color-filters input[type=checkbox]")
      .each(function (d) {
        if (d3.select(this).property("checked")) {
          selectedColors.push(d3.select(this).attr("value"));
        }
      });

    // 3) if nothing is checked, interpret as "all selected"
    const productsFilter = selectedProducts.length ? selectedProducts : allProducts;
    const colorsFilter = selectedColors.length ? selectedColors : allColors;

    // 4) read the #daysSelector value
    const selectedDays = +d3.select("#daysSelector").node().value;
    // e.g. 1, 3, 6, 30, or 9999

    // figure out the maximum date among all data
    // (We assume originalData is the preprocessed array you already have)
    const maxDate = d3.max(originalData, d => d.date);
    // if there's no data, bail out
    if (!maxDate) {
      drawMultipleStackedBars([]);
      return;
    }

    // compute the cutoff date (today's max - selectedDays)
    // If "9999" is chosen => user wants "All", so we won't filter by date
    let cutoff = null;
    if (selectedDays !== 9999) {
      cutoff = new Date(maxDate.getTime() - (selectedDays * 24 * 60 * 60 * 1000));
    }

    // 5) Filter the originalData by product, color, and date
    const filteredData = originalData.filter(d => {
      // must match the product filter
      const productMatch = productsFilter.includes(d.product);
      // must match the color filter
      const colorMatch = colorsFilter.includes(d.color);
      // must be on or after cutoff date (if we have a cutoff)
      const dateMatch = cutoff ? (d.date >= cutoff) : true;
      return productMatch && colorMatch && dateMatch;
    });

    // 5) Re‐draw the stacked bars with the filtered subset
    drawMultipleStackedBars(filteredData);
  }
}
//  shop, online store, fc instagram.
loadDataTwo()

function drawMultipleStackedBars(data) {

  const newData = data
    .map(product => ({
      ...product,
      totalQuantity: product.variants.reduce((sum, v) => sum + v.totalQuantity, 0) // Sum all variant quantities
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity) // Sort descending by totalQuantity
    .map(({ totalQuantity, ...rest }) => rest); // Remove totalQuantity from final output

  // 1) Identify all product names by grouping
  const productsMap = d3.group(newData, d => d.name);
  // productsMap is a Map: { "Nude Bralette" -> [ {date, name, variants: [...]}, ... ] }

  // 2) Set up chart dimensions and container
  const width = 400;
  const height = 300;
  const margin = { top: 30, right: 20, bottom: 50, left: 40 };

  const container = d3.select("#products_two").html(""); // clear or use .select() as needed

  // 3) For each product, build a stacked-bar chart
  for (const [productName, entries] of productsMap) {
    // A) Gather & sort all unique dates present in this product’s entries
    const dateKeys = Array.from(
      new Set(entries.map(d => +d.date)) // +d.date => numeric timestamp for sorting
    ).sort((a, b) => a - b);

    const allVariants = [ "xs", "sm", "md","lg","xl","sdd","mdd","ldd","xldd","2xldd"];

    // C) Pivot the data so each object has structure:
    //    { variant: "xs", [date1]: qty, [date2]: qty, ... }
    const pivotedData = allVariants.map(variant => {
      const row = { variant };
      // Initialize all date columns to 0
      for (const dateVal of dateKeys) {
        row[dateVal] = 0;
      }
      // Fill in actual quantities from each entry
      for (const entry of entries) {
        const varData = entry.variants.find(v => v.variant === variant);
        if (varData) {
          row[+entry.date] = varData.totalQuantity;
        }
      }
      return row;
    });

    // D) Prepare the stack generator
    //    Each date is a separate layer in the stack
    const stack = d3.stack()
      .keys(dateKeys); // your "layers" are the different dates

    // Generate the stacked layers
    const series = stack(pivotedData);
    // 'series' is an array of layers (one layer per date).
    // Each layer is an array of points ([y0, y1]) for each variant row.

    // E) Compute max stacked value to define y-scale
    const maxStackedValue = d3.max(series, layer =>
      d3.max(layer, d => d[1])
    );

    // F) Create scales
    const x = d3.scaleBand()
      .domain(allVariants) // each variant on x-axis
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, maxStackedValue])
      .range([height - margin.bottom, margin.top]);

    // A color scale for the "layers" (i.e. each date)
    const color = d3.scaleOrdinal()
      .domain(dateKeys.map(String))
      .range(d3.schemeSet2);

    // G) Create an <svg> for this product
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    // H) Draw stacked bars
    //    One <g> per layer (date), then rectangles for each variant row
    // svg.selectAll("g.layer")
    //   .data(series)
    //   .enter().append("g")
    //     .attr("class", "layer")
    //     .attr("fill", (d, i) => color(String(dateKeys[i])))
    //   .selectAll("rect")
    //   .data(d => d) // each sub-array for the variants
    //   .enter().append("rect")
    //     .attr("x", d => x(d.data.variant))
    //     .attr("y", d => y(d[1]))
    //     .attr("height", d => y(d[0]) - y(d[1]))
    //     .attr("width", x.bandwidth());

    // 1) Create a tooltip (often appended to <body> or the container)
    const tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#fff")
      .style("border", "1px solid #999")
      .style("border-radius", "4px")
      .style("padding", "5px 8px")
      .style("font-size", "12px")
      .style("opacity", 0); // start hidden

    // H) Draw stacked bars with a "layer reveal" animation.
    const bar = svg.selectAll("g.layer")
      .data(series)
      .enter().append("g")
      .attr("class", "layer")
      .attr("fill", (d, i) => color(String(dateKeys[i])));

    // First, append <rect> elements with y= y(0) and height=0
    // so they are "collapsed."
    bar.selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x(d.data.variant))
      .attr("width", x.bandwidth())
      .attr("y", y(0))       // start from the bottom
      .attr("height", 0)    // no initial height
      // 4) Add tooltip events
      .on("mouseover", function (event, dRect) {
        // 'this' is the rect; 'dRect' is the stacked point [y0, y1],
        // plus dRect.data for the row data (which includes `variant`).

        // The parent group has data for the entire layer:
        //   each barGroups node has the form: [ [y0,y1], [y0,y1], ... ]
        // But we actually need the date index from the parent's data index.
        // Easiest is to do the “each” layering approach shown below,
        // or simply store the date inside a local variable.
        // If we structured it using barGroups.each(...) see next code block.

        tooltip.style("opacity", 1);

        // Quantity is (y1 - y0)
        const quantity = dRect[1] - dRect[0];
        // The layer index is the parent <g>’s datum index:
        const layerIndex = d3.select(this.parentNode).datum().index;
        // (But in standard d3.stack output, the .index property may vary 
        //  depending on your d3 version. You can also pass it around manually.)

        // If your stack data doesn’t have .index, you can do:
        //   const g = d3.select(this.parentNode);
        //   const i = barGroups.nodes().indexOf(g.node());
        //   const dateVal = dateKeys[i];
        // OR just do the barGroups.each(...) approach (shown below).

        // For demonstration, let's assume "layerIndex" gives the correct date index:
        const dateVal = dateKeys[layerIndex];
        // Convert dateVal (timestamp) to a nice string
        const dateStr = d3.timeFormat("%Y-%m-%d")(new Date(dateVal));

        tooltip.html(`
        <strong>Date:</strong> ${dateStr}<br/>
        <strong>Variant:</strong> ${dRect.data.variant}<br/>
        <strong>Qty:</strong> ${quantity}
      `);
      })
      .on("mousemove", function (event) {
        // Move tooltip near the mouse
        tooltip
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY + 12) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });
    // Now, for each layer, transition the rectangles to their
    // correct stacked heights, adding a delay so that each date
    // appears in sequence. i * 1000 => wait 1s per layer index.
    bar.each(function (d, i) {
      d3.select(this).selectAll("rect")
        .transition()
        .delay(i * 1000)       // delay each layer i by i*1000 ms
        .duration(800)         // how long the animation lasts
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]));
    });

    // I) Add X-axis (variants)
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "-0.2em")
      .attr("transform", "rotate(-30)");

    // J) Add Y-axis (stacked quantity)
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(6));

    // K) Add product name as a title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(productName);
  }
}