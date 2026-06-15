import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[API Error]:', err);

  // Check if error is from Zod payload schema validation
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Request validation failed.',
        details: err.issues.map((issue: ZodIssue) => ({
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
