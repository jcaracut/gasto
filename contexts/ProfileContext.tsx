import { getDatabase, getMeta, initDatabase, setMeta } from "@/db/database";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// The display name the user chose during onboarding. Stored in the `meta`
// table under `user_name`; an empty/absent value means onboarding isn't done.
const META_KEY = "user_name";

interface ProfileContextValue {
  name: string; // current display name ("" until onboarded)
  isReady: boolean; // true once the persisted value has loaded
  hasOnboarded: boolean; // true when a non-empty name exists
  setName: (name: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [name, setNameState] = useState("");
  const [isReady, setIsReady] = useState(false);

  // Load the persisted name once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        const stored = await getMeta(db, META_KEY);
        if (active && stored) {
          setNameState(stored);
        }
      } catch (error) {
        console.error("Failed to load profile name:", error);
      } finally {
        if (active) setIsReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setName = useCallback(async (next: string) => {
    const trimmed = next.trim();
    setNameState(trimmed);
    try {
      const db = await getDatabase();
      await setMeta(db, META_KEY, trimmed);
    } catch (error) {
      console.error("Failed to persist profile name:", error);
    }
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      name,
      isReady,
      hasOnboarded: name.trim().length > 0,
      setName,
    }),
    [name, isReady, setName],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextValue => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
};
