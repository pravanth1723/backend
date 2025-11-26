const express = require('express');
const router = express.Router();

const { getRooms, getRoom, createRoom, updateRoom,joinRoom} = require('../controllers/roomController');
const validateToken = require('../middleware/validateTokenHandler');

router.use(validateToken); // protect room operations

// get all rooms
router.get('/', getRooms);
router.post('/', createRoom);
router.post('/join/:id',joinRoom);
router.get('/:id', getRoom);
router.put('/:id', updateRoom);
module.exports = router;
