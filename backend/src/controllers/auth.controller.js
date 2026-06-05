const jwt = require('jsonwebtoken');
const User = require('../models/users.model');
const passport = require('passport');


exports.refreshToken = async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(400).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign(
            { id: decoded.id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        refreshToken = jwt.sign(
            { id: decoded.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200)
            .json({ accessToken })
            .cookie('refreshToken', refreshToken)



    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Refresh token expired' });
        }
        return res.status(401).json({ message: 'Invalid refresh token' });
    }

}

exports.userProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ user: req.user })
     .send(
        `<h1>Profile</h1><pre>${
            JSON.stringify(req.user, null, 2)}</pre>`
    );
}
