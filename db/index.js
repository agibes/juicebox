//import pg module
const { Client } = require('pg');

//supply the db name and location
const client = new Client('postgres://localhost:5432/juicebox-dev');

//********************USERS********************//
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

        user.posts = await getPostsByUser(userId);

        //if user exists return user object (minus password, plus postsByUser)
        // console.log('getUserById returning: ', user);
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

async function getUserByUsername(username) {
    try {
        const { rows: [user] } = await client.query(`
            SELECT * FROM users
            WHERE username=$1;
        `, [username]);

        return user;
    } catch (error) {
        console.log(error);
    }
}

//********************POSTS********************//
async function createPost({authorId, title, content, tags=[]}) {
    try {
        const { rows: [post] }  = await client.query(`
        INSERT INTO posts ("authorId", title, content)
        VALUES ($1, $2, $3)
        RETURNING *;
        `, [authorId, title, content]);
        
        const tagList = await createTags(tags);

        return await addTagsToPost(post.id, tagList);
    } catch (error) {
        throw error;
    }
}

async function getAllPosts() {
    try {
        const { rows: postId } = await client.query(`
            SELECT id FROM posts;
        `);

        const posts = await Promise.all(postId.map(post => getPostById(post.id)));

        return posts;
    } catch (error) {
        console.log(error);
    }
}

async function getPostsByUser(userId) {
    try {
        const {rows: postId} = await client.query(`
            SELECT id FROM posts
            WHERE "authorId"=${userId};
        `);

        const posts = await Promise.all(postId.map(post => getPostById(post.id)));
        return posts;
    } catch (error) {
        console.error(error);
    }
}

async function getPostById(postId) {
    try {
        const {rows: [post]} = await client.query(`
            SELECT * FROM posts WHERE id=$1;
        `, [postId]);

        const {rows: tags} = await client.query(`
            SELECT tags.* FROM tags
            JOIN post_tags ON tags.id=post_tags."tagId"
            WHERE post_tags."postId"=$1;
        `, [postId]);

        const {rows:[author]} = await client.query(`
            SELECT id, username, name, location
            FROM users
            WHERE id=$1;
        `, [post.authorId]);

        post.tags = tags;
        post.author = author;

        delete post.authorId;

        return post;
    } catch (error) {
        console.error(error);
    }
}

async function updatePost(postId, fields) {
    const {tags} = fields;
    delete fields.tags;

    const setString = Object.keys(fields).map((key, index) => `${key}=$${index + 1}`).join(', ');
    
    try {  
        if (setString.length > 0) {
            const {rows: [post]} = await client.query(`
                UPDATE posts
                SET ${setString}
                WHERE id=${postId}
                RETURNING *;
            `, Object.values(fields));
        }
        
        if (tags === undefined) {
            return await getPostById(postId);
        }
        
        //make the tags
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');

        //dele post_tags that aren't in tag list
        await client.query(`
            DELETE FROM post_tags
            WHERE "tagId"
            NOT IN (${ tagListIdString })
            AND "postId"=$1;
        `, [postId])

        //make post tags
        await addTagsToPost(postId, tagList);

        return await getPostById(postId);
    } catch (error) {
        console.error(error);
    }
}

async function getPostsByTagName(tagName) {
    try {
        const {rows: postId} = await client.query(`
            SELECT posts.id FROM posts
            JOIN post_tags ON posts.id=post_tags."postId"
            JOIN tags ON tags.id=post_tags."tagId"
            WHERE tags.name=$1;
        `, [tagName]);

        return await Promise.all(postId.map(post=>getPostById(post.id)));
    } catch (error) {
        console.error(error);
    }
}

async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }

    const insertValues = tagList.map((_, index) => `$${index + 1}`).join('), (');
    const selectValues = tagList.map((_, index) => `$${index + 1}`).join(', ');
    
    try {
        await client.query(`
            INSERT INTO tags (name)
            VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;      
        `, tagList);

        const {rows: tags} = await client.query(`
        
            SELECT * FROM tags
            WHERE name
            IN (${selectValues});

        `, tagList)

        return tags;
    } catch (error) {
        console.log('error creating tags');
        console.error(error);
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
            INSERT INTO post_tags("postId", "tagId")
            VALUES ($1, $2)
            ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);
    } catch (error) {
        console.error(error);
    }
}

async function addTagsToPost(postId, tagList) {
    try {
        const createPostTagPromises = tagList.map(tag => createPostTag(postId, tag.id));
        await Promise.all(createPostTagPromises);
        return await getPostById(postId);
    } catch (error) {
        console.error(error);
    }
}

async function getAllTags() {
    try {
        const { rows: postId } = await client.query(`
            SELECT * FROM tags;
        `);

        const tags = await Promise.all(postId.map(post => getPostById(post.id)));

        return tags;
    } catch (error) {
        console.log(error);
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
    updatePost,
    createTags, 
    addTagsToPost,
    getPostsByTagName,
    getAllTags,
    getUserByUsername,
    getPostById
}