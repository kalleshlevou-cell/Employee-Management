import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ems';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Employee.deleteMany({});
    console.log('Cleared existing employees.');

    // 0. Create Kiro Super Admin account
    const kiro = new Employee({
      employeeId: 'EMP-000',
      name: 'Kiro Admin',
      email: 'kiro@ems.com',
      password: 'kiro@1234',
      phone: '+1-555-0000',
      department: 'Executive',
      designation: 'System Administrator',
      salary: 999999,
      joiningDate: new Date('2024-01-01'),
      status: 'Active',
      role: 'Super Admin',
      reportingManager: null,
      profileImage: '',
    });
    await kiro.save();
    console.log('Created Kiro Super Admin: kiro@ems.com / kiro@1234');

    // 1. Create CEO / Super Admin (EMP-001)
    const ceo = new Employee({
      employeeId: 'EMP-001',
      name: 'John Doe',
      email: 'admin@ems.com',
      password: 'password123', // Will be hashed by pre-save hook
      phone: '+1-555-0100',
      department: 'Executive',
      designation: 'Chief Executive Officer',
      salary: 280000,
      joiningDate: new Date('2022-01-15'),
      status: 'Active',
      role: 'Super Admin',
      reportingManager: null,
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    });
    await ceo.save();
    console.log('Created Super Admin (CEO): John Doe');

    // 2. Create HR Managers reporting to PDF/CEO
    const hrManager1 = new Employee({
      employeeId: 'EMP-002',
      name: 'Sarah Williams',
      email: 'sarah@ems.com',
      password: 'password123',
      phone: '+1-555-0102',
      department: 'Human Resources',
      designation: 'HR Lead Manager',
      salary: 98000,
      joiningDate: new Date('2023-03-10'),
      status: 'Active',
      role: 'HR Manager',
      reportingManager: ceo._id,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    });
    await hrManager1.save();

    const hrManager2 = new Employee({
      employeeId: 'EMP-003',
      name: 'David Miller',
      email: 'david@ems.com',
      password: 'password123',
      phone: '+1-555-0103',
      department: 'Human Resources',
      designation: 'HR Recruitment Specialist',
      salary: 82000,
      joiningDate: new Date('2024-01-10'),
      status: 'Active',
      role: 'HR Manager',
      reportingManager: ceo._id,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    });
    await hrManager2.save();
    console.log('Created HR Managers: Sarah Williams, David Miller');

    // 3. Create Engineering Lead (reporting to CEO)
    const engLead = new Employee({
      employeeId: 'EMP-004',
      name: 'Alice Johnson',
      email: 'alice@ems.com',
      password: 'password123',
      phone: '+1-555-0104',
      department: 'Engineering',
      designation: 'Engineering Lead',
      salary: 145000,
      joiningDate: new Date('2023-01-20'),
      status: 'Active',
      role: 'Employee', // standard Employee role, but reports to CEO and manages others
      reportingManager: ceo._id,
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    });
    await engLead.save();
    console.log('Created Engineering Lead: Alice Johnson');

    // 4. Create Engineers reporting to Engineering Lead
    const dev1 = new Employee({
      employeeId: 'EMP-005',
      name: 'Bob Smith',
      email: 'bob@ems.com',
      password: 'password123',
      phone: '+1-555-0105',
      department: 'Engineering',
      designation: 'Senior Full Stack Developer',
      salary: 115000,
      joiningDate: new Date('2023-08-01'),
      status: 'Active',
      role: 'Employee',
      reportingManager: engLead._id,
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    });
    await dev1.save();

    const dev2 = new Employee({
      employeeId: 'EMP-006',
      name: 'Charlie Brown',
      email: 'charlie@ems.com',
      password: 'password123',
      phone: '+1-555-0106',
      department: 'Engineering',
      designation: 'QA Automation Engineer',
      salary: 87000,
      joiningDate: new Date('2024-02-15'),
      status: 'Active',
      role: 'Employee',
      reportingManager: engLead._id,
      profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    });
    await dev2.save();
    console.log('Created Engineers: Bob Smith, Charlie Brown');

    // 5. Create HR Associate reporting to HR Lead
    const hrAssociate = new Employee({
      employeeId: 'EMP-007',
      name: 'Emma Watson',
      email: 'emma@ems.com',
      password: 'password123',
      phone: '+1-555-0107',
      department: 'Human Resources',
      designation: 'HR Generalist Associate',
      salary: 62000,
      joiningDate: new Date('2024-05-01'),
      status: 'Active',
      role: 'Employee',
      reportingManager: hrManager1._id,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    });
    await hrAssociate.save();
    console.log('Created HR Associate: Emma Watson');

    // 6. Create Sales Rep reporting to CEO (Inactive for testing)
    const salesRep = new Employee({
      employeeId: 'EMP-008',
      name: 'Frank Castillo',
      email: 'frank@ems.com',
      password: 'password123',
      phone: '+1-555-0108',
      department: 'Sales',
      designation: 'Account Sales Executive',
      salary: 76000,
      joiningDate: new Date('2023-11-12'),
      status: 'Inactive',
      role: 'Employee',
      reportingManager: ceo._id,
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    });
    await salesRep.save();
    console.log('Created Sales Executive (Inactive): Frank Castillo');

    console.log('Database seeded successfully!');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
