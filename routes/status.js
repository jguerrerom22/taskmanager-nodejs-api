const Joi = require('joi');
const express = require('express');
const router = express.Router();
const dbQuery = require('../db/dbQuery');
const Functions = require('../helpers/functions');
const auth = require('../middleware/auth');

/**
 * Get a list of users
 */
const getAll = async (req, res) => {

    try {
        let { rows } = await dbQuery.query(`
            SELECT id, nombre 
            FROM estado_tarea
            ORDER BY id
        `);
        return res.send(rows);
    } catch (error) {
        console.log(error);
        return res.status(400).send('An Error occured try later');
    }
}

router.get('/', auth, getAll);
module.exports = router;