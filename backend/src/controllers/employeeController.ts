import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Employee, { IEmployee } from '../models/Employee';
import { willCreateCycle, buildHierarchyTree } from '../utils/hierarchy';
import { parseCSVBuffer } from '../utils/csvHelper';
import mongoose from 'mongoose';

/**
 * @desc    Get all employees with filters, sorting, searching, pagination
 * @route   GET /api/employees
 * @access  Private (RBAC applied)
 */
export const getEmployees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  try {
    const { department, role, status, search, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

    const query: any = { isDeleted: false };

    // Role-based constraints: Employees can only see themselves
    if (req.user.role === 'Employee') {
      query._id = req.user._id;
    } else {
      // HR Managers or Super Admins can search, filter
      if (department) query.department = department;
      if (role) query.role = role;
      if (status) query.status = status;

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ];
      }
    }

    // Sort setup
    const sortField = sortBy ? (sortBy as string) : 'name';
    const direction = sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: direction };

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const employees = await Employee.find(query)
      .populate('reportingManager', 'name employeeId email designation')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Employee.countDocuments(query);

    res.json({
      employees,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalEmployees: total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving employees', error: (error as Error).message });
  }
};

/**
 * @desc    Get single employee details
 * @route   GET /api/employees/:id
 * @access  Private
 */
export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  // Employee can only view their own profile
  if (req.user.role === 'Employee' && req.user._id.toString() !== id) {
    res.status(403).json({ message: 'Access denied: You can only view your own profile.' });
    return;
  }

  try {
    const employee = await Employee.findOne({ _id: id, isDeleted: false })
      .populate('reportingManager', 'name employeeId email designation profileImage');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error retrieving employee', error: (error as Error).message });
  }
};

/**
 * @desc    Create a new employee
 * @route   POST /api/employees
 * @access  Private (Super Admin, HR Manager)
 */
export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  // Employees cannot create
  if (req.user.role === 'Employee') {
    res.status(403).json({ message: 'Access denied: Employees cannot create profiles.' });
    return;
  }

  try {
    const {
      employeeId,
      name,
      email,
      password,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      status,
      role,
      reportingManager,
      profileImage,
    } = req.body;

    // Validation
    if (!employeeId || !name || !email || !password || !department || !designation || salary === undefined) {
      res.status(400).json({ message: 'Please enter all required fields.' });
      return;
    }

    // HR manager cannot assign Super Admin role
    if (req.user.role === 'HR Manager' && role === 'Super Admin') {
      res.status(403).json({ message: 'Access denied: HR Managers cannot create Super Admins.' });
      return;
    }

    // Check unique employeeId
    const employeeIdExists = await Employee.findOne({ employeeId, isDeleted: false });
    if (employeeIdExists) {
      res.status(400).json({ message: `Employee with ID ${employeeId} already exists.` });
      return;
    }

    // Check unique email
    const emailExists = await Employee.findOne({ email, isDeleted: false });
    if (emailExists) {
      res.status(400).json({ message: `Employee with email ${email} already exists.` });
      return;
    }

    // Create Employee record
    const newEmployee = new Employee({
      employeeId,
      name,
      email,
      password,
      phone,
      department,
      designation,
      salary,
      joiningDate: joiningDate || new Date(),
      status: status || 'Active',
      role: role || 'Employee',
      reportingManager: reportingManager || null,
      profileImage: profileImage || '',
    });

    await newEmployee.save();

    // Do not return password in response
    const returnVal = newEmployee.toObject();
    delete returnVal.password;

    res.status(201).json(returnVal);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating employee', error: (error as Error).message });
  }
};

/**
 * @desc    Update an existing employee
 * @route   PUT /api/employees/:id
 * @access  Private
 */
export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  // Check access permissions
  const isSelf = req.user._id.toString() === id;

  if (req.user.role === 'Employee' && !isSelf) {
    res.status(403).json({ message: 'Access denied: Employees can only edit their own profile.' });
    return;
  }

  try {
    const employee = await Employee.findOne({ _id: id, isDeleted: false });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    const {
      name,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      status,
      role,
      reportingManager,
      profileImage,
      password,
    } = req.body;

    // Field-level restrictions
    if (req.user.role === 'Employee') {
      // Employees can only update phone, profileImage, passwords
      employee.phone = phone !== undefined ? phone : employee.phone;
      employee.profileImage = profileImage !== undefined ? profileImage : employee.profileImage;
      if (password) {
        employee.password = password;
      }
    } else {
      // HR Manager and Super Admin can edit other fields
      // HR Manager restrictions: cannot promote self or others to Super Admin
      if (req.user.role === 'HR Manager') {
        if (role === 'Super Admin' && employee.role !== 'Super Admin') {
          res.status(403).json({ message: 'HR Managers cannot assign the Super Admin role.' });
          return;
        }
        // HR Managers cannot demote/edit Super Admin
        if (employee.role === 'Super Admin' && !isSelf) {
          res.status(403).json({ message: 'HR Managers cannot modify Super Admin profiles.' });
          return;
        }
      }

      // Check circular reporting if reporting manager is modified
      if (reportingManager !== undefined && reportingManager !== employee.reportingManager?.toString()) {
        if (reportingManager) {
          if (reportingManager === id) {
            res.status(400).json({ message: 'An employee cannot report to themselves.' });
            return;
          }
          const circular = await willCreateCycle(id, reportingManager);
          if (circular) {
            res.status(400).json({ message: 'Circular reporting detected! Proposed manager reports to this employee directly/indirectly.' });
            return;
          }
        }
        employee.reportingManager = reportingManager || null;
      }

      // Update remaining fields
      employee.name = name !== undefined ? name : employee.name;
      employee.phone = phone !== undefined ? phone : employee.phone;
      employee.department = department !== undefined ? department : employee.department;
      employee.designation = designation !== undefined ? designation : employee.designation;
      employee.salary = salary !== undefined ? salary : employee.salary;
      employee.joiningDate = joiningDate !== undefined ? joiningDate : employee.joiningDate;
      employee.status = status !== undefined ? status : employee.status;
      employee.role = role !== undefined ? role : employee.role;
      employee.profileImage = profileImage !== undefined ? profileImage : employee.profileImage;
      if (password) {
        employee.password = password;
      }

      // Validate email uniqueness if changing the email
      if (email && email !== employee.email) {
        const emailExists = await Employee.findOne({ email, _id: { $ne: id }, isDeleted: false });
        if (emailExists) {
          res.status(400).json({ message: `Email ${email} is already in use by another employee.` });
          return;
        }
        employee.email = email;
      }
    }

    await employee.save();

    const returnVal = employee.toObject();
    delete returnVal.password;

    res.json(returnVal);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating employee', error: (error as Error).message });
  }
};

/**
 * @desc    Soft Delete employee (Delete flag)
 * @route   DELETE /api/employees/:id
 * @access  Private (Super Admin only)
 */
export const deleteEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  // Only Super Admin can delete
  if (req.user.role !== 'Super Admin') {
    res.status(403).json({ message: 'Access denied: Only Super Admin can delete profiles.' });
    return;
  }

  try {
    const employee = await Employee.findOne({ _id: id, isDeleted: false });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Set soft delete flag
    employee.isDeleted = true;
    await employee.save();

    // Standard behavior: Remove reporting links for direct reportees, setting them to null or their manager's manager
    await Employee.updateMany(
      { reportingManager: id },
      { $set: { reportingManager: employee.reportingManager || null } }
    );

    res.json({ message: 'Employee profile deleted successfully (soft-delete).' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting employee', error: (error as Error).message });
  }
};

/**
 * @desc    Change Manager of Employee
 * @route   PATCH /api/employees/:id/manager
 * @access  Private (Super Admin, HR Manager)
 */
export const updateManager = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reportingManagerId } = req.body; // Can be string MongoDB ObjectId or null

  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  if (req.user.role === 'Employee') {
    res.status(403).json({ message: 'Access denied: Employees cannot reassign managers.' });
    return;
  }

  try {
    const employee = await Employee.findOne({ _id: id, isDeleted: false });
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    if (reportingManagerId) {
      if (reportingManagerId === id) {
        res.status(400).json({ message: 'An employee cannot report to themselves.' });
        return;
      }
      const circular = await willCreateCycle(id, reportingManagerId);
      if (circular) {
        res.status(400).json({ message: 'Circular reporting detected!' });
        return;
      }
    }

    employee.reportingManager = reportingManagerId || null;
    await employee.save();

    res.json({ message: 'Reporting manager updated successfully', reportingManager: employee.reportingManager });
  } catch (error) {
    res.status(500).json({ message: 'Server error modifying manager association', error: (error as Error).message });
  }
};

/**
 * @desc    Get direct reports (reportees) of employee
 * @route   GET /api/employees/:id/reportees
 * @access  Private
 */
export const getReportees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const reportees = await Employee.find({ reportingManager: id, isDeleted: false }).select(
      'name employeeId email designation department status role profileImage'
    );
    res.json(reportees);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching direct reports', error: (error as Error).message });
  }
};

/**
 * @desc    Get entire Reporting Hierarchy Tree
 * @route   GET /api/organization/tree
 * @access  Private
 */
export const getOrgTree = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employees = await Employee.find({ isDeleted: false }).lean();
    const tree = buildHierarchyTree(employees, null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: 'Server error building organizational tree', error: (error as Error).message });
  }
};

/**
 * @desc    Get dashboard metrics & aggregation reports
 * @route   GET /api/employees/dashboard/stats
 * @access  Private (Super Admin, HR Manager)
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  if (req.user.role === 'Employee') {
    res.status(403).json({ message: 'Access denied: Dashboard statistics require privilege credentials.' });
    return;
  }

  try {
    const totalEmployees = await Employee.countDocuments({ isDeleted: false });
    const activeEmployees = await Employee.countDocuments({ isDeleted: false, status: 'Active' });
    const inactiveEmployees = await Employee.countDocuments({ isDeleted: false, status: 'Inactive' });

    // Distinct departments count
    const departments = await Employee.distinct('department', { isDeleted: false });

    // Group count by Department
    const departmentBreakdown = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$department', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
      { $project: { _id: 0, department: '$_id', count: '$count', avgSalary: { $round: ['$avgSalary', 2] } } },
    ]);

    // Group count by Role
    const roleBreakdown = await Employee.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { _id: 0, role: '$_id', count: '$count' } },
    ]);

    // Graph distribution of salaries (salary bands)
    const salaryRanges = await Employee.aggregate([
      { $match: { isDeleted: false } },
      {
        $bucket: {
          groupBy: '$salary',
          boundaries: [0, 30000, 60000, 90000, 120000, 150000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
          },
        },
      },
      {
        $project: {
          _id: 0,
          range: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 0] }, then: '$0 - $30k' },
                { case: { $eq: ['$_id', 30000] }, then: '$30k - $60k' },
                { case: { $eq: ['$_id', 60000] }, then: '$60k - $90k' },
                { case: { $eq: ['$_id', 90000] }, then: '$90k - $120k' },
                { case: { $eq: ['$_id', 120000] }, then: '$120k - $150k' },
              ],
              default: '$150k+',
            },
          },
          count: 1,
        },
      },
    ]);

    res.json({
      summary: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        departmentCount: departments.length,
      },
      departmentBreakdown,
      roleBreakdown,
      salaryRanges,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error aggregating metrics', error: (error as Error).message });
  }
};

/**
 * @desc    Upload CSV to批量 create/update employees (Two-Pass implementation)
 * @route   POST /api/employees/csv-import
 * @access  Private (Super Admin, HR Manager)
 */
export const importCSV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  if (req.user.role === 'Employee') {
    res.status(403).json({ message: 'Access denied: Employees cannot perform CSV uploads.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: 'Please upload a CSV file.' });
    return;
  }

  try {
    const rows = await parseCSVBuffer(req.file.buffer);
    if (!rows.length) {
      res.status(400).json({ message: 'The uploaded CSV file is empty.' });
      return;
    }

    const errors: string[] = [];
    const createdList: any[] = [];

    // PASS 1: Validate and create employees (without establishing manager relations)
    const pendingManagerMappings: { empDbId: string; managerEmpId: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // CSV headers are line 1, rows start at index 0 (line 2)

      const employeeId = row.employeeId?.trim();
      const name = row.name?.trim();
      const email = row.email?.trim()?.toLowerCase();
      const department = row.department?.trim();
      const designation = row.designation?.trim();
      const salaryStr = row.salary?.trim();

      // Basic validations
      if (!employeeId || !name || !email || !department || !designation || !salaryStr) {
        errors.push(`Row ${lineNum}: Missing required fields. Necessary: employeeId, name, email, department, designation, salary.`);
        continue;
      }

      const salaryVal = parseFloat(salaryStr);
      if (isNaN(salaryVal) || salaryVal < 0) {
        errors.push(`Row ${lineNum}: Invalid salary value '${salaryStr}'. Must be a positive number.`);
        continue;
      }

      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${lineNum}: Invalid email format '${email}'.`);
        continue;
      }

      // Check database duplicates
      const employeeIdExists = await Employee.findOne({ employeeId, isDeleted: false });
      if (employeeIdExists) {
        errors.push(`Row ${lineNum}: Employee ID '${employeeId}' already exists in system.`);
        continue;
      }

      const emailExists = await Employee.findOne({ email, isDeleted: false });
      if (emailExists) {
        errors.push(`Row ${lineNum}: Email '${email}' already exists in system.`);
        continue;
      }

      // Validate HR manager creating Super Admin
      const proposedRole = (row.role?.trim() || 'Employee') as 'Super Admin' | 'HR Manager' | 'Employee';
      if (req.user.role === 'HR Manager' && proposedRole === 'Super Admin') {
        errors.push(`Row ${lineNum}: HR Managers cannot create Super Admin accounts.`);
        continue;
      }

      // Safe role selection
      const validatedRole = ['Super Admin', 'HR Manager', 'Employee'].includes(proposedRole)
        ? proposedRole
        : 'Employee';

      const validatedStatus = ['Active', 'Inactive'].includes(row.status?.trim() || '')
        ? (row.status?.trim() as 'Active' | 'Inactive')
        : 'Active';

      try {
        // Create employee document
        const newEmp = new Employee({
          employeeId,
          name,
          email,
          phone: row.phone?.trim() || '',
          department,
          designation,
          salary: salaryVal,
          joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
          status: validatedStatus,
          role: validatedRole,
          password: employeeId, // Set initial default password as their Employee ID
          reportingManager: null, // Done in Pass 2
        });

        await newEmp.save();
        createdList.push(newEmp);

        if (row.reportingManagerId?.trim()) {
          pendingManagerMappings.push({
            empDbId: newEmp._id.toString(),
            managerEmpId: row.reportingManagerId.trim(),
          });
        }
      } catch (err) {
        errors.push(`Row ${lineNum}: Error inserting record: ${(err as Error).message}`);
      }
    }

    // PASS 2: Establish Reporting Manager connections
    let managerLinksConfigured = 0;
    for (const mapping of pendingManagerMappings) {
      try {
        // Find proposed manager in DB (matching employeeId)
        const managerEmp = await Employee.findOne({ employeeId: mapping.managerEmpId, isDeleted: false });
        if (!managerEmp) {
          errors.push(`Notice: Employee with ID '${mapping.managerEmpId}' (assigned as manager) was not found in database. Manager remains empty.`);
          continue;
        }

        // Check for cycle before setting manager
        const isCircular = await willCreateCycle(mapping.empDbId, managerEmp._id);
        if (isCircular) {
          errors.push(`Row Notice: Reporting link for manager '${mapping.managerEmpId}' rejected due to circular reporting chain.`);
          continue;
        }

        await Employee.findByIdAndUpdate(mapping.empDbId, {
          $set: { reportingManager: managerEmp._id },
        });
        managerLinksConfigured++;
      } catch (err) {
        errors.push(`Error configuring manager linkage for Employee '${mapping.empDbId}': ${(err as Error).message}`);
      }
    }

    res.json({
      success: true,
      recordsCreated: createdList.length,
      managerLinksConnected: managerLinksConfigured,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing CSV file', error: (error as Error).message });
  }
};
