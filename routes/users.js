const Joi = require('joi');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const dbQuery = require('../db/dbQuery');
const Functions = require('../helpers/functions');

/**
 * Get a list of users
 */
const getAllUsers = async (req, res) => {
    const seedUserQuery = `SELECT u.usuario, u.nombre, u.apellido, concat(substring(u.nombre,1,1), substring(u.apellido,1,1)) sigla, u.rol_id rol, r.nombre rol_nombre, u.activo
        FROM usuario u
        JOIN rol r ON r.id = u.rol_id
        ORDER BY u.nombre, u.apellido`;

    try {
        const { rows } = await dbQuery.query(seedUserQuery);
        if (!rows)  return res.status(400).send('Seeding Was not Successful');
        return res.send(rows);
    } catch (error) {
        return res.status(400).send('An Error occured try later');
    }
}

const createUser = async (req, res) => {
    const { error } = validateUser(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    const p = req.body;
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(p.contrasena, salt);

    const { rows } = await dbQuery.query(`SELECT * FROM usuario WHERE usuario = $1`, [p.usuario]);
    if (rows.length > 0) return res.status(400).send('Usuario ya existente');

    const query = `INSERT INTO usuario (usuario, clave, rol_id, foto, nombre, apellido, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7) returning *`;
    const values = [p.usuario, password, p.rol, null, p.nombre, p.apellido, (p.activo ? 1: 0)];

    try {
        const { rows } = await dbQuery.query(query, values);
        const dbResponse = rows[0];
        delete dbResponse.clave;
        const token = new Functions().generateAuthToken(dbResponse.usuario);
        dbResponse.token = token;
        return res.send(dbResponse);
    } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send('User with that EMAIL already exist');
        }
        console.log(error);
        return res.status(400).send('Operation was not successful');
    }
} 


const updateUser = async (req, res) => {
    const { error } = validateUser(req.body); 
    if (error) return res.status(400).send(error.details[0].message);

    const p = req.body;
    
    try {
        let query = `UPDATE usuario SET rol_id=$1, nombre=$2, apellido=$3, activo=$4 WHERE usuario=$5`;
        let values = [p.rol, p.nombre, p.apellido, (p.activo ? 1: 0), p.usuario];
        await dbQuery.query(query, values)

        if (p.contrasena){
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(p.contrasena, salt);
            let query = `UPDATE usuario SET clave=$1 WHERE usuario = $2`;
            let values = [password, p.usuario];
            await dbQuery.query(query, values)
        }
        
        return res.send({ error: false });
    } catch (error) {
        if (error.routine === '_bt_check_unique') {
          return res.status(400).send('User with that EMAIL already exist');
        }
        console.log(error);
        return res.status(400).send('Operation was not successful');
    }
} 

const validateUser = (user) => {
    const schema = {
		usuario: Joi.string().min(3).max(50).required(),
		contrasena: Joi.string().min(3),
		rol: Joi.number().required(),
		nombre: Joi.string().min(3).max(255).required(),
		apellido: Joi.string().min(3).max(255).required(),
		activo: Joi.boolean().required()
    };
    return Joi.validate(user, schema);
}

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/', updateUser);
module.exports = router;