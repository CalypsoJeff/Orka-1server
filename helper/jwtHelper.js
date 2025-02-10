import jwt from 'jsonwebtoken';

const SECRET_KEY = "YOUR_SECRET_KEY";
const REFRESH_SECRET_KEY = "REFRESH_SECRET_KEY";

/**
 * Generates an access token and a refresh token.
 * @param {string} user - The username or user ID.
 * @param {string} email - The user's email.
 * @param {string} role - The user's role.
 * @returns {Object} An object containing the access token and refresh token.
 */
export const generateToken = (user, email, role) => {
    const token = jwt.sign({ user, email, role }, SECRET_KEY, {
        expiresIn: '2h',
    });
    const refreshToken = jwt.sign({ user, email, role }, REFRESH_SECRET_KEY, {
        expiresIn: '5d',
    });
    return { token, refreshToken };
};

/**
 * Generates a password reset token.
 * @param {string} email - The user's email.
 * @returns {string} A reset token valid for 15 minutes.
 */
export const generateResetToken = (email) => {
    const resetToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: '15m' }); // Short expiration
    return resetToken;
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

        // Check if the token's email matches the user's email
        if (decoded.email !== email) {
            throw new Error("Token validation failed: Email mismatch");
        }

        return true; // Token is valid
    } catch (error) {
        console.error("Token validation error:", error);
        return false; // Token is invalid
    }
};
