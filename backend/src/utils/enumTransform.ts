/**
 * Java-API:n använder UPPERCASE enum-värden i DB:n. Frontend skickar ofta
 * lowercase ('production', 'cloud'). Den här helpern uppercase-ar
 * specifika strängfält på en POST/PUT-body innan den vidarebefordras.
 *
 * Lämnar fält ofrivilligt orörda om de inte finns eller inte är strängar.
 * Ändrar inte originalobjektet (returnerar shallow copy).
 */
export function uppercaseEnumFields(
  body: unknown,
  fields: readonly string[],
): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return (body ?? {}) as Record<string, unknown>;
  }
  const out: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const field of fields) {
    const v = out[field];
    if (typeof v === 'string' && v.length > 0) {
      out[field] = v.toUpperCase();
    }
  }
  return out;
}
