import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ems';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${(error as Error).message}`);
    console.error('Please make sure MongoDB is running locally, or configure a valid MONGODB_URI in your backend/.env file.');
    // We do not call process.exit(1) so the server can run and return errors to the frontend
    throw error;
  }
};
