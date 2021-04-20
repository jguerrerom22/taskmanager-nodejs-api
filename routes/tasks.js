const Joi = require('joi');
const express = require('express');
const router = express.Router();
const dbQuery = require('../db/dbQuery');
const Functions = require('../helpers/functions');
const auth = require('../middleware/auth');

/**
 * Get a list of users
 */
const getMyAssignedTasks = async (req, res) => {

    try {
        let { rows } = await dbQuery.query(`
            SELECT t.id, t.titulo, t.detalle, p.nombre prioridad, t.fecha_tarea, t.fecha_vencimiento, 
                u.nombre, u.apellido, e.nombre estado
            FROM tarea t, usuario u, usuario_tarea ut, prioridad p, estado_tarea e
            WHERE t.id = ut.tarea_id AND t.usuario = u.usuario AND t.prioridad_id = p.id AND t.estado_id = e.id
            AND ut.usuario = $1 AND t.estado_id != 2
            GROUP BY t.id, t.titulo, t.detalle, p.nombre, t.fecha_tarea, t.fecha_vencimiento, 
            u.nombre, u.apellido, e.nombre
            ORDER BY t.fecha_tarea
        `, [req.user.usuario]);
        if (!rows)  return res.status(400).send('No hay registros');
        let data = [];
        let d = rows;
        for (var i in d){
            let { rows } = await dbQuery.query(`
            SELECT u.nombre, u.apellido
            FROM usuario_tarea ut, usuario u
            WHERE ut.usuario = u.usuario AND ut.tarea_id = ${d[i].id}`);
            d[i].asignados = rows;
            data.push(d[i]);
        }
        return res.send(data);
    } catch (error) {
        console.log(error);
        
        return res.status(400).send('An Error occured try later');
    }
}

const getMyCreatedTasks = async (req, res) => {
    try {
        let { rows } = await dbQuery.query(`
            SELECT t.id, t.titulo, t.detalle, p.nombre prioridad, t.fecha_tarea, t.fecha_vencimiento, 
                u.nombre, u.apellido, e.nombre estado
            FROM tarea t, usuario u, prioridad p, estado_tarea e
            WHERE t.usuario = u.usuario AND t.prioridad_id = p.id AND t.estado_id = e.id
            AND t.usuario = $1 AND t.estado_id != 2
            GROUP BY t.id, t.titulo, t.detalle, p.nombre, t.fecha_tarea, t.fecha_vencimiento, 
            u.nombre, u.apellido, e.nombre
            ORDER BY t.fecha_tarea
        `, [req.user.usuario]);
        if (!rows)  return res.status(400).send('No hay registros');
        let data = [];
        let d = rows;
        for (var i in d){
            let { rows } = await dbQuery.query(`
            SELECT u.nombre, u.apellido, concat(substring(u.nombre,1,1), substring(u.apellido,1,1)) siglas
            FROM usuario_tarea ut, usuario u
            WHERE ut.usuario = u.usuario AND ut.tarea_id = ${d[i].id}`);
            d[i].asignados = rows;
            data.push(d[i]);
        }
        return res.send(data);
    } catch (error) {
        console.log(error);
        
        return res.status(400).send('An Error occured try later');
    }
} 

const getToApproveTasks = async (req, res) => {
    try {
        let { rows } = await dbQuery.query(`
            SELECT t.id, t.titulo, t.detalle, p.nombre prioridad, t.fecha_tarea, t.fecha_vencimiento, 
                u.nombre, u.apellido, e.nombre estado
            FROM tarea t, usuario u, prioridad p, estado_tarea e
            WHERE t.usuario = u.usuario AND t.prioridad_id = p.id AND t.estado_id = e.id
            AND t.usuario = $1 AND t.estado_id = 4
            GROUP BY t.id, t.titulo, t.detalle, p.nombre, t.fecha_tarea, t.fecha_vencimiento, 
            u.nombre, u.apellido, e.nombre
            ORDER BY t.fecha_tarea
        `, [req.user.usuario]);
        if (!rows)  return res.status(400).send('No hay registros');
        let data = [];
        let d = rows;
        for (var i in d){
            let { rows } = await dbQuery.query(`
            SELECT u.nombre, u.apellido, concat(substring(u.nombre,1,1), substring(u.apellido,1,1)) siglas
            FROM usuario_tarea ut, usuario u
            WHERE ut.usuario = u.usuario AND ut.tarea_id = ${d[i].id}`);
            d[i].asignados = rows;
            data.push(d[i]);
        }
        return res.send(data);
    } catch (error) {
        console.log(error);
        
        return res.status(400).send('An Error occured try later');
    }
} 

const getOneTasks = async (req, res) => {
    try {
        var { rows } = await dbQuery.query(`
            SELECT t.id, t.titulo, t.detalle, p.nombre prioridad, t.fecha_tarea, t.fecha_vencimiento, 
                u.nombre, u.apellido, e.nombre estado
            FROM tarea t, usuario u, prioridad p, estado_tarea e
            WHERE t.id = $1
            AND t.usuario = u.usuario AND p.id = t.prioridad_id AND e.id = t.estado_id
            GROUP BY t.id, t.titulo, t.detalle, p.nombre, t.fecha_tarea, t.fecha_vencimiento, 
            u.nombre, u.apellido, e.nombre
        `, [req.params.id]);
        if (!rows)  return res.status(400).send('No hay registros');
        var data = rows[0];

        var { rows } = await dbQuery.query(`SELECT c.*, u.nombre, u.apellido
            FROM comentarios c, usuario u 
            WHERE c.usuario = u.usuario
            AND tarea_id = $1 ORDER BY fecha_comentario`, [data.id]);
        data.comentarios = rows;

        return res.send(data);
    } catch (error) {
        console.log(error);
        return res.status(400).send('An Error occured try later');
    }
}

const createTask = async (req, res) => {
    try {
        const b = req.body;
        const today = new Date();
        const now = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

        if (b.esRecurrencia){
            var fecha = new Date();
            switch (b.recurrencia) {

                case "Diaria":
                    while (fecha <= new Date(b.vencimiento)){
                        fecha.setDate(fecha.getDate() + b.diasDiario);
                        console.log(fecha.getDate(), b.diasDiario);
                        var vencimiento = new Date(fecha);
                        vencimiento.setDate(vencimiento.getDate() + b.diasVencimiento);
                        await saveTask({
                            titulo:b.titulo,
                            descripcion: b.descripcion, 
                            prioridad: b.prioridad, 
                            vencimiento: vencimiento.getFullYear()+'-'+(vencimiento.getMonth()+1)+'-'+vencimiento.getDate(),
                            fecha: fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate(),
                            asignados: b.asignados
                        }, req.user.usuario);
                    }
                    break;
            
                case "Semanal":
                    while (fecha <= new Date(b.vencimiento)){
                        if (fecha.getDay() === getNumberDay(b.diasSemana)) break;
                        fecha.setDate(fecha.getDate() + 1);
                    }
                    
                    while (fecha < new Date(b.vencimiento)){
                        var vencimiento = new Date(fecha);
                        vencimiento.setDate(vencimiento.getDate() + b.diasVencimiento);

                        await saveTask({
                            titulo:b.titulo,
                            descripcion: b.descripcion, 
                            prioridad: b.prioridad, 
                            vencimiento: vencimiento.getFullYear()+'-'+(vencimiento.getMonth()+1)+'-'+vencimiento.getDate(),
                            fecha: fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate(),
                            asignados: b.asignados
                        }, req.user.usuario);

                        fecha.setDate(fecha.getDate() + 7);
                    }
                    break;

                case "Quincenal":
                    // Primer Quincena
                    while (fecha <= new Date(b.vencimiento)){
                        if (fecha.getDate() == b.diasQuincena1) break;
                        fecha.setDate(fecha.getDate() + 1);
                    }
                    while (fecha <= new Date(b.vencimiento)){
                        var vencimiento = new Date(fecha);
                        vencimiento.setDate(vencimiento.getDate() + b.diasVencimiento);

                        await saveTask({
                            titulo:b.titulo,
                            descripcion: b.descripcion, 
                            prioridad: b.prioridad, 
                            vencimiento: vencimiento.getFullYear()+'-'+(vencimiento.getMonth()+1)+'-'+vencimiento.getDate(),
                            fecha: fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate(),
                            asignados: b.asignados
                        }, req.user.usuario);

                        fecha.setMonth(fecha.getMonth() + 1);
                    }

                    // Segunda Quincena
                    fecha = new Date(now);
                    while (fecha <= new Date(b.vencimiento)){
                        if (fecha.getDate() == b.diasQuincena2) break;
                        fecha.setDate(fecha.getDate() + 1);
                    }
                    while (fecha <= new Date(b.vencimiento)){
                        var vencimiento = new Date(fecha);
                        vencimiento.setDate(vencimiento.getDate() + b.diasVencimiento);

                        await saveTask({
                            titulo:b.titulo,
                            descripcion: b.descripcion, 
                            prioridad: b.prioridad, 
                            vencimiento: vencimiento.getFullYear()+'-'+(vencimiento.getMonth()+1)+'-'+vencimiento.getDate(),
                            fecha: fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate(),
                            asignados: b.asignados
                        }, req.user.usuario);

                        var diff = b.diasQuincena2 - fecha.getDate();
                        fecha.setMonth(fecha.getMonth() + 1);

                        //El dia no esta en el mes ejemplo dia = 31 mes febrero
                        if (diff > 0){
                            //establecer el ultimo dia del mes
                            fecha = new Date(fecha.getFullYear, fecha.getMonth(), b.diasQuincena2);
                        }
                    }
                    break;

                case "Mensual":
                    while (fecha <= new Date(b.vencimiento)){
                        if (fecha.getDate() === b.diasMes) break;
                        fecha.setDate(fecha.getDate() + 1);
                    }
                    while (fecha <= new Date(b.vencimiento)){
                        var vencimiento = new Date(fecha);
                        vencimiento.setDate(vencimiento.getDate() + b.diasVencimiento);

                        await saveTask({
                            titulo:b.titulo,
                            descripcion: b.descripcion, 
                            prioridad: b.prioridad, 
                            vencimiento: vencimiento.getFullYear()+'-'+(vencimiento.getMonth()+1)+'-'+vencimiento.getDate(),
                            fecha: fecha.getFullYear()+'-'+(fecha.getMonth()+1)+'-'+fecha.getDate(),
                            asignados: b.asignados
                        }, req.user.usuario);

                        var diff = b.diasMes - fecha.getDate();
                        fecha.setMonth(fecha.getMonth() + 1);

                        //El dia no esta en el mes ejemplo dia = 31 mes febrero
                        if (diff > 0)
                        {
                            //establecer el ultimo dia del mes
                            fecha = new Date(fecha.getFullYear, fecha.getMonth(), b.diasMes);
                        }
                    }

                    break;
                default:
                    break;
            } 

            return res.send({ message: "success" });

        } else {
            b.fecha = now;
            saveTask(b, req.user.usuario);
            
            return res.send({ message: "success" });
        }
        
    } catch (error) {
        return res.status(400).send('An Error occured try later');
    }
}

const saveTask = async (b, usuario) => {
    try {
        const today = new Date();
        const now = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        let { rows } = await dbQuery.query(`
            INSERT INTO tarea (titulo, detalle, prioridad_id, usuario, fecha_creacion, fecha_vencimiento, estado_id, fecha_tarea)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `, [b.titulo, b.descripcion, b.prioridad, usuario, now, b.vencimiento, 1, b.fecha]);
        if (!rows)  return res.status(400).send('No hay registros');
        const id = rows[0].id;
    
        for (var x in b.asignados){
            const asig = b.asignados[x];
            let { rows } = await dbQuery.query(`
                INSERT INTO usuario_tarea (usuario, tarea_id)
                VALUES ($1, $2)`,
                [asig, id]);
        }    
    } catch (error) {
        console.log(error);
    }
    
}

var setStatusTask = async (req, res) => {
    try {
        const b = req.body;

        if (!b.idtarea) return res.status(200).send({ error: true, message: 'ID de tarea vacío!' });
        if (!b.estado) return res.status(200).send({ error: true, message: 'Estado de tarea vacío!' });

        if (b.estado === 2){
            var { rows } = await dbQuery.query(`SELECT usuario FROM tarea WHERE id = $1`, [b.idtarea]);
            if (!rows)  return res.status(400).send('No hay registros');
            if (rows[0].usuario !== req.user.usuario) {
                return res.send({ error: true, message: 'Sólo el propietario de la tarea puede cambiarla a estado Cerrada' });
            };
        }
        var { rows } = await dbQuery.query(`
            UPDATE tarea set estado_id = $1 WHERE id = $2
        `, [b.estado, b.idtarea]);
        if (!rows)  return res.status(400).send('No se pudo modificar');
        return res.send({ error: false, message: 'success' });
    } catch (error) {
        console.log(error);
        return res.status(400).send('An Error occured try later');
    }
}

var createComment = async (req, res) => {
    try {
        const b = req.body;

        if (!b.comentario) return res.status(400).send({ message: 'Comentario vacío!' });

        var { rows } = await dbQuery.query(`
            INSERT INTO comentarios (tarea_id, comentario, fecha_comentario, usuario)
            VALUES ($1, $2, NOW(), $3) RETURNING id
        `, [req.params.id, b.comentario, req.user.usuario]);
        if (!rows)  return res.status(400).send('No se pudo ingresar');
        const id = rows[0].id;

        var { rows } = await dbQuery.query(`SELECT c.*, u.nombre, u.apellido
            FROM comentarios c, usuario u 
            WHERE c.usuario = u.usuario AND id = $1 ORDER BY fecha_comentario`, [id]);
            
        return res.send({ message: "success", comentario: rows[0] });
        
    } catch (error) {
        console.log(error);
        return res.status(400).send('An Error occured try later');
    }
}

const getNumberDay = (day) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days.indexOf(day);
}

router.get('/misAsignadas', auth, getMyAssignedTasks);
router.get('/misCreadas', auth, getMyCreatedTasks);
router.get('/porAprobar', auth, getToApproveTasks);
router.get('/:id', auth, getOneTasks);
router.post('/', auth, createTask);
router.post('/status', auth, setStatusTask);
router.post('/:id/comentario', auth, createComment);
module.exports = router;