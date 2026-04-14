const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running and healthy!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`Server is running on port ${PORT}`);
});