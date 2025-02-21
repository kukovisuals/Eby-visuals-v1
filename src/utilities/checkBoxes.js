import * as d3 from "d3";

function createCheckboxes(containerSelector, items, changeHandler) {
    // 1) Clear out existing content
    d3.select(containerSelector).html("");

    d3.select('.mainWrapper')
        .style("display", "flex")

    d3.select(".container-filter")
        .style("width", "50%");
    // 2) Create a toggle butto   n
    const toggleButton = d3.select(containerSelector)
        .append("button")
        .text("Show Filters")  // initial label
        .style("margin-bottom", "8px");

    // 3) Create a container <div> for the checkboxes (initially hidden)
    const checkboxContainer = d3.select(containerSelector)
        .append("div")
        .style("display", "none")               // hidden by default
        .style("flex-wrap", "wrap")
        .style("gap", "10px")
        .style("padding", "10px")
        .style("border", "1px solid #ddd")
        .style("border-radius", "8px")
        .style("background", "#fafafa");

    // 4) Populate the container with <label> + <input> checkboxes
    checkboxContainer.selectAll("label")
        .data(items)
        .enter()
        .append("label")
        .style("display", "inline-flex")
        .style("align-items", "center")
        .style("gap", "6px")
        .style("margin-right", "10px")
        .each(function (d) {
            const label = d3.select(this);

            label.append("input")
                .attr("type", "checkbox")
                .attr("value", d)
                .on("change", changeHandler);

            label.append("span")
                .text(d);
        });

    // 5) Button logic: Toggle visibility & button text
    let isVisible = false;
    toggleButton.on("click", () => {
        isVisible = !isVisible;
        checkboxContainer.style("display", isVisible ? "flex" : "none");
        toggleButton.text(isVisible ? "Hide Filters" : "Show Filters");
    });
}

export default createCheckboxes;
