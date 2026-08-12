import { NextFunction, Request, Response, Router } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { authMiddleware, requireRole } from '@/middlewares/auth.middleware';
import { apiService } from '@/services/api.service';
import { isOrganizationScoped, isScoped, isSystemManagerScoped } from '@/services/authorization.service';
import {
  loadRefData,
  enrichSystem,
  findPersonByUsername,
  collectOrgBranch,
  RefData,
} from '@/services/enrich.service';
import { User, UserRole } from '@/interfaces/user.interface';
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

interface ScopedSystem {
  systemManagerId?: unknown;
  ownerOrganizationId?: unknown;
}

/**
 * Bygger ett filter för den inloggade användaren. Systemförvaltaren begränsas
 * till de system den är utsedd förvaltare för, IT-samordnaren till system som
 * ägs av den egna organisationen (inklusive underliggande enheter). Admin
 * passerar allt.
 *
 * Kopplingen mellan AD-konto och person-post går via username, och mellan
 * AD-konto och organisation via orgTree. Saknas någon av dem blir urvalet tomt
 * Uppslagen görs en gång per request, inte en gång per system.
 */
function systemFilter(req: Request, refs: RefData): (sys: ScopedSystem) => boolean {
  const user = req.user!;

  if (isSystemManagerScoped(user)) {
    const person = findPersonByUsername(refs, user.username);

    if (!person) {
      logger.warn(`${user.username} saknar person-post — ser inga system`);
      return () => false;
    }

    return sys => sys.systemManagerId === person.id;
  }

  if (isOrganizationScoped(user)) {
    if (!user.orgId) {
      logger.warn(`${user.username} saknar orgTree/orgId — ser inga system`);
      return () => false;
    }

    if (!refs.organizations.has(user.orgId)) {
      logger.warn(`${user.username} har orgId ${user.orgId} som saknas i registret — ser inga system`);
      return () => false;
    }

    const branch = collectOrgBranch(refs, user.orgId);

    return sys => typeof sys.ownerOrganizationId === 'string' && branch.has(sys.ownerOrganizationId);
  }

  return () => true;
}

/** 403-text anpassad efter vad som begränsar användaren. */
function scopeDeniedMessage(user: Pick<User, 'role'>): string {
  return isOrganizationScoped(user)
    ? 'Systemet ägs av en annan organisation'
    : 'Du är inte utsedd förvaltare för systemet';
}

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

    // api-service kan inte filtrera på förvaltare eller organisation, så urvalet
    // görs här — efter pagineringen. Därför speglar _meta hela registret;
    // total räknas om nedan. Uppdateras när filtrering finns i api-service.
    const scoped = isScoped(req.user!);
    const canSee = systemFilter(req, refs);
    const visible = scoped ? enriched.filter(s => canSee(s)) : enriched;

    res.json({
      data: visible,
      total: scoped ? visible.length : (meta.totalRecords ?? meta.count),
      page: meta.page,
      pages: scoped ? undefined : meta.totalPages,
      _meta: meta,
      systems: visible,
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

    if (!systemFilter(req, refs)(sys)) {
      throw new HttpException(403, scopeDeniedMessage(req.user!));
    }

    res.json(enrichSystem(sys, refs));
  } catch (err) {
    next(err);
  }
});

/** Hindrar Systemförvaltare från att ändra system de inte förvaltar. */
async function requireManagedSystem(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isScoped(req.user!)) return next();

    const [sys, refs] = await Promise.all([
      apiService.get<ScopedSystem>(`systems/${req.params.id}`),
      loadRefData(),
    ]);

    if (!systemFilter(req, refs)(sys)) {
      return next(new HttpException(403, scopeDeniedMessage(req.user!)));
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
