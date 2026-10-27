import { validateState } from "../domain/commands";
import type { AppState } from "../domain/model";
export const STORAGE_KEY = "kindred-demo-v1";
export function restore(raw: string): AppState {
  return validateState(JSON.parse(raw));
}
