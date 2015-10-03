var client = require('node-mysql-promise');
var brain = require('brain');
var express = require('express');
var q = require('q');
var app = express();
var bodyParser = require('body-parser');
var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

var mysqlConf ={
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USR,
    password: process.env.MYSQL_PW,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT
};
app.use(bodyParser.json());
app.get('/',function(req,res){
    res.send('heelloo');
});
app.post('/magic', function (req, res) {

//   { trainingSet:
//      offset: 0
// }
    var body = req.body || {};
    var trainSet = body.trainingSet || null;
    var net = new brain.NeuralNetwork();
    if (trainSet) {
        var learnSet = [];
        trainSet.forEach(function(item){
           learnSet.push( {input : [item.input.price] , output : { match : item.output.match}});
        });

        net.train(learnSet);
    }
    var offset = body.offset || 0;
    var count = body.count || 100;
    var mysql = client.createConnection(mysqlConf);
    mysql.table('vehicle').field(['vin', 'brand',
        'model_de', 'engine_de',
        'fuel_type',
        'engine_capacity',
        'power_hp',
        'sale_type',
        'emissions',
        'additional_title',
        'mileage',
        'price',
        'seats',
        'sport_score',
        'family_score',
        'eco_score',
        'price_score',
        'offroad_score',
        'design_score']).limit(offset, count).select().then(function (data) {
        data.map(function (item) {
            var _item = item;
            delete _item.vin;
            item.match = trainSet  ? net.run([_item.price]).match : null;
        }).sort(function (a, b) {
            if (a.match < b.match)
                return -1;
            if (a.match > b.match)
                return 1;
            return 0;
        });
        console.log('sortedArray');
        res.json({data : data, offset : offset + count});
    }).catch(function (e) {
        console.log(e);
        console.log(mysqlConf)
    });

});


// SELECT vin, swiss_type_number, model_de, price FROM `vehicle`
