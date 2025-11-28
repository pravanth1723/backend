const express=require('express');
const router=express.Router();
const {registerUser,loginUser,current,validateUser,logoutUser} = require('../controllers/user');
const validateToken = require('../middleware/validateTokenHandler');

router.post("/register",registerUser);

router.post("/login",loginUser);

router.get("/current",validateToken, current);

router.get("/me",validateToken, validateUser);

router.post("/logout",logoutUser);

module.exports=router;
