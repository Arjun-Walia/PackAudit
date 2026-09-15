import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createInspection,
  decideFinding,
  canReport,
  parseStore,
  summarize,
  validateCapture,
  newStore,
  statusOf,
} from "../lib/officer-model.ts";

test("new workspace is empty, not populated with fake activity", () => {
  assert.deepEqual(summarize(newStore().inspections), {
    total: 0,
    pending: 0,
    reportable: 0,
  });
});
test("record statuses distinguish drafts, pending, rejected and accepted", () => {
  const sample = createInspection("fixture", "Pack", "Officer", "Unit");
  assert.equal(statusOf(sample), "Needs review");
  assert.equal(
    statusOf(createInspection("upload", "Pack", "Officer", "Unit")),
    "Capture draft",
  );
  assert.equal(
    statusOf(decideFinding(sample, "accepted", "", "Officer")),
    "Note ready",
  );
  assert.equal(
    statusOf(decideFinding(sample, "rejected", "Reason", "Officer")),
    "Reviewed · rejected",
  );
});
test("corrupt profiles, decisions and image URLs are rejected on restore", () => {
  assert.throws(
    () =>
      parseStore(
        JSON.stringify({ version: 1, profile: { name: 1 }, inspections: [] }),
      ),
    /profile/,
  );
  const record = createInspection("fixture", "Pack", "Officer", "Unit");
  const store = { version: 1, profile: null, inspections: [record] };
  record.front = "https://external.test/image.png";
  assert.throws(() => parseStore(JSON.stringify(store)), /image/);
  record.front = "/media/inspect-pack.svg";
  record.findings[0].decision = "invalid";
  assert.throws(() => parseStore(JSON.stringify(store)), /inspection/);
});
test("fixture has explicit provenance and pending review", () => {
  const record = createInspection("fixture", "sample", "Officer", "D01");
  assert.equal(record.source, "fixture");
  assert.equal(record.findings[0].decision, "pending");
  assert.equal(canReport(record), false);
});
test("uploaded captures never receive canned findings", () => {
  const record = createInspection("upload", "my pack", "Officer", "D01");
  assert.equal(record.findings.length, 0);
  assert.equal(canReport(record), false);
});
test("acceptance records actor, time and note without mutating original", () => {
  const record = createInspection("fixture", "sample", "Officer", "D01");
  const updated = decideFinding(
    record,
    "accepted",
    "Verified sample",
    "Officer",
    "2026-09-14T00:00:00Z",
  );
  assert.equal(canReport(updated), true);
  assert.equal(record.findings[0].decision, "pending");
  assert.equal(updated.audit.at(-1).actor, "Officer");
  assert.equal(updated.findings[0].note, "Verified sample");
});
test("reject requires a reason and does not authorize a report", () => {
  const record = createInspection("fixture", "sample", "Officer", "D01");
  assert.throws(
    () => decideFinding(record, "rejected", " ", "Officer"),
    /reason/i,
  );
  const updated = decideFinding(record, "rejected", "Not supported", "Officer");
  assert.equal(canReport(updated), false);
  assert.equal(updated.audit.length, 2);
});
test("reset decision revokes report eligibility and retains audit", () => {
  const record = createInspection("fixture", "sample", "Officer", "D01");
  const accepted = decideFinding(record, "accepted", "", "Officer");
  const reset = decideFinding(accepted, "pending", "", "Officer");
  assert.equal(canReport(reset), false);
  assert.equal(reset.audit.length, 3);
});
test("cannot invent finding decisions on an uploaded record", () => {
  assert.throws(
    () =>
      decideFinding(
        createInspection("upload", "Pack", "Officer", "D01"),
        "accepted",
        "",
        "Officer",
      ),
    /finding/i,
  );
});
test("capture validates required identity and both images", () => {
  assert.match(validateCapture("", "", "", ""), /product/i);
  assert.match(validateCapture("Pack", "123", "", ""), /barcode/i);
  assert.match(validateCapture("Pack", "8901234567890", "", ""), /front/i);
  assert.match(
    validateCapture("Pack", "", "data:image/png;base64,a", ""),
    /back/i,
  );
  assert.equal(validateCapture("Pack", "", "front", "back"), "");
});
test("session storage is validated; corrupt input is not silently accepted", () => {
  assert.deepEqual(parseStore(null), newStore());
  assert.throws(() => parseStore("{bad"), /./);
  assert.throws(() => parseStore('{"version":9}'), /workspace/i);
  assert.throws(
    () => parseStore('{"version":1,"profile":null,"inspections":[{}]}'),
    /inspection/i,
  );
  const store = newStore();
  store.inspections.push(
    createInspection("fixture", "sample", "Officer", "D01"),
  );
  assert.deepEqual(parseStore(JSON.stringify(store)), store);
});
test("dashboard counts are derived from real local decisions", () => {
  const record = createInspection("fixture", "sample", "Officer", "D01");
  assert.deepEqual(summarize([record]), {
    total: 1,
    pending: 1,
    reportable: 0,
  });
  assert.deepEqual(
    summarize([decideFinding(record, "accepted", "", "Officer")]),
    { total: 1, pending: 0, reportable: 1 },
  );
});
