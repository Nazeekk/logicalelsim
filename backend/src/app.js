const express = require('express');
const cors = require('cors');
const connectDB = require('./core/database');
const authRoutes = require('./routes/auth');

const { port } = require('./config');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running and healthy!' });
});

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.info(`Server is running on port ${port}`);
});