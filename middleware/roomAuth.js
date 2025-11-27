const asyncHandler = require('express-async-handler');
const Room = require('../models/room');
/**
 * Middleware to verify user is a member of the room
 * Checks if req.user.id exists in room's roommembers array
 */
const checkRoomMembership = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);
  
  if (!room) {
    return res.status(404).json({ category: 'error', message: 'Room not found' });
  }

  // Check if user is a member
  const isMember = room.roommembers.some(
    memberId => memberId.toString() === req.user.id.toString()
  );

  if (!isMember) {
    return res.status(403).json({ category: 'error', message: 'Access denied: You are not a member of this room' });
  }

  // Attach room to request object to avoid redundant DB queries
  req.room = room;
  next();
});

/**
 * Middleware to verify user is the room creator/admin
 * Checks if req.user.id matches room's createdBy field
 */
const checkRoomAdmin = asyncHandler(async (req, res, next) => {
  const room = req.room || await Room.findById(req.params.id);
  
  if (!room) {
    return res.status(404).json({ category: 'error', message: 'Room not found' });
  }

  // Check if user is the creator
  if (room.createdBy.toString() !== req.user.id.toString()) {
    return res.status(403).json({ category: 'error', message: 'Access denied: Only room creator can perform this action' });
  }

  // Attach room to request object
  req.room = room;
  next();
});

module.exports = {
  checkRoomMembership,
  checkRoomAdmin
};
