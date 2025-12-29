const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const Room = require('../models/room');
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

        // Set cookie with environment-aware options so it works in dev (HTTP)
        // and in production (HTTPS + cross-site if needed).
        res.cookie('jwt', accesstoken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // secure cookies only in prod (requires HTTPS)
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' in prod for cross-site, 'Lax' for dev
            maxAge: 30 * 60 * 1000,
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
    // Clear cookie with matching options used when setting it.
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        path: '/',
    });
    return res.status(200).json({ category: 'success', message: 'Logged out successfully' });
});

const addIncome = asyncHandler(async (req, res) => {
    console.log("Add income called");
    const income = req.body;
    console.log(income);
    console.log(req.body);
    console.log(req.user.id);
    if (!income) {
        return res.status(400).json({ category: 'error', message: 'Income is required' });
    }
    console.log(req.user.id);
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }
    console.log(income);
    user.incomes.push(income);
    await user.save();

    return res.status(200).json({ category: 'success', message: 'Income added successfully' });
});

const fetchIncomes = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }
    return res.status(200).json({ category: 'success', message: 'Incomes retrieved successfully', data: user.incomes });
});

const updateIncome = asyncHandler(async (req, res) => {
    const updatedIncome = req.body;
    const incomeId = req.params.id;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }

    const income = user.incomes.id(incomeId);
    if (!income) {
        return res.status(404).json({ category: 'error', message: 'Income not found' });
    }

    Object.assign(income, updatedIncome); // update fields
    await user.save();

    return res.status(200).json({
        category: 'success',
        message: 'Income updated successfully',
        income
    });
});


const deleteIncome = asyncHandler(async (req, res) => {
    const incomeId = req.params.id;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }

    const income = user.incomes.id(incomeId);
    if (!income) {
        return res.status(404).json({ category: 'error', message: 'Income not found' });
    }

    income.deleteOne(); // 🔥 removes subdocument
    await user.save();

    return res.status(200).json({
        category: 'success',
        message: 'Income deleted successfully'
    });
});

const addMethod = asyncHandler(async (req, res) => {
    const method = req.body;
    if (!method) {
        return res.status(400).json({ category: 'error', message: 'Method is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }

    user.methods.push(method);
    await user.save();
    
    // Push method name to all user's personal rooms
    await Room.updateMany(
        { 
            createdBy: req.user.id, 
            kind: 'personal' 
        },
        { 
            $push: { members: method.name } 
        }
    );
    
    return res.status(200).json({ category: 'success', message: 'Method added successfully' });
});

const getMethods = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }
    return res.status(200).json({ category: 'success', message: 'Methods retrieved successfully', data: user.methods });
});

const deleteMethod = asyncHandler(async (req, res) => {
    const methodId = req.params.id;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ category: 'error', message: 'User not found' });
    }

    const method = user.methods.id(methodId);
    if (!method) {
        return res.status(404).json({ category: 'error', message: 'Method not found' });
    }

    const methodName = method.name;
    method.deleteOne(); // removes subdocument
    await user.save();

    // Remove method name from all user's personal rooms
    await Room.updateMany(
        { 
            createdBy: req.user.id, 
            kind: 'personal' 
        },
        { 
            $pull: { members: methodName } 
        }
    );

    return res.status(200).json({
        category: 'success',
        message: 'Method deleted successfully'
    });
});

module.exports = { registerUser, loginUser, current, validateUser, logoutUser, addIncome, fetchIncomes, updateIncome, deleteIncome, addMethod, getMethods, deleteMethod };