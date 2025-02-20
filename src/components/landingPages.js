import { landingPages } from "../utilities/typeHeaders";
import { files } from "../utilities/allFiles";
import drawChart from "../visuals/stackChart_pages";
// Function to load all CSVs and transform data
async function mainLandingPages() {

  const alldata = await landingPages(files);
  // Group by date
  console.log("all data", alldata)
  const cleanData_1 = alldata.filter(d => (d.cartAdditions > 100))
  const cleanData_2 = alldata.filter(d => (d.cartAdditions < 100 & d.cartAdditions > 50))
  const cleanData_3 = alldata.filter(d => (d.cartAdditions < 50 & d.cartAdditions > 10))

  drawChart(cleanData_1, '#chart_1', "n");
  drawChart(cleanData_2, '#chart_2', "n");
  drawChart(cleanData_3, '#chart_3', "n");
}

export default mainLandingPages;