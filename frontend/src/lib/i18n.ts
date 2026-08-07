const sv = {
  // Common
  save: "Spara",
  cancel: "Avbryt",
  close: "Stäng",
  create: "Skapa",
  saving: "Sparar...",
  search: "Sök",
  actions: "Åtgärder",
  name: "Namn",
  title: "Titel",
  description: "Beskrivning",
  status: "Status",
  active: "Aktiv",
  inactive: "Inaktiv",
  owner: "Ägare",
  system: "System",
  version: "Version",
  yes: "Ja",
  no: "Nej",
  loading: "Laddar...",
  noResults: "Inga resultat hittades",
  required: (field: string) => `${field} är obligatoriskt`,
  saveFailed: "Kunde inte spara",
  emptyValue: "-",

  // Auth
  login: "Logga in",
  loggingIn: "Loggar in...",
  loginFailed: "Inloggningen misslyckades",
  username: "Användarnamn",
  email: "E-post",
  password: "Lösenord",
  logout: "Logga ut",
  sessionExpired: "Sessionen har gått ut",

  // Accessibility (aria-labels)
  a11y: {
    openMenu: "Öppna meny",
    closeMenu: "Stäng meny",
    view: (name: string) => `Visa ${name}`,
    edit: (name: string) => `Redigera ${name}`,
    delete: (name: string) => `Ta bort ${name}`,
    showPassword: "Visa lösenord",
    hidePassword: "Dölj lösenord",
  },

  // Roles
  roles: {
    admin: "Admin",
    editor: "Redaktör",
    viewer: "Läsare",
  } as Record<string, string>,

  roleDashboards: {
    admin: "Du har full tillgång till alla funktioner.",
    editor: "Du kan redigera system, leverantörer och klassningar.",
    viewer: "Du har läsbehörighet för alla register.",
  } as Record<string, string>,

  // Navigation
  nav: {
    dashboard: "Dashboard",
    systems: "System",
    suppliers: "Leverantörer",
    classifications: "Klassning (K/R/T)",
    risks: "Riskanalys",
    gdpr: "GDPR",
    ai: "AI-tillämpningar",
    processes: "Processer",
    continuity: "Kontinuitet",
    reports: "Rapporter",
    notifications: "Notifieringar",
    admin: "Administration",
  },

  // Dashboard
  dashboard: {
    title: "Dashboard",
    organizations: "Organisationer",
    recentSystems: "Senaste system",
  },

  // Systems
  systems: {
    title: "System",
    newSystem: "Nytt system",
    editSystem: "Redigera",
    searchPlaceholder: "Sök system...",
    selectPlaceholder: "Välj system...",
    systemId: "System-ID",
    systemIdPlaceholder: "t.ex. SYS-005",
    hosting: "Hosting",
    supplier: "Leverantör",
    ownerOrg: "Ägande organisation",
    systemOwner: "Systemägare",
    technicalContact: "Teknisk kontakt",
    criticality: "Kritikalitet",
    noSystems: "Inga system hittades",
    statuses: {
      planned: "Planerad",
      development: "Under utveckling",
      production: "I produktion",
      deprecated: "Föråldrad",
      retired: "Avvecklad",
    } as Record<string, string>,
    hostingTypes: {
      cloud: "Moln",
      internal: "Intern",
    } as Record<string, string>,
  },

  // KRT Classification
  krt: {
    title: "Informationssäkerhetsklass (K/R/T)",
    confidentiality: "Konfidentialitet",
    integrity: "Riktighet",
    availability: "Tillgänglighet",
    short: { k: "K", r: "R", t: "T" },
    abbr: "K/R/T",
    assessment: "Bedömning",
    levels: {
      veryHigh: "Mycket högt",
      high: "Högt",
      medium: "Medium",
      low: "Lågt",
    },
    infoText:
      "Klassning av konfidentialitet, riktighet och tillgänglighet för varje system. Beroende av klassningen bedöms om systemet är verksamhetskritiskt och sedan samhällsviktigt.",
    businessCritical: "Verksamhetskritiskt",
    societalCritical: "Samhällsviktigt",
    notAssessed: "Ej bedömt",
    businessCriticalRule:
      "Ett system räknas som verksamhetskritiskt när riktighet eller tillgänglighet är klassad till 3 eller högre.",
    mcfLinkLabel: "Läs om samhällsviktig verksamhet hos MCF",
    mcfUrl: "https://www.mcf.se/samhallsviktigverksamhet/",
    classify: "Gör klassning",
    classifyTitle: (systemId: string, name: string) =>
      `Klassning: ${systemId} — ${name}`,
    a11yClassify: (name: string) => `Gör klassning för ${name}`,
    businessCriticalHit:
      "Med den här klassningen är systemet verksamhetskritiskt. Verksamheten ska då även bedöma om systemet är samhällsviktigt.",
    upcomingFields:
      "Kommentar per aspekt och bedömningen av samhällsviktig verksamhet kommer i nästa version.",
  },

  // Suppliers
  suppliers: {
    title: "Leverantörer & Avtal",
    newSupplier: "Ny leverantör",
    editSupplier: "Redigera",
    searchPlaceholder: "Sök leverantör...",
    orgNumber: "Organisationsnummer",
    orgNumberPlaceholder: "t.ex. 556123-4567",
    contactEmail: "Kontakt e-post",
    website: "Webbplats",
    websitePlaceholder: "https://...",
    noSuppliers: "Inga leverantörer hittades",
  },

  // Risks
  risks: {
    title: "Riskanalys",
    risk: "Risk",
    newRisk: "Ny risk",
    infoText: "Dokumentera och följ upp risker kopplade till system.",
    probability: "Sannolikhet",
    impact: "Konsekvens",
    responsible: "Ansvarig",
    deadline: "Deadline",
    system: "System",
    levels: {
      low: "Låg",
      medium: "Medium",
      high: "Hög",
      critical: "Kritisk",
    } as Record<string, string>,
    statuses: {
      open: "Öppen",
      mitigated: "Åtgärdad",
      accepted: "Accepterad",
      closed: "Stängd",
    } as Record<string, string>,
  },

  // GDPR
  gdpr: {
    title: "GDPR-behandlingar",
    newTreatment: "Ny behandling",
    infoText:
      "Register över personuppgiftsbehandlingar enligt GDPR artikel 30.",
    noTreatments: "Inga behandlingar hittades",
    treatmentId: "Behandlings-ID",
    legalBasis: "Laglig grund",
    sensitiveData: "Känsliga uppg.",
    ssn: "Personnr",
    controller: "Personuppg.ansvarig",
    dpo: "DPO",
    dpiaRequired: "DPIA krävs",
    thirdCountryTransfer: "Tredjelandsöverföring",
    purpose: "Ändamål",
    linkedSystems: "Kopplade system",
    legalBases: {
      samtycke: "Samtycke",
      avtal: "Avtal",
      rattslig_forpliktelse: "Rättslig förpliktelse",
      vitalt_intresse: "Vitalt intresse",
      allmant_intresse: "Allmänt intresse",
      berattigat_intresse: "Berättigat intresse",
    } as Record<string, string>,
  },

  // AI
  ai: {
    title: "AI-tillämpningar",
    newApp: "Ny AI-tillämpning",
    infoText: "Register över AI-tillämpningar enligt EU AI Act.",
    appId: "AI-ID",
    noApps: "Inga AI-tillämpningar hittades",
    riskCategory: "Riskkategori",
    highRiskArea: "Högriskområde",
    fria: "FRIA",
    friaCompleted: "FRIA genomförd",
    friaDone: "Klar",
    friaNotDone: "Ej klar",
    registrationStatus: "Registreringsstatus",
    contact: "Kontakt",
    statuses: {
      active: "Aktiv",
      draft: "Utkast",
      suspended: "Pausad",
      retired: "Avvecklad",
    } as Record<string, string>,
    riskCategories: {
      high_risk: "Hög risk",
      limited_risk: "Begränsad risk",
      minimal_risk: "Minimal risk",
    } as Record<string, string>,
    // Observed values only; unlisted ones fall back to their raw value.
    registrationStatuses: {
      not_required: "Krävs ej",
      pending: "Väntar",
    } as Record<string, string>,
    highRiskAreas: {
      essential_services: "Samhällsviktiga tjänster",
    } as Record<string, string>,
  },

  // Processes
  processes: {
    title: "Verksamhetsprocesser",
    infoText:
      "Koppla system till verksamhetsprocesser via KLASSA 2.1-klassificeringsstrukturen. Används även för att koppla informationsmängder till system.",
    klassaNote:
      "KLASSA 2.1-hierarkin (verksamhetstyper, verksamhetsområden, processgrupper, processer) är implementerad i backend men processkopplingar per system är under utveckling.",
    ownerOrg: "Ägande organisation",
  },

  // Continuity
  continuity: {
    title: "Kontinuitet & Återställning",
    infoText:
      "Översikt av verksamhetskritiska och samhällsviktiga system baserat på K/R/T-klassning. System med riktighet eller tillgänglighet på nivå 3 eller högre bedöms som verksamhetskritiska.",
    businessCritical: "Verksamhetskritiskt",
    societalCritical: "Samhällsviktigt",
  },

  // Reports
  reports: {
    title: "Rapporter",
    infoText:
      "Generera sammanställningar för utskrift eller export. Kan användas som underlag vid driftavbrott.",
    print: "Skriv ut",
    export: "Exportera",
    systemOverview: "Systemöversikt",
    systemOverviewDesc: (count: number) =>
      `Sammanställning av ${count} system med status, ägare och klassning.`,
    krtReport: "Informationssäkerhetsklass (K/R/T)",
    krtReportDesc:
      "Alla systems konfidentialitet, riktighet och tillgänglighet.",
    supplierReport: "Leverantörsrapport",
    supplierReportDesc: "Översikt av leverantörer, avtal och kontaktuppgifter.",
    riskReport: "Riskanalys-sammanställning",
    riskReportDesc: "Öppna risker med sannolikhet, konsekvens och ansvariga.",
    continuityReport: "Kontinuitetsplan",
    continuityReportDesc:
      "Utskrivbar kontinuitetsplan för verksamhetskritiska system.",
    gdprReport: "GDPR-behandlingar",
    gdprReportDesc: (count: number) =>
      `${count} personuppgiftsbehandlingar med laglig grund och systemkopplingar.`,
    aiReport: "AI-tillämpningar",
    aiReportDesc: (count: number) =>
      `${count} AI-applikationer med riskklassificering.`,
  },

  // Notifications
  notifications: {
    title: "Notifieringar",
    markAllRead: "Markera alla som lästa",
    infoText:
      "Påminnelser för avtalsförnyelser och behörighetskontroller, varningar för risker och saknade åtgärder.",
    unreadCount: (n: number) => `${n} olästa`,
  },

  // Admin
  admin: {
    title: "Administration",
    infoText: "Hantera användare och roller.",
    noAccess: "Du har inte behörighet för denna sida.",
    role: "Roll",
    created: "Skapad",
    editRole: "Redigera roll",
  },

  // App
  app: {
    name: "Systemregistret",
    org: "Sundsvalls kommun",
  },
} as const;

export type Translations = typeof sv;
export default sv;
