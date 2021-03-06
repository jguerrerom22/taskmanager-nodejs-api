const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function auth(req, res, next){
    let token = req.header('x-auth-token');
    if (!token){
        return res.status(401).send({ message: 'Access denied. No token provided' });
    } 

    // Get info token
    try{
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next();
    }
    catch (ex){
        res.status(400).send({ message: 'Invalid token' });
    }   
}