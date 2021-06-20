const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 5100;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tinfh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const jobsCollection = client.db(process.env.DB_NAME).collection("jobs");
  console.log("Database Connected");

  app.get("/jobs", (req, res) => {
    const keywords = req.query.keywords;
    const tagKeyword = keywords.split(" ");
    jobsCollection
      .find({
        $or: [
          { jobTitle: { $regex: keywords, $options: "i" } },
          { tags: { $in: tagKeyword } },
        ],
      })
      .toArray((err, documents) => {
        if (err) {
          res.send(err);
        } else {
          res.send(documents);
        }
      });
  });
});

app.listen(port, () => {
  console.log("Express js App");
});
