// =========================
// Load CSV and prepare data
// =========================
d3.csv("csv/virus_media_viz_500.csv").then(data => {

    // ---- PREP DATA ----
    data.forEach(d => {
        d.num_rep = +d.num_rep;
        d.minutes_since_first = +d.minutes_since_first;
        d.virus_id = +d.virus_id;
    });

    // One image per virus_id (for feed)
    const uniqueVirus = Array.from(
        d3.group(data, d => d.virus_id),
        ([virus_id, rows]) => rows[0]
    );

    // ---- INITIALIZE FEED ----
    const feedContainer = d3.select("#image-feed");
    const searchInput = d3.select("#search-bar");

    function renderFeed(filteredData) {
        // clear previous images
        feedContainer.selectAll("img").remove();

        feedContainer.selectAll("img")
            .data(filteredData)
            .enter()
            .append("img")
            .attr("src", d => `images_2/${d.virus_image}`)
            .attr("alt", d => d.title)
            .style("opacity", d => {
                switch (d.num_rep) {
                    case 5: return 1;
                    case 4: return 0.9;
                    case 3: return 0.7;
                    case 2: return 0.5;
                    default: return 0.5;
                }
            })
            .on("click", (event, d) => {
                // reset opacity for all images
                d3.selectAll("#image-feed img")
                    .style("opacity", img => {
                        switch (img.num_rep) {
                            case 5: return 1;
                            case 4: return 0.9;
                            case 3: return 0.7;
                            case 2: return 0.5;
                            default: return 0.5;
                        }
                    });

                // highlight clicked image
                d3.select(event.currentTarget).style("opacity", 1);

                // update viz + title
                updateVisualisation(d.virus_id);
                updateTitle(d);
            });
    }

    // ---- SEARCH FILTER ----
    searchInput.on("input", (event) => {
        const query = event.target.value.toLowerCase();
        const filtered = uniqueVirus.filter(d => d.title.toLowerCase().includes(query));

        if(filtered.length > 0){
            renderFeed(filtered);
            updateTitle(filtered[0]);
            updateVisualisation(filtered[0].virus_id);
        } else {
            renderFeed([]);
        }
    });

    // ---- INITIAL RENDER ----
    renderFeed(uniqueVirus);
    updateTitle(uniqueVirus[0]);
    updateVisualisation(uniqueVirus[0].virus_id);

    // =========================
    // VISUALISATION FUNCTION
    // =========================
    function updateVisualisation(virus_id) {
        const selected = data
            .filter(d => d.virus_id === virus_id)
            .sort((a, b) => a.minutes_since_first - b.minutes_since_first);

        const vis = d3.select("#visualisation");
        vis.selectAll("*").remove();

        const width = vis.node().clientWidth;
        const height = vis.node().clientHeight;

        const svg = vis.append("svg")
            .attr("width", width)
            .attr("height", height);

        const margin = { top: 20, right: 200, bottom: 20, left: 150 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const x = d3.scaleLinear()
            .domain([0, d3.max(selected, d => d.minutes_since_first)])
            .range([0, innerWidth]);

        const y = d3.scalePoint()
            .domain(selected.map(d => d.media))
            .range([0, innerHeight])
            .padding(0.5);

        const line = d3.line()
            .x(d => x(d.minutes_since_first))
            .y(d => y(d.media))
            .curve(d3.curveMonotoneX);

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Labels
        g.selectAll(".node-label")
            .data(selected)
            .enter()
            .append("text")
            .attr("x", d => x(d.minutes_since_first) + 12)
            .attr("y", d => y(d.media) + 4)
            .text(d => `${d.time} ${d.media}`)
            .attr("fill", "white")
            .attr("font-size", "14px")
            .attr("font-family", "IBM Plex Serif");

        // Path
        g.append("path")
            .datum(selected)
            .attr("d", line)
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .attr("fill", "none")
            .attr("opacity", 0.3);

        // Nodes
        g.selectAll(".node")
            .data(selected)
            .enter()
            .append("rect")
            .attr("x", d => x(d.minutes_since_first) - 5)
            .attr("y", d => y(d.media) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", "white")
            .attr("stroke-width", 1);
    }

    // =========================
    // TITLE / DAY / BACKGROUND
    // =========================
    function updateTitle(d) {
        document.getElementById("viz-title").textContent = d.title;
        document.getElementById("viz-day").textContent = d.day;
        document.getElementById("viz-time").textContent = d.time;

        // background image
        document.body.style.setProperty(
            "--bg-image",
            `url(images_2/${d.virus_image})`
        );
    }

});
