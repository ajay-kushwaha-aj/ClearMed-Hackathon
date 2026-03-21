import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
    return;
  }

  if (err instanceof Error) {
    const status = (err as NodeJS.ErrnoException & { statusCode?: number }).statusCode || 500;
    console.error(`[Error] ${err.message}`, err.stack);
    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
    return;
  }

  console.error('[Unknown Error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
