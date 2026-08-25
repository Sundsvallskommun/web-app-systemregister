import bodyParser from "body-parser";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, RequestHandler, Router } from "express";
import session from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import passport from "passport";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import rateLimit from "express-rate-limit";

import {
  APP_NAME,
  BASE_URL_PREFIX,
  CREDENTIALS,
  LOG_FORMAT,
  NODE_ENV,
  ORIGIN,
  PORT,
  SECRET_KEY,
  SESSION_TTL,
  SWAGGER_ENABLED,
} from "@config";
import errorMiddleware from "@middlewares/error.middleware";
import { logger, stream } from "@utils/logger";

import healthController from "./controllers/health.controller";
import meController from "./controllers/me.controller";
import { buildProxyRouter } from "./controllers/proxy.controller";
import { buildSamlRouter } from "./controllers/saml.controller";
import systemsController from "./controllers/systems.controller";
import { createSamlStrategy } from "./services/saml.service";
import { createSessionStore } from "./utils/sessionStore";

/** Sessionens livslängd i sekunder — default 8 timmar (en arbetsdag). */
const sessionTtlSeconds = Number(SESSION_TTL ?? 8 * 60 * 60);

const corsWhitelist = (ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Routprefix, normaliserat till exakt en inledande och ingen avslutande slash.
 * Både monteringen av routrarna och CORS-undantaget för /saml utgår från det
 * här värdet, så de inte kan glida isär om env-variabeln skrivs annorlunda.
 */
const routePrefix = `/${(BASE_URL_PREFIX || "/api").trim().replace(/^\/+|\/+$/g, "")}`;

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
  services: ["serviceType", "hostingType"],
  "system-service-links": ["direction"],
  "system-dependencies": ["dependencyType"],
  personuppgiftsbehandlingar: [
    "status",
    "legalBasis",
    "sensitiveDataBasis",
    "transferProtectionMechanism",
  ],
  "ai-applications": ["status", "riskCategory"],
  informationshanteringsplaner: ["status"],
  foreskrifter: ["utfardare"],
};

const PROXIED_RESOURCES = [
  "services",
  "organizations",
  "persons",
  "suppliers",
  "criticality-levels",
  "system-service-links",
  "system-dependencies",
  "personuppgiftsbehandlingar",
  "ai-applications",
  "informationshanteringsplaner",
  "foreskrifter",
  "klassa/verksamhetstyper",
  "klassa/verksamhetsomraden",
  "klassa/processgrupper",
  "klassa/processer",
  "processer",
  "security-level-definitions",
  "event-logs",
  "vulnerability-scans",
] as const;

// Kräver en dedikerad router när de tas i bruk. Faktiska rutter:
//   personuppgiftsbehandlingar/{behandlingId}/system-links   (fd 'personuppgiftsbehandling-system-links')
//   informationshanteringsplaner/{ihPlanId}/handlingstyper   (fd 'handlingstyper')
//   handlingstyper/{handlingstypId}/ansvariga                (fd 'handlingstyp-ansvariga')
//   handlingstyper/{handlingstypId}/klassning                (fd 'informationsklassningar' — fanns ej som platt resurs)
//   vulnerability-scans/{scanId}/findings                    (fd 'vulnerability-findings')
//   kodtabeller/{tableName}                                   (fd 'code-lists')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

export class App {
  public app: Application;
  public env: string;
  public port: number | string;
  public swaggerEnabled: boolean;
  private samlStrategy = createSamlStrategy();

  constructor() {
    this.app = express();
    this.env = NODE_ENV || "development";
    this.port = PORT || 3001;
    this.swaggerEnabled = SWAGGER_ENABLED || false;

    this.initializeDataFolders();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info("=================================");
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 ${APP_NAME ?? "BFF"} listening on port ${this.port}`);
      logger.info(`Prefix: ${routePrefix}`);
      logger.info("=================================");
    });
  }

  public getServer(): Application {
    return this.app;
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan(LOG_FORMAT || "dev", { stream }));
    // @types/hpp and @types/compression bundle their own RequestHandler that
    // doesn't line up with @types/express — cast to the local handler type.
    this.app.use(hpp() as unknown as RequestHandler);
    this.app.use(helmet());
    this.app.use(compression() as unknown as RequestHandler);
    this.app.use(bodyParser.json({ limit: "1mb" }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(limiter);

    // SAML-routerna nås genom webbläsarnavigering och formulärposter från IdP:n,
    // inte via XHR. Origin-headern är då antingen IdP:ns eller "null" (efter en
    // redirect) och ska inte matchas mot frontend-allowlistan.
    const samlPath = `${routePrefix}/saml`;

    this.app.use((req, res, next) => {
      if (req.path.startsWith(samlPath)) {
        return next();
      }

      cors({
        credentials: CREDENTIALS,
        origin: (origin, callback) => {
          if (
            !origin ||
            corsWhitelist.includes("*") ||
            corsWhitelist.includes(origin)
          ) {
            return callback(null, true);
          }
          if (this.env === "development") {
            return callback(null, true);
          }
          // Utan CORS-headers blockerar webbläsaren svaret — men anropet ska
          // inte bli ett 500 från error-middlewaren.
          logger.warn(`Blockerade CORS-anrop från origin: ${origin}`);
          callback(null, false);
        },
      })(req, res, next);
    });

    // Bakom reverse proxy i drift — behövs för secure cookies och korrekt IP.
    this.app.set("trust proxy", 1);

    this.app.use(
      session({
        secret: SECRET_KEY as string,
        resave: false,
        saveUninitialized: false,
        store: createSessionStore(sessionTtlSeconds),
        cookie: {
          httpOnly: true,
          maxAge: sessionTtlSeconds * 1000,
          sameSite: "lax",
          secure: this.env === "production",
        },
      }),
    );

    // Användarobjektet är litet och läses direkt ur sessionen — ingen
    // användardatabas att slå upp mot, all behörighet kommer från AD-grupperna.
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user: Express.User, done) => done(null, user));

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    passport.use("saml", this.samlStrategy);
  }

  private initializeRoutes(): void {
    const root = Router();

    root.use("/health", healthController);
    root.use("/saml", buildSamlRouter(this.samlStrategy));
    root.use("/me", meController);

    // Dedikerade controllers med berikning — måste komma före proxy-loopen.
    root.use("/systems", systemsController);

    for (const resource of PROXIED_RESOURCES) {
      root.use(
        `/${resource}`,
        buildProxyRouter(resource, {
          enumFields: RESOURCE_ENUM_FIELDS[resource],
        }),
      );
    }

    // Aliases för bakåtkompatibilitet med gamla systemregister-frontend.
    // Frontend ringer /gdpr och /ai, api-service heter personuppgiftsbehandlingar och ai-applications.
    root.use(
      "/gdpr",
      buildProxyRouter("personuppgiftsbehandlingar", {
        enumFields: RESOURCE_ENUM_FIELDS.personuppgiftsbehandlingar,
      }),
    );
    root.use(
      "/ai",
      buildProxyRouter("ai-applications", {
        enumFields: RESOURCE_ENUM_FIELDS["ai-applications"],
      }),
    );

    this.app.use(routePrefix, root);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  private initializeDataFolders(): void {
    const logsDir = join(__dirname, "../data/logs");
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
  }
}

export default App;
