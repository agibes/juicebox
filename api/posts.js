const express = require('express');
const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const postsRouter = express.Router();
const {requireUser} = require('./utils');

// postsRouter.use((req, res, next) => {
//     console.log('something about a request from users');

//     next();
// });

postsRouter.post('/', requireUser, async(req, res, next) => {
//    res.send({message: 'under construction'});

    const {title, content, tags=""} = req.body;

    //breaking the tags up
    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    //only send tags if there are some to send
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    try {
        
        postData.authorId = req.user.id;
        postData.title = title;
        postData.content = content;
        
        const post = await createPost(postData);

        res.send({post});
            
    } catch ({name, message}) {
        next({name, message});
    }
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

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const {postId} = req.params;
    const {title, content, tags } = req.body;
    //set update fields
    const updateFields = {};

    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
        updateFields.title = title;
    }

    if (content) {
        updateFields.content = content;
    }
    //try to update post
    try {
        //get the original post
        const originalPost = await getPostById(postId);
        console.log('original post:', originalPost);
        // console.log(originalPost);
        //if user is author, update
        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({post: updatedPost});
        console.log('updated post:', updatedPost);

        } else {
            next({
                name: 'UnauthorizedUserError', 
                message: 'You cannot update a post that is not yours'
            })
        }
    } catch ({name, message}) {
        next({name, message});
    }
});

module.exports = postsRouter;

//login albert
//curl http://localhost:3000/api/users/login -H "Content-Type: application/json" -X POST -d '{"username": "albert", "password": "bertie99"}'

//update post
//curl http://localhost:3000/api/posts/1 -X PATCH -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGJlcnQiLCJwYXNzd29yZCI6ImJlcnRpZTk5IiwiaWF0IjoxNjgyNTMzOTcyfQ.TuOE5APw62d81o5Z-yFrhuu7dg8EGp5yinIYIewkWl8' -H 'Content-Type: application/json' -d '{"title": "updating my old stuff", "tags": "#oldisnewagain"}'