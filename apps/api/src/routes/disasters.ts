import { Router } from 'express';
import { resolveUserMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { 
  CreateDisasterUseCase, 
  UpdateDisasterUseCase, 
  DeleteDisasterUseCase,
  GetDisasterUseCase,
  ListDisastersUseCase,
  UnauthorizedError, 
  NotFoundError 
} from '@drp/core';
import { JsonDisasterRepository } from '../adapters/JsonDisasterRepository';
import { CreateDisasterInput, UpdateDisasterInput } from '@drp/shared-types';

const router = Router();
const repo = new JsonDisasterRepository();

const createUseCase = new CreateDisasterUseCase(repo);
const updateUseCase = new UpdateDisasterUseCase(repo);
const deleteUseCase = new DeleteDisasterUseCase(repo);
const getUseCase = new GetDisasterUseCase(repo);
const listUseCase = new ListDisastersUseCase(repo);

router.use(resolveUserMiddleware); // Protect all disaster routes

router.get('/', async (req, res) => {
  try {
    const disasters = await listUseCase.execute();
    res.json(disasters);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const disaster = await getUseCase.execute(req.params.id);
    res.json(disaster);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const input: CreateDisasterInput = req.body;
    const disaster = await createUseCase.execute({ input, user: req.user! });
    res.status(201).json(disaster);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const input: UpdateDisasterInput = req.body;
    const disaster = await updateUseCase.execute({ id: req.params.id, input, user: req.user! });
    res.json(disaster);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    await deleteUseCase.execute({ id: req.params.id, user: req.user! });
    res.status(204).send();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      res.status(403).json({ error: error.message });
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

export default router;
