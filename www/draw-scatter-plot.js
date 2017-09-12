const d3 = require('d3');
const draws = require('./draws.json');

const context = d3.select("canvas").node().getContext("2d"),
    svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

const k = height / width,
    x = d3.scaleLinear().domain([1000, 1500]).range([0, width]),
    y = d3.scaleLinear().domain([1000, 1500]).range([height, 0]),
    z = d3.schemeCategory10;

var xAxis = d3.axisTop(x).ticks(12),
    yAxis = d3.axisRight(y).ticks(12 * height / width);

var gx = svg.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + (height - 10) + ")")
    .call(xAxis);

var gy = svg.append("g")
    .attr("class", "axis axis--y")
    .attr("transform", "translate(10,0)")
    .call(yAxis);

  d3.json('draws.json', data => {
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "circle")
        .attr("cx", function (d) { return x(d.homeelo); })
        .attr("cy", function (d) { return y(d.awayelo); })
        .transition()
        .duration(800)
        .attr("r", function (d) { return 2; });
  });
