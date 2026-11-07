import { Request, RequestHandler, Response, NextFunction } from 'express'

// Express 5 natively propagates async errors to next() — this wrapper is kept for
// backwards compatibility but is no longer required for new route handlers.
export const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)
