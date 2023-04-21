//import pg module
const { Client } = require('pg');

//supply the db name and location
const client = new Client('postgres://localhost:5432/juicebox-dev');

async function createUser({ username, password, name, location }) {
    try {
        const { rows: [user] }  = await client.query(`
            INSERT INTO users (username, password, name, location)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);
        // console.log('created user: ', user)
        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    const { rows } = await client.query(`
        SELECT id, username, name, location, active FROM users;
    `);
    return rows;
}

async function getUserById(userId) {
    try {
        //get user by id
        const {rows: [user]} = await client.query(`
            SELECT id, username, name, location, active FROM users
            WHERE id=$1
        `, [userId]);

        //if user does not exist return
        if (user.length === 0) {
            return;
        }

        user.posts = getPostsByUser(userId);

        //if user exists return user object (minus password, plus postsByUser)
        console.log('getUserById returning: ', user);
        return user;
    } catch (error) {
        console.error(error);
    }
}

async function updateUser(id, fields) {
    try {
        //we want fields to look like: {name: 'some_name', location:'some_location'}
        //then we want to strip fields to look like name: 'adonis', breed:'crazy dogo'
        const keys = Object.keys(fields);
        const setString = keys.map((key, index) => `${key}=$${index + 1}`).join(', ');

        if (setString.length === 0) {
            return;
        }
        
        const {rows: [user]} = await client.query(`
            UPDATE users
            SET ${setString}
            WHERE id = ${id}
            RETURNING *
        `, Object.values(fields));

        // console.log('updated user:', user);
        return user;
    } catch (error) {
        console.error(error);
    }
}

async function createPost({authorId, title, content}) {
    try {
        const { rows: [post] }  = await client.query(`
        INSERT INTO posts ("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [authorId, title, content]);
        // console.log('created post: ', post)
        return post;
    } catch (error) {
        throw error;
    }
}

async function getAllPosts() {
    const { rows } = await client.query(`
        SELECT id, "authorId", title, content, active FROM posts;
    `);
    return rows;
}

async function getPostsByUser(userId) {
    try {
        const {rows: userPosts} = await client.query(`
            SELECT * FROM posts
            WHERE 'authorId'=$1
        `, [userId]);
        console.log('getPostsByUser returning: ', userPosts);
        return userPosts;
    } catch (error) {
        console.error(error);
    }
}

async function updatePost(id, fields) {
    // console.log('post id:', id);
    try {
        const keys = Object.keys(fields);
        const setString = keys.map((key, index) => `${key}=$${index + 1}`).join(', ');
        
        if (setString.length === 0) {
            return;
        }
        
        const {rows: [post]} = await client.query(`
            UPDATE posts
            SET ${setString}
            WHERE id=${id}
            RETURNING *
        `, Object.values(fields));

        // console.log('updated post:', post);
        return post;
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    client,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    createPost,
    getAllPosts,
    getPostsByUser,
    updatePost
}