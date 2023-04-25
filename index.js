require('dotenv').config();
const PORT = 3000;
const express = require('express');
const app = express();
const apiRouter = require('./api');
const morgan = require('morgan');
const { client } = require('./db');



app.use(morgan('dev'));
app.use(express.json());

client.connect();


app.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
    
    next();
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log('The server is up on port', PORT)
});