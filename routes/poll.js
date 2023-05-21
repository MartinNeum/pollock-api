const express = require('express');
const router = express.Router();

const Poll = require('../src/Poll')
const Token = require('../src/Token')
const fs = require('fs');
const pollsFilePath = './data/polls.json';
const {generateShareToken, generateEditToken, generateAdminToken} = require("../funcs/tokens");
const {GeneralPollObject} = require("../src/Poll");
const generateTimestamp = require("../funcs/timestamp");
const {Statistics, StatisticsOption} = require("../src/Statistics");
const votesFilePath = './data/votes.json';


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

    // PollShare (Token) erstellen
    //TODO: SET link for token
    const pollShare = new Token(null, generateShareToken())

    // Poll erstellen
    const poll = new Poll.Poll(pollBody, pollShare)

    const adminToken = generateAdminToken()

    const generalPollObj = new GeneralPollObject(poll,adminToken)

    // polls.json bearbeiten
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /poll/lack. Fehler beim Lesen der Datei:\n', err)
        res.status(404).json({ "code": 404, "message": "Poll not found." })
        return;
      }
      let polls = [];
      if (data) {
        polls = JSON.parse(data);
      }
      polls.push(generalPollObj);
  
      // Polls in .json abspeichern
      fs.writeFile(pollsFilePath, JSON.stringify(polls), 'utf8', (err) => {
        if (err) {
          console.error('\nERROR bei POST /poll/lack. Fehler beim Schreiben der Datei:\n', err);
          res.status(404).json({ "code": 404, "message": "Poll not found." })
          return;
        }
        //TODO: SET link for admin and share
        res.status(200).json({
          "admin": {
            "link": "string",
            "value": adminToken
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
    res.status(404).json({ "code": 404, "message": "Poll not found." })
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
  fs.readFile(pollsFilePath, 'utf8', (err, pollData) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (!pollData) {
      res.status(404).json({code: 404, error: 'Poll not found.'});
      return;
    }
    const polls = JSON.parse(pollData);

    // Polls nach token durchsuchen
    const poll = polls.find(p => p.poll.share.value == token);

    fs.readFile(votesFilePath, 'utf8', (err, voteData) => {
      if (err) {
        console.error('Fehler beim Lesen der Datei:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      if(voteData){
      const voteInfos = JSON.parse(voteData);

      const voteParticipants = [];
      let numOfVotes = 0;
      let numOfWorst = 0;
      // Votes nach token durchsuchen
      voteInfos.forEach(voteInfo => {
        if (voteInfo == null) {
          console.log("keine Votes gefunden");
          return;
        } else {
          if(voteInfo.voteInfo.poll.poll.share.value == token){
            // TODO Number of VOICES nicht Votes
            numOfVotes++;
            voteParticipants.push(voteInfo.voteInfo.vote.owner);
            for (var i=0; i < voteInfo.voteInfo.vote.choice.length; i++){
              if (voteInfo.voteInfo.vote.choice[i].worst == true){
                numOfWorst++;
              }
            }
          }
        }
      })
      const statisticOptions = new StatisticsOption(numOfVotes, numOfWorst);
      const statistic = new Statistics(poll.poll, voteParticipants, statisticOptions);
      res.json(statistic);
      if (!statistic) {
        res.status(404).json({code: 404, error: 'Poll not found.'});
        return;
      }
    }else{
        const statisticOptions = new StatisticsOption(0, 0);
        const statistic = new Statistics(poll.poll, 0, statisticOptions);
        res.json(statistic);
      }

  });
  });
});

/**### PUT /poll/lack/:token ###*/
/**Update a poll by admin token.**/
router.put('/lack/:token', (req, res) => {

  // Token holen
  const adminToken = req.params.token;

  // Request body in variablen abspeichern
  const { title, description, options, setting, fixed } = req.body;
  
  // Check token
  if(adminToken == null) {
    console.error('ERROR bei PUT /poll/lack/:token: Kein Token geliefert.');
    res.status(404).json({ error: 'Poll not found.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    let pollIndex = polls.findIndex(p => p.adminToken == adminToken);

    // Poll bearbeiten
    if (pollIndex != -1) {
      polls[pollIndex].poll.body.title = title
      polls[pollIndex].poll.body.description = description
      polls[pollIndex].poll.body.options = options
      polls[pollIndex].poll.body.setting = setting
      polls[pollIndex].poll.body.fixed = fixed
    } else {
      console.error('Fehler beim Bearbeiten des Polls: ', err)
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    try {
      fs.writeFileSync(pollsFilePath, JSON.stringify(polls, null, 2), 'utf8');
      res.json({ "code": 200, "message": "i. O." });

    } catch (err) {
      console.error('\nERROR bei PUT /poll/lack/:token\n ', error)
      res.status(404).json({ error: 'Poll not found.' });
    }
  });
});

/**### DELETE /poll/lack/:token ###*/
/**Deletes a poll by admin token.**/
router.delete('/lack/:token', (req, res) => {

  //TODO: check if this function needs the admin token or edit token ?

  // Token holen
  const token = req.params.token;

  // Check token
  if(token == null) {
    console.error('ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.');
    res.status(400).json({ error: 'Invalid poll admin token.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    const updatedPolls = [];

    polls.forEach(poll => {
      if (poll == null) {
        res.status(405).json({"code": 405, "message": "Invalid poll admin token."});
        return;
      } else {
        if (poll.adminToken != token) {
          updatedPolls.push(poll);
        }
      }
    });

    try {
      if (updatedPolls.length < polls.length) {
        fs.writeFileSync(pollsFilePath, JSON.stringify(updatedPolls, null, 2), 'utf8');
        res.json({ "code": 200, "message": "i. O." });
      } else {
        console.error('\nERROR bei DELETE /poll/lack/:token: Schreiben des neuen Arrays schlug fehl.');
        res.status(404).json({ error: 'Poll not found.' });
      }

    } catch (err) {
      console.error('\nERROR bei DELETE /poll/lack/:token:\n', err);
      res.status(404).json({ error: 'Poll not found.' });
    }
  });
});
//TODO implement API Check?
/**########################LOCK ENDPOINT############################*/
/**### POST /poll/lock ###*/
/**Add a new poll.**/
router.post('/lock', (req, res) => {
  try {
    // Request body in variablen abspeichern
    const { title, description, options, setting, fixed } = req.body;

    // PollBody erstellen
    const pollSetting = new Poll.PollSetting(setting.voices, setting.worst, setting.deadline)

    const pollOptions = []
    options.forEach(option => {
      if (option.id == null || option.text == null) {
        console.error('\nERROR bei POST /poll/lock:\n Mindestens ein Feld wurde nicht im Request-Body geliefert.')
        res.status(405).json({ "code": 405, "message": "Invalid input" })

      } else {
        const pollOption = new Poll.PollOption(option.id, option.text)
        pollOptions.push(pollOption)
      }
    });
    const pollFixed = fixed

    let pollBody;
    if (title == null || pollOptions == null) {
      console.error('\nERROR bei POST /poll/lock:\n Mindestens ein Feld wurde nicht im Request-Body geliefert.')
      res.status(405).json({ "code": 405, "message": "Invalid input" })
      return
    } else {
      pollBody = new Poll.PollBody(title, description, pollOptions, pollSetting, pollFixed)
    }
    // TODO Security
    // PollSecurity erstellen
    const pollSecurity = null

    // PollShare (Token) erstellen
    //TODO: SET link for token
    const pollShare = new Token(null, generateShareToken())

    // Poll erstellen
    const poll = new Poll.Poll(pollBody, pollSecurity, pollShare)

    const adminToken = generateAdminToken()

    const generalPollObj = new GeneralPollObject(poll,adminToken)

    // polls.json bearbeiten
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /poll/lock. Fehler beim Lesen der Datei:\n', err)
        res.status(404).json({ "code": 404, "message": "Poll not found." })
        return;
      }
      let polls = [];
      if (data) {
        polls = JSON.parse(data);
      }
      polls.push(generalPollObj);

      // Polls in .json abspeichern
      fs.writeFile(pollsFilePath, JSON.stringify(polls), 'utf8', (err) => {
        if (err) {
          console.error('\nERROR bei POST /poll/lock. Fehler beim Schreiben der Datei:\n', err);
          res.status(404).json({ "code": 404, "message": "Poll not found." })
          return;
        }
        //TODO: SET link for admin and share
        res.status(200).json({
          "admin": {
            "link": "string",
            "value": adminToken
          },
          "share": {
            "link": "string",
            "value": poll.share.value
          }
        });
      });
    });
  } catch (error) {
    console.error('\nERROR bei POST /poll/lock:\n ', error)
    res.status(404).json({ "code": 404, "message": "Poll not found." })
  }
});

/**### GET /poll/lock/:token ###*/
/**Return the statistics of the poll by share token.**/
router.get('/lock/:token', (req, res) => {

  const token = req.params.token;

  // Check token
  if(token == ':token' || token == null) {
    console.error('Fehler beim Lesen der Datei:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, pollData) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (!pollData) {
      res.status(404).json({code: 404, error: 'Poll not found.'});
      return;
    }
    const polls = JSON.parse(pollData);

    // Polls nach token durchsuchen
    const poll = polls.find(p => p.poll.share.value == token);

    fs.readFile(votesFilePath, 'utf8', (err, voteData) => {
      if (err) {
        console.error('Fehler beim Lesen der Datei:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      if(voteData){
        const voteInfos = JSON.parse(voteData);

        const voteParticipants = [];
        let numOfVotes = 0;
        let numOfWorst = 0;
        // Votes nach token durchsuchen
        voteInfos.forEach(voteInfo => {
          if (voteInfo == null) {
            console.log("keine Votes gefunden");
            return;
          } else {
            if(voteInfo.voteInfo.poll.poll.share.value == token){
              // TODO Number of VOICES nicht Votes
              numOfVotes++;
              voteParticipants.push(voteInfo.voteInfo.vote.owner);
              for (var i=0; i < voteInfo.voteInfo.vote.choice.length; i++){
                if (voteInfo.voteInfo.vote.choice[i].worst == true){
                  numOfWorst++;
                }
              }
            }
          }
        })
        const statisticOptions = new StatisticsOption(numOfVotes, numOfWorst);
        const statistic = new Statistics(poll.poll, voteParticipants, statisticOptions);
        res.json(statistic);
        if (!statistic) {
          res.status(404).json({code: 404, error: 'Poll not found.'});
          return;
        }
      }else{
        const statisticOptions = new StatisticsOption(0, 0);
        const statistic = new Statistics(poll.poll, 0, statisticOptions);
        res.json(statistic);
      }

    });
  });
});

/**### PUT /poll/lock/:token ###*/
/**Update a poll by admin token.**/
router.put('/lock/:token', (req, res) => {

  // Token holen
  const adminToken = req.params.token;

  // Request body in variablen abspeichern
  const { title, description, options, setting, fixed } = req.body;

  // Check token
  if(adminToken == null) {
    console.error('ERROR bei PUT /poll/lock/:token: Kein Token geliefert.');
    res.status(404).json({ error: 'Poll not found.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    let pollIndex = polls.findIndex(p => p.adminToken == adminToken);

    // Poll bearbeiten
    if (pollIndex != -1) {
      polls[pollIndex].poll.body.title = title
      polls[pollIndex].poll.body.description = description
      polls[pollIndex].poll.body.options = options
      polls[pollIndex].poll.body.setting = setting
      polls[pollIndex].poll.body.fixed = fixed
    } else {
      console.error('Fehler beim Bearbeiten des Polls: ', err)
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    try {
      fs.writeFileSync(pollsFilePath, JSON.stringify(polls, null, 2), 'utf8');
      res.json({ "code": 200, "message": "i. O." });

    } catch (err) {
      console.error('\nERROR bei PUT /poll/lock/:token\n ', error)
      res.status(404).json({ error: 'Poll not found.' });
    }
  });
});

/**### DELETE /poll/lock/:token ###*/
/**Deletes a poll by admin token.**/
router.delete('/lock/:token', (req, res) => {

  //TODO: check if this function needs the admin token or edit token ?

  // Token holen
  const token = req.params.token;

  // Check token
  if(token == null) {
    console.error('ERROR bei DELETE /poll/lock/:token: Kein Token geliefert.');
    res.status(400).json({ error: 'Invalid poll admin token.' });
    return;
  }

  // Polls lesen
  fs.readFile(pollsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const polls = JSON.parse(data);

    // Polls nach token durchsuchen
    const updatedPolls = [];

    polls.forEach(poll => {
      if (poll == null) {
        res.status(405).json({"code": 405, "message": "Invalid poll admin token."});
        return;
      } else {
        if (poll.adminToken != token) {
          updatedPolls.push(poll);
        }
      }
    });

    try {
      if (updatedPolls.length < polls.length) {
        fs.writeFileSync(pollsFilePath, JSON.stringify(updatedPolls, null, 2), 'utf8');
        res.json({ "code": 200, "message": "i. O." });
      } else {
        console.error('\nERROR bei DELETE /poll/lock/:token: Schreiben des neuen Arrays schlug fehl.');
        res.status(404).json({ error: 'Poll not found.' });
      }

    } catch (err) {
      console.error('\nERROR bei DELETE /poll/lock/:token:\n', err);
      res.status(404).json({ error: 'Poll not found.' });
    }
  });
});

module.exports = router;
