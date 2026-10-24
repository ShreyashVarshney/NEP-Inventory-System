import jwt from 'jsonwebtoken';
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const token = authHeader.split(" ")[1]?.trim();
        if (!token || token === "null" || token === "undefined") {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("Critical error: JWT_SECRET is not configured in server environment variables.");
            return res.status(500).json({ success: false, message: "Server configuration error: JWT_SECRET missing" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (jwtErr) {
            if (jwtErr.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Token expired. Please sign in again." });
            }
            if (jwtErr.name === "JsonWebTokenError") {
                return res.status(401).json({ success: false, message: "Invalid token. Please sign in again." });
            }
            return res.status(401).json({ success: false, message: "Authentication failed. Please sign in again." });
        }

        if (!decoded || !decoded.id) {
            return res.status(401).json({ success: false, message: "Invalid token payload" });
        }

        let user;
        try {
            user = await User.findById(decoded.id).select("-password");
        } catch (dbErr) {
            if (dbErr.name === "CastError") {
                return res.status(401).json({ success: false, message: "Invalid user identifier in token" });
            }
            throw dbErr;
        }

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found or session revoked" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in authMiddleware:", error);
        return res.status(500).json({ success: false, message: "Internal server error in middleware" });
    }
};

export default authMiddleware;