    const User = require('../models/userModel');
    const jwt = require('jsonwebtoken');

    const auth = async (req, res, next) => {
        try {
            const token = req.cookies.token;
            
            // If no token exists, return unauthorized (without referencing undefined 'err')
            if (!token) {
                return res.status(401).json({ msg: "Authentication required - no token found" });
            }

            // let token;
            // if (
            // req.headers.authorization &&
            // req.headers.authorization.startsWith('Bearer')
            // ) {
            // token = req.headers.authorization.split(' ')[1];
            // } else if (req.cookies && req.cookies.jwt) {
            // token = req.cookies.token;
            // }
        
            if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'You are not logged in. Please log in to get access.'
            });
            }

            // Try to verify the token
            try {
                const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                
                // Find the user
                const user = await User.findById(decodedToken.token)
                    .select('-password')
                    .populate('followers')
                    .populate('threads')
                    .populate('replies')
                    .populate('reposts');
                    
                if (!user) {
                    return res.status(401).json({ msg: "User not found - invalid token" });
                }
                
                // Set user in request and continue
                req.user = user;
                next();
                
            } catch (jwtError) {
                // Handle JWT verification errors specifically
                console.log("JWT verification error:", jwtError.message);
                return res.status(401).json({ msg: "Invalid or expired token", err: jwtError.message });
            }
        } catch (err) {
            console.error("Auth middleware error:", err);
            return res.status(500).json({ msg: "Authentication failed - server error", err: err.message });
        }
    };

    module.exports = auth;