const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const { MONGO_URI } = require('./config');

const app = express();

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(MONGO_URI);

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
