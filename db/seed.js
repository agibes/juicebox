// grab our client (with destructuring) from the export in index.js
const { 
    client, 
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    createTags,
    addTagsToPost,
    getPostsByTagName,
    getPostById
} = require('./index');


//drops all tables
async function dropTables() {
    try {
        console.log('starting to drop tables...');
        await client.query(`
        DROP TABLE IF EXISTS post_tags;
        DROP TABLE IF EXISTS tags;
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

            CREATE TABLE tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL
            );

            CREATE TABLE post_tags (
                "postId" INTEGER REFERENCES posts(id),
                "tagId" INTEGER REFERENCES tags(id),
                UNIQUE ("postId", "tagId")
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
                content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
                tags: ["#happy", "#youcandoanything"]
            });
            await createPost({
                authorId: sandra.id,
                title: "How does this work?",
                content: "Seriously, does this even do anything?",
                tags: ["#happy", "#worst-day-ever"]
            });
            await createPost({
                authorId: glamgal.id,
                title: "Living the Glam Life",
                content: "Do you even? I swear that half of you are posing.",
                tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
            });
        } catch (error) {
            console.error(error);
        }
    }

    // async function createInitialTags() {
    //     try {
    //         console.log('starting to create tags...');

    //         const [happy, sad, inspo, catman] = await createTags(['#happy', '#worst-day-ever', '#youcandoanything', '#catmandoeverthing']);
            
    //         const [postOne, postTwo, postThree] = await getAllPosts();

    //         await addTagsToPost(postOne.id, [happy, inspo]);
    //         await addTagsToPost(postTwo.id, [sad, inspo]);
    //         await addTagsToPost(postThree.id, [happy, catman, inspo]);

    //         console.log('finished creating tags...');
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }
    
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
            const updatePostResult = await updatePost(posts[1].id, {
              title: "New Title",
              content: "Updated Content"
            });
            console.log('finished testing updatePost...');

            console.log('starting to test update post tags...');
            // console.log(posts[1]);
            const updatePostTagsResult = await updatePost(posts[1].id, {
                tags: ["#youcandoanything", "#redfish", "#bluefish"]
            });
            // console.log(updatePostTagsResult);
            console.log('finished testing updating post tags');

            console.log('starting to test getPostsByTagName...');
            const postsWithHappy = await getPostsByTagName("#happy");
            // console.log(posts[1], posts[2], posts[0]);
            console.log('finished testing getPostsByTagName')
            // console.log(postsWithHappy[0], postsWithHappy[1]);

            console.log("testing getUserById with 1");
            const albert = await getUserById(1);
            const sandy = await getUserById(2);
            const glamgal = await getUserById(3);
            // console.log("finished testing getUserById with 1", albert, sandy, glamgal);

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