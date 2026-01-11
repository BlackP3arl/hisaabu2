import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import categoriesRoutes from './routes/categories.js';
import itemsRoutes from './routes/items.js';
import quotationsRoutes from './routes/quotations.js';
import invoicesRoutes from './routes/invoices.js';
import recurringInvoicesRoutes from './routes/recurringInvoices.js';
import paymentsRoutes from './routes/payments.js';
import settingsRoutes from './routes/settings.js';
import shareLinksRoutes from './routes/shareLinks.js';
import dashboardRoutes from './routes/dashboard.js';
import taxesRoutes from './routes/taxes.js';
import uomsRoutes from './routes/uoms.js';
import publicRoutes from './routes/public.js';

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
const API_VERSION = '/api/v1';

// Public routes (no authentication)
app.use(`${API_VERSION}/public`, publicRoutes);

// Authentication routes
app.use(`${API_VERSION}/auth`, authRoutes);

// Protected routes (require authentication)
app.use(`${API_VERSION}/clients`, clientsRoutes);
app.use(`${API_VERSION}/categories`, categoriesRoutes);
app.use(`${API_VERSION}/items`, itemsRoutes);
app.use(`${API_VERSION}/quotations`, quotationsRoutes);
app.use(`${API_VERSION}/invoices`, invoicesRoutes);
app.use(`${API_VERSION}/recurring-invoices`, recurringInvoicesRoutes);
app.use(`${API_VERSION}/payments`, paymentsRoutes);
app.use(`${API_VERSION}/settings`, settingsRoutes);
app.use(`${API_VERSION}/share-links`, shareLinksRoutes);
app.use(`${API_VERSION}/dashboard`, dashboardRoutes);
app.use(`${API_VERSION}/taxes`, taxesRoutes);
app.use(`${API_VERSION}/uoms`, uomsRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
