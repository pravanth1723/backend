const express = require('express');
const router = express.Router();

const { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } = require('../controllers/expense');
const validateToken = require('../middleware/validateTokenHandler');

router.use(validateToken); // protect expense operations

// get all expenses (optionally accept query params like ?roomId=... in controller)
router.get('/by-room-id/:id', getExpenses);

// create a new expense
router.post('/', createExpense);

// get an expense by id
router.get('/:id', getExpense);

// update an expense by id
router.put('/:id', updateExpense);

// delete an expense by id
router.delete('/:id', deleteExpense);

module.exports = router;
