const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User schema - minimal fields as requested:
 * - username
 * - password (store hashed passwords only)
 * - createdAt (timestamps configured to only add createdAt)
 */
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add the username'],
      trim: true,
      minlength: 3,
      maxlength: 64,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add password'],
    },
    incomes: {
      type: [
        {
          note: { type: String, required: true },
          amount: { type: Number, required: true },
          date: { type: Date, required: true }
        }
      ]
    },
    methods: {
      type: [
        {
          name: { type: String, required: true },
          type: { type: String, required: true }
        }
      ]
    }
  },
  {
    // Only store createdAt (no updatedAt)
    timestamps: { createdAt: true, updatedAt: false },
  }
);


module.exports = mongoose.model('User', userSchema);
