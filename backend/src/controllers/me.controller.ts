import { Request, Response, Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
