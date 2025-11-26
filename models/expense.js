const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Expense schema
 * - roomId: reference to Room
 * - createdBy: who added the expense
 * - total & amounts are stored as integer cents (Number) to avoid floating precision issues
 * - spentBy: array of payers (support multi-payer)
 * - spentFor: array of beneficiaries with explicit share or percentage
 * - splitMethod: how the split was calculated
 * - settlements: optional list of actual payments that settled parts of this expense
 */

const expenseSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    description: { type: String, default: null },
    total: { type: Number, required: true, min: 0 },
    spentBy: {
      type: [
        {
          name: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 }
        }
      ],
      required: true
    },
    spentFor: {
      type: [
        {
          name: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 }
        }
      ],
      required: true
    },
    username: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
