import * as d3 from "d3";

export async function landingPages(files) {
    let allData = [];

    for (const { file, date } of files) {
        const data = await d3.csv(file, d => {

            return {
                year: date,
                name: d["Landing page path"] || "UNKNOWN",
                n: +d["Sessions"] || 0,
                cartAdditions: +d["Sessions with cart additions"] || 0,
                cvr: +d["Conversion rate"] * 100 || 0 // Ensure it's a number
            };
        });
        allData.push(...data);
    }

    return allData
}

export async function stateSales(files) {

  let allSaleState = [];

  for (const { file, date } of files) {
    const data = await d3.csv(file, d => {

      return {
        date,
        states: d["Shipping region"],
        totalSales: +d["Total sales"] || 0,
      }
    });
    allSaleState.push(...data);
  }

  return allSaleState
}

export async function channelSale(files) {

  let allSaleReferrer = [];

  for (const { file, date } of files) {
    const data = await d3.csv(file, d => {

      return {
        date: new Date(date),
        name: d["Order referrer name"] || "UKNOWN",
        totalSales: +d["Net sales"] || 0,
      }
    });
    allSaleReferrer.push(...data);
  }

  return allSaleReferrer;
}

export async function productSales(files) {

    let allFileOrders = [];
  
    for (const { file, date } of files) {
      const data = await d3.csv(file, d => {
        if (d["Lineitem name"]?.includes("Extender")) return null;
        if (d["Lineitem name"]?.includes("Subscription")) return null;
        if (d["Name"]?.includes("EXC")) return null;

        let variant;
        let name;
        if (d["Lineitem name"]) {
          const parts = d["Lineitem name"].split(" - ");
          name = parts[0] || "Unknown";
          variant = parts[1]?.toLowerCase();
        }
  
        return {
          // Convert the passed-in 'date' to a Date object
          date: new Date(date),
          name,
          variant,
          quantity: +d["Lineitem quantity"] || 0,
        };
      });
      // Flatten everything into one array
      allFileOrders.push(...data);
    }

    return allFileOrders
}