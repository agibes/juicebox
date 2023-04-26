const express = require('express');
const { getAllUsers, getUserByUsername, createUser } = require('../db');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = process.env;

usersRouter.use((req, res, next) => {
    console.log('a request is being made to users');

    next();
});

usersRouter.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
      
        res.send({
          users
        });

    } catch (error) {
        console.log(error)
    };
});

// usersRouter.post('/login', async (req, res, next) => {
//     console.log(req.body);
//     res.end();
// })


usersRouter.post('/login', async (req, res, next) => {
    const {username, password} = req.body;

    if (!username || !password) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);
        
        if (user && user.password === password) {
            //create token and return to user
            const token = jwt.sign({id: user.id, username: username, password: password}, process.env.JWT_SECRET);
            res.send({message: "youre logged in!", token});
        } else {
            next({
                name: "IncorrectCredentialsError",
                message: "Username or password is incorrect"
            });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
});

// curl http://localhost:3000/api -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbGJlcnQiLCJwYXNzd29yZCI6ImJlcnRpZTk5IiwiaWF0IjoxNjgyNDUyMDc0fQ.iPhCdMzVOc0KrL2XUgrC3h3sIFwB70fvrzb8sIA9Sl4'


usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }

        const user = await createUser({username, password, name, location});

        const token = jwt.sign({id: user.id, username}, process.env.JWT_SECRET, {expiresIn: '1w'});

        res.send({
            message: "thank you for signing up",
            token
        })
    } catch ({name, message}) {
        next({name, message})
    }
});

module.exports = usersRouter;