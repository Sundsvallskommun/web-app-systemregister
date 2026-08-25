import { NextFunction, Request, Response, Router } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import {
  isInScope,
  isScoped,
  resolveScope,
  scopeDeniedMessage,
  scopeToQuery,
  Scope,
  ScopedSystem,
} from '@/services/authorization.service';
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
    // Referensdatan berikar svaret, och för de begränsade rollerna behövs den
    // redan innan anropet — person-posten respektive organisationen avgör vilket
    // urval som skickas uppströms.
    const refsPromise = loadRefData();
    const scope: Scope = isScoped(req.user!)
      ? resolveScope(req.user!, await refsPromise)
      : { kind: 'all' };
    const query = scopeToQuery(scope, req.query as Record<string, unknown>);

    if (!query) {
      res.json({
        data: [],
        total: 0,
        page: 1,
        pages: 0,
        _meta: {},
        systems: [],
      });
      return;
    }

    const [raw, refs] = await Promise.all([
      apiService.get<{ _meta?: Record<string, unknown>; systems?: unknown[] }>(
        'systems',
        query,
      ),
      refsPromise,
    ]);

    const meta = raw?._meta ?? {};
    const systemsArr = Array.isArray(raw?.systems) ? raw.systems : [];
    const enriched = systemsArr.map((s) =>
      enrichSystem(s as Parameters<typeof enrichSystem>[0], refs),
    );

    // Systemen kommer i api-serviceens ordning, som i praktiken är namnsorterad:
    // varken createdAt eller någon sort-parameter finns i api-service i dag, och
    // id:na är slumpade UUID:er (v4) som inte heller bär skapandeordning.
    // Dashboardens "Senaste system" tar de fem första och visar därför inte de
    // nyast skapade systemen. Sortera på createdAt här när fältet finns.
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
      apiService.get<Parameters<typeof enrichSystem>[0]>(
        `systems/${req.params.id}`,
      ),
      loadRefData(),
    ]);

    if (!isInScope(resolveScope(req.user!, refs), sys)) {
      throw new HttpException(403, scopeDeniedMessage(req.user!));
    }

    res.json(enrichSystem(sys, refs));
  } catch (err) {
    next(err);
  }
});

/**
 * Hindrar Systemförvaltare från att ändra system de inte förvaltar. Admin
 * passerar utan uppslag — kontrollen kostar då inget extra anrop.
 *
 * Systemet som hämtats för kontrollen läggs på res.locals så att PATCH kan
 * återanvända det i stället för att hämta samma post en gång till.
 */
async function requireManagedSystem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!isScoped(req.user!)) return next();

    const [sys, refs] = await Promise.all([
      apiService.get<ScopedSystem & Record<string, unknown>>(
        `systems/${req.params.id}`,
      ),
      loadRefData(),
    ]);

    if (!isInScope(resolveScope(req.user!, refs), sys)) {
      return next(new HttpException(403, scopeDeniedMessage(req.user!)));
    }

    res.locals.system = sys;
    next();
  } catch (err) {
    next(err);
  }
}

router.post('/', requireRole(...createRoles), async (req, res, next) => {
  try {
    const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS);
    const data = await apiService.post('systems', body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  requireRole(...writeRoles),
  requireManagedSystem,
  async (req, res, next) => {
    try {
      const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS);
      const data = await apiService.put(`systems/${req.params.id}`, body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// api-service stödjer inte PATCH — endast PUT
router.patch(
  '/:id',
  requireRole(...writeRoles),
  requireManagedSystem,
  async (req, res, next) => {
    try {
      const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS) as Record<
        string,
        unknown
      >;
      // requireManagedSystem har redan hämtat posten för de begränsade rollerna.
      // Admin passerar utan uppslag och hämtar den därför här.
      const current =
        (res.locals.system as Record<string, unknown> | undefined) ??
        (await apiService.get<Record<string, unknown>>(
          `systems/${req.params.id}`,
        ));
      const merged = { ...current, ...body };
      const data = await apiService.put(`systems/${req.params.id}`, merged);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', requireRole(...deleteRoles), async (req, res, next) => {
  try {
    await apiService.delete(`systems/${req.params.id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
