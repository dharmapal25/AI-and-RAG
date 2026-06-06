const jwt = require('jsonwebtoken');
const User = require('../models/users.model');

exports.refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;

    if (!token) {
        return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ accessToken });
    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

exports.userProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findOneAndUpdate(
            { googleId: req.user.id },
            {
                $set: {
                    googleId: req.user.id,
                    displayName: req.user.displayName,
                    email: req.user.emails[0].value,
                    profilePicture: req.user.photos[0]?.value || '',
                }
            },
            {
                upsert: true, // create if not exists
                new: true  // return the updated document
            }
        );

        const accessToken = jwt.sign(
            { id: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.json({ user, accessToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};