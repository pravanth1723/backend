const express=require('express');
const router=express.Router();
const {registerUser,loginUser,current}=require('../controllers/userController');
const validateToken = require('../middleware/validateTokenHandler');
console.log("hello");
router.post("/register",registerUser);

router.post("/login",loginUser);

router.get("/current",validateToken, current);
module.exports=router;
