/**
 * The JSON contract, as importable data (test-only helper).
 *
 * READ ONLY. The files in ../../fixtures are the meeting point between the editor that
 * emits this JSON and the runtime that consumes it. Changing a fixture to make your
 * code pass is changing the contract — don't. Provenance: ../../fixtures/README.md.
 */

import energyXpRaw from '../../fixtures/energy-xp.json' with { type: 'json' }
import karvRaw from '../../fixtures/karv.json' with { type: 'json' }
import progresRaw from '../../fixtures/progres.json' with { type: 'json' }

export const rawFixtures = {
  'energy-xp': energyXpRaw as unknown,
  progres: progresRaw as unknown,
  karv: karvRaw as unknown,
} as const

export type FixtureName = keyof typeof rawFixtures

export const fixtureNames = Object.keys(rawFixtures) as FixtureName[]

export { energyXpRaw, karvRaw, progresRaw }
