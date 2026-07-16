import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth';
import Employee from '../models/Employee';

// Generate Token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyforemployeemanagement', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new employee account (self-registration as Employee role)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, email, password, phone, department, designation } = req.body;

  if (!name || !email || !password || !department || !designation) {
    res.status(400).json({ message: 'Please provide name, email, password, department, and designation.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    return;
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: 'Please provide a valid email address.' });
    return;
  }

  try {
    // Check email already exists
    const emailExists = await Employee.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (emailExists) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    // Auto-generate a unique employee ID
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    // Ensure generated ID is unique (in case of gaps from soft deletes)
    const idExists = await Employee.findOne({ employeeId });
    const finalId = idExists ? `EMP-${Date.now().toString().slice(-6)}` : employeeId;

    const newEmployee = new Employee({
      employeeId: finalId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || '',
      department: department.trim(),
      designation: designation.trim(),
      salary: 0,
      joiningDate: new Date(),
      status: 'Active',
      role: 'Employee', // Self-registered accounts are always Employee
      reportingManager: null,
      profileImage: '',
    });

    await newEmployee.save();

    const token = generateToken(newEmployee._id.toString());

    res.status(201).json({
      _id: newEmployee._id,
      employeeId: newEmployee.employeeId,
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: (error as Error).message });
  }
};

/**
 * @desc    Authenticate User & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and password' });
    return;
  }

  try {
    const employee = await Employee.findOne({ email, isDeleted: false }).select('+password');

    if (!employee) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (employee.status === 'Inactive') {
      res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
      return;
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = generateToken(employee._id.toString());

    res.json({
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: (error as Error).message });
  }
};

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Simple token clear - client-side handles clearing the local storage token
  res.json({ message: 'Logged out successfully' });
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  try {
    const employee = await Employee.findById(req.user._id).populate('reportingManager', 'name employeeId email');
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
