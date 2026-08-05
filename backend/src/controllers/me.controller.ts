import { Request, Response, Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

/** Inloggad användare — frontend använder den här för att avgöra sessionsstatus. */
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { username, name, givenName, surname, email, groups, role } = req.user!;
  res.json({ data: { username, name, givenName, surname, email, groups, role } });
});

export default router;
