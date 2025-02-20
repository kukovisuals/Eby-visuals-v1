import * as d3 from "d3";

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

const originalData = preprocessData(filteredProducts);

return originalData