const express = require('express');
const router = express.Router();

const fs = require('fs');
const usersFilePath = './data/users.json';

// GET /user
router.get('/', (req, res) => {

  try {

    const data = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(data)
    res.json(users)

  } catch (error) {

    console.error('\nERROR bei GET /user:\n ', error)
    res.status(500).json({ error: 'GET /user schlug fehl' })
    
  }

});

module.exports = router;
