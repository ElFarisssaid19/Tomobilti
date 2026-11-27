import { cleanupE2eData } from './support/api.js'

/** Removes every account, reservation and invoice the suite created. */
export default async function globalTeardown() {
  cleanupE2eData()
}
