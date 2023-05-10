const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Definiere Routen
app.get('/', (req, res) => {
  res.send('Willkommen bei meiner API!');
});

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
