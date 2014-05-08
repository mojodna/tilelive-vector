var _ = require('underscore');
var spherical = require('spherical');

var TileProfiler = module.exports = function(vtile) {
    this._vtile = vtile;
};

TileProfiler.prototype.layerInfo = function() {
    var jsonsizes = this._vtile.toJSON().reduce(function(memo, l) {
        memo[l.name] = JSON.stringify(l).length;
        return memo;
    }, {});

    return this._vtile.toGeoJSON('__array__').map(function(layer) {
        var info = {
            name: layer.name,                  // name of the layer
            coordCount: [],                    // # coords per feature
            duplicateCoordCount: [],           // # duplicate coords per feature
            coordDistance: [],                 // distances between consecutive coordinates
            features: layer.features.length,   // number of features
            jsonsize: jsonsizes[layer.name]    // length of layer as a JSON string
        };
        layer.features.reduce(featureDetails, info);
        return info;
    });
};

function featureDetails(info, feature) {
    var coords = flattenGeoJsonCoords(feature.geometry);
    var coordDistances = coords.map(findDistances);
    coordDistances.shift();

    info.coordCount.push(coords.length);
    info.duplicateCoordCount.push(coords.reduce(countDuplicates, 0));
    info.coordDistance = info.coordDistance.concat(coordDistances);

    return info;
}

function countDuplicates(count, coord, index, coordinates) {
    if (index !== 0 &&
        coord[0] === coordinates[index - 1][0] &&
        coord[1] === coordinates[index - 1][1]) count++;
    return count;
}

function findDistances(coord, index, coordinates) {
    if (index === 0) return null;
    return spherical.distance(coordinates[index - 1], coord);
}

function flattenGeoJsonCoords(geometry) {
    if (geometry.type === 'Point') return [ geometry.coordinates ];
    if (geometry.type === 'LineString') return geometry.coordinates;
    if (geometry.type == 'Polygon') return _(geometry.coordinates).flatten(true);
}
