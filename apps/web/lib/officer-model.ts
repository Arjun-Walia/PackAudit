// Legal Metrology Officer Workspace state model.
export type Decision = "pending" | "accepted" | "rejected";
export type Profile = { name: string; code: string; district: string };

export type InspectionFinding = {
  decision: Decision;
  note: string;
  reviewedAt: string | null;
  ruleClause?: string;
  title?: string;
  description?: string;
  measured?: string;
  required?: string;
  pdpArea?: string;
  rulePack?: string;
};

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
  findings: InspectionFinding[];
  audit: { at: string; actor: string; action: string }[];
};

export type Workspace = {
  version: 1;
  profile: Profile | null;
  inspections: Inspection[];
};

export const STORE_KEY = "lmpc-demo-workspace-v1";

export const SEED_PROFILE: Profile = {
  name: "Rajesh V. Kulkarni",
  code: "MH-LM-2024-0412",
  district: "Pune Central (Camp Zone)",
};

export const SEED_INSPECTIONS: Inspection[] = [
  {
    id: "0191e4a2-7b3e-7821-b12a-3c4d5e6f7001",
    product: "Haldiram's Nagpur Bhujia Sev · 200 g",
    gtin: "8904004401245",
    channel: "Retail Supermarket",
    source: "fixture",
    createdAt: "2026-09-14T09:30:00.000Z",
    officer: "Rajesh V. Kulkarni",
    district: "Pune Central (Camp Zone)",
    front: "/media/inspect-pack.svg",
    back: "/media/pack.jpg",
    findings: [
      {
        decision: "accepted",
        note: "Verified physical discrepancy. Area of principal display panel measured at 120 cm². Table I Sl. 3 mandates minimum numeral height of 2.5 mm; measured height 1.8 mm is non-compliant.",
        reviewedAt: "2026-09-14T10:15:22.000Z",
        ruleClause: "Rule 7(2) read with Table I (Row 3)",
        title: "MRP Numeral Height Below Statutory Minimum",
        description:
          "Retail sale price numerals printed on PDP measure below the mandatory 2.5 mm height threshold for package surface area 120 cm².",
        measured: "1.8 ± 0.2 mm",
        required: "2.5 mm",
        pdpArea: "120 cm²",
        rulePack: "lmpc.v2026_07",
      },
    ],
    audit: [
      {
        at: "2026-09-14T09:30:00.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action: "Field inspection initiated at Camp Supermarket",
      },
      {
        at: "2026-09-14T09:34:10.000Z",
        actor: "Optical Metrology Pipeline",
        action: "Calibrated optical scale computed (module width 0.330 mm, PDP 120 cm²)",
      },
      {
        at: "2026-09-14T10:15:22.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action:
          "Finding accepted — Verified physical discrepancy. Area of principal display panel measured at 120 cm².",
      },
    ],
  },
  {
    id: "0191e4a2-7b3e-7821-b12a-3c4d5e6f7002",
    product: "Tata Salt Vacuum Evaporated Iodized Salt · 1 kg",
    gtin: "8901030383854",
    channel: "Wholesale Distribution",
    source: "fixture",
    createdAt: "2026-09-15T11:15:00.000Z",
    officer: "Rajesh V. Kulkarni",
    district: "Pune Central (Camp Zone)",
    front: "/media/pack.jpg",
    back: "/media/field.jpg",
    findings: [
      {
        decision: "accepted",
        note: "Statutory violation verified under Rule 6(1)(h). Back label omitted mandatory customer care email address. Consumer care postal address and telephone were printed, but electronic grievance contact is absent.",
        reviewedAt: "2026-09-15T11:42:18.000Z",
        ruleClause: "Rule 6(1)(h)",
        title: "Consumer Care Electronic Contact Details Missing",
        description:
          "Name, address, telephone number, or email address of the person or office to contact in case of consumer complaints missing required email identifier.",
        measured: "Email: Not Detected",
        required: "Mandatory Name, Phone & Email",
        pdpArea: "210 cm²",
        rulePack: "lmpc.v2026_07",
      },
    ],
    audit: [
      {
        at: "2026-09-15T11:15:00.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action: "Packaging documentation registered at wholesale hub",
      },
      {
        at: "2026-09-15T11:20:00.000Z",
        actor: "Optical Metrology Pipeline",
        action: "Extraction complete: consumer care fields evaluated",
      },
      {
        at: "2026-09-15T11:42:18.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action:
          "Finding accepted — Statutory violation verified under Rule 6(1)(h). Back label omitted mandatory customer care email address.",
      },
    ],
  },
  {
    id: "0191e4a2-7b3e-7821-b12a-3c4d5e6f7003",
    product: "Fortune Sunlite Refined Sunflower Oil Pouch · 1 L",
    gtin: "8906007281015",
    channel: "Retail Kirana",
    source: "fixture",
    createdAt: "2026-09-15T14:40:00.000Z",
    officer: "Rajesh V. Kulkarni",
    district: "Pune Central (Camp Zone)",
    front: "/media/measure.jpg",
    back: "/media/paper.jpg",
    findings: [
      {
        decision: "pending",
        note: "",
        reviewedAt: null,
        ruleClause: "Rule 6(1)(e) read with Rule 7",
        title: "Unit Sale Price (USP) Declaration Format Verification",
        description:
          "Pouch package Net Volume 1 L requires Unit Sale Price rounded to nearest rupee and paise per millilitre or per litre.",
        measured: "USP: ₹145.00 / 1 L",
        required: "MRP and Unit Sale Price ₹.../L",
        pdpArea: "185 cm²",
        rulePack: "lmpc.v2026_07",
      },
    ],
    audit: [
      {
        at: "2026-09-15T14:40:00.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action: "Inspection intake logged from Swargate distribution depot",
      },
      {
        at: "2026-09-15T14:45:12.000Z",
        actor: "Optical Metrology Pipeline",
        action: "Manner of declaration metrics analyzed — pending officer review",
      },
    ],
  },
  {
    id: "0191e4a2-7b3e-7821-b12a-3c4d5e6f7004",
    product: "Britannia Good Day Butter Cookies · 600 g",
    gtin: "8901063012011",
    channel: "Retail Supermarket",
    source: "fixture",
    createdAt: "2026-09-16T09:10:00.000Z",
    officer: "Rajesh V. Kulkarni",
    district: "Pune Central (Camp Zone)",
    front: "/media/mark.jpg",
    back: "/media/ink.jpg",
    findings: [
      {
        decision: "rejected",
        note: "Physical examination confirms contrast ratio 3.2:1 against matte gold backing is compliant with Rule 9(1) under diffused lighting. Specular reflection during preliminary scan produced an initial false flag.",
        reviewedAt: "2026-09-16T09:40:15.000Z",
        ruleClause: "Rule 9(1)",
        title: "Declaration Background Contrast Ratio",
        description:
          "All declarations on packaging must be clear, conspicuous and legible, in contrasting color against package background.",
        measured: "Contrast ratio 3.2:1 (field verified)",
        required: "Conspicuous & legible contrast",
        pdpArea: "145 cm²",
        rulePack: "lmpc.v2026_07",
      },
    ],
    audit: [
      {
        at: "2026-09-16T09:10:00.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action: "Scheduled retail surveillance intake",
      },
      {
        at: "2026-09-16T09:15:00.000Z",
        actor: "Optical Metrology Pipeline",
        action: "Contrast evaluation flagged borderline 2.1:1 on metallic packaging",
      },
      {
        at: "2026-09-16T09:40:15.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action:
          "Finding rejected — Physical examination confirms contrast ratio 3.2:1 against matte gold backing is compliant with Rule 9(1).",
      },
    ],
  },
  {
    id: "0191e4a2-7b3e-7821-b12a-3c4d5e6f7005",
    product: "Dabur Pure Honey Squeezy Pack · 400 g",
    gtin: "8901207042514",
    channel: "E-Commerce Fulfillment Hub",
    source: "fixture",
    createdAt: "2026-09-16T11:00:00.000Z",
    officer: "Rajesh V. Kulkarni",
    district: "Pune Central (Camp Zone)",
    front: "/media/pack.jpg",
    back: "/media/measure.jpg",
    findings: [
      {
        decision: "pending",
        note: "",
        reviewedAt: null,
        ruleClause: "Rule 6(1)(d)",
        title: "Month and Year of Manufacture / Pre-packing",
        description:
          "Packaging must prominently bear month and year in which commodity is manufactured, packed or imported.",
        measured: "Mfg: 08/2026 (Font isolation borderline)",
        required: "Clear month and year declaration",
        pdpArea: "95 cm²",
        rulePack: "lmpc.v2026_07",
      },
    ],
    audit: [
      {
        at: "2026-09-16T11:00:00.000Z",
        actor: "Rajesh V. Kulkarni (MH-LM-2024-0412)",
        action: "Physical sample obtained from Fulfillment Center FC-04",
      },
      {
        at: "2026-09-16T11:05:45.000Z",
        actor: "Optical Metrology Pipeline",
        action: "Extraction analysis completed: date of packing ambiguity flagged",
      },
    ],
  },
];

export function newStore(): Workspace {
  return { version: 1, profile: null, inspections: [] };
}

export function getSeededStore(): Workspace {
  return {
    version: 1,
    profile: { ...SEED_PROFILE },
    inspections: SEED_INSPECTIONS.map((item) => ({
      ...item,
      findings: item.findings.map((f) => ({ ...f })),
      audit: item.audit.map((a) => ({ ...a })),
    })),
  };
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
    channel: "Retail Supermarket",
    source,
    createdAt: now,
    officer,
    district,
    front: source === "fixture" ? "/media/inspect-pack.svg" : "",
    back: source === "fixture" ? "/media/pack.jpg" : "",
    findings:
      source === "fixture"
        ? [
            {
              decision: "pending",
              note: "",
              reviewedAt: null,
              ruleClause: "Rule 7(2) read with Table I (Row 3)",
              title: "MRP Numeral Height Below Statutory Minimum",
              description:
                "Retail sale price numerals printed on PDP measure below the mandatory 2.5 mm height threshold for package surface area 120 cm².",
              measured: "1.8 ± 0.2 mm",
              required: "2.5 mm",
              pdpArea: "120 cm²",
              rulePack: "lmpc.v2026_07",
            },
          ]
        : [],
    audit: [
      {
        at: now,
        actor: officer,
        action:
          source === "fixture"
            ? "Packaging documentation registered"
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
  const current = record.findings[0];
  return {
    ...record,
    findings: [
      {
        ...current,
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
        action: `Finding ${decision}${note.trim() ? ` — ${note.trim()}` : ""}`,
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
          src.startsWith("/media/") ||
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

export function getFindingDetails(record: Inspection) {
  const finding = record.findings[0];
  return {
    ruleClause: finding?.ruleClause ?? "Rule 7(2) read with Table I (Row 3)",
    title: finding?.title ?? "MRP Numeral Height Below Statutory Minimum",
    description:
      finding?.description ??
      "Retail sale price numerals printed on PDP measure below the mandatory 2.5 mm height threshold for package surface area 120 cm².",
    measured: finding?.measured ?? "1.8 ± 0.2 mm",
    required: finding?.required ?? "2.5 mm",
    pdpArea: finding?.pdpArea ?? "120 cm²",
    rulePack: finding?.rulePack ?? "lmpc.v2026_07",
  };
}
