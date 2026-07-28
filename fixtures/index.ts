/**
 * The JSON contract, as importable data.
 *
 * READ ONLY. These files are the meeting point between the two XP Kit tracks:
 * intern A's editor emits this shape, this runtime consumes it. Changing a fixture
 * to make your code pass is changing the contract — don't.
 *
 * Each file is hand-translated from what the app ships TODAY, so "is the editor
 * emitting the right JSON?" is a diff, not an argument. Provenance and the exact
 * field-by-field mapping live in docs/01-json-contract.md.
 */

import energyXpRaw from "./energy-xp.json";
import karvRaw from "./karv.json";
import progresRaw from "./progres.json";

export const rawFixtures = {
  "energy-xp": energyXpRaw as unknown,
  progres: progresRaw as unknown,
  karv: karvRaw as unknown,
} as const;

export type FixtureName = keyof typeof rawFixtures;

export const fixtureNames = Object.keys(rawFixtures) as FixtureName[];

export { energyXpRaw, progresRaw, karvRaw };
