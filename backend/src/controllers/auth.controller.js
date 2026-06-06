const User = require('../models/users.model');

exports.userProfile = async (req, res) => {
    try {
        // If req.user is just an id (from session), fetch the full user
        let user = null;
        if (req.user && (req.user._id || req.user.id) && !(req.user.googleId || req.user.email)) {
            const id = req.user._id || req.user.id;
            user = await User.findById(id);
        } else {
            // derive identifiers/fields whether req.user is a passport profile or a DB user document
            const googleId = req.user.googleId || req.user.id || (req.user._id ? req.user._id.toString() : null) || req.user._json?.sub || null;
            const email = (req.user.emails && req.user.emails[0] && req.user.emails[0].value) || req.user.email || req.user._json?.email || '';
            const profilePicture = (req.user.photos && req.user.photos[0] && req.user.photos[0].value) || req.user.profilePicture || req.user._json?.picture || '';
            const displayName = req.user.displayName || req.user.name || req.user.displayName || req.user._json?.name || '';

            const query = googleId ? { googleId } : (email ? { email } : {});

            user = await User.findOneAndUpdate(
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
        }

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};