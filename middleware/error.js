const logging = require('../startup/logging');

module.exports = function(err, req, res, next){
    logging.error(err.message, err);
    res.status(500).send({ message: 'Something failed' });
}