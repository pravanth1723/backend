const asyncHandler = require('express-async-handler');
const Room = require('../models/room');
const User = require('../models/user');
const mongoose = require('mongoose');

const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ 'roommembers': req.user.id })
    .select('_id roomCode kind name createdBy');
  
  // Add admin flag to each room
  const roomsWithAdminFlag = rooms.map(room => ({
    _id: room._id,
    roomCode: room.roomCode,
    kind: room.kind,
    name: room.name,
    admin: room.createdBy.toString() === req.user.id.toString() ? 'yes' : 'no'
  }));
  
  res.status(200).json({ category: 'success', message: 'Rooms retrieved successfully', data: roomsWithAdminFlag });
});

/**
 * Create a new room
 * - requires at least roomCode (kind is optional)
 * - ensures the creator is added to members as admin
 */
const createRoom = asyncHandler(async (req, res) => {
  let { roomCode, passcode, kind, name, notes, members } = req.body;
  if (!roomCode) {
    return res.status(400).json({ category: 'error', message: 'roomCode is required' });
  }
  console.log('Creating room with data:', req.body);
  console.log('User creating room:', req.user.id);
  // If kind is personal, fetch user methods and add as members
  if (kind === 'personal') {
    const user = await User.findById(req.user.id);
    console.log('Fetched user for personal room:', user.methods);
    if (user && user.methods && user.methods.length > 0) {
      console.log(user.methods.map(method => method.name));
      members = user.methods.map(method => method.name);
      console.log('Members set from user methods for personal room:', members);
    }
  }
console.log('Final members list:', members);
  console.log('About to create room with:', {
    roomCode,
    passcode,
    kind,
    name: roomCode,
    notes: notes || null,
    members: members,
    roommembers: [req.user.id],
    createdBy: req.user.id,
  });
  
  const room = await Room.create({
    roomCode,
    passcode: passcode,
    kind: kind,
    name: roomCode,
    notes: notes || null,
    members: members,
    roommembers: [req.user.id],
    createdBy: req.user.id,
  });

  console.log('Room created successfully:', room);
  res.status(200).json({ category: 'success', message: 'Room created successfully', data: room });
});

/**
 * Get a single room by id
 * - only accessible if user is a member
 * - room is pre-fetched by checkRoomMembership middleware
 */
const getRoom = asyncHandler(async (req, res) => {
  // Room is already fetched and verified by middleware
  res.status(200).json({ category: 'success', message: 'Room retrieved successfully', data: req.room });
});

/**
 * Update room details
 * - only accessible by room creator
 * - room is pre-fetched by checkRoomAdmin middleware
 */
const updateRoom = asyncHandler(async (req, res) => {
  // Room is already fetched and verified by middleware
  const room = req.room;
  const { roomCode, title, name, organizer, notes, members } = req.body;

  room.roomCode = roomCode || room.roomCode;
  room.name = name || room.name;
  room.notes = notes || room.notes;
  room.members = members || room.members;
  room.updatedBy = req.user.id;
  room.title = title || room.title;
  room.organizer = organizer || room.organizer;
  room.organizerUpiId = req.body.organizerUpiId || room.organizerUpiId;
  
  const updatedRoom = await room.save();
  res.status(200).json({ category: 'success', message: 'Room updated successfully', data: updatedRoom });
});

/**
 * Join a room with passcode
 * - public endpoint, no membership required initially
 */
const joinRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ category: 'error', message: 'Room not found' });
  }

  const { passcode } = req.body;

  if (room.passcode !== passcode) {
    return res.status(401).json({ category: 'error', message: 'Incorrect passcode' });
  }
  
  if (room.kind == 'personal') {
    return res.status(400).json({ category: 'error', message: 'Cannot join a personal room' });
  }
  
  // Add user to members if not already present
  if (!room.roommembers.includes(req.user.id)) {
    room.roommembers.push(req.user.id);
    room.updatedBy = req.user.id;
    await room.save();
  }

  res.status(200).json({ category: 'success', message: 'Joined room successfully', data: room });
});

const leaveRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) {
    return res.status(404).json({ category: 'error', message: 'Room not found' });
  }

  // Prevent the creator from leaving their own room
  if (room.createdBy.toString() === req.user.id.toString()) {
    return res.status(400).json({ category: 'error', message: 'Room creator cannot leave the room' });
  }

  // Remove user from members if present
  const memberIndex = room.roommembers.indexOf(req.user.id);
  if (memberIndex > -1) {
    room.roommembers.splice(memberIndex, 1);
    room.updatedBy = req.user.id;
    await room.save();
  }

  res.status(200).json({ category: 'success', message: 'Left room successfully' });
});

const changePasscode = asyncHandler(async (req, res) => {
  const room = req.room; // fetched by checkRoomAdmin middleware
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ category: 'error', message: 'New passcode is required' });
  }

  room.passcode = passcode;
  room.updatedBy = req.user.id;
  await room.save();

  res.status(200).json({ category: 'success', message: 'Passcode changed successfully' });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = req.room; // fetched by checkRoomAdmin middleware

  await Room.deleteOne({ _id: room._id });

  res.status(200).json({ category: 'success', message: 'Room deleted successfully' });
});

const calculateBestOrganizer = asyncHandler(async (req, res) => {
  const roomId = req.params.id;
  const Expense = require('../models/expense');

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ category: 'error', message: 'Invalid room ID' });
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return res.status(404).json({ category: 'error', message: 'Room not found' });
  }

  // Get all expenses for this room
  const expenses = await Expense.find({ roomId: roomId });
  
  if (expenses.length === 0) {
    return res.status(200).json({ 
      category: 'success', 
      message: 'No expenses found for this room', 
      data: { bestOrganizer: null, netContribution: 0 } 
    });
  }

  // Calculate net contribution for each person
  const netContributions = {};

  expenses.forEach(expense => {
    // Calculate total paid by each person
    expense.spentBy.forEach(payer => {
      if (!netContributions[payer.name]) {
        netContributions[payer.name] = { paid: 0, split: 0 };
      }
      netContributions[payer.name].paid += payer.amount;
    });

    // Calculate total split for each person
    expense.spentFor.forEach(beneficiary => {
      if (!netContributions[beneficiary.name]) {
        netContributions[beneficiary.name] = { paid: 0, split: 0 };
      }
      netContributions[beneficiary.name].split += beneficiary.amount;
    });
  });

  // Find person with highest net contribution (paid - split)
  let bestOrganizer = null;
  let maxNetContribution = -Infinity;

  for (const [person, amounts] of Object.entries(netContributions)) {
    const netContribution = amounts.paid - amounts.split;
    if (netContribution > maxNetContribution) {
      maxNetContribution = netContribution;
      bestOrganizer = person;
    }
  }

  res.status(200).json({ 
    category: 'success', 
    message: 'Best organizer calculated successfully', 
    data: { 
      bestOrganizer,
    }
  });
});

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  joinRoom,
  leaveRoom,
  changePasscode,
  deleteRoom,
  calculateBestOrganizer,
};
