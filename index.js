const express = require('express');
const dotenv = require('dotenv').config();
const connectDb = require('./config/dbConnection');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.PORT || 5000;

// Allow configuring the frontend origin via env (use exact origin: protocol+host+port)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
connectDb();
app.use(express.json());
app.use('/api/users', require('./routes/user'));
app.use('/api/rooms', require('./routes/room'));
app.use('/api/expenses', require('./routes/expense'));

// Central error handler (was imported but not used)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
