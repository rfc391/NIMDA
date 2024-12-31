
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Add your token verification logic here
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
