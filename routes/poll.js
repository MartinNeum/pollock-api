const express = require('express');
const router = express.Router();

// GET /poll
router.get('/', (req, res) => {
  const umfragen = [
    { id: 1, frage: 'Frage 1' },
    { id: 2, frage: 'Frage 2' },
    { id: 3, frage: 'Frage 3' }
  ];
  res.json(umfragen);
});

module.exports = router;
