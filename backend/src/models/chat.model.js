const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
    default: "New Chat"
  },

  bookmark: {
    type: Boolean,
    default: false
  },

  messages: [
    {
      role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
      },

      content: {
        type: String,
        required: true
      },

      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
