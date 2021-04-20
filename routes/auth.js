const dbQuery = require('../db/dbQuery');
const bcrypt = require('bcrypt');
const express = require('express');
const Functions = require('../helpers/functions');
const router = express.Router();

const authenticate = async (req, res) => {

    if (!req.body.usuario) return res.send({error: true, message: "El usuario es requerido" });
    if (!req.body.contrasena) return res.send({error: true, message: "La contraseña es requerida" });

    try {
        const { rows } = await dbQuery.query(`SELECT * FROM usuario WHERE usuario = $1`, [req.body.usuario]);
        if (rows.length == 0)  return res.send({error: true, message: 'El usuario no existe' });

        if (rows[0].activo === 0){
            return res.send({error: true, message: 'Usuario inactivo' });
        }
        const valido = await bcrypt.compare(req.body.contrasena, rows[0].clave);
        
        if (valido){
            const token = new Functions().generateAuthToken(rows[0].usuario, (rows[0].rol_id === 1));
            return res.send({ error: false, token: token, nombre: rows[0].nombre, apellido: rows[0].apellido, esAdmin: (rows[0].rol_id === 1) });
        }
        return res.send({error: true, message: 'Usuario y/o clave incorrecto' });
        
    } catch (error) {
        console.log(error);
        
        return res.send({ error: true, message: 'Ha ocurrido un error' });
    }
};

router.post('/', authenticate);

module.exports = router;