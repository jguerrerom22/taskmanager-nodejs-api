const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(){

    this.generateAuthToken = function (usuario, esAdmin) {
        let dataJwt = { usuario: usuario, esAdmin: esAdmin };
        const token = jwt.sign(dataJwt, config.get('jwtPrivateKey'));
        return token;
    }
}


