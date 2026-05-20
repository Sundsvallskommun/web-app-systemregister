import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, RequestHandler, Router } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import {
  APP_NAME,
  BASE_URL_PREFIX,
  CREDENTIALS,
  LOG_FORMAT,
  NODE_ENV,
  ORIGIN,
  PORT,
  SWAGGER_ENABLED,
} from '@config';
import errorMiddleware from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';

import authController from './controllers/auth.controller';
import healthController from './controllers/health.controller';
import meController from './controllers/me.controller';
import { buildProxyRouter } from './controllers/proxy.controller';
import systemsController from './controllers/systems.controller';

const corsWhitelist = (ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean);

/**
 * Resources som proxas mot api-service-systemregister.
 * Mappar mot de Java-controllers som finns under
 * api-service-systemregister/src/main/java/se/sundsvall/systemregister/api/.
 */
// systems hanteras av en dedikerad controller som berikar svaret med embedded
// objekt (Supplier, ownerOrg, systemOwner, ...) — se controllers/systems.controller.ts.
// Den måste registreras INNAN PROXIED_RESOURCES-loopen i initializeRoutes().
//
// Enum-fält per resurs som ska uppercase-as på POST/PUT/PATCH-bodyn innan
// vidarebefordran (Java-API:s @Enumerated(EnumType.STRING) lagrar enum-namn,
// vilka alltid är UPPERCASE).
const RESOURCE_ENUM_FIELDS: Record<string, readonly string[]> = {
  services: ['serviceType', 'hostingType'],
  'system-service-links': ['direction'],
  'system-dependencies': ['dependencyType'],
  personuppgiftsbehandlingar: ['status', 'legalBasis', 'sensitiveDataBasis', 'transferProtectionMechanism'],
  'ai-applications': ['status', 'riskCategory'],
  informationshanteringsplaner: ['status'],
  foreskrifter: ['utfardare'],
};

const PROXIED_RESOURCES = [
  'services',
  'organizations',
  'persons',
  'suppliers',
  'criticality-levels',
  'system-service-links',
  'system-dependencies',
  'personuppgiftsbehandlingar',
  'personuppgiftsbehandling-system-links',
  'ai-applications',
  'informationshanteringsplaner',
  'handlingstyper',
  'handlingstyp-ansvariga',
  'informationsklassningar',
  'foreskrifter',
  'klassa-verksamhetstyper',
  'klassa-verksamhetsomraden',
  'klassa-processgrupper',
  'klassa-processer',
  'processer',
  'code-lists',
  'security-level-definitions',
  'event-logs',
  'vulnerability-scans',
  'vulnerability-findings',
] as const;

export class App {
  public app: Application;
  public env: string;
  public port: number | string;
  public swaggerEnabled: boolean;

  constructor() {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3001;
    this.swaggerEnabled = SWAGGER_ENABLED || false;

    this.initializeDataFolders();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info('=================================');
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 ${APP_NAME ?? 'BFF'} listening on port ${this.port}`);
      logger.info(`Prefix: ${BASE_URL_PREFIX ?? '/api'}`);
      logger.info('=================================');
    });
  }

  public getServer(): Application {
    return this.app;
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan(LOG_FORMAT || 'dev', { stream }));
    // @types/hpp and @types/compression bundle their own RequestHandler that
    // doesn't line up with @types/express — cast to the local handler type.
    this.app.use(hpp() as unknown as RequestHandler);
    this.app.use(helmet());
    this.app.use(compression() as unknown as RequestHandler);
    this.app.use(bodyParser.json({ limit: '1mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      cors({
        credentials: CREDENTIALS,
        origin: (origin, callback) => {
          if (!origin || corsWhitelist.includes('*') || corsWhitelist.includes(origin)) {
            return callback(null, true);
          }
          if (this.env === 'development') {
            return callback(null, true);
          }
          callback(new Error('Not allowed by CORS'));
        },
      }),
    );
  }

  private initializeRoutes(): void {
    const prefix = BASE_URL_PREFIX || '/api';
    const root = Router();

    root.use('/health', healthController);
    root.use('/auth', authController);
    root.use('/me', meController);

    // Dedikerade controllers med berikning — måste komma före proxy-loopen.
    root.use('/systems', systemsController);

    for (const resource of PROXIED_RESOURCES) {
      root.use(`/${resource}`, buildProxyRouter(resource, { enumFields: RESOURCE_ENUM_FIELDS[resource] }));
    }

    // Aliases för bakåtkompatibilitet med gamla systemregister-frontend.
    // Frontend ringer /gdpr och /ai, api-service heter personuppgiftsbehandlingar och ai-applications.
    root.use('/gdpr', buildProxyRouter('personuppgiftsbehandlingar', { enumFields: RESOURCE_ENUM_FIELDS.personuppgiftsbehandlingar }));
    root.use('/ai', buildProxyRouter('ai-applications', { enumFields: RESOURCE_ENUM_FIELDS['ai-applications'] }));

    this.app.use(prefix, root);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  private initializeDataFolders(): void {
    const logsDir = join(__dirname, '../data/logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
  }
}

export default App;
