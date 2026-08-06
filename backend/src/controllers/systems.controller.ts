import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { loadRefData, enrichSystem } from '@/services/enrich.service';
import { UserRole } from '@/interfaces/user.interface';
import { uppercaseEnumFields } from '@/utils/enumTransform';

// Systemförvaltare får ändra sina system, men bara Admin får registrera nya.
const writeRoles: UserRole[] = ['admin', 'editor'];
const createRoles: UserRole[] = ['admin'];
const deleteRoles: UserRole[] = ['admin'];

// Java-API:s enum-värden är UPPERCASE; frontend skickar ibland lowercase.
const SYSTEM_ENUM_FIELDS = ['status', 'hostingType'] as const;

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

router.post('/', requireRole(...createRoles), async (req, res, next) => {
  try {
    const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS);
    const data = await apiService.post('systems', body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole(...writeRoles), async (req, res, next) => {
  try {
    const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS);
    const data = await apiService.put(`systems/${req.params.id}`, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

  // api-service stödjer inte PATCH — endast PUT
router.patch('/:id', requireRole(...writeRoles), async (req, res, next) => {
  try {
    const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS) as Record<string, unknown>;
    const current = await apiService.get<Record<string, unknown>>(`systems/${req.params.id}`);
    const merged = { ...current, ...body };
    const data = await apiService.put(`systems/${req.params.id}`, merged);
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
