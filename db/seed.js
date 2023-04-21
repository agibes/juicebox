// grab our client (with destructuring) from the export in index.js
const { 
    client, 
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    getPostsByUser,
    updatePost
} = require('./index');


//drops all tables
async function dropTables() {
    try {
        console.log('starting to drop tables...');
        await client.query(`
        DROP TABLE IF EXISTS posts;
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
            password varchar(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true
            );

          CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
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
            const albert = await createUser({username: 'albert', password: 'bertie99', name: 'albert', location: 'honolulu' });
            const sandy = await createUser({username: 'sandra', password: '2sandy4me', name: 'sandy', location: 'omaha' });
            const glamgal = await createUser({username: 'glamgal', password: 'soglam', name: 'glam', location: 'denver' });
            console.log('finished creating users');
        } catch (error) {
            console.log('error: failed to create users');
            throw error;
        }
    }

    async function createInitialPosts() {
        try {
            const [albert, sandra, glamgal] = await getAllUsers();

            await createPost({
                authorId: albert.id,
                title: "Aleberts First Post",
                content: "This is my first post. I hope I love writing blogs as much as I love writing them."
            });
            await createPost({
                authorId: sandra.id,
                title: "Sandras First Post",
                content: "This is my first post. I hope I love writing blogs as much as I love writing them."
            });
            await createPost({
                authorId: glamgal.id,
                title: "Glamgals First Post",
                content: "This is my first post. I hope I love writing blogs as much as I love writing them."
            });
        } catch (error) {
            console.error(error);
        }
    }
    
    //rebuild databse
    async function rebuildDB() {
        try {
            client.connect();
            
            await dropTables();
            await createTables();
            await createInitialUsers();
            await createInitialPosts();
        } catch (error) {
            throw error;
        }
    }
    
    async function testDB() {
        try {
            console.log('starting to test db...');
            
            console.log('testing getAllUsers...')
            const users = await getAllUsers();
            // console.log('getAllUsers: ', users);
            console.log('finished testing getAllUsers...')
            
            
            console.log('testing updateUser...')
            await updateUser(3, {name: 'moreglama', location: 'salt lake city'})
            console.log('finished testing updateUser...')

            console.log("testing getAllPosts");
            const posts = await getAllPosts();
            console.log("finished testing getAllPosts...");
        
            console.log("testing updatePost on posts[0]");
            const updatePostResult = await updatePost(posts[0].id, {
              title: "New Title",
              content: "Updated Content"
            });
            console.log('finished testing updatePost...');
        
            console.log("testing getUserById with 1");
            const albert = await getUserById(1);
            console.log("finished testing getUserById with 1", albert);

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