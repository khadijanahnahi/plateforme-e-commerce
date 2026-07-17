import { cleanupE2EData } from "./helpers/cleanup.js";

export default async function globalTeardown() {
  cleanupE2EData();
}
