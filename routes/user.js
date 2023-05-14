const express = require('express');
const router = express.Router();

const fs = require('fs');
const User = require("../src/User");
const {text} = require("express");
const {VoteChoice} = require("../src/Vote");
const usersFilePath = './data/users.json';

/**### POST /user ###*/
/**Add a new user.**/
router.post('', (req, res) => {
  try {
    // Request body in variablen abspeichern
    const { name, password } = req.body;

    const user = new User(name, password);

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /user. Fehler beim Lesen der Datei:\n', err)
        res.status(404).json({ error: 'Poll not found.' });
        return;
      }

      // User in users-array hinzufügen
      let users = [];
      if (data) {
        users = JSON.parse(data);
      }
      users.push(user);


      // Users in .json abspeichern
      fs.writeFile(usersFilePath, JSON.stringify(users), 'utf8', (err) => {
        if (err) {
          console.error('\nERROR bei POST /users. Fehler beim Schreiben der Datei:\n', err);
          res.status(404).json({ error: 'Poll not found.' });
          return;
        }

        res.status(200).json(user.name);
      });
    });
  } catch (error) {

    console.error('\nERROR bei POST /user:\n ', error);
    res.status(404).json({ error: 'Poll not found.' });
  }
});

// /user/{username}
// GET user by user name
router.get('/:username', (req, res) => {
  try {
    const username = req.params.username;

    if (username.length === 0)
    {
      res.status(400).json({ error: 'Invalid username supplied' })
      return;
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(user => user.name === username);

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(404).json({ error: 'Poll not found.' });
  }
});

// DELETE /user/{username}
// Delete user
router.get('/:username', (req, res) => {
  try {
    const username = req.params.username;

    if (username.length === 0)
    {
      res.status(400).json({ error: 'Invalid username supplied' })
      return;
    }
    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(user => user.name === username);

    if (user) {
        users.remove(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }

    //Save Users
    fs.writeFile(usersFilePath, JSON.stringify(users), 'utf8', (err) => {
      if (err) {
        res.status(404).json({ error: 'Poll not found.' });
        return;
      }
      res.status(200);
    });
  } catch (error) {
    res.status(404).json({ error: 'Poll not found.' });
  }
});




module.exports = router;
