const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const registerUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400);
        throw new Error('All fields are mandotory');
    }

    const userAvailable = await User.findOne({ username });
    if (userAvailable) {
        res.status(400);
        throw new Error("User already registered");
    }
    //hasing password

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    const user = await User.create({
        username,
        password: hashedPassword,
    });
    if (user) {
        res.status(201).json({ _id: user.id })
    }
    else {
        res.status(400);
        throw new Error('User data is not valid');
    }
    res.json({ message: 'Register the user' });
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400);
        throw new Error('Enter username and password');
    }
    else {
        const user = await User.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            console.log('reached login');
            const accesstoken = jwt.sign({
                user: {
                    username: user.username,
                    id: user.id,
                },
            },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "21m" }
            );
            console.log('successs');
            res.cookie('jwt', accesstoken,
                {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Strict'
                });
            res.status(200).json("Login successful");

        }
        else {
            res.status(401);
            throw new Error("Email or Password is incorrect");
        }
    }
});

const current = asyncHandler(async (req, res) => {
    res.json(req.user);
});

module.exports = { registerUser, loginUser, current };
