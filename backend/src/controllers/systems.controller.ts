import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { loadRefData, enrichSystem } from '@/services/enrich.service';
import { UserRole } from '@/interfaces/user.interface';

const writeRoles: UserRole[] = ['admin', 'editor'];
const deleteRoles: UserRole[] = ['admin'];

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [raw, refs] = await Promise.all([
      apiService.get<{ _meta?: Record<string, unknown>; systems?: unknown[] }>(
        'systems',
        req.query as Record<string, unknown>,
      ),
      loadRefData(),
    ]);
    const meta = raw?._meta ?? {};
    const systemsArr = Array.isArray(raw?.systems) ? raw.systems : [];
    const enriched = systemsArr.map(s => enrichSystem(s as Parameters<typeof enrichSystem>[0], refs));

    res.json({
      data: enriched,
      total: meta.totalRecords ?? meta.count,
      page: meta.page,
      pages: meta.totalPages,
      _meta: meta,
      systems: enriched,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [sys, refs] = await Promise.all([
      apiService.get<Parameters<typeof enrichSystem>[0]>(`systems/${req.params.id}`),
      loadRefData(),
    ]);
    res.json(enrichSystem(sys, refs));
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole(...writeRoles), async (req, res, next) => {
  try {
    const data = await apiService.post('systems', req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole(...writeRoles), async (req, res, next) => {
  try {
    const data = await apiService.put(`systems/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole(...writeRoles), async (req, res, next) => {
  try {
    const data = await apiService.patch(`systems/${req.params.id}`, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole(...deleteRoles), async (req, res, next) => {
  try {
    await apiService.delete(`systems/${req.params.id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
