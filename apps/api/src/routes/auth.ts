import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const router = Router();
const SECRET = 'dev-secret';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read JSON data
const dataPath = path.resolve(__dirname, '../../data/users.json');
let users: any[] = [];
try {
  users = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
} catch (e) {
  console.error("Failed to load mock users.json", e);
}

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, name: user.name });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;
