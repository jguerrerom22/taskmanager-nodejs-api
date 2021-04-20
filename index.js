const express = require('express');
const app = express();

if (process.env.NODE_ENV == 'production'){
    require('./startup/prod')(app);
} else {
    require('./startup/dev')(app);
}

require('./startup/routes')(app);
require('./startup/config')();

const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0');