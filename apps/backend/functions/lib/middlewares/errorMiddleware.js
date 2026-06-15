"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error('[API Error]:', err);
    // Check if error is from Zod payload schema validation
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_INPUT',
                message: 'Request validation failed.',
                details: err.issues.map((issue) => ({
                    field: issue.path.map(String).join('.'),
                    issue: issue.message
                }))
            }
        });
    }
    // Handle default domain logical stock errors
    if (err.message && err.message.includes('Insufficient stock')) {
        return res.status(409).json({
            success: false,
            error: {
                code: 'OUT_OF_STOCK',
                message: err.message
            }
        });
    }
    // Fallback for general server errors
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: err.message || 'An unexpected error occurred.'
        }
    });
}
//# sourceMappingURL=errorMiddleware.js.map