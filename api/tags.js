const express = require('express');
const tagsRouter = express.Router();
const {getAllTags, getPostsByTagName} = require('../db');

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
        const postsWithTagName = await getPostsByTagName(tagName);

        const activePosts = postsWithTagName.filter(post => {
            return (post.active) || (req.user && post.author.id === req.user.id);
        });

        res.send(activePosts);
    } catch ({name, message}) {
        next({name: 'TagNameError', message: 'something went wrong'});
    }
});

// does not show inactive posts (with specified tagName) if user is not logged in
// curl http://localhost:3000/api/tags/%23oldisnewagain/posts

//shows inactive posts (with specified tagName) if user is logged in
// curl http://localhost:3000/api/tags/%23oldisnewagain/posts -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGJlcnQiLCJwYXNzd29yZCI6ImJlcnRpZTk5IiwiaWF0IjoxNjgyNTMzOTcyfQ.TuOE5APw62d81o5Z-yFrhuu7dg8EGp5yinIYIewkWl8'

module.exports = tagsRouter;