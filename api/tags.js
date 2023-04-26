const express = require('express');
const tagsRouter = express.Router();
const {getAllTags, getPostsByTagName} = require('../db');

// tagsRouter.use((req, res, next) => {
//     console.log('something about tags');

//     next();
// })

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

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    try {
        const {tagName} = req.params;
        // console.log(tagName);
        const postsWithTagName = await getPostsByTagName(tagName);
        // console.log(postsWithTagName);
        res.send(postsWithTagName);
    } catch ({name, message}) {
        next({name: 'TagNameNotFound', message: 'something went wrong'});
    }
});

module.exports = tagsRouter;