const express = require('express');
const { getAllPosts } = require('../db');
const postsRouter = express.Router();

postsRouter.use((req, res, next) => {
    console.log('something about a request from users');

    next();
});

postsRouter.get('/', async (req, res) => {
    try { 
        const posts = await getAllPosts();
    
        res.send({
          posts
        });

    } catch (error) { 
        console.log(error) 
    };
});

module.exports = postsRouter;