// grab our client (with destructuring) from the export in index.js
const { 
    client, 
    getAllUsers,
    createUser
} = require('./index');


//drops all tables
async function dropTables() {
    try {
        console.log('starting to drop tables...');
        await client.query(`
        DROP TABLE IF EXISTS users;
        `);
        console.log('finished dropping tables...');
    } catch (error) {
        console.log('error: failed to drop tables')
        throw error;
    }
}

//creates all tables
async function createTables() {
    try {
        console.log('starting to build tables...');
        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL
            );
            `);
            console.log('finished creating tables...');
        } catch (error) {
            console.log('error: failed to create tables')
            throw error;
        }
    }
    
    //create some users
    async function createInitialUsers() {
        try {
            console.log('starting to create users...');
            const albert = await createUser({username: 'albert', password: 'bertie99'});
            const sandy = await createUser({username: 'sandra', password: '2sandy4me' });
            const glamgal = await createUser({username: 'glamgal', password: 'soglam' });
            console.log('finished creating users');
        } catch (error) {
            console.log('error: failed to create users');
            throw error;
        }
    }
    
    //rebuild databse
    async function rebuildDB() {
        try {
            client.connect();
            
            await dropTables();
            await createTables();
            await createInitialUsers();
        } catch (error) {
        throw error;
        }
    }

    async function testDB() {
        try {
            console.log('starting to test db...');
            // client.connect();
            const users = await getAllUsers();
            console.log('getAllUsers: ', users);
            console.log('finished database tests');
        } catch (error) {
            console.error('error testing database');
            throw error;
        } 
    }
    
    rebuildDB()
        .then(testDB)
        .catch(console.error)
        .finally(() => client.end());