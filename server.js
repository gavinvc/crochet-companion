const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (ensure MongoDB service is running)
mongoose.connect('mongodb://localhost:27017/yourdbname')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Basic route
app.get('/', (req, res) => {
  res.send('Hello MEAN Stack!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

