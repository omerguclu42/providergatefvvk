import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db, usernameToEmail } from "../lib/firebase";
import { resolvePermissions, type Permission, type UserProfile } from "./permissions";

type Status = "loading" | "signedOut" | "signedIn" | "noProfile" | "inactive";

interface AuthState {
  status: Status;
  user: User | null;
  profile: UserProfile | null;
  permissions: Set<Permission>;
  can: (permission: Permission) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Profil ve yetkileri yeniden yükler (ör. ilk kurulumdan sonra) */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function loadRoleMap(): Promise<Record<string, Permission[]>> {
  const snap = await getDocs(collection(db, "roles"));
  const map: Record<string, Permission[]> = {};
  snap.forEach((d) => (map[d.id] = (d.data().permissions ?? []) as Permission[]));
  return map;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());

  const loadProfile = useCallback(async (fbUser: User | null) => {
      setUser(fbUser);
      if (!fbUser) {
        setProfile(null);
        setPermissions(new Set());
        setStatus("signedOut");
        return;
      }
      setStatus("loading");
      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (!snap.exists()) {
          setProfile(null);
          setPermissions(new Set());
          setStatus("noProfile");
          return;
        }
        const p = { uid: fbUser.uid, ...snap.data() } as UserProfile;
        const roleMap = p.userType === "employee" ? await loadRoleMap() : {};
        setProfile(p);
        setPermissions(resolvePermissions(p, roleMap));
        setStatus(p.active ? "signedIn" : "inactive");
      } catch (err) {
        console.error("Profil yüklenemedi", err);
        setProfile(null);
        setPermissions(new Set());
        setStatus("noProfile");
      }
  }, []);

  useEffect(() => onAuthStateChanged(auth, loadProfile), [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      status,
      user,
      profile,
      permissions,
      can: (p) => permissions.has(p),
      login: async (username, password) => {
        await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
      },
      logout: () => signOut(auth),
      refresh: () => loadProfile(auth.currentUser),
    }),
    [status, user, profile, permissions, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
