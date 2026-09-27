import type { Request, Response, NextFunction } from 'express';
import { ZodError, type AnyZodObject } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

export function validateRequest(schema: AnyZodObject, location: RequestLocation = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[location]);
      req[location] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: issues[0]?.message || 'بيانات غير صالحة',
          details: issues,
        });
        return;
      }
      next(error);
    }
  };
}
