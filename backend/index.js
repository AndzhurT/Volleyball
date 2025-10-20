// index.js
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Welcome to the Volleyball API!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
