var fs = require('fs');
var filename = process.argv[2];
var outputFilename = process.argv[3]; // unused atm

fs.readFile(filename, 'utf8', function(err, data) {
	if (err) throw err;
	console.log('using', filename);

	var jsonData = smf2json(data); // unaltered smf information
	var distilledData = distill(jsonData); // converted data to krunker map spec
	var objectData = JSON.stringify(distilledData); 

	console.log("Object data:");
	console.log(require('util').inspect(distilledData, true, 10)); // debugging

	console.log("Copy below:");
	// generic map headers for now
	console.log('{"name":"New Krunker Map","modURL":"","shadowR":1024,"ambient":9937064,"light":15923452,"sky":14477549,"fog":9280160,"fogD":900,"camPos":[0,0,0],"spawns":[],"objects":' 
		+ objectData + '}');
});


// what a mess
// converting smf syntax into valid json
// returns object
function smf2json(data) {
	data = data.trim().split("\n"); // to array and trim blank lines

	for (i=0;i<data.length;i++) {
		data[i] = data[i].replace(/\r?\n|\r|\t/g, '').trim(); // remove whitespace 
		data[i] = data[i].replace(/\\/g, '\\\\'); // escape backslashes


		if (data[i].startsWith("{")) {
			// nothing
		} else if (data[i].startsWith("}")) {
			if (typeof data[i+1] !== "undefined" ) {
				if (data[i+1].trim().startsWith("}")) {} else
					data[i] = data[i] + ","; // add commas after closing brace if appropriate
			}

		} else if (data[i].startsWith("\"")) { // value
			data[i] = data[i].replace(/" "/g, '": "'); // add colons
			if (data[i+1].trim().startsWith("}")) {} else
				data[i] = data[i] + ","; // add commas after key:value pairs if appropriate
		} else
			data[i] = "\"" + data[i] + "\":"; // i forget what this does but it's important
	}

	data = "{" + data.join('') + "}"; // back to string

	// can't have duplicate key names in a js object
	// https://stackoverflow.com/questions/38992106/parsing-nested-json-objects-with-duplicate-keys-php-or-js
	var re = /\"(\w+?)(?=\":\{)/g, names = {}, dups;

	data.match(re).forEach(function(v){
		v = v.replace(/\"/, "");
		(!names[v])? names[v] = 1 : names[v]++;
	});

	dups = Object.keys(names).filter(function(k) { return names[k] > 1; }); // getting duplicated keys
	dups.forEach(function (k) {
		var count = names[k], i;
		names[k] = [];
		for (i = 0; i < count; i++)
			names[k].push((i+1));
	});

	data = data.replace(re, function (p1) { // replacing duplicate keys
		p1 = p1.substr(1);
		if (dups.indexOf(p1) !== -1) 
			return '"' + p1 + names[p1].shift();
		else
			return '"' + p1;
	});

	console.log(data); // string
	data = JSON.parse(data);
	return data;
}

// pull relevant information from json
// output in krunker format
function distill(data) {
	data = data.Root; // ignore the top level "Root" object
	var positionVals = {};
	var sizeVals     = {};
	var kmjObjects   = []; // this gets returned

	var regEntities = /^Entity/g;
	var regSolids   = /^Solid/g;
	var regFaces    = /^Face/g;
	var regPlanes   = /^Plane/g;
	var regVertexes = /^Vertex/g;

	// iterating through the json to get the values we need
	filterJSON(data, regSolids, function(solids) {
		for(i=0;i<solids.length;i++) {
			positionVals[solids[i]] = [];
			sizeVals[solids[i]] = [];
			filterJSON(data[solids[i]], regFaces, function(faces) {
				for (j=0;j<faces.length;j++) {
					filterJSON(data[solids[i]][faces[j]], regPlanes, function(planes) {
						sizeVals[solids[i]].push(data[solids[i]][faces[j]][planes[0]].DistanceFromOrigin); // distance from origin for each face
					});

					filterJSON(data[solids[i]][faces[j]], regVertexes, function(vertexes) {
						for (k=0;k<vertexes.length;k++) {
							positionVals[solids[i]].push(data[solids[i]][faces[j]][vertexes[k]].Position); // coords of face vertexes
						}
					});
				}
			});

			// create krunker objects string
			kmjObjects.push({
				"p": calculateCenter(positionVals[solids[i]], sizeVals[solids[i]]), // do math for centers
				"s": calculateSize(sizeVals[solids[i]]) // math for size
				// "c": "color"
			});
		}
	});

	return kmjObjects;

	// https://stackoverflow.com/questions/33218359/get-all-json-keys-that-match-a-pattern
	function filterJSON(obj, filter, callback) {
		var filtered = [];
		for (key in obj) {
			if (key.match(filter)) 
				filtered.push(key);
		}
		callback(filtered);
	}

	function calculateCenter(positionVals, sizeVals) {
			var dedupedData = [...new Set(positionVals)]; // deduplicate

			var x = 0; 
			var y = 0; 
			var z = 0; 


			for (m=0;m<dedupedData.length;m++) {
				var temp = dedupedData[m].split(" ");
				// round to nearest number for simplicity
				x += Math.round(parseFloat(temp[0]));
				y += Math.round(parseFloat(temp[1]));
				z += Math.round(parseFloat(temp[2]));
			}

			x = x/8;
			y = y/8;
			z = z/8;
			z = z - (Math.round(parseFloat(calculateSize(sizeVals)[1])/2)); // position of bottom face 

		// IMPORTANT: dimensions are swapped x,y,z = y,z,x
		// BE SURE TO RETURN VALUES MAPPED IN THIS ORDER FOR OTHER FUNCTIONS RETURNING COORDS
		return [y, z, x];
	}

	function calculateSize(data) {
			var x = 0;
			var y = 0;
			var z = 0;

			for (m=0;m<data.length;m++) {
				// round to nearest number for simplicity
				data[m] = Math.round(parseFloat(data[m]));
			}

			x = data[2] + data[3];
			y = data[0] + data[1];
			z = data[4] + data[5];

		return [y, z, x];
	}

}

function d2r(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}