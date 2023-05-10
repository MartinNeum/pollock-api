const express = require('express');
const router = express.Router();

const Poll = require('../src/Poll')
const fs = require('fs');
const pollsFilePath = './data/polls.json';


// GET /poll
router.get('/', (req, res) => {

  try {

    const data = fs.readFileSync(pollsFilePath, 'utf8');
    const polls = JSON.parse(data)
    res.json(polls)

  } catch (error) {

    console.error('\nERROR bei GET /poll:\n', error)
    res.status(500).json({ error: 'GET /poll schlug fehl' })
    
  }

});


/** ################ POLLLACK ENDPOINTS ################ **/

// POST /poll/lack
router.post('/lack', (req, res) => {

  try {

    // Request body in variablen abspeichern
    const { title, description, options, setting, fixed } = req.body;

    // Prüfen, ob alle Felder geliefert wurden
    if (title == null || description == null || options == null || setting == null || fixed == null) {
      console.error('\nERROR bei POST /poll/lack:\n Mindestens ein Feld wurde nicht im Request-Body geliefert.')
      res.status(405).json({ "code": 405, "message": "Invalid input" })
      return
    }

    // Generiere token
    const token = new Date().getTime()

    // Poll mit gelieferten Daten erstellen
    const poll = {
      title,
      description,
      options,
      setting,
      fixed,
      token
    };

    // polls.json bearbeiten
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /poll/lack. Fehler beim Lesen der Datei:\n', err)
        res.status(500).json({ error: 'POST /poll/lack schlug fehl' })
        return;
      }
      
      // Poll in polls-array hinzufügen
      let polls = [];
      if (data) {
        polls = JSON.parse(data);
      }
      polls.push(poll);
  
      // Polls in .json abspeichern
      fs.writeFile(pollsFilePath, JSON.stringify(polls), 'utf8', (err) => {
        if (err) {
          console.error('\nERROR bei POST /poll/lack. Fehler beim Schreiben der Datei:\n', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
  
        res.status(200).json({
          "admin": {
            "link": "string",
            "value": "71yachha3ca48yz7"
          },
          "share": {
            "link": "string",
            "value": poll.token
          }
        });
      });

    });

  } catch (error) {

    console.error('\nERROR bei POST /poll/lack:\n ', error)
    res.status(500).json({ error: 'POST /poll/lack schlug fehl' })
    
  }

});

// GET /poll/lack/{token}
router.get('/lack/:token', (req, res) => {

  const token = req.params.token;

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    const poll = polls.find(p => p.token == token);

    if (!poll) {
      res.status(404).json({ code: 404, error: 'Poll not found' });
      return;
    }

    res.json(poll);
  });

});

module.exports = router;
