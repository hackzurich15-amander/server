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
    // workaround becaus the amag api is down
    // amag api is down
    deferred.resolve('http://www.gravatar.com/avatar/'+vid+'?s=400')

/*    request('http://api.hackzurich.amag.ch/hackzurich/vehicle/'+vid+'.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
           var vehicleImages = JSON.parse(body).vehicleImages;
            console.log('loaded img: '+vehicleImages);
            deferred.resolve('http://api.hackzurich.amag.ch/hackzurich/image/'+vehicleImages[0].id+'/width/500');

        }

        deferred.reject(error)
    });*/
    return deferred.promise;
};

module.exports = new LoadImages();