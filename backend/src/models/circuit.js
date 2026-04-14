const mongoose = require('mongoose');

const circuitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Circuit',
    },
    data: {
      nodes: {
        type: Array,
        default: [],
      },
      edges: {
        type: Array,
        default: [],
      },
    },
  },
  {
    timestamps: true,
  },
);

const Circuit = mongoose.model('Circuit', circuitSchema);

module.exports = Circuit;