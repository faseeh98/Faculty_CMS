var http = require ("http");
var fs = require ("fs");
var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var mongoURL = "mongodb://localhost:27017/";
const multer = require('multer');
const path = require('path');

//Set Storage Engine
const storage = multer.diskStorage({
    destination: './uploads',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

//Init Upload
const upload = multer({
    storage: storage,
    limits:{filesize:1000000},
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('file');

//check file type function - used in init upload
function checkFileType(file, cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    //check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    //check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null,true);
    } else {
        cb('Error: Images Only');
    }
};

//init app
var app = express();

//port
const port = 8080;

//parse POST form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//EJS init
app.set('view engine', 'ejs');

//Public folder(s)
app.use('/assets', express.static('assets'));
app.use('/app', express.static('app'));
app.use('/images', express.static('images'));

//permissions
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With, Content-Type,Accept,content-type,application/json');
    next();
    });

//MongoDB
//text updates db
MongoClient.connect(mongoURL, function(err, db) {
    if (err) throw err;
    dbo = db.db('mydb');
    //Create collection
    dbo.createCollection("update_entries", function(err, res) {
        if (err) throw err;
        console.log("Collection created: update_entries");
        db.close();
        });
    });
//file upload db
MongoClient.connect(mongoURL, function(err, db) {
    if (err) throw err;
    dbo = db.db('files');
    //Create collection
    dbo.createCollection("images", function(err, res) {
        if (err) throw err;
        console.log("Collection created: images");
        db.close();
        });
    });

//HOMEPAGE
app.get('/', function(req, res){
    MongoClient.connect(mongoURL, function(err, db){
        if (err) throw err;
        dbo = db.db('mydb');
        dbo.collection("update_entries").findOne({},{ sort: { _id: -1}}, function(err, result){
            if (err) throw err;
            res.render('index.ejs', {'update_entries': result});
            db.close();
        });
    });
});
//ADMIN
app.get('/admin', function(req, res){
    res.render('admin.ejs');
});


//UPDATE
app.post('/update', function(req, res){
    MongoClient.connect(mongoURL, function(err, db, body) {
        if (err) throw err;
        dbo = db.db('mydb');
        delete req.body._id;
        dbo.collection("update_entries").insertOne(req.body, function(err, res) {
            if (err) throw err;
            console.log("Document added to mydb: update_entries");
            db.close();
            });
    });
    res.render('admin_success', {data: req.body});
});
    // MongoClient.connect(mongoURL, function(err, db, file) {
    //  if (err) throw err;
    //  dbo = db.db('files');
    //  dbo.collection("images").insertOne(req.file, function(err, res) {
    //      if (err) throw err;
    //      console.log("Document added to files: images");
    //      db.close();
    //      });
    //      res.render('admin_success', {data: req.file});

    // });

//DATA
app.get('/data', function(req, res){
    MongoClient.connect(mongoURL, function(err, db){
        if (err) throw err;
        dbo = db.db('mydb');
        dbo.collection("update_entries").findOne({},{ sort: { _id: -1}}, function(err, result){
            if (err) throw err;
            console.log("Found data from mydb: update_entries");
            res.send(result);
            db.close();
        });
    });
});

app.listen(port, () => console.log(`Server started on ${port}`));