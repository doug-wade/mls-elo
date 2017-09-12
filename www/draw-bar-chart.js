const d3 = require('d3');
const draws = require('./draws.json');
require('./index.css');

const intermediateData = draws.reduce((acc, elem) => {
  const difference = Math.floor((elem.homeelo + 100) - elem.awayelo);
  if (!acc[difference]) {
    acc[difference] = 1;
  } else {
    acc[difference]++;
  }
  return acc;
}, {});
const min = Number.Infinity;
const max = Number.NegativeInfinity;
const data = Object.keys(intermediateData).reduce((acc, elem) => {
  const count = intermediateData[elem];
  if (count < min) {
    min = count;
  }
  if (count > max) {
    max = count;
  }
  if (elem < 0) {
    acc.unshift({elo: +elem, count});
  } else {
    acc.push({elo: +elem, count});
  }
  return acc;
}, []);

data.sort((a, b) => {
  if (a.elo < b.elo) {
    return -1;
  }
  if (a.elo > b.elo) {
    return 1;
  }
  return 0;
})

d3.select(".chart")
  .selectAll("div")
    .data(data)
  .enter().append("div")
    .style("width", function(d) { return d.count * 40 + "px"; })
    .text(function(d) { return `count: ${d.count} elo: ${d.elo}`; });
