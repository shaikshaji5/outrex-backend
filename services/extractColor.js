const {FastAverageColor}= require("fast-average-color");

async function getDominantColor(imageUrl) {
  const fac = new FastAverageColor();
  const color = await fac.getColorAsync(imageUrl);

  console.log("Dominant Color:", color.hex);
  return color.hex; // Returns hex code like "#ff5733"
}
module.exports = { getDominantColor };
