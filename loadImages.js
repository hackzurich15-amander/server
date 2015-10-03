/**
 * Created by longstone on 03/10/15.
 */
var Q = require('q');
var request = require('request');
// .json



// buz.js
var LoadImages = function () {};

LoadImages.prototype.loadImg = function (vid) {
    var deferred = Q.defer();
    request('http://api.hackzurich.amag.ch/hackzurich/vehicle/'+vid+'.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
           var vehicleImages = JSON.parse(body).vehicleImages;
            deferred.resolve('http://api.hackzurich.amag.ch/hackzurich/image/'+vehicleImages[0].id+'/width/500');
        }

        deferred.reject(error)
    });
    return deferred.promise;
};

module.exports = new LoadImages();