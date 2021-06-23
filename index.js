const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
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
  const employersCollection = client.db(process.env.DB_NAME).collection("employers");
  const jobSeekerCollection = client.db(process.env.DB_NAME).collection("jobseeker");
  const adminCollection = client.db(process.env.DB_NAME).collection("admin");
  console.log("Database Connected");

  app.get("/jobs", (req, res) => {
    const keywords = req.query.keywords;
    const tagKeyword = keywords?.split(" ");
    jobsCollection
      .find({
        $or: [
          { jobTitle: { $regex: keywords, $options: "i" } },
          { tags: { $in: tagKeyword } },
        ],
        approvalStatus: 'approved',
      })
      .toArray((err, documents) => {
        if (err) {
          res.send([]);
        } else {
          res.send(documents);
        }
      });
  });

  app.post('/add-job-seeker', (req, res) => {
    const data = req.body;
    jobSeekerCollection.insertOne(data)
      .then(result => {
        if (result.insertedCount > 0) {
          res.send(true);
        } else {
          res.send(false);
        }
      })
  })

  app.post('/add-employer', (req, res) => {
    const data = req.body;
    employersCollection.insertOne(data)
      .then(result => {
        if (result.insertedCount > 0) {
          res.send(true);
        } else {
          res.send(false);
        }
      })
  })

  app.get('/check-account-type', (req, res) => {
    employersCollection.findOne({
      email: req.query.email,
    })
      .then(result => {
        if (result) {
          res.send({ accountType: 'employer' });
        } else {
          jobSeekerCollection.findOne({
            email: req.query.email,
          })
            .then(result => {
              if (result) {
                res.send({ accountType: 'job seeker' });
              } else {
                adminCollection.findOne({
                  email: req.query.email,
                })
                  .then(result => {
                    if (result) {
                      res.send({ accountType: 'admin' });
                    } else {
                      res.send(null);
                    }
                  }).catch(() => res.send(null));
              }
            }).catch(() => res.send(null));
        }
      }).catch(() => res.send(null));
  });

  app.post('/add-job-post', (req, res) => {
    const jobPost = req.body;
    jobPost.approvalStatus = 'pending';

    jobsCollection.insertOne(jobPost)
    .then(result => {
      if(result.insertedCount > 0){
        res.send(true);
      } else{
        res.send(false);
      }
    })
    .catch(() => res.send(false));
  });

  app.get('/employer-post/:email', (req, res) => {
    jobsCollection.find({ email: req.params.email })
    .toArray((err, documents) => {
      if(err){
        res.send(null);
      } else{
        res.send(documents);
      }
    })
  });

  app.get('/pending-post', (req, res) => {
    jobsCollection.find({ approvalStatus: 'pending' })
    .toArray((err, documents) => {
      if(err){
        res.send(null);
      } else{
        res.send(documents);
      }
    })
  });

  app.get('/approved-post', (req, res) => {
    jobsCollection.find({ approvalStatus: 'approved' })
    .toArray((err, documents) => {
      if(err){
        res.send(null);
      } else{
        res.send(documents);
      }
    })
  });

  app.get('/job-details/:id', (req, res) => {
    jobsCollection.findOne({ _id: ObjectId(`${req.params.id}`) })
    .then(document => res.send(document))
    .catch(() => res.send(null));
  })

  app.patch('/edit-approval/:id', (req, res) => {
    console.log(req.params.id, req.body);
    jobsCollection.updateOne(
      { _id: ObjectId(req.params.id) },
      { $set: { approvalStatus : req.body.approvalStatus } }
    )
    .then(result => {
      if(result.modifiedCount > 0){
        res.send(true);
      } else{
        res.send(false);
      }
    })
    .catch(() => res.send(false));
  });

});

app.listen(process.env.PORT || port, () => {
  console.log("Express js App");
});
