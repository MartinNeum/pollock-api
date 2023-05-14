const express = require('express');
const router = express.Router();

const Poll = require('../src/Poll')
const Token = require('../src/Token')
const fs = require('fs');
const pollsFilePath = './data/polls.json';
const getPolls = require('../funcs/data');


/** #################################################### **/
/** ################ POLLLACK ENDPOINTS ################ **/
/** #################################################### **/


/**### POST /poll/lack ###*/
/**Add a new poll.**/
router.post('/lack', (req, res) => {

  try {

    // Request body in variablen abspeichern
    const { title, description, options, setting, fixed } = req.body;

    // PollBody erstellen
    const pollSetting = new Poll.PollSetting(setting.voices, setting.worst, setting.deadline)

    const pollOptions = []
    options.forEach(option => {
      if (option.id == null || option.text == null) {
        console.error('\nERROR bei POST /poll/lack:\n Mindestens ein Feld wurde nicht im Request-Body geliefert.')
        res.status(405).json({ "code": 405, "message": "Invalid input" })

      } else {
        const pollOption = new Poll.PollOption(option.id, option.text)
        pollOptions.push(pollOption)
      }
    });

    const pollFixed = fixed

    let pollBody;
    if (title == null || pollOptions == null) {
      console.error('\nERROR bei POST /poll/lack:\n Mindestens ein Feld wurde nicht im Request-Body geliefert.')
      res.status(405).json({ "code": 405, "message": "Invalid input" })
      return
    } else {
      pollBody = new Poll.PollBody(title, description, pollOptions, pollSetting, pollFixed)
    }

    // PollSecurity erstellen
    const pollSecurity = null

    // PollShare (Token) erstellen
    const pollShare = new Token(null, new Date().getTime())

    // Poll erstellen
    const poll = new Poll.Poll(pollBody, pollSecurity, pollShare)

    // polls.json bearbeiten
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /poll/lack. Fehler beim Lesen der Datei:\n', err)
        res.status(500).json({ error: 'POST /poll/lack schlug fehl' })
        return;
      }
    //TODO: FIX THIS - (ich glaube geht nicht so leicht)
      // lass mal lieber ohne
      
      // Poll in polls-array hinzufügen
      //const polls = getPolls(pollsFilePath);
    //  console.log(polls);
      const polls = JSON.parse(data);
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
            "value": poll.share.value
          }
        });
      });

    });

  } catch (error) {

    console.error('\nERROR bei POST /poll/lack:\n ', error)
    res.status(500).json({ error: 'POST /poll/lack schlug fehl' })
    
  }

});

/**### GET /poll/lack/:token ###*/
/**Return the statistics of the poll by share token.**/
router.get('/lack/:token', (req, res) => {

  const token = req.params.token;

  // Check token
  if(token == ':token' || token == null) {
    console.error('Fehler beim Lesen der Datei:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    const poll = polls.find(p => p.share.value == token);

    if (!poll) {
      res.status(404).json({ code: 404, error: 'Poll not found.' });
      return;
    }

    res.json(poll);
  });

});

/**### PUT /poll/lack/:token ###*/
/**Update a poll by admin token.**/
router.put('/lack/:token', (req, res) => {

  // Token holen
  const token = req.params.token;

  // Request body in variablen abspeichern
  const { title, description, options, setting, fixed } = req.body;
  
  // Check token
  if(token == ':token' || token == null) {
    console.error('ERROR bei PUT /poll/lack/:token: Kein Token geliefert.');
    res.status(405).json({ error: 'ERROR bei PUT /poll/lack/:token: Kein Token geliefert.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    let pollIndex = polls.findIndex(p => p.share.value == token);

    // Poll bearbeiten
    if (pollIndex != -1) {
      polls[pollIndex].body.title = title
      polls[pollIndex].body.description = description
      polls[pollIndex].body.options = options
      polls[pollIndex].body.setting = setting
      polls[pollIndex].body.fixed = fixed
    } else {
      console.error('Fehler beim Bearbeiten des Polls: ', err)
      res.status(404).json({ code: 404, error: 'Fehler beim Bearbeiten des Polls.' });
      return;
    }

    try {

      fs.writeFileSync(pollsFilePath, JSON.stringify(polls, null, 2), 'utf8');
      res.json({ "code": 200, "message": "i. O." });

    } catch (err) {

      console.error('\nERROR bei PUT /poll/lack/:token\n ', error)
      res.status(500).json({ error: 'PUT /poll/lack/:token schlug fehl' })
      
    }

  });

});

/**### DELETE /poll/lack/:token ###*/
/**Deletes a poll by admin token.**/
router.delete('/lack/:token', (req, res) => {

  // Token holen
  const token = req.params.token;

  // Check token
  if(token == ':token' || token == null) {
    console.error('ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.');
    res.status(405).json({ error: 'ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    const updatedPolls = polls.filter(p => p.share.value != token);

    console.log(updatedPolls)

    try {

      if (updatedPolls.length < polls.length) {
        fs.writeFileSync(pollsFilePath, JSON.stringify(updatedPolls, null, 2), 'utf8');
        res.json({ "code": 200, "message": "i. O." });
      } else {
        console.error('\nERROR bei DELETE /poll/lack/:token: Schreiben des neuen Arrays schlug fehl.');
        res.status(500).json({ error: 'ERROR bei DELETE /poll/lack/:token: Schreiben des neuen Arrays schlug fehl.' });
      }

    } catch (err) {
      console.error('\nERROR bei DELETE /poll/lack/:token:\n', err);
      res.status(500).json({ error: 'ERROR bei DELETE /poll/lack/:token.' });
    }

  });
});

module.exports = router;
