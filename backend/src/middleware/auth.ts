import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Employee, { IEmployee } from '../models/Employee';

export interface AuthenticatedRequest extends Request {
  user?: IEmployee;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforemployeemanagement') as {
      id: string;
    };

    const employee = await Employee.findById(decoded.id).select('+password');
    if (!employee || employee.isDeleted) {
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    if (employee.status === 'Inactive') {
      res.status(403).json({ message: 'User account is inactive. Please contact your administrator.' });
      return;
    }

    req.user = employee;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const checkRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Forbidden: Access denied for role '${req.user.role}'` });
      return;
    }

    next();
  };
};
