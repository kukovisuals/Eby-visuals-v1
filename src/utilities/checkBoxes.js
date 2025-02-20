import * as d3 from "d3";

function createCheckboxes(containerSelector, items, changeHandler) {
    // Remove anything that might be in the container first 
    d3.select(containerSelector).html("");

    d3.select(containerSelector)
        .selectAll("label")
        .data(items)
        .enter()
        .append("label")
        .each(function (d) {
            // Each label has text + an <input> inside
            const label = d3.select(this);

            label
                .append("input")
                .attr("type", "checkbox")
                .attr("value", d) // use the string name
                // If you want them default-checked, do: .property("checked", true)
                .on("change", changeHandler);

            // Then the label text
            label.append("span")
                .text(" " + d + " ");
        });
}

export default createCheckboxes;