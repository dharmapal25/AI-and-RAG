const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    googleId: { 
        type: String,
        required: [true, 'Google ID is required'],
        unique: true 
    },

    displayName: { type: String, 
        required: [true, 'Display name is required'] 
    },

    profilePicture: { type: String },

    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true 
    },

    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;