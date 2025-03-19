import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET;

/**
 * Generates an access token and a refresh token.
 * @param {string} userId - The user's ID.
 * @param {string} phone - The user's phone number.
 * @param {string} role - The user's role.
 * @returns {Object} An object containing the access token and refresh token.
 */
export const generateToken = (userId, phone, role) => {
    if (!SECRET_KEY || !REFRESH_SECRET_KEY) {
        throw new Error("JWT secret keys are missing.");
    }

    const token = jwt.sign({ userId, phone, role }, SECRET_KEY, { expiresIn: '2h' });
    const refreshToken = jwt.sign({ userId, phone, role }, REFRESH_SECRET_KEY, { expiresIn: '5d' });

    return { token, refreshToken };
};

/**
 * Generates a password reset token.
 * @param {string} email - The user's email.
 * @returns {string} A reset token valid for 15 minutes.
 */
export const generateResetToken = (email) => {
    return jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' });
};

/**
 * Validates a password reset token.
 * @param {string} token - The token to validate.
 * @param {string} email - The user's email.
 * @returns {boolean} True if the token is valid and matches the email, false otherwise.
 */
export const validateResetToken = (token, email) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.email !== email) throw new Error("Token validation failed: Email mismatch");
        return true;
    } catch (error) {
        console.error(error.name === "TokenExpiredError" ? "Token expired" : "Token validation error", error);
        return false;
    }
};

/**
 * Verifies and invalidates a refresh token (if using a DB, remove it).
 * @param {string} refreshToken - The refresh token to invalidate.
 * @returns {boolean} True if the token is valid and removed, false otherwise.
 */
export const verifyAndInvalidateRefreshToken = async (refreshToken) => {
    try {
        jwt.verify(refreshToken, REFRESH_SECRET_KEY);
        // If using a database, remove the token from the stored tokens list
        await TokenModel.deleteOne({ token: refreshToken });
        return true;
    } catch (error) {
        return false;
    }
};
