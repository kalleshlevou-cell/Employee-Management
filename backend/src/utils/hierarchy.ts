import Employee from '../models/Employee';
import mongoose from 'mongoose';

/**
 * Checks whether assigning a manager to an employee would introduce a cycle.
 * Traverses up the manager chain from the proposed manager. If we encounter the employee, a cycle is detected.
 *
 * @param employeeId The ID of the employee whose manager is being assigned (as string or ObjectId)
 * @param proposedManagerId The ID of the proposed manager (as string or ObjectId)
 * @returns true if a cycle is created, false otherwise
 */
export const willCreateCycle = async (
  employeeId: string | mongoose.Types.ObjectId,
  proposedManagerId: string | mongoose.Types.ObjectId | null | undefined
): Promise<boolean> => {
  if (!proposedManagerId) return false;

  const empIdStr = employeeId.toString();
  const proposedIdStr = proposedManagerId.toString();

  // An employee reporting to themselves is a cycle
  if (empIdStr === proposedIdStr) return true;

  let currentId: string | undefined = proposedIdStr;

  while (currentId) {
    const parentEmployee: any = await Employee.findById(currentId).populate('reportingManager');
    if (!parentEmployee || parentEmployee.isDeleted) {
      break;
    }

    const nextManager: any = parentEmployee.reportingManager;
    if (!nextManager) {
      break;
    }

    const nextManagerId: string = nextManager._id
      ? nextManager._id.toString()
      : nextManager.toString();

    if (nextManagerId === empIdStr) {
      return true; // Encountered the employee in the ancestry chain!
    }

    currentId = nextManagerId;
  }

  return false;
};

interface TreeItem {
  id: string; // db id
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
  profileImage: string;
  status: string;
  children: TreeItem[];
}

/**
 * Builds a hierarchical tree array from a list of employees.
 */
export const buildHierarchyTree = (
  employees: any[],
  rootManagerId: string | null = null
): TreeItem[] => {
  const tree: TreeItem[] = [];
  const employeesFiltered = employees.filter((emp) => !emp.isDeleted);

  const directReports = employeesFiltered.filter((emp) => {
    if (!rootManagerId) {
      return !emp.reportingManager;
    }
    const managerIdStr = emp.reportingManager?._id
      ? emp.reportingManager._id.toString()
      : emp.reportingManager?.toString();
    return managerIdStr === rootManagerId;
  });

  for (const emp of directReports) {
    tree.push({
      id: emp._id.toString(),
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      designation: emp.designation,
      department: emp.department,
      role: emp.role,
      profileImage: emp.profileImage || '',
      status: emp.status,
      children: buildHierarchyTree(employeesFiltered, emp._id.toString()),
    });
  }

  return tree;
};
