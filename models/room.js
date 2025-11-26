const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Room schema
 * - roomCode: unique code to join
 * - kind: enum for room type
 * - passcodeHash: hashed passcode (if used)
 * - members: embedded small array of members (user references + display name + role)
 * - settings: currency, defaultSplitMethod, etc.
 * - lastExpenseAt: denormalized timestamp for convenience
 * - createdBy/updatedBy: references to users
 */
const roomSchema = new Schema(
  {
    roomCode: {
      type: String,
      required: [true, 'roomCode is required'],
      minlength: 3,
      maxlength: 64,
    },
    kind: {
      type: String,
      enum: ['personal', 'group'],
      required: true,
      default: 'personal',
    },
    passcode: { type: String, required :true },
    name: { type: String, default: null },
    notes: { type: String, default: null },
    members: {
      type: [String],
    },
    roommembers:{ type: [Schema.Types.ObjectId], ref: 'User' },
    lastExpenseAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String},
    organizer: { type: String },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

// Compound unique index for roomCode + kind + createdBy
// Only enforced when kind is 'personal'
roomSchema.index(
  { roomCode: 1, kind: 1, createdBy: 1 },
  { 
    unique: true,
    partialFilterExpression: { kind: 'personal' }
  }
);

module.exports = mongoose.model('Rooms', roomSchema);
