
// find out how much space we have to draw in
const width = d3.select('.map').node().clientWidth;
const height = d3.select('.map').node().clientHeight;

// create somewhere to draw
let choro_svg = d3.select('.map').append('svg').attr("width",width).attr('height', height);

// projection to scale coordinates, path to draw lines within those coordinates
let projection = d3.geoMercator();
let path = d3.geoPath().projection(projection);

let map = undefined;

// a colour scheme
const color = d3.scaleSequential(d3.interpolateReds);

// a list of years for the data - would be better to read this dynamically from the data itself but meh
let years = ['2014/15', '2015/16', '2016/17', '2018/19', '2019/20', '2020/21', '2021/22', '2022/23'];


// load the map data and the source data
Promise.all([
    d3.json('data/lad-dec2023-clipped-simple.topojson'),
    d3.csv('data/affordability.csv')
]).then(([lad_boundaries, csv_data]) => {

    // work out our maximum and minimum values for the data over *all* years
    let min = Number.MAX_SAFE_INTEGER;
    for(y of years){
        let min_year = d3.min(csv_data, d => +d[y]);
        if(min_year < min){
            min = min_year;
        }
    }

    let max = 0;
    for(y of years){
        let max_year = d3.max(csv_data, d => +d[y]);
        if(max_year > max){
            max = max_year;
        }
    }  

    color.domain([min, max]);

    // get the boundary data we're working with - just england ('E') and wales ('W')
    lad_boundaries.objects['lad-dec2023-clipped'].geometries = lad_boundaries.objects['lad-dec2023-clipped'].geometries.filter((lad) => {
        return lad.properties.LAD23CD.startsWith('E') || lad.properties.LAD23CD.startsWith('W');
    });

    let lad = topojson.feature(lad_boundaries, lad_boundaries.objects['lad-dec2023-clipped']);

    projection.fitSize([width, height], lad);

    // if they click next, draw the next year
    d3.select('#nextbutton').on('click', function(){ 
        d3.select('#yearselect').node().value = +d3.select('#yearselect').node().value + 1;
        let year = years[d3.select('#yearselect').node().value];
        d3.select('#yeartitle').text(year);
        draw(year, lad, csv_data);
    });

    // if they click previous, draw the previous year
    d3.select('#previousbutton').on('click', function(){ 
        d3.select('#yearselect').node().value = +d3.select('#yearselect').node().value - 1;
        let year = years[d3.select('#yearselect').node().value];
        d3.select('#yeartitle').text(year);
        draw(year, lad, csv_data);
    });

    // if they change the slider, draw the year they've selected
    d3.select('#yearselect').on('change', function(){
        let year = years[this.value];
        d3.select('#yeartitle').text(year);
        draw(year, lad, csv_data);
    });        
    
    // draw the starting year
    let year = years[d3.select('#yearselect').node().value];
    draw(year, lad, csv_data);
});

function draw(year, lad, csv_data){
    // draw a map
    map = choro_svg.selectAll('path')
        .data(lad.features)
        .join((enter) => {
            enter.append('path')
            .attr('d', path)
            // colour it according to the data
            .attr('fill', d => {
                let lad_code = d.properties.LAD23CD;
                if(csv_data.find(e => e['LA code'] === lad_code) === undefined){
                    return 'white';
                } else {
                    return color(csv_data.find(e => e['LA code'] === d.properties.LAD23CD)[year])
                }
            })
            .attr('id', d => d.properties.LAD23CD)
            .attr('stroke', '#eee')
            .attr('stroke-width', '1px')
        }, (update) =>{
            update.attr('fill', d => {
                let lad_code = d.properties.LAD23CD;
                if(csv_data.find(e => e['LA code'] === lad_code) === undefined){
                    return 'white';
                } else {
                    return color(csv_data.find(e => e['LA code'] === d.properties.LAD23CD)[year])
                }
            });
        });
}