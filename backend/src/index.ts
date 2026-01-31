import express, { Express } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { customersRouter } from './routes/customers.js';
import { documentsRouter } from './routes/documents.js';
import { returnsRouter } from './routes/returns.js';
import { appointmentsRouter } from './routes/appointments.js';
import { communicationsRouter } from './routes/communications.js';
import { kanbanRouter } from './routes/kanban.js';
import { workflowsRouter } from './routes/workflows.js';
import { usersRouter } from './routes/users.js';
import { twilioRouter } from './routes/twilio.js';
import { calendlyRouter } from './routes/calendly.js';
import { assistantRouter } from './routes/assistant.js';
import { contactRouter } from './routes/contact.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { initializeFirebase } from './services/firebase.js';
import { setupTwilioWebSocket } from './websocket/twilio-stream.js';

const app: Express = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin
initializeFirebase();

// Initialize WebSocket for Twilio streaming
setupTwilioWebSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Twilio webhooks need urlencoded body parsing
app.use('/api/twilio', express.urlencoded({ extended: false }));
app.use(express.json());

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Twilio webhooks (no auth - uses signature validation)
app.use('/api/twilio', twilioRouter);

// Calendly webhook (no auth - uses signature validation)
app.use('/api/calendly/webhook', express.json(), calendlyRouter);

// Contact form - POST is public (optional auth), GET/PATCH require auth
app.post('/api/contact', optionalAuthMiddleware, contactRouter);
app.use('/api/contact', authMiddleware, contactRouter);

// Protected routes
app.use('/api/calendly', authMiddleware, calendlyRouter);
app.use('/api/customers', authMiddleware, customersRouter);
app.use('/api/documents', authMiddleware, documentsRouter);
app.use('/api/returns', authMiddleware, returnsRouter);
app.use('/api/appointments', authMiddleware, appointmentsRouter);
app.use('/api/communications', authMiddleware, communicationsRouter);
app.use('/api/kanban', authMiddleware, kanbanRouter);
app.use('/api/workflows', authMiddleware, workflowsRouter);
app.use('/api/users', authMiddleware, usersRouter);
app.use('/api/assistant', authMiddleware, assistantRouter);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
