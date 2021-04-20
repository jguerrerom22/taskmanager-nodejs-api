const express = require('express');

module.exports = function(app){
    app.use(express.json());

    app.use('/auth/', require('../routes/auth'));
    app.use('/users/', require('../routes/users'));
    app.use('/tareas/', require('../routes/tasks'));
    app.use('/prioridad/', require('../routes/priorities'));
    app.use('/status/', require('../routes/status'));
};