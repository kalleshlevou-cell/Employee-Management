import { willCreateCycle } from '../utils/hierarchy';
import Employee from '../models/Employee';

// Mocking Employee.findById to avoid database connection dependencies in unit tests
const mockEmployees: Record<string, any> = {
  'A1': { _id: 'A1', name: 'Employee A1', reportingManager: 'B2', isDeleted: false },
  'B2': { _id: 'B2', name: 'Employee B2', reportingManager: 'C3', isDeleted: false },
  'C3': { _id: 'C3', name: 'Employee C3', reportingManager: null, isDeleted: false },
  'D4': { _id: 'D4', name: 'Employee D4', reportingManager: null, isDeleted: false },
};

const setupMocks = () => {
  // Override findById for testing
  (Employee.findById as any) = (id: string) => {
    const idStr = id.toString();
    const found = mockEmployees[idStr];
    return {
      populate: async (path: string) => {
        if (found && found.reportingManager) {
          // Resolve reporting manager reference
          const managerObj = mockEmployees[found.reportingManager];
          return { ...found, reportingManager: managerObj };
        }
        return found;
      },
      ...found,
    };
  };
};

const runTests = async () => {
  console.log('--- STARTING UNIT TESTS FOR CYCLE DETECTION ---');
  setupMocks();

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failed++;
    }
  };

  try {
    // Test Case 1: Self reporting is circular
    const case1 = await willCreateCycle('A1', 'A1');
    assert(case1 === true, 'An employee reporting to themselves is a cycle');

    // Test Case 2: Standard valid reporting chain (C3 reporting to D4)
    const case2 = await willCreateCycle('C3', 'D4');
    assert(case2 === false, 'Assigning C3 under D4 does not create a cycle');

    // Test Case 3: Circular reporting (Assigning C3 under A1, since A1 -> B2 -> C3)
    const case3 = await willCreateCycle('C3', 'A1');
    assert(case3 === true, 'Assigning C3 under A1 creates a cycle (C3 -> A1 -> B2 -> C3)');

    // Test Case 4: Safe manager configuration on blank
    const case4 = await willCreateCycle('A1', null);
    assert(case4 === false, 'Removing manager (setting to null) is always safe');

    console.log('\n--- TEST SUMMARY ---');
    console.log(`Passed: ${passed}/${passed + failed}`);
    
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Test suite crashed with error:', error);
    process.exit(1);
  }
};

runTests();
