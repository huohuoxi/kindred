import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createSeed } from "../data/seed";
import { execute } from "../domain/commands";
import type { AppState, CommandInput } from "../domain/model";
import { STORAGE_KEY, restore } from "../lib/persistence";
function load(): { state: AppState; recovery: boolean; storageError: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return { state: restore(raw), recovery: false, storageError: false };
      } catch {
        return {
          state: createSeed(Date.now()),
          recovery: true,
          storageError: false,
        };
      }
    }
    return {
      state: createSeed(Date.now()),
      recovery: false,
      storageError: false,
    };
  } catch {
    return {
      state: createSeed(Date.now()),
      recovery: false,
      storageError: true,
    };
  }
}
type Context = {
  state: AppState;
  run: (command: CommandInput, id?: string) => boolean;
  error: string;
  notice: string;
  recovery: boolean;
  storageError: boolean;
  resetDemo: () => void;
  clearError: () => void;
  inform: (text: string) => void;
};
const AppContext = createContext<Context | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state);
  const ref = useRef(state);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recovery, setRecovery] = useState(initial.recovery);
  const [storageError, setStorageError] = useState(initial.storageError);
  const persist = (next: AppState) => {
    ref.current = next;
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  useEffect(() => {
    if (!initial.recovery && !initial.storageError) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial.state));
      } catch {
        setStorageError(true);
      }
    }
  }, [initial]);
  const clearError = useCallback(() => setError(""), []);
  const run = (command: CommandInput, id: string = crypto.randomUUID()) => {
    if (recovery) {
      setError("Reset the incompatible saved demo before making changes.");
      return false;
    }
    try {
      const next = execute(ref.current, {
        ...command,
        id,
        actor: ref.current.currentUser,
      });
      persist(next);
      setError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "This action could not be completed.",
      );
      return false;
    }
  };
  const resetDemo = () => {
    persist(createSeed(Date.now()));
    setRecovery(false);
    setError("");
    setNotice("Demo reset. All browser-local creations were deleted.");
    location.hash = "/";
  };
  return (
    <AppContext.Provider
      value={{
        state,
        run,
        error,
        notice,
        recovery,
        storageError,
        resetDemo,
        clearError,
        inform: setNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Missing application provider.");
  return value;
}
