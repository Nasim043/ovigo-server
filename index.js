const express = require('express');
const app = express();
var cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');

// middlewarea
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l8zs6j6.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db('Ovigo').collection('users');
    const communitiesCollection = client.db('Ovigo').collection('communities');
    const postsCollection = client.db('Ovigo').collection('posts');

    app.get('/', (req, res) => {
      res.send('Ovigo is running!')
    })

    // users
    app.post('/users', async (req, res) => {
      const users = req.body;

      // check if the user is existing
      const user = await usersCollection.findOne({ email: users.email });
      if (user) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    })

    // community
    // get creators all community
    app.get('/community/:email', async (req, res) => {
      const email = req.params.email;
      const result = await communitiesCollection.find({ creator_email: email }).toArray();
      res.send(result);
    })

    // get a specific community
    app.get('/community/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await communitiesCollection.findOne(query);
      res.send(result);
    });

    // create a community
    app.post('/community', async (req, res) => {
      const community = req.body;
      const result = await communitiesCollection.insertOne(community);
      res.send(result);
    })

    // posts related API

    // get all posts of a community
    app.get('/posts', async (req, res) => {
      const communityId = new ObjectId(req.query.communityid);
      const result = await postsCollection.find({ community_id: communityId }).toArray();
      res.send(result);
    })

    // get a single post
    app.get('/posts/:id', async (req, res) => {
      const Id = new ObjectId(req.params.id);
      const result = await postsCollection.find({ _id: Id }).toArray();
      res.send(result);
    })

    // create a post
    app.post('/posts', async (req, res) => {
      const post = req.body;
      post.community_id = new ObjectId(post.community_id);
      const result = await postsCollection.insertOne(post);
      res.send(result);
    })

    // update a post
    app.patch('/posts/edit/:id', async (req, res) => {
      const id = req.params.id;
      const post = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          ...post
        },
      };
      const result = await postsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(5000, () => {
  console.log('Ovigo app listening on port 5000!')
})