const express=require('express');
const router=express.Router();
const {registerUser,loginUser,current,validateUser,logoutUser,addIncome,fetchIncomes,updateIncome,deleteIncome,addMethod,getMethods,deleteMethod} = require('../controllers/user');
const validateToken = require('../middleware/validateTokenHandler');

router.post("/register",registerUser);

router.post("/login",loginUser);

router.get("/current",validateToken, current);

router.get("/me",validateToken, validateUser);

router.post("/logout",logoutUser);

router.post("/income",validateToken,addIncome);

router.get("/incomes",validateToken,fetchIncomes);

router.put("/income/:id",validateToken,updateIncome);

router.delete("/income/:id",validateToken,deleteIncome);

router.post("/methods",validateToken,addMethod);

router.get("/methods",validateToken,getMethods);

router.delete("/methods/:id",validateToken,deleteMethod);

module.exports=router;
