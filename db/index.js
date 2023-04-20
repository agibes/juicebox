//import pg module
const { Client } = require('pg');

//supply the db name and location
const client = new Client('postgres://localhost:5432/juicebox-dev');

async function getAllUsers() {
    const { rows } = await client.query(`
        SELECT id, username FROM users;
    `);
    return rows;
}

async function createUser({ username, password }) {
    try {
        const { rows: [user] }  = await client.query(`
            INSERT INTO users (username, password) VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password]);
        console.log('created users: ', user)
        return user;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    client,
    getAllUsers,
    createUser,
}