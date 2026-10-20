import { cleanupE2EData } from "./helpers/cleanup.js";

export default async function globalSetup() {
  cleanupE2EData();
}
