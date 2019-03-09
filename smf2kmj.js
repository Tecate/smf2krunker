var fs = require('fs');
var filename = process.argv[2];
var outputFilename = process.argv[3];

fs.readFile(filename, 'utf8', function(err, data) {
	if (err) throw err;
	console.log('using', filename);
	var jsonData = smf2json(data);
	var distilledData = distill(jsonData);
	// console.log(jsonData);
	// console.log(distill(jsonData));
	console.log(require('util').inspect(distilledData, true, 10));
	var objectData = JSON.stringify(distilledData);
	console.log('{"name":"New Krunker Map","modURL":"","shadowR":1024,"ambient":9937064,"light":15923452,"sky":14477549,"fog":9280160,"fogD":900,"camPos":[0,0,0],"spawns":[],"objects":' 
		+ objectData + '}');
});

// what a mess
function smf2json(data) {
	data = data.trim().split("\n"); // to array and trim blank lines

	for (i=0;i<data.length;i++) {
		data[i] = data[i].replace(/\r?\n|\r|\t/g, '').trim(); // remove whitespace 

		data[i] = data[i].replace(/\\/g, '\\\\');


		if (data[i].startsWith("{")) {
		} else if (data[i].startsWith("}")) {
			if (typeof data[i+1] !== "undefined" ) {
				if (data[i+1].trim().startsWith("}")) {} else {
					data[i] = data[i] + ",";
				}
			}

		} else if (data[i].startsWith("\"")) { // value
			data[i] = data[i].replace(/" "/g, '": "');
			if (data[i+1].trim().startsWith("}")) {} else {
				data[i] = data[i] + ",";
			}

		} else {
			data[i] = "\"" + data[i] + "\":";
		}
		// console.log(data[i]);
	}
	data = "{" + data.join('') + "}";

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

		for (i = 0; i < count; i++) {
			names[k].push((i+1));
		}
	});

	data = data.replace(re, function (p1) { // replacing duplicate keys
		p1 = p1.substr(1);
		if (dups.indexOf(p1) !== -1) {
			return '"' + p1 + names[p1].shift();
		} else {
			return '"' + p1;
		}
	});

	console.log(data); // string
	data = JSON.parse(data);
	return data;
}

// pull relevant information from json
// output in krunker format
function distill(data) {
	data = data.Root;
	var positionVals = {};
	var sizeVals     = {};
	var kmjObjects   = [];

	var regEntities = /^Entity/g;
	var regSolids   = /^Solid/g;
	var regFaces    = /^Face/g;
	var regPlanes   = /^Plane/g;
	var regVertexes = /^Vertex/g;


	filterJSON(data, regSolids, function(solids) {
		for(i=0;i<solids.length;i++) {
			positionVals[solids[i]] = [];
			sizeVals[solids[i]] = [];
			filterJSON(data[solids[i]], regFaces, function(faces) {
				for (j=0;j<faces.length;j++) {
					filterJSON(data[solids[i]][faces[j]], regPlanes, function(planes) {
						sizeVals[solids[i]].push(data[solids[i]][faces[j]][planes[0]].DistanceFromOrigin);
					});

					filterJSON(data[solids[i]][faces[j]], regVertexes, function(vertexes) {
						for (k=0;k<vertexes.length;k++) {
							positionVals[solids[i]].push(data[solids[i]][faces[j]][vertexes[k]].Position);
						}
					});
				}
			});

			// create krunker objects string
			kmjObjects.push({
				"p": calculateCenter(positionVals[solids[i]]),
				"s": calculateSize(sizeVals[solids[i]])
				// "c": "color"
			});
		}
	});

	return kmjObjects;

	// https://stackoverflow.com/questions/33218359/get-all-json-keys-that-match-a-pattern
	function filterJSON(obj, filter, callback) {
		var filtered = [];
		for (key in obj) {
			if (key.match(filter)) {
				filtered.push(key);
			} 
		}
		callback(filtered);
	}

	function calculateCenter(data) {
			data = [...new Set(data)]; // deduplicate

			var x = 0; 
			var y = 0; 
			var z = 0; 

			for (m=0;m<data.length;m++) {
				var temp = data[m].split(" ");
				x += parseInt(temp[0]);
				y += parseInt(temp[1]);
				z += parseInt(temp[2]);
			}

		// IMPORTANT: dimensions are swapped x,y,z = y,z,x
		// BE SURE TO RETURN VALUES MAPPED IN THIS ORDER FOR OTHER FUNCTIONS RETURNING COORDS
		return [y/8, z/8, x/8];
	}

	function calculateSize(data) {
			var x = 0;
			var y = 0;
			var z = 0;

			for (m=0;m<data.length;m++) {
				data[m] = parseInt(data[m]);
			}

			x = data[2] + data[3];
			y = data[0] + data[1];
			z = data[4] + data[5];

		return [y, z, x];
	}

}

