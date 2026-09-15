// Browser-only demonstration state. This is not an API contract or an LMPC engine.
export type Decision = "pending" | "accepted" | "rejected";
export type Profile = { name: string; code: string; district: string };
export type Inspection = {
  id: string;
  product: string;
  gtin: string;
  channel: string;
  source: "fixture" | "upload";
  createdAt: string;
  officer: string;
  district: string;
  front: string;
  back: string;
  findings: { decision: Decision; note: string; reviewedAt: string | null }[];
  audit: { at: string; actor: string; action: string }[];
};
export type Workspace = {
  version: 1;
  profile: Profile | null;
  inspections: Inspection[];
};
export const STORE_KEY = "lmpc-demo-workspace-v1";
export function newStore(): Workspace {
  return { version: 1, profile: null, inspections: [] };
}
export function createInspection(
  source: Inspection["source"],
  product: string,
  officer: string,
  district: string,
): Inspection {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    product,
    gtin: "",
    channel: "Retail",
    source,
    createdAt: now,
    officer,
    district,
    front: source === "fixture" ? "/media/inspect-pack.svg" : "",
    back: "",
    findings:
      source === "fixture"
        ? [{ decision: "pending", note: "", reviewedAt: null }]
        : [],
    audit: [
      {
        at: now,
        actor: officer,
        action:
          source === "fixture"
            ? "Illustrative sample opened"
            : "Local capture draft created",
      },
    ],
  };
}
export function decideFinding(
  record: Inspection,
  decision: Decision,
  note: string,
  actor: string,
  at = new Date().toISOString(),
): Inspection {
  if (!record.findings.length || record.source !== "fixture")
    throw new Error("No sample finding is available for review.");
  if (decision === "rejected" && !note.trim())
    throw new Error("Add a reason before rejecting the finding.");
  return {
    ...record,
    findings: [
      {
        decision,
        note: note.trim(),
        reviewedAt: decision === "pending" ? null : at,
      },
    ],
    audit: [
      ...record.audit,
      {
        at,
        actor,
        action: `Sample finding ${decision}${note.trim() ? ` — ${note.trim()}` : ""}`,
      },
    ],
  };
}
export function canReport(record: Inspection) {
  return (
    record.source === "fixture" &&
    record.findings.some((f) => f.decision === "accepted")
  );
}
export function summarize(records: Inspection[]) {
  return {
    total: records.length,
    pending: records.filter((r) =>
      r.findings.some((f) => f.decision === "pending"),
    ).length,
    reportable: records.filter(canReport).length,
  };
}
export function validateCapture(
  product: string,
  gtin: string,
  front: string,
  back: string,
) {
  if (!product.trim()) return "Enter the product name.";
  if (gtin && !/^(\d{8}|\d{12,14})$/.test(gtin))
    return "Enter an 8, 12, 13 or 14 digit barcode, or leave it blank.";
  if (!front) return "Add the front / principal display panel image.";
  if (!back) return "Add the back label image.";
  return "";
}
export function parseStore(raw: string | null): Workspace {
  if (!raw) return newStore();
  const value = JSON.parse(raw);
  if (
    value?.version !== 1 ||
    !Array.isArray(value.inspections) ||
    !("profile" in value)
  )
    throw new Error("Unsupported workspace data.");
  if (
    value.profile !== null &&
    (!value.profile ||
      !["name", "code", "district"].every(
        (k) => typeof value.profile[k] === "string",
      ))
  )
    throw new Error("Invalid workspace profile.");
  for (const r of value.inspections) {
    if (
      !r ||
      ![
        "id",
        "product",
        "gtin",
        "channel",
        "createdAt",
        "officer",
        "district",
        "front",
        "back",
      ].every((k) => typeof r[k] === "string") ||
      !["fixture", "upload"].includes(r.source) ||
      !Array.isArray(r.findings) ||
      !Array.isArray(r.audit) ||
      !r.findings.every(
        (f: { decision?: string; note?: string; reviewedAt?: unknown }) =>
          f &&
          ["pending", "accepted", "rejected"].includes(f.decision ?? "") &&
          typeof f.note === "string" &&
          (f.reviewedAt === null || typeof f.reviewedAt === "string"),
      ) ||
      !r.audit.every(
        (a: { at?: string; actor?: string; action?: string }) =>
          a &&
          typeof a.at === "string" &&
          typeof a.actor === "string" &&
          typeof a.action === "string",
      )
    )
      throw new Error("Invalid inspection data.");
    if (
      ![r.front, r.back].every(
        (src) =>
          src === "" ||
          src === "/media/inspect-pack.svg" ||
          /^data:image\/(png|jpeg|webp);base64,/.test(src),
      )
    )
      throw new Error("Invalid inspection image.");
  }
  return value as Workspace;
}
export function statusOf(record: Inspection) {
  if (record.source === "upload") return "Capture draft";
  if (canReport(record)) return "Note ready";
  return record.findings[0]?.decision === "rejected"
    ? "Reviewed · rejected"
    : "Needs review";
}
