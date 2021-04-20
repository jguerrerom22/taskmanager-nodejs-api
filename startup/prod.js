const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');

module.exports = function(app){
    app.use(helmet());
    app.use(compression());
    app.use(bodyParser.json({ limit: '2mb' }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", 'http://www.ku-vid.com');
        res.header("Access-Control-Allow-Credentials", true);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header("Access-Control-Allow-Headers", 'Origin,Content-Type,Accept,content-type,application/json,X-Auth-Token,Visitor-Id');
        next();
    });
}