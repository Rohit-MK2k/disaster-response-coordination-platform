import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

export const app = express();
app.use(cors());
import authRoutes from './routes/auth';
import disasterRoutes from './routes/disasters';
import { resolveUserMiddleware, AuthenticatedRequest } from './middleware/auth';

app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/disasters', disasterRoutes);

// Protected health check route
app.get('/health', resolveUserMiddleware, (req: express.Request, res: express.Response) => {
  const authReq = req as AuthenticatedRequest;
  res.json({ status: 'ok', user: authReq.user });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`API Server running on port ${PORT}`);
  });
}
