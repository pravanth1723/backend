const express = require('express');
const dotenv = require('dotenv').config();
const connectDb = require('./config/dbConnection');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = 5000;
app.use(cors({origin: 'http://localhost:3000',credentials: true}));
app.use(cookieParser());
connectDb();app.use(express.json());
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/rooms', require('./routes/roomRoute'));
app.use('/api/expenses', require('./routes/expenseRoute'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
