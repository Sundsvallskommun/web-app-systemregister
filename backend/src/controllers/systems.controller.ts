import { NextFunction, Request, Response, Router } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { isSystemManagerScoped } from '@/services/authorization.service';
import { loadRefData, enrichSystem, findPersonByUsername, RefData } from '@/services/enrich.service';
import { UserRole } from '@/interfaces/user.interface';
import { uppercaseEnumFields } from '@/utils/enumTransform';
import { logger } from '@/utils/logger';

// Systemförvaltare får ändra sina system, men bara Admin får registrera nya.
const writeRoles: UserRole[] = ['admin', 'editor'];
const createRoles: UserRole[] = ['admin'];
const deleteRoles: UserRole[] = ['admin'];

// Java-API:s enum-värden är UPPERCASE; frontend skickar ibland lowercase.
const SYSTEM_ENUM_FIELDS = ['status', 'hostingType'] as const;

const router = Router();
router.use(authMiddleware);

/**
 * Avgör om ett enskilt system är synligt för användaren. Systemförvaltaren når
 * bara de system den är utsedd förvaltare för, övriga roller passerar allt.
 *
 * Kopplingen mellan AD-konto och person-post går via username. Saknas den blir
 * urvalet tomt — hellre det än att visa hela registret. Uppslaget görs en gång
 * per request, inte en gång per system.
 */
function systemFilter(req: Request, refs: RefData): (systemManagerId?: unknown) => boolean {
  if (!isSystemManagerScoped(req.user!)) return () => true;

  const person = findPersonByUsername(refs, req.user!.username);

  if (!person) {
    logger.warn(`${req.user!.username} saknar person-post — ser inga system`);
    return () => false;
  }

  return systemManagerId => systemManagerId === person.id;
}

/**
 * Frågeparametrar för listningen. Systemförvaltaren får sitt urval pålagt som
 * systemManagerId, så att api-service filtrerar före pagineringen och _meta
 * räknar på de system användaren förvaltar i stället för på hela registret.
 *
 * Klientens eget systemManagerId skrivs över — det är inget den får välja.
 * null betyder att användaren saknar person-post och därmed inte ser något.
 */
function systemQuery(req: Request, refs: RefData): Record<string, unknown> | null {
  const query = req.query as Record<string, unknown>;

  if (!isSystemManagerScoped(req.user!)) return query;

  const person = findPersonByUsername(refs, req.user!.username);

  if (!person) {
    logger.warn(`${req.user!.username} saknar person-post — ser inga system`);
    return null;
  }

  return { ...query, systemManagerId: person.id };
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Referensdatan berikar svaret, och för Systemförvaltaren behövs den redan
    // innan anropet — person-posten avgör vilket urval som skickas uppströms.
    const refsPromise = loadRefData();
    const query = systemQuery(req, await refsPromise);

    if (!query) {
      res.json({ data: [], total: 0, page: 1, pages: 0, _meta: {}, systems: [] });
      return;
    }

    const [raw, refs] = await Promise.all([
      apiService.get<{ _meta?: Record<string, unknown>; systems?: unknown[] }>('systems', query),
      refsPromise,
    ]);

    const meta = raw?._meta ?? {};
    const systemsArr = Array.isArray(raw?.systems) ? raw.systems : [];
    const enriched = systemsArr.map(s => enrichSystem(s as Parameters<typeof enrichSystem>[0], refs));

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
      apiService.get<Parameters<typeof enrichSystem>[0]>(`systems/${req.params.id}`),
      loadRefData(),
    ]);

    if (!systemFilter(req, refs)(sys.systemManagerId)) {
      throw new HttpException(403, 'Du är inte utsedd förvaltare för systemet');
    }

    res.json(enrichSystem(sys, refs));
  } catch (err) {
    next(err);
  }
});

/** Hindrar Systemförvaltare från att ändra system de inte förvaltar. */
async function requireManagedSystem(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isSystemManagerScoped(req.user!)) return next();

    const [sys, refs] = await Promise.all([
      apiService.get<{ systemManagerId?: string }>(`systems/${req.params.id}`),
      loadRefData(),
    ]);

    if (!systemFilter(req, refs)(sys.systemManagerId)) {
      return next(new HttpException(403, 'Du är inte utsedd förvaltare för systemet'));
    }

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

router.put('/:id', requireRole(...writeRoles), requireManagedSystem, async (req, res, next) => {
  try {
    const body = uppercaseEnumFields(req.body, SYSTEM_ENUM_FIELDS);
    const data = await apiService.put(`systems/${req.params.id}`, body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

  // api-service stödjer inte PATCH — endast PUT
router.patch('/:id', requireRole(...writeRoles), requireManagedSystem, async (req, res, next) => {
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
