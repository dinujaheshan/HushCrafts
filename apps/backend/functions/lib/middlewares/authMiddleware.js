"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requirePermission = requirePermission;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
/**
 * Validates client request bearer token
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Access Denied: Missing Authorization Header'
            }
        });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebaseAdmin_1.auth.verifyIdToken(token);
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: decodedToken.role || undefined,
            permissions: decodedToken.permissions || []
        };
        return next();
    }
    catch (err) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Access Denied: Invalid Authentication Token'
            }
        });
    }
}
/**
 * Verifies if user contains specific capability claims
 */
function requirePermission(permission) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access Denied: Unauthenticated Request'
                }
            });
        }
        const permissions = user.permissions || [];
        // Super admins bypass all permission checks
        if (user.role === 'super_admin' || permissions.includes(permission)) {
            return next();
        }
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Access Denied: Insufficient Permissions'
            }
        });
    };
}
//# sourceMappingURL=authMiddleware.js.map