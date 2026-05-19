import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { UserRole } from '@/interfaces/user.interface';

const writeRoles: UserRole[] = ['admin', 'editor'];
const deleteRoles: UserRole[] = ['admin'];

/**
 * Skapar en proxy-router för en data-resurs på api-service-systemregister.
 *
 *   GET    /<resource>          -> proxar till GET    /{municipalityId}/<resource>
 *   GET    /<resource>/:id      -> proxar till GET    /{municipalityId}/<resource>/:id
 *   POST   /<resource>          -> proxar till POST   /{municipalityId}/<resource>     (editor+)
 *   PUT    /<resource>/:id      -> proxar till PUT    /{municipalityId}/<resource>/:id (editor+)
 *   PATCH  /<resource>/:id      -> proxar till PATCH  /{municipalityId}/<resource>/:id (editor+)
 *   DELETE /<resource>/:id      -> proxar till DELETE /{municipalityId}/<resource>/:id (admin)
 */
export function buildProxyRouter(resource: string): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.get(resource, req.query as Record<string, unknown>);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.get(`${resource}/${req.params.id}`);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireRole(...writeRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.post(resource, req.body);
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', requireRole(...writeRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.put(`${resource}/${req.params.id}`, req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireRole(...writeRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.patch(`${resource}/${req.params.id}`, req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireRole(...deleteRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await apiService.delete(`${resource}/${req.params.id}`);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
