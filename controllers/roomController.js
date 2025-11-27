const asyncHandler = require('express-async-handler');
const Room = require('../models/room');
const mongoose = require('mongoose');

const getRooms = asyncHandler(async (req, res) => {
  console.log('Fetching rooms for user:', req.user.id);
  const rooms = await Room.find({ 'roommembers': req.user.id })
    .select('_id roomCode kind name');
  const username = req.user.username;
  res.status(200).json({ category: 'success', message: 'Rooms retrieved successfully', data: rooms });
});

/**
 * Create a new room
 * - requires at least roomCode (kind is optional)
 * - ensures the creator is added to members as admin
 */
const createRoom = asyncHandler(async (req, res) => {
  const { roomCode, passcode, kind, name, notes, members } = req.body;
  console.log(req.body);
  if (!roomCode) {
    return res.status(400).json({ category: 'error', message: 'roomCode is required' });
  }

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

  res.status(201).json({ category: 'success', message: 'Room created successfully', data: room });
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
  
  console.log("roooom", room);
  const { roomCode, title, name, organizer, notes, members } = req.body;

  room.roomCode = roomCode || room.roomCode;
  room.name = name || room.name;
  room.notes = notes || room.notes;
  room.members = members || room.members;
  room.updatedBy = req.user.id;
  room.title = title || room.title;
  room.organizer = organizer || room.organizer;
  
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

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  joinRoom
};
