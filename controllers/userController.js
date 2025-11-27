const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ category: 'error', message: 'All fields are mandatory' });
    }

    const userAvailable = await User.findOne({ username });
    if (userAvailable) {
        return res.status(400).json({ category: 'error', message: 'User already registered' });
    }

    // hashing password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    const user = await User.create({
        username,
        password: hashedPassword,
    });

    if (user) {
        return res.status(200).json({ category: 'success', message: 'User registered successfully', data: { _id: user.id, username: user.username } });
    } else {
        return res.status(400).json({ category: 'error', message: 'User data is not valid' });
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ category: 'error', message: 'Enter username and password' });
    }

    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
        const accesstoken = jwt.sign({
            user: {
                username: user.username,
                id: user.id,
            },
        },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30m" }
        );        

        res.cookie('jwt', accesstoken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });
        return res.status(200).json({ category: 'success', message: 'Login successful', data: { username: user.username, id: user.id } });
    } else {
        return res.status(401).json({ category: 'error', message: 'Email or password is incorrect' });
    }
});

const current = asyncHandler(async (req, res) => {
    res.status(200).json({ category: 'success', message: 'Current user retrieved successfully', data: req.user });
});

const validateUser = asyncHandler(async (req, res) => {

    if (req.user) {
        return res.status(200).json({ category: 'success', message: 'User authenticated', data: { userId: req.user.username, id: req.user.id } });
    } else {
        return res.status(401).json({ category: 'error', message: 'Not authenticated' });
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
    });
    return res.status(200).json({ category: 'success', message: 'Logged out successfully' });
});

module.exports = { registerUser, loginUser, current, validateUser, logoutUser };
