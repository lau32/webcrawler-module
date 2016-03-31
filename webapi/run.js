var http = require('http');
var url = require('url');
var mongoose = require('mongoose');
mongoose.connect('mongodb://192.168.99.101:27017/olxDB');
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
var Rental = require('./models/rentals');

http.createServer(function(request, response) {
    var pathname = url.parse(decodeURI(request.url), true).pathname;
    var method = request.method;

    switch (method) {
        case 'GET':
                if(getRegex[0].test(pathname)) {
                    Rental.find({}, 'title', function (err, data) {
                        if (err) {
                            console.error(err);

                            response.writeHead(404);
                            response.write(JSON.stringify({urls: urls.get}));
                            response.end();
                        }
                        else {
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.write(JSON.stringify({data: data, urls: urls.get}));
                            response.end();
                        }
                    });
                }
            else if (getRegex[1].test(pathname)) {
                    var id = pathname.split('/').pop();
                    Rental.find({'_id': id}, 'title', function (err, data) {
                        if (err) {
                            console.log(err);

                            response.writeHead(404);
                            response.write(JSON.stringify({urls: urls.get}));
                            response.end();
                        }
                        else {
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.write(JSON.stringify({data: data, urls: urls.get}));
                            response.end();
                        }
                    });
                }
            else if (pathname == 'multiple') {

                }
            else {
                    response.writeHead(404);
                    response.write(JSON.stringify({urls: urls.get}));
                    response.end();
                }
            break;
        case 'POST':
            var body = [];
            request.on('data', function(data) {
                body.push(data);
            });
            request.on('end', function() {
                var data = JSON.parse(body.toString());
                if(postRegex[0].test(pathname)) {
                    postInsert(data, response);
                }
                else if(postRegex[1].test(pathname)) {

                }
            });
            break;
        case 'PUT':
            if(putRegex[0].test(pathname)) {
                var id  = url.parse(decodeURI(request.url), true).query.id;
                var body = [];
                request.on('data', function (data) {
                    body.push(data);
                });
                request.on('end', function () {
                    var data = JSON.parse(body.toString());
                    data[0]["_id"] = id;
                    putInsertUpdate(data, response);
                });
            }
            break;
        case 'DELETE':
            if(deleteRegex[0].test(pathname)) {
                var id = pathname.split('/').pop();
                Rental.remove({"_id": id}, function(err, doc) {
                    if(err) {
                        console.error(err);
                        response.writeHead(404);
                        response.write(JSON.stringify({urls: urls.get}));
                        response.end();
                    }
                    else {
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.write(JSON.stringify({data: doc, urls: urls.get}));
                            response.end();
                    }
                });
            }
            break;
    }
})
    .listen(8080);

var urls;
urls = {
    get: [
        {url: "/rentals/add/"},
        {url: "/rentals/:id"},
        {url: "/rentals/remove/"}
    ],
    post: [
        {url: "/rentals/all"},
        {url: "/rentals"},
        {url: "/rentals/remove/"}
    ],
    put: [
        {url: "/rentals/"},
        {url: "/rentals"},
        {url: "/rentals/remove/"}
    ]
};

var getRegex = [/^\/rentals\/all$/,/^\/rentals\/([0-9a-z]+)$/, /^\/rentals\?ids=\{(([0-9]+),)$/];
var postRegex = [/^\/rentals\/add$/];
var putRegex = [/^\/rentals$/];
var deleteRegex = [/^\/rentals\/remove\/([0-9a-z]+)$/];

function postInsert(data, response) {

        Rental.find({"title": { $in: data.map(function(d) { return d['title']})}}, function(err, doc) {
            if(err) {
                console.log(err);

            }
            else if(doc[0] != null){
                console.log(doc);
                response.writeHead(409);
                response.write(doc.toString());
                response.end();
            }
            else {
                Rental.insertMany(data, function(err, docs) {
                    if (err) {
                        console.log(err);
                        response.writeHead(500);
                        response.write(err.toString());
                        response.end();
                    }
                    else {
                        var resBody = [];
                        docs.map(function(doc) { resBody.push({'id':doc['_id']})});
                        response.writeHead(201,{'Location': "/rentals/:rental_id"});
                        response.write(JSON.stringify({"data": resBody, "urls": urls.post}));
                        response.end();
                    }
                });
            }
        });
}

function putInsertUpdate(data, response) {
    Rental.findOneAndUpdate({'_id': data[0]["_id"]}, data[0], function(err, doc) {
        if(err){
            console.log(err);
            response.writeHead(500);
            response.write(/ObjectId failed/.test(err)? "Invailid id" : err.toString());
            response.end();
        }
        else if(doc) {
            Rental.findOne({'_id': doc["_id"]}, function(err, doc) {
                if(!err){
                    response.writeHead(200);
                    response.write(JSON.stringify(doc));
                    response.end();
                }
                else {
                    console.log(err);
                    response.writeHead(500);
                    response.write(err.toString());
                    response.end();
                }
            });
        }
        else {
            Rental.collection.insert(data[0], function(err, doc) {
                if(err) {
                    console.log(err);
                    response.writeHead(409);
                    response.write("Duplicate key");
                    response.end();
                }
                else {
                    response.writeHead(201, {'Locatoion': "rentals/" + doc["insertedIds"][0]});
                    response.write(JSON.stringify({"data": doc["ops"][0], "urls": urls.put}));
                    response.end();
                }
            });
        }
    });
}