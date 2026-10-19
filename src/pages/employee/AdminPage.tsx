import { useCallback, useEffect, useState, type FormEvent } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import AppLayout from "../../components/AppLayout";
import { EMPLOYEE_NAV } from "./EmployeeHome";
import { db, createAuthAccount, USERNAME_PATTERN } from "../../lib/firebase";
import { DEFAULT_ROLES, type UserProfile, type UserType } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { Can } from "../../auth/guards";

interface Supplier {
  id: string;
  name: string;
  active: boolean;
}

interface RoleRow {
  id: string;
  name: string;
}

function fbError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "auth/email-already-in-use") return "Bu kullanıcı adı zaten kullanılıyor.";
    if (err.code === "auth/weak-password") return "Şifre çok zayıf (en az 8 karakter).";
    if (err.code === "permission-denied") return "Bu işlem için yetkiniz yok.";
  }
  return err instanceof Error ? err.message : String(err);
}

export default function AdminPage() {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [u, s, r] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("username"))),
        getDocs(collection(db, "suppliers")),
        getDocs(collection(db, "roles")),
      ]);
      setUsers(u.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
      setSuppliers(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Supplier).sort((a, b) => a.name.localeCompare(b.name, "tr")));
      const roleRows = r.docs.map((d) => ({ id: d.id, name: (d.data().name as string) ?? d.id }));
      setRoles(roleRows.length ? roleRows : Object.entries(DEFAULT_ROLES).map(([id, v]) => ({ id, name: v.name })));
      setLoadError(null);
    } catch (err) {
      setLoadError(fbError(err));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const supplierName = (id?: string) => suppliers.find((s) => s.id === id)?.name ?? id ?? "—";
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;

  async function toggleActive(u: UserProfile) {
    if (u.uid === me?.uid) return;
    await updateDoc(doc(db, "users", u.uid), { active: !u.active });
    reload();
  }

  return (
    <AppLayout nav={EMPLOYEE_NAV}>
      <h1>Yönetim</h1>
      <p className="muted">Tedarikçi firmaları ve kullanıcı hesaplarını buradan yönetin.</p>
      {loadError && <div className="alert error">{loadError}</div>}

      <Can permission="admin.suppliers">
        <section className="card">
          <h2>Tedarikçi firmalar</h2>
          <SupplierForm onCreated={reload} existingIds={suppliers.map((s) => s.id)} />
          <table className="table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Firma adı</th>
                <th>Kullanıcı sayısı</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{users.filter((u) => u.supplierId === s.id).length}</td>
                </tr>
              ))}
              {!suppliers.length && (
                <tr>
                  <td colSpan={3} className="muted">
                    Henüz tedarikçi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </Can>

      <section className="card">
        <h2>Kullanıcılar</h2>
        <UserForm suppliers={suppliers} roles={roles} onCreated={reload} />
        <table className="table">
          <thead>
            <tr>
              <th>Kullanıcı adı</th>
              <th>Ad soyad</th>
              <th>Tip</th>
              <th>Firma / Roller</th>
              <th>Durum</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className={u.active ? "" : "inactive"}>
                <td>{u.username}</td>
                <td>{u.displayName}</td>
                <td>{u.userType === "supplier" ? "Tedarikçi" : "Çalışan"}</td>
                <td>{u.userType === "supplier" ? supplierName(u.supplierId) : (u.roles ?? []).map(roleName).join(", ")}</td>
                <td>{u.active ? "Aktif" : "Pasif"}</td>
                <td>
                  {u.uid !== me?.uid && (
                    <button className="link-btn" onClick={() => toggleActive(u)}>
                      {u.active ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  );
}

function SupplierForm({ onCreated, existingIds }: { onCreated: () => void; existingIds: string[] }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const id = code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{2,20}$/.test(id)) return setMsg({ type: "error", text: "Kod 2-20 karakter; büyük harf, rakam veya tire." });
    if (!name.trim()) return setMsg({ type: "error", text: "Firma adı zorunlu." });
    if (existingIds.includes(id)) return setMsg({ type: "error", text: "Bu kod zaten kullanılıyor." });
    try {
      await setDoc(doc(db, "suppliers", id), { name: name.trim(), active: true, createdAt: serverTimestamp() });
      setCode("");
      setName("");
      setMsg({ type: "ok", text: "Tedarikçi eklendi." });
      onCreated();
    } catch (err) {
      setMsg({ type: "error", text: fbError(err) });
    }
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <input placeholder="Kod (ör. TED-001)" value={code} onChange={(e) => setCode(e.target.value)} />
      <input placeholder="Firma adı" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="primary small-btn" type="submit">
        Ekle
      </button>
      {msg && <span className={msg.type === "error" ? "text-error" : "text-ok"}>{msg.text}</span>}
    </form>
  );
}

function UserForm({
  suppliers,
  roles,
  onCreated,
}: {
  suppliers: Supplier[];
  roles: RoleRow[];
  onCreated: () => void;
}) {
  const [userType, setUserType] = useState<UserType>("employee");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  function toggleRole(id: string) {
    setSelectedRoles((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const uname = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(uname)) return setMsg({ type: "error", text: "Geçersiz kullanıcı adı (3-32; a-z, 0-9, . _ -)." });
    if (!displayName.trim()) return setMsg({ type: "error", text: "Ad soyad zorunlu." });
    if (password.length < 8) return setMsg({ type: "error", text: "Şifre en az 8 karakter olmalı." });
    if (userType === "supplier" && !supplierId) return setMsg({ type: "error", text: "Tedarikçi firma seçin." });
    if (userType === "employee" && !selectedRoles.length) return setMsg({ type: "error", text: "En az bir rol seçin." });

    setBusy(true);
    setMsg(null);
    try {
      const uid = await createAuthAccount(uname, password);
      await setDoc(doc(db, "users", uid), {
        username: uname,
        displayName: displayName.trim(),
        userType,
        ...(userType === "supplier" ? { supplierId } : { roles: selectedRoles }),
        active: true,
        createdAt: serverTimestamp(),
      });
      setUsername("");
      setDisplayName("");
      setPassword("");
      setSelectedRoles([]);
      setMsg({ type: "ok", text: `"${uname}" oluşturuldu. Kullanıcıya şifresini iletin.` });
      onCreated();
    } catch (err) {
      setMsg({ type: "error", text: fbError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="user-form" onSubmit={submit}>
      <div className="segmented">
        <button type="button" className={userType === "employee" ? "on" : ""} onClick={() => setUserType("employee")}>
          Şirket çalışanı
        </button>
        <button type="button" className={userType === "supplier" ? "on" : ""} onClick={() => setUserType("supplier")}>
          Tedarikçi
        </button>
      </div>
      <div className="inline-form">
        <input placeholder="Kullanıcı adı" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
        <input placeholder="Ad soyad" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <input placeholder="Geçici şifre (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      {userType === "supplier" ? (
        <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Tedarikçi firma seçin…</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} – {s.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="role-picks">
          {roles.map((r) => (
            <label key={r.id} className="check">
              <input type="checkbox" checked={selectedRoles.includes(r.id)} onChange={() => toggleRole(r.id)} />
              {r.name}
            </label>
          ))}
        </div>
      )}
      <div className="inline-form">
        <button className="primary small-btn" type="submit" disabled={busy}>
          {busy ? "Oluşturuluyor…" : "Kullanıcı oluştur"}
        </button>
        {msg && <span className={msg.type === "error" ? "text-error" : "text-ok"}>{msg.text}</span>}
      </div>
    </form>
  );
}
