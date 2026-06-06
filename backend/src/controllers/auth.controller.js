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

        // derive identifiers/fields whether req.user is a passport profile or a DB user document
        const googleId = req.user.googleId || req.user.id || (req.user._id ? req.user._id.toString() : null) || req.user._json?.sub || null;
        const email = (req.user.emails && req.user.emails[0] && req.user.emails[0].value) || req.user.email || req.user._json?.email || '';
        const profilePicture = (req.user.photos && req.user.photos[0] && req.user.photos[0].value) || req.user.profilePicture || req.user._json?.picture || '';
        const displayName = req.user.displayName || req.user.name || req.user.displayName || req.user._json?.name || '';

        const query = googleId ? { googleId } : (email ? { email } : {});

        const user = await User.findOneAndUpdate(
            query,
            {
                $set: {
                    googleId: googleId || undefined,
                    displayName: displayName,
                    email,
                    profilePicture,
                }
            },
            {
                upsert: true, // create if not exists
                returnDocument: 'after'
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