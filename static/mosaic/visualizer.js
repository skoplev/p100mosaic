// Parses csv string into array of array.
// Default data type is string.
// formatter is a function that is applied to to each string element.
// It can be used to convert strings to numbers: parseCsv(csv, Number)
function parseCsv(csv, formatter) {
	// separate csv stream into its components
	return csv.split("\n")
		.filter(function(line) {return line !== ""})  // exclude empty lines
		.map(function(line) {
			if (typeof formatter === "undefined") {
				// return array of strings
				return line.split(",");
			} else {
				// apply formatter to each element of line and return 
				return line.split(",").map(formatter);
			}
		});
}

function parseGmt(gmt) {
	return gmt.split("\n")
		.filter(function(line) {return line !== ""})  // exclude empty lines
		.map(function(line) {
			return line.split("\t");
		});
}

// Flatten nested arrays
Array.prototype.flatten = function() {
    var ret = [];
    for (var i = 0; i < this.length; i++) {
        if (Array.isArray(this[i])) {
            ret = ret.concat(this[i].flatten());
        } else {
            ret.push(this[i]);
        }
    }
    return ret;
};

Array.prototype.contains = function(v) {
    for (var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for (var i = 0; i < this.length; i++) {
        if (!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

// Extension of indexOf which returns an array with all matches
Array.prototype.indexOfAll = function(val) {
	var indexes = [];
	i = - 1;

	while ((i = this.indexOf(val, i + 1)) !== -1) {
		indexes.push(i);
	}
	return indexes;
}


// Check if numeric
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


// data is array of array
// First entry of data is assumed to be the field specifier
function getColumn(data, field) {
	// find index of the field
	var k = data[0].indexOf(field);

	// extract values to vector
	var values = data
		.slice(1)  // excludes first element of data
		.map(function(row) {return row[k]});  // extract values
	return(values);
}

// Look up perturbation related metadata from table.
// Returns javascript object in the format fields: value.
function getPertMetaData(meta_data, id) {

	// Get the column numbers that describe the pertrubation.
	var pert_pattern = /^pert_/;
	var pert_fields_bool = meta_data[0].map(function(name) {
		return pert_pattern.test(name);
	});
	var pert_cols = pert_fields_bool.indexOfAll(true);

	// Find entry
	var pert_row = getColumn(meta_data, "pert_id").indexOf(id);

	// Format metadata into javascript object.
	var out = {};

	for (var i = 0; i < pert_cols.length; i++) {
		var name = meta_data[0][pert_cols[i]];
		var value = meta_data[pert_row + 1][pert_cols[i]];
		out[name] = value;
	}

	return out;
}

// Selects, and returns, either field pert_iname or pert_desc.
function pertDescrIname(meta_obj) {
	if (meta_obj.pert_iname !== "NA") {
		return meta_obj.pert_iname;
	} else {
		return meta_obj.pert_desc;
	}
}

function applyTwice(arr1, arr2, fun) {
	if (arr1.length !== arr2.length) {
		console.log("WARNING: applyTwice() called with arrays of different lenght.")
	}

	var arr = new Array(arr1.length);

	for (var i = 0; i < arr.length; i++) {
		arr[i] = fun(arr1[i], arr2[i]);
	}
	return(arr);
}


function and(a, b) {return a && b}
function or(a, b) {return a || b}

var grayScale = d3.scale.linear()
	    .domain([-40.0, 0, 40.0])
	    .clamp(true)  // color scale is clammed to boundary if values are out of range
	    .range(["rgb(102,102,102)", "rgb(247,247,247)", "rgb(77,77,77)"]);  // RdBu from Colorbrewer	

// Callback function when gene set is selected. 
function geneSelector(sel) {

	if (sel.value === -1) {
		d3.selectAll("svg").selectAll(".rect-p100")
			.style("fill", function(d) {
					if (isNaN(d.num)) {
						return "white";
					} else {
						return(colorScale(d.num));
					}
				}
			);
	} else {

	}

	if (sel.value < 0) {
		d3.selectAll("svg").selectAll(".rect-p100")
			.style("fill", function(d) {
					if (isNaN(d.num)) {
						return "white";
					} else {
						return(colorScale(d.num));
					}
				}
			);
	} else {
		// get gene list of selection
		gene_sel = gene_lists[sel.value];  // contains 

		// calculate feature ids that are included in selection
		var sel_bool = getColumn(p100_meta_row, "pr_gene_symbol")
			.map(function(symbol) {return gene_sel.contains(symbol)});

		sel_index = sel_bool.indexOfAll(true);


		// convert non-selections to corresponding greyscale of the same luminosity

		d3.selectAll("svg").selectAll(".rect-p100")
			.style("fill", function(d) {
					if (sel.value === -1 || sel_index.contains(d.feature_id)) {
						// in colors
						if (isNaN(d.num)) {
							return "white";
						} else {
							return(colorScale(d.num));
						}
					} else {
						// greyscale
						if (isNaN(d.num)) {
							return "white";
						} else {
							return(grayScale(d.num));
						}
					}
				}
			);
	}
}

// Constructs grid data with coordinates.
// frame_size specifies the maximum
// order can contain duplicates and specifies the layout.
function buildGridData(numbers, order, frame_size) {

	// Default order array
	if (typeof order === "undefined" || order.constructor !== Array) {
		order = d3.range(numbers.length);
		console.log("WARNING: buildGridData called without an order array.");
	}

	// Calculate dimensionality of layout. The maximum number of cells
	var dim = Math.ceil(Math.sqrt(numbers.length));

	// Calculate square size
	var square_size = frame_size / dim;

	// Pen (cursor) position
	var pen_xpos = 0.0;
	var pen_ypos = 0.0;

	// gene symbols
	var grid_data = [];
	for (var i = 0; i < order.length; i++) {

		// Check if new row should be initiated.
		if (i !== 0 && i % dim == 0) {
			// new row
			pen_xpos = 0.0;
			pen_ypos += square_size;
		} 

		// Construct data object
		dobj = {};
		dobj.x = pen_xpos;
		dobj.y = pen_ypos;
		dobj.size = square_size;
		dobj.num = numbers[order[i]];  // data value
		dobj.feature_id = order[i];  // for looking up metadata

		grid_data.push(dobj);

		// Advance cursor
		pen_xpos += square_size;
	}

	return(grid_data);
}


// Trim svg element to bounday box
function trimSvg(svg) {
	var box = svg.node().getBBox();
	svg.attr("width", box.width + box.x);
	svg.attr("height", box.height + box.y);
}
