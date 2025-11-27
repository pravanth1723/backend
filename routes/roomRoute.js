const express = require('express');
const router = express.Router();
const {getRooms, getRoom, createRoom, updateRoom,joinRoom,leaveRoom,changePasscode,deleteRoom} = require('../controllers/roomController');
const validateToken = require('../middleware/validateTokenHandler');
const { checkRoomMembership, checkRoomAdmin } = require('../middleware/roomAuth');

router.use(validateToken); 

router.get('/',getRooms);
router.post('/', createRoom);
router.post('/join/:id',joinRoom);
router.get('/:id',checkRoomMembership,getRoom);
router.put('/:id', checkRoomMembership,updateRoom);
router.put('/change-passcode/:id',checkRoomAdmin, changePasscode);
router.put('/exit/:id',leaveRoom);
router.delete('/:id', checkRoomAdmin, deleteRoom);
module.exports = router;
