import { NextFunction, Request, Response, Router } from 'express';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { UserRole } from '@/interfaces/user.interface';
import { uppercaseEnumFields } from '@/utils/enumTransform';

const writeRoles: UserRole[] = ['admin', 'editor'];
const deleteRoles: UserRole[] = ['admin'];

export interface ProxyRouterOptions {
  /**
   * Fältnamn som ska uppercase-as automatiskt på POST/PUT/PATCH-bodyn innan den
   * vidarebefordras till api-service. Anledningen är att Java-enums är UPPERCASE
   * medan frontend ofta skickar lowercase. Default: ingen transform.
   */
  enumFields?: readonly string[];
}

/**
 * api-service paginerar listresurser som  { _meta: {...}, <resourceName>: [...] }.
 * Frontend förväntar sig  { data, total, page, pages }. Normalisera båda formaten
 * så frontend kan läsa res.data oavsett om bakomliggande är paginerad eller flat.
 */
function normalizeListResponse(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const obj = payload as Record<string, unknown>;
  if (!('_meta' in obj)) return payload;

  const meta = obj._meta as Record<string, unknown> | undefined;
  const dataKey = Object.keys(obj).find(k => k !== '_meta' && Array.isArray(obj[k]));
  if (!dataKey || !meta) return payload;

  return {
    data: obj[dataKey],
    total: meta.totalRecords ?? meta.count,
    page: meta.page,
    pages: meta.totalPages,
    _meta: meta,
    [dataKey]: obj[dataKey],
  };
}

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
export function buildProxyRouter(resource: string, opts: ProxyRouterOptions = {}): Router {
  const router = Router();
  router.use(authMiddleware);

  const enumFields = opts.enumFields ?? [];
  const transformBody = (body: unknown): unknown =>
    enumFields.length > 0 ? uppercaseEnumFields(body, enumFields) : body;

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.get(resource, req.query as Record<string, unknown>);
      res.json(normalizeListResponse(data));
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
      const data = await apiService.post(resource, transformBody(req.body));
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', requireRole(...writeRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.put(`${resource}/${req.params.id}`, transformBody(req.body));
      res.json(data);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id', requireRole(...writeRoles), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await apiService.patch(`${resource}/${req.params.id}`, transformBody(req.body));
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
