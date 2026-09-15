"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  canReport,
  createInspection,
  decideFinding,
  statusOf,
  summarize,
  validateCapture,
  type Inspection,
  type Decision,
} from "@/lib/officer-model";
import { BrandLink, BrandMark } from "@/components/brand/Brand";
import { InstallButton } from "@/components/pwa/InstallButton";
import { PRODUCT_NAME } from "@/lib/site";
import { useWorkspace } from "./Workspace";
import s from "./Workspace.module.css";
function date(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function PageHeading({
  label,
  title,
  text,
  action,
}: {
  label: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className={s.pageHeading}>
      <div>
        <p className={s.eyebrow}>{label}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </div>
  );
}
function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p role="alert" className={s.error}>
      {message}
    </p>
  ) : null;
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className={s.empty}>
      <span aria-hidden="true">⌗</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className={s.primary} href="/inspect">
        Start an inspection ↗
      </Link>
    </div>
  );
}
function Records({ records }: { records: Inspection[] }) {
  return (
    <div className={s.recordList}>
      {records.map((r) => (
        <Link className={s.recordRow} href={`/inspections/${r.id}`} key={r.id}>
          <div className={s.packThumb}>
            {r.front ? <img src={r.front} alt="" /> : <span>▤</span>}
          </div>
          <div>
            <strong>{r.product}</strong>
            <small>
              {r.gtin || "Barcode not recorded"} ·{" "}
              {r.source === "fixture" ? "Illustrative sample" : "Local capture"}
            </small>
          </div>
          <span className={s.recordDate}>{date(r.createdAt)}</span>
          <span
            className={s.badge}
            data-tone={canReport(r) ? "green" : "amber"}
          >
            {statusOf(r)}
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
export function LoginScreen() {
  const { data, save } = useWorkspace();
  const router = useRouter();
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const name = String(form.get("name")).trim();
      const code = String(form.get("code")).trim();
      const district = String(form.get("district")).trim();
      if (!name || !code || !district)
        throw new Error("Complete all three profile fields.");
      save({ ...data, profile: { name, code, district } });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <div className={s.loginGrid}>
      <div className={s.loginStory}>
        <BrandLink className={s.brand} />
        <p className={s.eyebrow}>THE OFFICER STAYS IN CONTROL</p>
        <h1>
          A closer look.
          <br />
          <em>A clearer record.</em>
        </h1>
        <p>
          From the first pack image to an inspection note, keep the evidence and
          your decision together.
        </p>
        <div className={s.loginSteps}>
          <span>01 Capture</span>
          <span>02 Review</span>
          <span>03 Record</span>
        </div>
        <small>Demonstration only. No real credentials are needed.</small>
      </div>
      <div className={s.loginForm}>
        <span className={s.badge}>DEMO ACCESS</span>
        <h2>Open your workspace</h2>
        <p>
          Use a demonstration identity. This is not government authentication.
        </p>
        <form onSubmit={submit}>
          <label>
            Display name
            <input
              name="name"
              required
              maxLength={60}
              defaultValue={data.profile?.name ?? "Demo Officer"}
              autoComplete="off"
            />
          </label>
          <div className={s.formRow}>
            <label>
              Officer code
              <input
                name="code"
                required
                maxLength={24}
                defaultValue={data.profile?.code ?? "DEMO-01"}
              />
            </label>
            <label>
              District / unit
              <input
                name="district"
                required
                maxLength={60}
                defaultValue={data.profile?.district ?? "Demo district"}
              />
            </label>
          </div>
          <ErrorMessage message={error} />
          <button className={s.primary} type="submit">
            Enter demo workspace <span>→</span>
          </button>
        </form>
        <p className={s.fine}>
          Records stay in this browser tab across refreshes. Closing the tab
          ends the demo session. Use sample data, not sensitive inspection
          evidence.
        </p>
        <Link href="/">← Back to the project</Link>
      </div>
    </div>
  );
}
export function DashboardScreen() {
  const { data } = useWorkspace();
  const counts = summarize(data.inspections);
  return (
    <>
      <PageHeading
        label="OVERVIEW"
        title="Ready for the next inspection?"
        text={`Welcome, ${data.profile?.name}. Your field records, decisions and next steps in one place.`}
        action={
          <Link className={s.primary} href="/inspect">
            ＋ New inspection
          </Link>
        }
      />
      <div className={s.stats}>
        {[
          [counts.total, "Inspection records", "Created in this tab"],
          [counts.pending, "Awaiting your review", "No automated decisions"],
          [counts.reportable, "Notes ready", "At least one accepted finding"],
        ].map(([value, label, caption]) => (
          <div key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{caption}</small>
          </div>
        ))}
      </div>
      <div className={s.dashboardGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h2>Recent inspections</h2>
            <Link href="/inspections">View repository →</Link>
          </div>
          {data.inspections.length ? (
            <Records records={data.inspections.slice(0, 5)} />
          ) : (
            <Empty
              title="Your first record starts here"
              text="Capture a pack or use the guided sample to walk through a finding and record your decision."
            />
          )}
        </section>
        <aside className={s.brief}>
          <p className={s.eyebrow}>FIELD BRIEF</p>
          <h2>
            Evidence first.
            <br />
            Judgment always yours.
          </h2>
          <ol>
            <li>Capture the front and back clearly.</li>
            <li>Use a known scale before measuring.</li>
            <li>Review the clause and supporting image.</li>
          </ol>
          <Link href="/rules">Read the demo rule reference ↗</Link>
          <div className={s.briefFoot}>
            LIVE SERVICES<strong>Not connected</strong>
            <span>
              OCR, secure authentication and server reports need the backend
              implementation.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
export function CaptureScreen() {
  const { data, save } = useWorkspace();
  const router = useRouter();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(0);
  async function image(file: File | undefined, setter: (src: string) => void) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      setError(
        "Choose a JPEG, PNG or WebP image up to 1 MB for this local demo.",
      );
      return;
    }
    setReading((n) => n + 1);
    setError("");
    try {
      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(
            new Error("The image could not be read. Please choose it again."),
          );
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const preview = new Image();
        preview.onload = () => resolve();
        preview.onerror = () =>
          reject(
            new Error(
              "This file is not a readable image. Choose another JPEG, PNG or WebP.",
            ),
          );
        preview.src = src;
      });
      setter(src);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReading((n) => n - 1);
    }
  }
  function sample() {
    try {
      const record = createInspection(
        "fixture",
        "Classic namkeen · 200 g",
        data.profile!.name,
        data.profile!.district,
      );
      save({ ...data, inspections: [record, ...data.inspections] });
      router.push(`/inspections/${record.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const product = String(form.get("product")).trim();
    const gtin = String(form.get("gtin")).trim();
    const message = validateCapture(product, gtin, front, back);
    if (message) {
      setError(message);
      return;
    }
    try {
      const record = {
        ...createInspection(
          "upload",
          product,
          data.profile!.name,
          data.profile!.district,
        ),
        gtin,
        front,
        back,
        channel: String(form.get("channel")),
      };
      save({ ...data, inspections: [record, ...data.inspections] });
      router.push(`/inspections/${record.id}`);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        label="NEW INSPECTION / CAPTURE"
        title="Start with a clear picture."
        text="Keep the product identity and both label faces together. No image leaves this browser tab."
      />
      <div className={s.sampleBanner}>
        <div>
          <span className={s.badge}>GUIDED SAMPLE</span>
          <h2>Just exploring? Start with the namkeen pack.</h2>
          <p>
            Illustrated packaging + predefined sample metrology. No OCR or rule
            engine is run.
          </p>
        </div>
        <button className={s.primary} onClick={sample}>
          Open sample inspection ↗
        </button>
      </div>
      <form onSubmit={submit}>
        <div className={s.captureGrid}>
          <section className={s.panel}>
            <div className={s.panelHeading}>
              <h2>
                <span className={s.stepNumber}>01</span> Product identity
              </h2>
            </div>
            <div className={s.panelBody}>
              <label>
                Product / brand name
                <input
                  name="product"
                  placeholder="e.g. Classic namkeen · 200 g"
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Barcode / GTIN <small>Optional · enter manually</small>
                <input
                  name="gtin"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="8, 12, 13 or 14 digits"
                />
              </label>
              <label>
                Inspection channel
                <select name="channel">
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Warehouse</option>
                </select>
              </label>
              <div className={s.notice}>
                Live barcode recognition is not connected. An entered barcode
                identifies the pack; it does not establish physical scale.
              </div>
            </div>
          </section>
          <section className={s.panel}>
            <div className={s.panelHeading}>
              <h2>
                <span className={s.stepNumber}>02</span> Label evidence
              </h2>
              <span className={s.fine}>JPEG / PNG / WebP · ≤ 1 MB each</span>
            </div>
            <div className={s.uploadGrid}>
              {[
                { name: "Front / PDP", value: front, set: setFront },
                { name: "Back label", value: back, set: setBack },
              ].map((face) => (
                <label className={s.upload} key={face.name}>
                  {face.value ? (
                    <img src={face.value} alt={`${face.name} preview`} />
                  ) : (
                    <div>
                      <span aria-hidden="true">＋</span>
                      <strong>{face.name}</strong>
                      <small>Keep all label edges in view</small>
                    </div>
                  )}
                  <span>
                    {face.value ? `Replace ${face.name}` : `Add ${face.name}`}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    disabled={reading > 0}
                    aria-label={`Upload ${face.name}`}
                    onChange={(e) => void image(e.target.files?.[0], face.set)}
                  />
                </label>
              ))}
            </div>
            <p className={s.captureHint}>
              Use even lighting. Avoid glare. Keep the camera parallel to the
              label.
            </p>
          </section>
        </div>
        <ErrorMessage message={error} />
        <div className={s.actionBar}>
          <p>
            Uploaded packs are saved as drafts. Analysis requires the live
            vision service.
          </p>
          <button type="submit" className={s.primary} disabled={reading > 0}>
            {reading > 0 ? "Reading image…" : "Save capture draft →"}
          </button>
        </div>
      </form>
    </>
  );
}
export function RepositoryScreen() {
  const { data } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const records = data.inspections.filter(
    (r) =>
      `${r.product} ${r.gtin} ${r.district} ${r.id}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "ready"
          ? canReport(r)
          : filter === "draft"
            ? r.source === "upload"
            : r.findings.some((f) => f.decision === "pending"))),
  );
  return (
    <>
      <PageHeading
        label="REPOSITORY"
        title="Every pack. Every decision."
        text="Search the records created in this browser tab. Open a record to see its evidence and review history."
        action={
          <Link className={s.primary} href="/inspect">
            ＋ New inspection
          </Link>
        }
      />
      <section className={s.panel}>
        <div className={s.filters}>
          <label>
            Find an inspection
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Product, barcode, district or ID"
            />
          </label>
          <label>
            Status
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All records</option>
              <option value="pending">Needs review</option>
              <option value="ready">Note ready</option>
              <option value="draft">Capture drafts</option>
            </select>
          </label>
        </div>
        <p className={s.resultCount} role="status">
          {records.length} {records.length === 1 ? "record" : "records"}
        </p>
        {records.length ? (
          <Records records={records} />
        ) : (
          <div className={s.empty}>
            <h2>
              {data.inspections.length
                ? "No matching records"
                : "No inspections yet"}
            </h2>
            <p>
              {data.inspections.length
                ? "Try a different search or status."
                : "Create your first sample inspection or capture draft."}
            </p>
            <Link href="/inspect">Start an inspection →</Link>
          </div>
        )}
      </section>
    </>
  );
}
export function ReviewScreen({ id }: { id: string }) {
  const { data, save } = useWorkspace();
  const record = data.inspections.find((r) => r.id === id);
  const [note, setNote] = useState(record?.findings[0]?.note ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [face, setFace] = useState<"front" | "back">("front");
  if (!record)
    return (
      <Empty
        title="This record isn’t in this tab"
        text="Demo records belong to the tab where they were created. Return to the repository or start a new inspection."
      />
    );
  const sample = record.source === "fixture";
  const finding = record.findings[0];
  const unsavedNote = sample && note.trim() !== finding.note;
  function decide(decision: Decision) {
    try {
      const updated = decideFinding(
        record!,
        decision,
        note,
        `${data.profile!.name} (${data.profile!.code})`,
      );
      save({
        ...data,
        inspections: data.inspections.map((r) => (r.id === id ? updated : r)),
      });
      setError("");
      setMessage(
        decision === "pending"
          ? "Finding returned to pending review."
          : `Sample finding ${decision}. Your decision is recorded in this tab.`,
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <Link className={s.backLink} href="/inspections">
        ← Repository
      </Link>
      <PageHeading
        label={
          sample
            ? "ILLUSTRATIVE SAMPLE / OFFICER REVIEW"
            : "LOCAL CAPTURE / AWAITING SERVICES"
        }
        title={record.product}
        text={`${record.district} · ${record.officer} · ${date(record.createdAt)}`}
        action={
          <span
            className={s.badge}
            data-tone={canReport(record) ? "green" : "amber"}
          >
            {statusOf(record)}
          </span>
        }
      />
      <div className={s.reviewGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h2>Source evidence</h2>
            <span className={s.badge}>
              {sample ? "ILLUSTRATION" : "LOCAL IMAGE"}
            </span>
          </div>
          <div className={s.evidenceImage}>
            {record[face] ? (
              <img src={record[face]} alt={`${record.product} ${face} label`} />
            ) : (
              <p>No back image is supplied with the illustrative sample.</p>
            )}
            {sample && face === "front" && (
              <div className={s.measureCallout}>
                <span>FIXTURE SCALE · NOT MEASURED FROM IMAGE</span>
                <strong>1.8 ± 0.2 mm</strong>
                <small>Sample MRP numeral height</small>
              </div>
            )}
          </div>
          <div className={s.faceTabs} role="group" aria-label="Evidence face">
            <button
              aria-pressed={face === "front"}
              onClick={() => setFace("front")}
            >
              Front / PDP
            </button>
            <button
              aria-pressed={face === "back"}
              onClick={() => setFace("back")}
            >
              Back label
            </button>
          </div>
          <dl className={s.keyValues}>
            <div>
              <dt>Barcode</dt>
              <dd>{record.gtin || "Not recorded"}</dd>
            </div>
            <div>
              <dt>Channel</dt>
              <dd>{record.channel}</dd>
            </div>
            <div>
              <dt>Inspection ID</dt>
              <dd>{record.id}</dd>
            </div>
          </dl>
          {sample && (
            <>
              <div className={s.panelHeading}>
                <h2>Sample label fields</h2>
                <span className={s.badge}>PREDEFINED</span>
              </div>
              <dl className={s.keyValues}>
                <div>
                  <dt>Commodity</dt>
                  <dd>Classic namkeen</dd>
                </div>
                <div>
                  <dt>MRP declaration</dt>
                  <dd>₹60.00 · inclusive of all taxes</dd>
                </div>
                <div>
                  <dt>Net quantity</dt>
                  <dd>200 g</dd>
                </div>
                <div>
                  <dt>Label language</dt>
                  <dd>English + Hindi</dd>
                </div>
              </dl>
            </>
          )}
        </section>
        <div>
          {sample ? (
            <section className={s.panel}>
              <div className={s.panelHeading}>
                <h2>Proposed finding</h2>
                <span className={s.badge} data-tone="amber">
                  OFFICER REVIEW
                </span>
              </div>
              <div className={s.panelBody}>
                <p className={s.eyebrow}>RULE 7 · TABLE I · SAMPLE ROW 3</p>
                <h2>MRP numerals below the sample minimum</h2>
                <p className={s.muted}>
                  The demonstration compares a predefined numeral height against
                  a predefined threshold. These values were not extracted from
                  the illustration.
                </p>
                <div className={s.measurements}>
                  <div>
                    <span>Sample height</span>
                    <strong>
                      1.8 <small>± 0.2 mm</small>
                    </strong>
                  </div>
                  <div>
                    <span>Sample minimum</span>
                    <strong>
                      2.5 <small>mm</small>
                    </strong>
                  </div>
                </div>
                <div className={s.notice}>
                  Sample PDP area: 120 cm² · printed declaration. Rule
                  reference: lmpc.v2026_07 (design target). No gazette
                  verification or live engine execution in this preview.
                </div>
                <label>
                  Officer note <small>Required when rejecting</small>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={1200}
                    placeholder="Record what supports or changes your decision…"
                  />
                </label>
                <ErrorMessage message={error} />
                <p className={s.success} role="status">
                  {message}
                </p>
                <div className={s.buttons}>
                  <button
                    className={s.primary}
                    onClick={() => decide("accepted")}
                  >
                    Accept sample finding
                  </button>
                  <button
                    className={s.secondary}
                    onClick={() => decide("rejected")}
                  >
                    Reject with reason
                  </button>
                  {finding.decision !== "pending" && (
                    <button
                      className={s.textButton}
                      onClick={() => decide("pending")}
                    >
                      Reopen review
                    </button>
                  )}
                </div>
                <p className={s.fine}>
                  This records a demo decision only. It does not submit a case
                  or issue a penalty.
                </p>
              </div>
            </section>
          ) : (
            <section className={s.panel}>
              <div className={s.panelBody}>
                <span className={s.badge}>CAPTURE SAVED</span>
                <h2>Your images are ready for the next step.</h2>
                <p>
                  Live extraction and physical metrology are not connected. No
                  findings or millimetre values have been assigned to your
                  uploaded pack.
                </p>
                <Link className={s.secondary} href="/inspect">
                  Try the separate guided sample →
                </Link>
              </div>
            </section>
          )}
          <div className={s.reportLink}>
            <div>
              <strong>Inspection note</strong>
              <p>
                {unsavedNote
                  ? "Your note has unsaved changes. Record the decision again to save them before opening the inspection note."
                  : canReport(record)
                    ? "Your accepted sample finding can now be included in a printable note."
                    : "At least one accepted finding is required before a note is available."}
              </p>
            </div>
            {canReport(record) && !unsavedNote && (
              <Link className={s.primary} href={`/inspections/${id}/report`}>
                Preview note ↗
              </Link>
            )}
          </div>
        </div>
      </div>
      <section className={s.panel}>
        <div className={s.panelHeading}>
          <h2>Review history</h2>
          <span className={s.fine}>Local demo log · not tamper-proof</span>
        </div>
        <ol className={s.audit}>
          {record.audit.map((event, index) => (
            <li key={index}>
              <span className={s.auditDot} />
              <div>
                <strong>{event.action}</strong>
                <span>
                  {event.actor} · {date(event.at)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
export function ReportScreen({ id }: { id: string }) {
  const { data } = useWorkspace();
  const record = data.inspections.find((r) => r.id === id);
  if (!record || !canReport(record))
    return (
      <>
        <PageHeading
          label="INSPECTION NOTE"
          title="Review required first."
          text="A note is available only for a sample record with at least one accepted finding."
        />
        <Link
          className={s.primary}
          href={record ? `/inspections/${id}` : "/inspections"}
        >
          Return to review →
        </Link>
      </>
    );
  return (
    <>
      <div className={s.printTools}>
        <Link href={`/inspections/${id}`}>← Back to review</Link>
        <button className={s.primary} onClick={() => window.print()}>
          Print / Save as PDF ↗
        </button>
      </div>
      <article className={s.paper}>
        <header className={s.paperHeader}>
          <span className={s.brand}>
            <BrandMark />
            {PRODUCT_NAME}
          </span>
          <span>
            DEMONSTRATION COPY
            <br />
            NOT AN OFFICIAL NOTICE
          </span>
        </header>
        <p className={s.eyebrow}>OFFICER-REVIEWED SAMPLE</p>
        <h1>Inspection note</h1>
        <p className={s.muted}>{record.id}</p>
        <div className={s.reportIdentity}>
          <div>
            <small>PRODUCT</small>
            <h2>{record.product}</h2>
            <p>{record.gtin || "Barcode not recorded"}</p>
          </div>
          <div>
            <small>REVIEWED BY</small>
            <h2>{record.audit.at(-1)?.actor}</h2>
            <p>
              {record.district} · {date(record.findings[0].reviewedAt!)}
            </p>
          </div>
        </div>
        <div className={s.reportFinding}>
          <img
            src="/media/inspect-pack.svg"
            alt="Illustrative sample packaging"
          />
          <div>
            <span className={s.badge} data-tone="green">
              ACCEPTED SAMPLE FINDING
            </span>
            <h2>MRP numeral height</h2>
            <p>Reference: Rule 7 · Table I · sample row 3</p>
            <p>
              Predefined height: <strong>1.8 ± 0.2 mm</strong>
              <br />
              Predefined minimum: <strong>2.5 mm</strong>
              <br />
              Sample PDP area: 120 cm²
            </p>
            <p>
              Officer note: {record.findings[0].note || "No additional note."}
            </p>
          </div>
        </div>
        <h2>Evidence & provenance</h2>
        <p>
          This record uses illustrated packaging and predefined demonstration
          values, not OCR or image-derived measurements. Reference version:
          lmpc.v2026_07 (design target). Vision / engine execution: none. This
          document is not a legal determination, penalty or digitally signed
          record.
        </p>
        <h2>Decision history</h2>
        <ol className={s.reportAudit}>
          {record.audit.map((a, i) => (
            <li key={i}>
              {a.action} — {a.actor}, {date(a.at)}
            </li>
          ))}
        </ol>
        <footer className={s.signature}>
          <div>
            <strong>{record.audit.at(-1)?.actor}</strong>
            <span>Recorded demo reviewer · not authenticated</span>
          </div>
          <div>
            Signature __________________
            <span>Manual signature space · demonstration only</span>
          </div>
        </footer>
      </article>
      <p className={s.printHelp}>
        Your browser’s print dialog can save this note as a PDF.
        Server-generated PDF reports are not connected.
      </p>
    </>
  );
}
export function RulesScreen() {
  return (
    <>
      <PageHeading
        label="RULE REFERENCE"
        title="A finding needs a reference."
        text="The demonstration’s rule context and implementation boundaries, in one place."
      />
      <div className={s.notice}>
        Prototype reference only, not a verified legal checklist. Consult the
        current official rules and gazette before using any threshold in a real
        inspection.
      </div>
      <div className={s.rulesGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h2>What the sample demonstrates</h2>
            <span className={s.badge}>DESIGN TARGET</span>
          </div>
          <div className={s.panelBody}>
            <p className={s.eyebrow}>lmpc.v2026_07</p>
            <h2>Rule 7 · Table I</h2>
            <p>
              Numeral height relative to the principal display panel. The sample
              uses the project’s predefined printed-pack scenario.
            </p>
            <dl className={s.keyValues}>
              <div>
                <dt>Sample PDP</dt>
                <dd>120 cm²</dd>
              </div>
              <div>
                <dt>Sample minimum</dt>
                <dd>2.5 mm</dd>
              </div>
              <div>
                <dt>Sample height</dt>
                <dd>1.8 ± 0.2 mm</dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>Illustrative values; no engine run</dd>
              </div>
            </dl>
          </div>
        </section>
        <section className={s.brief}>
          <p className={s.eyebrow}>REVIEW PRINCIPLES</p>
          <h2>What a real finding must carry</h2>
          <ol>
            <li>Source image and evidence region.</li>
            <li>Verified rule, clause and version.</li>
            <li>Known physical scale and uncertainty.</li>
            <li>An explicit officer decision.</li>
          </ol>
          <p>
            Missing scale means no physical measurement—not a guessed millimetre
            value.
          </p>
        </section>
      </div>
      <section className={s.panel}>
        <div className={s.panelHeading}>
          <h2>Scope of this workspace</h2>
        </div>
        <div className={s.scopeRows}>
          <div>
            <strong>Capture, sample review, printable note, repository</strong>
            <span className={s.badge} data-tone="green">
              LOCAL DEMO
            </span>
          </div>
          <div>
            <strong>Secure sign-in, OCR, rule engine, server PDF</strong>
            <span className={s.badge}>BACKEND REQUIRED</span>
          </div>
          <div>
            <strong>Listing checks, packer sandbox, district maps</strong>
            <span className={s.badge}>LATER PHASE</span>
          </div>
        </div>
      </section>
    </>
  );
}
export function SettingsScreen() {
  const { data, save } = useWorkspace();
  const router = useRouter();
  const [error, setError] = useState("");
  function signout() {
    try {
      save({ ...data, profile: null });
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        label="WORKSPACE SETTINGS"
        title="Know where your data lives."
        text="A transparent view of this demonstration environment."
      />
      <div className={s.rulesGrid}>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h2>Demo identity</h2>
            <span className={s.badge}>NOT AUTHENTICATED</span>
          </div>
          <dl className={s.keyValues}>
            <div>
              <dt>Name</dt>
              <dd>{data.profile?.name}</dd>
            </div>
            <div>
              <dt>Officer code</dt>
              <dd>{data.profile?.code}</dd>
            </div>
            <div>
              <dt>District / unit</dt>
              <dd>{data.profile?.district}</dd>
            </div>
          </dl>
          <div className={s.panelBody}>
            <ErrorMessage message={error} />
            <button className={s.secondary} onClick={signout}>
              Leave demo workspace
            </button>
            <p className={s.fine}>
              Records remain in this tab for the next demo profile. This is not
              an account boundary; use no sensitive evidence.
            </p>
          </div>
        </section>
        <section className={s.panel}>
          <div className={s.panelHeading}>
            <h2>On your phone</h2>
          </div>
          <div className={s.panelBody}>
            <p>
              Add the app to your home screen for a focused field interface.
            </p>
            <InstallButton />
            <p className={s.fine}>
              Online-first. There is no background upload or offline sync queue.
              Installed-app sessions are separate from browser-tab sessions.
            </p>
          </div>
        </section>
      </div>
      <section className={s.panel}>
        <div className={s.panelHeading}>
          <h2>Storage & service status</h2>
        </div>
        <dl className={s.keyValues}>
          <div>
            <dt>Records and uploaded images</dt>
            <dd>Session storage · this tab only</dd>
          </div>
          <div>
            <dt>Cloud upload</dt>
            <dd>None</dd>
          </div>
          <div>
            <dt>Live vision and authentication</dt>
            <dd>Not connected</dd>
          </div>
          <div>
            <dt>Reports</dt>
            <dd>Browser print / Save as PDF · demo watermark</dd>
          </div>
          <div>
            <dt>Listings / offline queue / industry sandbox</dt>
            <dd>Disabled</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
