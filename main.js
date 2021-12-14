// CONSTANTS ################################################
const height = window.innerHeight * 0.8;
const margin = {
    top: 50,
    left: 50,
    right: 200,
    bottom: 50
  },
  radius = 5;
const allGenres = ["Comedy", "Drama", "Adventure", "Thriller", "Horror", "Action", "Romance"];
const allColors = ["Yellow", "Red", "Green", "Purple", "Black", "Blue", "Pink"];

// Limiting the width to prevent a stretched graph
let width = window.innerWidth * 0.8;
width = width > height ? height + margin.right : width;

// Variables to be assigned in init() and used in draw()
let svg, 
xScale, 
yScale, 
colorScale;

// APPLICATION STATE #########################################
let state = {
  data: [],
  selectedGenre: "All" 
};

// IMPORT IN DATA ############################################
d3.csv("Movie-Ratings.csv", d3.autoType).then(raw_data => {
  
  // Save the imported data into state object & Sort by budget size
  state.data = raw_data.sort((a, b) => b["Budget (million $)"] - a["Budget (million $)"]);
  
  // Call init() function right after importing data
  init();
});

// INITIALIZING FUNTION ######################################
function init() {
  
  // SCALES =================================================
  xScale = d3.scaleLinear()
    .domain(d3.extent(state.data, d => d["Rotten Tomatoes Ratings %"]))
    .range([margin.left, width - margin.right]);

  yScale = d3.scaleLinear()
    .domain(d3.extent(state.data, d => d["Audience Ratings %"]))
    .range([height - margin.top, margin.bottom]);

  colorScale = d3.scaleOrdinal()
    .domain(allGenres)
    .range(allColors)

  sizeScale = d3.scaleSqrt()
    .domain([1, d3.max(state.data, d => d["Budget (million $)"])])
    .range([3, 16]);

  // CREATE MAIN SVG ELEMENT ==================================
  svg = d3.select("#container")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  // AXIS TICKS  ----------------------------------------------
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.top})`)
    .call(d3.axisBottom(xScale));
  
  svg.append("g")
    .attr("transform", `translate(${margin.bottom},0)`)
    .call(d3.axisLeft(yScale));

  // AXIS LABELS ----------------------------------------------
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left * 2)
    .attr("y", height - 6)
    .style("font-weight", "bold")
    .style("font-size", "1.2rem")
    .text("Rotten Tomatoes Ratings %");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", -height / 2 + margin.left * 2)
    .attr("y", 15)
    .style("font-weight", "bold")
    .style("font-size", "1.2rem")
    .attr("transform", "rotate(-90)")
    .text("Audience Ratings %");

  // LEGENDS ------------------------------------------------

  // Title for Genre Legend
  svg.append("text")
    .text("Genre:")
    .attr("x", width - margin.right / 2 - 15)
    .attr("y", 110)
    .style("font-size", "1rem")
    .style("font-weight", "bold")

  // Color dots for Genre Legend
  svg.selectAll(".legend-dot")
    .data(allColors)
    .join("circle")
    .attr("class", "legend-dot")
    .attr("cx", width - margin.right * .6 - 10)
    .attr("cy", (_, i) => 130 + i * 20)
    .attr("r", 6)
    .style("fill", d => d)
    .attr("stroke", "black")
    .attr("opacity", "0.6")

  // Genre labels for Genre Legend
  svg.selectAll(".legend-genre")
    .data(allGenres)
    .join("text")
    .attr("class", "legend-genre")
    .attr("x", width - margin.right / 2 - 10)
    .attr("y", (_, i) => 130 + i * 20)
    .text(d => d)
    .style("font-size", "15px")
    .attr("alignment-baseline","middle")

  // Grabbing the min, median, and max of budgets
  const allBudgets = state.data.map(d => d["Budget (million $)"]);
  const threeBudgets = [
    d3.min(allBudgets), 
    d3.median(allBudgets), 
    d3.max(allBudgets)
  ];

  // Title for Budget Legend
  svg.append("text")
    .text("Budget:")
    .attr("x", width - margin.right / 2 - 17)
    .attr("y", 355)
    .style("font-size", "1rem")
    .style("font-weight", "bold")

  // Circle Sizes for Budget Legend
  svg.selectAll(".legend-size")
    .data(threeBudgets)
    .join("circle")
    .attr("class", "legend-size")
    .attr("cx", d => width - margin.right * .6 - sizeScale(d) / 2 - 5)
    .attr("cy", (_, i) => 378 + i * 35)
    .attr("r", d => sizeScale(d))
    .style("fill", "white")
    .attr("stroke", "black")
    .attr("opacity", "0.6")

  // Budget Dollars for Budget Legend
  svg.selectAll(".legend-budget")
    .data(threeBudgets)
    .join("text")
    .attr("class", "legend-budget")
    .attr("x", width - margin.right * .45 - 5)
    .attr("y", (_, i) => 380 + i * 35)
    .text(d => d === 0 ? "< $1 mill" : `$${d} mill`)
    .style("font-size", "15px")
    .attr("alignment-baseline","middle")

  // USER INTERFACE SETUP FOR VIS OPTIONS ===================

  // Grab elements for listeners and values
  const selectMenu = d3.select("#dropdown");
  const selectGenreText = d3.selectAll(".legend-genre");
  const selectGenreColor = d3.selectAll(".legend-dot");

  // Create array for holding vis options 
  const menuData = [{key: "All", label: "All"}];

  // Fill menuData with the possible data vis options
  allGenres.map(genre => {
    menuData.push({key: genre, label: genre})
  });

  // Create options in UI menu for user to click
  selectMenu.selectAll("option")
    .data(menuData)
    .join("option")
    .attr("value", d => d.key)
    .text(d => d.label);

  // Listen for user changes on menu and call draw
  selectMenu.on("change", event => {
    state.selectedGenre = event.target.value;
    draw();
  });

  // Listen for clicks on Genres or Colors
  selectGenreText.on("click", (_, d) => updateSelection(d));
  selectGenreColor.on("click", (_, d) => updateSelection(d));

  // Update selected genre and call draw
  const updateSelection = (d) => {

    // Get index of genre or color
    let genreIdx = allGenres.indexOf(d) >= 0 ?
                    allGenres.indexOf(d) :
                    allColors.indexOf(d);

    // Change menu option to current select option
    document.getElementById("dropdown").options.selectedIndex = genreIdx + 1;

    state.selectedGenre = allGenres[genreIdx];

    draw();
  }

  // Call draw function once Init() is finished for the first time
  draw(); 
}

// DRAW FUNCTION ####################################################
function draw() {

  // Filter wanted data based on current state
  const filteredData = state.data
        .filter(d => state.selectedGenre === "All" || state.selectedGenre === d.Genre);

  // Tooltip Handling =============================================
  const tooltip = d3.select("#tooltip");

  // Tooltip Mouseover 
  const tipMouseover = function(event, d) {

    const tooltipHTML = `<b>Title:</b> ${d.Film}<br/>
                          <b>Genre:</b> ${d.Genre}</span><br/>
                          <b>Rotten Tomatoes:</b> ${d["Rotten Tomatoes Ratings %"]}%<br/>
                          <b>Audience Ratings:</b> ${d["Audience Ratings %"]}%<br/> 
                          <b>Budget:</b> $${d["Budget (million $)"]} million (USD)<br>
                          <b>Year:</b> ${d["Year of release"]}`;

    let color = colorScale(d.Genre);
    let size = sizeScale(d["Budget (million $)"]);

    tooltip.html(tooltipHTML)
      .style("left", ((d.Film.length >= 20 ? // Dynamic positioning if long film title
                        event.pageX - 160 - ((d.Film.length - 19) * 5) : 
                        event.pageX - 160) + "px"))  
      .style("top", (event.pageY - 120 - 0.5 * size + "px"))
      .style("border", `${color} solid 0.2rem`) // Same border color as genre
      .style("outline", "1px solid black")
      .transition()
        .duration(100) 
        .style("opacity", .85) 

    d3.select(this)
      .transition()
      .duration(100)
      .style("opacity", 1);
  };

  // Tooltip Mouseout
  const tipMouseout = function(d) {
      tooltip.transition()
          .duration(200) 
          .style("opacity", 0); // Make tooltip div invisible

      d3.select(this)
      .transition()
      .duration(200)
      .style("opacity", 0.5);
  };

  // Draw SVG Scatterplot ==========================================
  const dots = svg.selectAll("circle.dot")
  .data(filteredData, d => d.Film)
  .join(
    enter => enter
      .append("circle")
        .attr("class", "dot")
        .attr("transform", d => `translate(${xScale(d["Rotten Tomatoes Ratings %"])}, 
                                ${yScale(d["Audience Ratings %"])})`)
        .attr("r", 0)
        .attr("fill", d => colorScale(d.Genre))
        .attr("stroke", "black")
        .attr("opacity", "0.4")
        .on("mouseover", tipMouseover)
        .on("mouseout", tipMouseout)
      .call(enter => enter.transition()
        .duration(500)
        .attr("r", d => sizeScale(d["Budget (million $)"]))
        ),
    update => update
      .attr("opacity", "1")
      .call(update => update.transition()
        .duration(1000)
        .attr("opacity", "0.4")),
    exit => exit
      .call(exit => exit.transition()
        .duration(500)
        .attr("r", 0))
        .remove()
  );
}
