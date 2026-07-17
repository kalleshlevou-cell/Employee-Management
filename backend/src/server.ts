import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import organizationRoutes from './routes/organizationRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*', // We can restrict this in production (typically http://localhost:5173 for Vite)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Express JSON parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection is active (critical for serverless environment)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed in serverless request handler:', err);
  }
  next();
});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date() });
});

// Bind routers
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organization', organizationRoutes);

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Bootstrapping function
const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();
  } catch (err) {
    console.warn('Backend server starting with DB in disconnected state. Retrying database connections on demand.');
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

if (!process.env.VERCEL) {
  startServer();
}

export default app;
