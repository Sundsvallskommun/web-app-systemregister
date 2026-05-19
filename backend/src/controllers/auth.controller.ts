import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } from '@config';
import { HttpException } from '@/exceptions/HttpException';
import { authService } from '@/services/auth.service';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: Number(AUTH_RATE_LIMIT_WINDOW_MS ?? 5 * 60 * 1000),
  max: Number(AUTH_RATE_LIMIT_MAX ?? 10),
  message: { message: 'För många inloggningsförsök, försök igen senare' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      throw new HttpException(400, 'username och password krävs');
    }
    const result = await authService.login(String(username), String(password));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw new HttpException(400, 'refreshToken krävs');
    const result = authService.refresh(String(refreshToken));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  // Stateless JWT — klienten kastar sina tokens. Vid behov: implementera token-blacklist här.
  res.json({ message: 'logged out' });
});

export default router;
