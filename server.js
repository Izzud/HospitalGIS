const { Client, Pool } = require('pg')
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8007;
require('dotenv').config();

const hashingSecret = process.env.REACT_APP_SECRET_KEY;
const connectionString = `postgres://${process.env.REACT_APP_DB_USER}:${process.env.REACT_APP_DB_PASS}@${process.env.REACT_APP_DB_HOST}/${process.env.REACT_APP_DB_NAME}`

var jwtOptions = {}
jwtOptions.secretOrKey = process.env.REACT_APP_SECRET_KEY;

const client = new Client({
    //   connectionString: process.env.DATABASE_URL,
    connectionString: connectionString
})

client.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use(cors())
app.options('*', cors());

app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

app.get("/", function (req, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('CURRENTLY TESTING API v0.5');
});

app.get("/hospital", function (req, response) {
    client.query('SELECT * FROM hospital;').then(result => {
        response.status(200); 
        response.send(result.rows);
    }).catch(e => { 
        console.error(e.stack); 
        response.status(400); 
        response.send(e); 
    });
});

app.get("/hospital/:id", function (req, response) {
    client.query('SELECT * FROM hospital WHERE id = $1;', [req.params.id]).then(result => {
        response.status(200); 
        response.send(result.rows);
    }).catch(e => { 
        console.error(e.stack); 
        response.status(400); 
        response.send(e); 
    });
});

app.put("/hospital/:id", function (req, response) {
    console.log([req.body.name, req.body.beds, req.body.covid_cases, req.params.id])
    client.query('UPDATE hospital SET name = $1, beds = $2, covid_cases = $3 WHERE id = $4;', [req.body.name, req.body.beds, req.body.covid_cases, req.params.id]).then(result => {
        response.status(200);
    }).catch(e => { 
        console.error(e.stack); 
        response.status(400); 
        response.send(e); 
    });
});

app.post("/hospital", function (req, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('CURRENTLY TESTING POST FOR HOSPITAL');
})

app.post("/login", function (req, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('CURRENTLY TESTING LOGIN');
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

// const username = 'user1'
// const pass = 'test'

// const hashedStr = crypto.createHmac('sha256', hashingSecret)
//                         .update(pass)
//                         .digest('hex');

// client.query('INSERT INTO app_user (username, password) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password = Excluded.password;', [username, hashedStr]).then(result => {
//     console.log(result.rows)
// }).catch(e => console.error(e.stack))