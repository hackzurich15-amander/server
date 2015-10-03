var client = require('node-mysql-promise');
var brain = require('brain');
var express = require('express');
var q = require('q');
var app = express();
var bodyParser = require('body-parser');
var imgLoader = require('./loadImages');
var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

var buildWhere = function buildWhereF(fInclude) {
    if (!fInclude) {
        fInclude = {};
    }
    var qry = '';
    if (fInclude.hasOwnProperty('priceMax')) {
        qry += '`price` < ' + fInclude.priceMax;
    }
    if (fInclude.hasOwnProperty('psMin')) {
        if (qry) {
            qry += ' AND ';
        }
        qry += '`power_hp` > ' + fInclude.psMin;
    }
    if (fInclude.hasOwnProperty('brand')) {
        if (qry) {
            qry += ' AND ';
        }
        qry += '`brand` LIKE \'' + fInclude.brand + '\'';
    }
    return qry;
};

var mysqlConf = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USR,
    password: process.env.MYSQL_PW,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT
};
app.use(bodyParser.json());
app.get('/', function (req, res) {
    imgLoader.loadImg('TMBAJ7NP9G7006459').then(function (img) {
        console.log('sucess', img);
        res.send(img);
    }, function (error) {
        console.log('error', error);
        res.send(error);
    });

});
app.post('/magic', function (req, res) {

//   { trainingSet:
//      offset: 0
// }
    var body = req.body || {};
    var trainSet = body.trainingSet || null;
    var net = new brain.NeuralNetwork();
    var offset = body.offset || 0;
    if (trainSet && trainSet.length) {
        offset = trainSet.length;
        var learnSet = [];
        trainSet.forEach(function (item) {
            learnSet.push({input: [item.input.price], output: {match: item.output.match}});
        });

        net.train(learnSet);
    }

    var count = body.count || 100;
    var mysql = client.createConnection(mysqlConf);
    var whereQry = buildWhere(body.filterInclude);
    console.log(whereQry);
    mysql.table('vehicle').field(['vin', 'brand', 'model_de', 'engine_de', 'fuel_type', 'engine_capacity',
        'power_hp', 'sale_type', 'emissions', 'additional_title', 'mileage', 'price', 'seats', 'sport_score',
        'family_score', 'eco_score', 'price_score', 'offroad_score', 'design_score'])
        .limit(offset, count).where(whereQry).select().then(function (data) {
            data.map(function (item) {

                var _item = item;
                item.match = trainSet ? net.run([_item.price]).match : null;
                return item;
            }).sort(function (a, b) {
                if (a.match < b.match)
                    return -1;
                if (a.match > b.match)
                    return 1;
                return 0;
            });
            var promisify = function (item) {
                var deferred = q.defer();
                imgLoader.loadImg(item.vin).then(function (imageUrl) {
                    item.imageUrl = [imageUrl];
                    console.log('image loaded for ' + item.vin + ' url: ' + imageUrl);
                    deferred.resolve();
                }, deferred.reject);
                return deferred.promise;
            };

            var imgPromise = [];
            for (i = 0; i < data.length; i++) {
                imgPromise.push(promisify(data[i]));
            }

            q.allSettled(imgPromise)
                .then(function (results) {
                    res.json({data: data, offset: offset + count});
                },function(err){
                    res.json({error :err});
                });

}).catch(function (e) {
    console.log(e);
    console.log(mysqlConf)
});

});


// SELECT vin, swiss_type_number, model_de, price FROM `vehicle`
