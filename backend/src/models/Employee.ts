import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  reportingManager?: mongoose.Types.ObjectId | IEmployee | null;
  profileImage?: string;
  isDeleted: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const EmployeeSchema: Schema<IEmployee> = new Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be greater than or equal to 0'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining Date is required'],
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    role: {
      type: String,
      enum: ['Super Admin', 'HR Manager', 'Employee'],
      default: 'Employee',
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    profileImage: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
EmployeeSchema.pre<IEmployee>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password || '', salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Compare password method
EmployeeSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password || '');
};

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
