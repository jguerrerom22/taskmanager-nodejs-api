const express = require('express');
const router = express.Router();
const dbQuery = require('../db/dbQuery');
const auth = require('../middleware/auth');

const getAllPriorities = async (req, res) => {
    try {
        let { rows } = await dbQuery.query(`SELECT * FROM prioridad`);
        if (!rows)  return res.status(400).send('No hay registros');
        return res.send(rows);
    } catch (error) {
        console.log(error);
        return res.status(400).send('An Error occured try later');
    }
}

router.get('/', auth, getAllPriorities);
module.exports = router;