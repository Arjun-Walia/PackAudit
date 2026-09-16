"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BrandLink } from "@/components/brand/Brand";
import {
  getSeededStore,
  newStore,
  parseStore,
  STORE_KEY,
  type Workspace as WorkspaceData,
} from "@/lib/officer-model";
import s from "./Workspace.module.css";
const Context = createContext<{
  data: WorkspaceData;
  save: (data: WorkspaceData) => void;
} | null>(null);
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace unavailable");
  return value;
}
export function Workspace({ children }: { children: ReactNode }) {
  const [data, setData] = useState(newStore);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) {
        const seeded = getSeededStore();
        sessionStorage.setItem(STORE_KEY, JSON.stringify(seeded));
        setData(seeded);
      } else {
        const parsed = parseStore(raw);
        if (parsed.inspections.length === 0) {
          const seeded = getSeededStore();
          sessionStorage.setItem(STORE_KEY, JSON.stringify(seeded));
          setData(seeded);
        } else {
          setData(parsed);
        }
      }
    } catch {
      setError(
        "The saved workspace could not be read. Your stored data has not been overwritten. Reopen this app in a new tab to start a separate session.",
      );
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (ready && !error && !data.profile && path !== "/login")
      router.replace("/login");
  }, [ready, error, data.profile, path, router]);
  function save(next: WorkspaceData) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        "This tab could not save the workspace. Try smaller images or allow session storage. Your last saved record is unchanged.",
      );
    }
    setData(next);
  }
  if (!ready || error)
    return (
      <main className={s.workspace}>
        <div className={s.standalone}>
          <h1>{error ? "Workspace needs attention" : "Opening workspace…"}</h1>
          <p role={error ? "alert" : "status"}>
            {error || "Loading this tab’s demo records."}
          </p>
          <Link href="/">Return to landing page</Link>
        </div>
      </main>
    );
  const login = path === "/login";
  if (!login && !data.profile)
    return (
      <main className={s.workspace}>
        <p className={s.standalone} role="status">
          Opening demo sign-in…
        </p>
      </main>
    );
  return (
    <Context.Provider value={{ data, save }}>
      <div className={s.workspace}>
        <a className={s.skip} href="#workspace-main">
          Skip to workspace
        </a>
        {!login && (
          <aside className={s.sidebar}>
            <BrandLink className={s.brand} />
            <span className={s.navLabel}>OFFICER WORKSPACE</span>
            <nav aria-label="Workspace navigation">
              {[
                ["/dashboard", "Overview", "◫"],
                ["/inspect", "New inspection", "＋"],
                ["/inspections", "Repository", "▤"],
                ["/rules", "Rule reference", "§"],
                ["/settings", "Workspace settings", "⚙"],
              ].map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    path === href ||
                    (href === "/inspections" &&
                      path.startsWith("/inspections/"))
                      ? "page"
                      : undefined
                  }
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Link>
              ))}
            </nav>
            <div className={s.sidebarFoot}>
              <span className={s.avatar}>
                {data.profile?.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{data.profile?.name}</strong>
                <small>
                  {data.profile?.code} · {data.profile?.district}
                </small>
              </div>
            </div>
          </aside>
        )}
        <div className={login ? s.loginFrame : s.frame}>
          {!login && (
            <header className={s.topbar}>
              <span>
                Field workspace /{" "}
                <strong>
                  {path.startsWith("/inspections/")
                    ? "Inspection record"
                    : path === "/inspect"
                      ? "Capture"
                      : path.slice(1)}
                </strong>
              </span>
              <Link href="/">View public site ↗</Link>
            </header>
          )}
          <div className={s.demoBanner}>
            <span className={s.dot} />
            Legal Metrology Inspection System · Active Officer Verification Session
          </div>
          <main id="workspace-main" className={login ? s.loginMain : s.main}>
            {children}
          </main>
        </div>
      </div>
    </Context.Provider>
  );
}
