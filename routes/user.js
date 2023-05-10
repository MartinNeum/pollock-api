const express = require('express');
const router = express.Router();

// GET /user
router.get('/', (req, res) => {
  const users = [
    { id: 1, name: 'Benutzer 1' },
    { id: 2, name: 'Benutzer 2' },
    { id: 3, name: 'Benutzer 3' }
  ];
  res.json(users);
});

module.exports = router;
