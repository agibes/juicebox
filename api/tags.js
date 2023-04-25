const express = require('express');
const tagsRouter = express.Router();
const {getAllTags} = require('../db');

tagsRouter.use((req, res, next) => {
    console.log('something about tags');

    next();
})

tagsRouter.get('/', async (req, res) => {
    try {
        const tags = await getAllTags();
        
        res.send({
            tags
        });
    } catch (error) {
        console.log(error);
    };
});

module.exports = tagsRouter;