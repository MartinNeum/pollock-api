const express = require('express');
const router = express.Router();

const fs = require('fs');
const User = require("../src/User");
const {text} = require("express");
const {VoteChoice} = require("../src/Vote");
const {generateAPIKey} = require("../funcs/tokens");
const {GeneralUser} = require("../src/User");
const usersFilePath = './data/users.json';

/**### POST /user ###*/
/**Add a new user.**/
//TODO doppelte User-Erstellung verhindern
router.post('', (req, res) => {
  try {

    // Request body in variablen abspeichern
    const { name, password } = req.body;

    //TODO: do we need to save the password ? Or only the lock=true or =false value?
    const user = new User.User(name, true);
    const generalUser = new GeneralUser(user, generateAPIKey());

    fs.readFile(usersFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('\nERROR bei POST /user. Fehler beim Lesen der Datei:\n', err)
        res.status(404).json({ message: 'Poll not found.' });
        return;
      }

      // User in users-array hinzufügen
      let users = [];
      if (data) {
        users = JSON.parse(data);
      }
      users.push(generalUser);

      // Users in .json abspeichern
      fs.writeFile(usersFilePath, JSON.stringify(users), 'utf8', (err) => {
        if (err) {
          console.error('\nERROR bei POST /users. Fehler beim Schreiben der Datei:\n', err);
          res.status(404).json({ message: 'Poll not found.' });
          return;
        }

        res.status(200).json(generalUser.apiKey);
      });
    });
  } catch (error) {
    console.error('\nERROR bei POST /user:\n ', error);
    res.status(404).json({ message: 'Poll not found.' });
  }
});

//TODO: POST /user/key //Create a API-Key for an existent user.

// /user/{username}
// GET user by username
router.get('/:username', (req, res) => {
  try {
    const apiKey = req.header("API-KEY");

    const username = req.params.username;

    if (username.length === 0)
    {
      res.status(400).json({ message: 'Invalid username supplied' })
      return;
    }

    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data);

    const me = users.find(user => user.apiKey == apiKey);
    if (me != null){
      const user = users.find(user => user.user.name === username);

      if (user) {
        res.json(user.user);
      } else {
        res.status(404).json({ message: 'Invalid username supplied' });
      }
    }
    else
    {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(404).json({ message: 'Poll not found.' });
  }
});

// DELETE /user/{username}
// Delete user
// This can only be done by the logged in user.
router.delete('/:username', (req, res) => {
  try {
    const apiKey = req.header("API-KEY");
    const username = req.params.username;

    if (username.length === 0)
    {
      res.status(400).json({code: 400,message: 'Invalid username supplied' })
      return;
    }

    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(user => user.user.name == username);
    const user = users.find(user => user.user.name == username);
    const me = users.find(user => user.apiKey == apiKey);
    if (me != null) {
      if (userIndex !== -1) {
        if (user == me)
        {
          users.splice(userIndex, 1);
        }
        else
        {
          res.status(400).json({code: 400, message:'Invalid username supplied'});
        }
      } else {
        res.status(400).json({code: 400,message:'Invalid username supplied'});
      }
    }
    else
    {
      res.status(404).json({code: 404,message:'User not found'})
    }
    //Save Users
    fs.writeFile(usersFilePath, JSON.stringify(users), 'utf8', (err) => {
      if (err) {
        console.log("Failed to save users to userFilePath.");
        res.status(404).json({code: 404, message: 'Poll not found.' });;
        return;
      }
      res.status(200).json();
    });
  } catch (error) {
    res.status(404).json({code: 404, message: 'Poll not found.' });
  }
});

module.exports = router;
