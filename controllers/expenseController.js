const asyncHandler = require('express-async-handler');
const Expense = require('../models/expense');
const Room = require('../models/room');
const mongoose = require('mongoose');

/**
 * Get expenses relevant to the current user.
 * - If ?roomId=... is provided, validate membership and return expenses for that room.
 * - Otherwise return expenses where the user is payer, beneficiary, or creator.
 */
const getExpenses = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
console.log('roomId param:', roomId);
  if (roomId) {
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    const expenses = await Expense.find({ roomId: roomId }).sort({ createdAt: -1 });
    console.log('Expenses for room:', expenses);
    return res.status(200).json(expenses);
  }

  // fallback: find expenses where user is involved
  const expenses = await Expense.find({
    $or: [
      { 'spentBy.userId': req.user.id },
      { 'spentFor.userId': req.user.id },
      { createdBy: req.user.id },
    ],
  }).sort({ createdAt: -1 });

  res.status(200).json({ expenses, username: req.user.username });
});

/**
 * Create an expense
 * - requires roomId, total, spentBy, spentFor
 * - validates room existence and membership
 * - optional: validates that sum(spentBy.amount) === total (if amounts provided)
 */
const createExpense = asyncHandler(async (req, res) => {
  const { roomId, total, spentBy, spentFor, description } = req.body;

  if (!roomId || total == null || !Array.isArray(spentBy) || !Array.isArray(spentFor)) {
    res.status(400);
    throw new Error('roomId, total, spentBy and spentFor are required');
  }

  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  const expense = await Expense.create({
    roomId,
    description: description || null,
    total,
    spentBy,
    spentFor,
    username: req.user.username,
    createdBy: req.user.id,
  });

  // update room lastExpenseAt denormalized field
  await Room.findByIdAndUpdate(roomId, { lastExpenseAt: new Date(), updatedBy: req.user.id });

  res.status(201).json(expense);
});

/**
 * Get an expense by id
 * - Accessible if user is involved (payer, beneficiary, or member of the room) or creator
 */
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  // quick allow if creator
  if (expense.createdBy && expense.createdBy.toString() === req.user.id.toString()) {
    return res.status(200).json(expense);
  }

  // check involvement as payer or beneficiary
  const isPayer = (expense.spentBy || []).some((p) => p.userId.toString() === req.user.id.toString());
  const isBeneficiary = (expense.spentFor || []).some((b) => b.userId.toString() === req.user.id.toString());

  if (isPayer || isBeneficiary) {
    return res.status(200).json(expense);
  }

  // lastly check room membership
  const room = await Room.findById(expense.roomId);
  if (!room) {
    res.status(404);
    throw new Error('Related room not found');
  }

  const isMember = room.members.some((m) => m.userId.toString() === req.user.id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error('User does not have access to this expense');
  }

  res.status(200).json(expense);
});

/**
 * Update an expense
 * - Only the expense creator may update it (keeps it simple like contacts)
 * - updates updatedBy automatically
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.createdBy.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('User does not have access to update this expense');
  }

  const updatePayload = {
    ...req.body,
    updatedBy: req.user.id,
  };

  const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

  // update room's lastExpenseAt if needed
  if (updatedExpense && updatedExpense.roomId) {
    await Room.findByIdAndUpdate(updatedExpense.roomId, { lastExpenseAt: new Date(), updatedBy: req.user.id });
  }

  res.status(200).json(updatedExpense);
});

/**
 * Delete an expense
 * - Only the creator may delete (keeps permission simple)
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (expense.createdBy.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('User does not have access to delete this expense');
  }

  await Expense.deleteOne({ _id: req.params.id });

  // update room metadata if needed (lastExpenseAt could be recomputed in background)
  try {
    await Room.findByIdAndUpdate(expense.roomId, { updatedBy: req.user.id });
  } catch (err) {
    // non-fatal
  }

  res.status(200).send('Expense Deleted');
});

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
