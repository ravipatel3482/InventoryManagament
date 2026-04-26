const express = require('express')
const { graphqlHTTP } = require('express-graphql');
const store = require('./Src/GraphQLType/store')
const app = express()
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const PORT = process.env.PORT || 4000;

// Replace 'myStoreDB' with whatever you want to name your database
// const mongoURI = 'mongodb://localhost:27017/myStoreDB'
// mongoose.connect(mongoURI)
//   .then(() => console.log("✅ Successfully connected to MongoDB locally"))
//   .catch(err => console.error("❌ MongoDB connection error:", err));
// real URL 


app.use(cors()); 
app.use(express.json());
const mongoURI_Server = process.env.MONGO_URI
mongoose.connect(mongoURI_Server)
  .then(() => console.log("✅ Successfully connected to MongoDB Server Online"))
  .catch(err => console.error("❌ MongoDB connection error:", err));
  
app.use("/graphql", graphqlHTTP({
  schema: store,
  graphiql: true
}));

app.listen(PORT, () => {
  console.log("Hello From Express.js")
});