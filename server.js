const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Routen importieren
const routes = require('./routes');
app.use('/', routes);

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
