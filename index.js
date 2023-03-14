const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");

app.use(cors());
app.use(express.json());
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0iyuemt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  // client.connect()
  console.log("database connected");
  const moviesCollection = client.db("Cineplanet").collection("movies");
  const usersCollection = client.db("Cineplanet").collection("users");
  const favoriteCollection = client.db("Cineplanet").collection("favorite");
  const movieCommentCollection = client.db("Cineplanet").collection("comments");

  // user
  app.post("/users", async (req, res) => {
    const user = req.body;
    console.log(user);
    const result = await usersCollection.insertOne(user);
    res.send(result);
  });

  app.get("/users", async (req, res) => {
    const query = {};
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  });

//   movies
  app.get("/movies", async (req, res) => {
    const query = {};
    const result = await moviesCollection.find(query).toArray();
    res.send(result);
  });
  app.get("/movies/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await moviesCollection.find(query).toArray();
    res.send(result);
  });

  // favourite notification
  app.post("/favorite", async (req, res) => {
    const query = req.body;
    const result = await favoriteCollection.insertOne(query);
    res.send(result);
  });
  app.get("/favorite", async (req, res) => {
    const email = req.query.email;
    const query = { email: email };
    const result = await favoriteCollection.find(query).toArray();
    res.send(result);
  });
  app.delete("/favorite/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await favoriteCollection.deleteOne(query);
      res.send({
        success: true,
        data: result,
      });
    } catch (error) {
      res.send({
        success: false,
        error: error.message,
      });
    }
  });

  app.put("/movieLike/:id", async (req, res) => {
    const id = req.params.id;
    const userEmail = req.body.email;
    const filter = { _id: new ObjectId(id) };
    const movie = await moviesCollection.findOne(filter);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    let likedBy = movie.likedBy || [];

    if (likedBy.includes(userEmail)) {
      // User has already liked the movie, so remove the like
      const updateDoc = {
        $inc: { like: -1 },
        $pull: { likedBy: userEmail },
      };
      const result = await moviesCollection.updateOne(filter, updateDoc);
      if (result.modifiedCount > 0) {
        return res.json({ message: "movie unliked successfully" });
      } else {
        return res.status(500).json({ message: "Unable to unlike movie" });
      }
    } else {
      // User has not liked the movie, so add the like
      const updateDoc = {
        $inc: { like: 1 },
        $addToSet: { likedBy: userEmail },
      };
      const result = await moviesCollection.updateOne(filter, updateDoc);
      if (result.modifiedCount > 0) {
        return res.json({ message: "movie liked successfully" });
      } else {
        return res.status(500).json({ message: "Unable to like movie" });
      }
    }
  });
  //get movie comment
  app.get("/movieComment/:id", async (req, res) => {
    const id = req.params.id;
    const query = { postId: id };
    const result = movieCommentCollection.find(query);
    const cursor = await result.limit(4).sort({ $natural: -1 }).toArray();

    res.send(cursor);
  });
  app.post("/moviesComment", async (req, res) => {
    const user = req.body;
    const result = await movieCommentCollection.insertOne(user);
    console.log(result);
    res.send(result);
  });

}
run();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
