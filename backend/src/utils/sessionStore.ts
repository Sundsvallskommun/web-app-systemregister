import session from 'express-session';
import createMemoryStore from 'memorystore';
import { SESSION_STORE } from '@config';

/**
 * Sessionerna hålls i minnet. Det räcker för en enkel instans — vid omstart får
 * användarna logga in igen, vilket med SSO oftast sker utan att de märker det.
 * Kör appen i flera repliker behöver det här bytas mot en delad store (Redis).
 *
 * @param sessionTTL livslängd i sekunder
 */
export function createSessionStore(sessionTTL: number): session.Store {
  if (SESSION_STORE && SESSION_STORE !== 'memory') {
    throw new Error(`SESSION_STORE=${SESSION_STORE} stöds inte — endast "memory" är implementerad`);
  }

  const MemoryStore = createMemoryStore(session);
  return new MemoryStore({
    // memorystore rensar utgångna sessioner med det här intervallet (ms)
    checkPeriod: sessionTTL * 1000,
  });
}
