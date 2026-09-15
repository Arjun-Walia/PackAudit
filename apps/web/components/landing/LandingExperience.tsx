"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { BrandLink, BrandMark } from "@/components/brand/Brand";
import { InstallButton } from "@/components/pwa/InstallButton";
import { PRODUCT_NAME } from "@/lib/site";
import s from "./LandingExperience.module.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: 0 }}
      whileInView={reduce ? { opacity: 1 } : { y: [20, 0], opacity: [0.6, 1] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Pack() {
  const [showEvidence, setShowEvidence] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 32]);
  return (
    <div className={s.packScene} ref={ref} data-evidence={showEvidence}>
      <div className={s.sceneHeading}>
        <span>FIELD NOTES / 001</span>
        <span>Illustrative preview</span>
      </div>
      <motion.div className={s.packObject} style={{ y: reduce ? 0 : y }}>
        <img
          src="/media/inspect-pack.svg"
          width="520"
          height="640"
          alt="Illustrated namkeen label showing MRP, net quantity and origin"
          fetchPriority="high"
        />
        <div className={s.packOutline} aria-hidden="true" />
      </motion.div>
      <motion.div
        id="pack-evidence"
        className={s.evidenceOverlay}
        initial={false}
        animate={{
          opacity: showEvidence ? 1 : 0,
          x: showEvidence || reduce ? 0 : 12,
        }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        aria-hidden={!showEvidence}
      >
        <span className={s.evidenceTag}>01 / Declaration located</span>
        <div className={s.evidencePrice}>
          ₹60.00 <span>MRP</span>
        </div>
        <p>
          Visible on the pack.
          <br />
          <strong>Ready for a closer look.</strong>
        </p>
        <div className={s.evidenceTrail}>
          <span>Image</span>
          <span>Rule</span>
          <span>Review</span>
        </div>
        <small>Sample evidence · not a compliance verdict</small>
      </motion.div>
      <div className={s.sceneControls}>
        <div role="group" aria-label="Packaging preview">
          <button
            type="button"
            aria-pressed={!showEvidence}
            aria-controls="pack-evidence"
            onClick={() => setShowEvidence(false)}
          >
            The pack
          </button>
          <button
            type="button"
            aria-pressed={showEvidence}
            aria-controls="pack-evidence"
            onClick={() => setShowEvidence(true)}
          >
            The evidence <span aria-hidden="true">↗</span>
          </button>
        </div>
        <span>Same pack. A different level of scrutiny.</span>
      </div>
    </div>
  );
}

const inspectionSteps = [
  {
    name: "Capture",
    title: "Start with the whole pack.",
    text: "Keep the front, back and barcode in one inspection. A clear capture gives every later finding something to point back to.",
    record: "Capture record",
    rows: [
      ["Product", "Classic namkeen · 200 g"],
      ["Images", "Front + back"],
      ["Identity", "Barcode attached"],
    ],
    note: "Original images stay with the inspection.",
  },
  {
    name: "Check",
    title: "Put the declaration beside the rule.",
    text: "Review extracted fields and physical measurements together. Each proposed finding carries a clause, evidence and measurement uncertainty.",
    record: "Proposed finding",
    rows: [
      ["Declaration", "MRP numeral height"],
      ["Sample height", "1.8 ± 0.2 mm"],
      ["Reference", "Rule 7 · Table I"],
    ],
    note: "Sample finding · awaiting officer review.",
  },
  {
    name: "Review",
    title: "Make a decision you can trace.",
    text: "Accept, reject or annotate the proposal. The inspection note brings the officer’s decision, the cited rule and the supporting images together.",
    record: "Inspection note",
    rows: [
      ["Decision", "Accepted by officer"],
      ["Evidence", "Image + measurement"],
      ["Record", "Officer + time + rule version"],
    ],
    note: "Illustrative record · nothing is submitted.",
  },
];

function InspectionWorkflow() {
  const [selected, setSelected] = useState(0);
  const step = inspectionSteps[selected];
  return (
    <section
      id="how-it-works"
      className={s.process}
      aria-labelledby="process-title"
    >
      <Reveal className={s.processCopy}>
        <p className={s.eyebrow}>How it works</p>
        <h2 id="process-title">
          Not just a flag.
          <br />A finding you can explain.
        </h2>
        <p className={s.processLead}>
          A detector can spot text. An inspection needs the source, the rule and
          a recorded decision.
        </p>
        <div className={s.stepButtons} aria-label="Explore inspection steps">
          {inspectionSteps.map((item, index) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={selected === index}
              aria-controls="step-description"
              onClick={() => setSelected(index)}
            >
              <span>0{index + 1}</span>
              {item.name}
            </button>
          ))}
        </div>
        <div
          id="step-description"
          className={s.stepDescription}
          aria-live="polite"
        >
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </div>
      </Reveal>
      <Reveal className={s.recordPreview}>
        <div className={s.recordHeading}>
          <BrandMark />
          <span>Sample inspection / 001</span>
        </div>
        <div aria-live="polite">
          <h3>{step.record}</h3>
          <dl>
            {step.rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className={s.recordNote}>{step.note}</p>
        </div>
      </Reveal>
    </section>
  );
}

function Audience() {
  return (
    <section
      id="for-you"
      className={s.audience}
      aria-labelledby="audience-title"
    >
      <div className={s.audienceInner}>
        <Reveal>
          <p className={s.eyebrow}>Who it’s for</p>
          <h2 id="audience-title">
            In the field.
            <br />
            Back at the desk.
          </h2>
          <p className={s.audienceIntro}>
            The inspection starts with an officer. The evidence should be useful
            to everyone who works with it.
          </p>
        </Reveal>
        <div className={s.audienceRows}>
          {[
            {
              name: "Legal Metrology officers",
              status: "Core workflow",
              description:
                "Capture pack images, review clause-cited findings and record your decision. The original evidence stays alongside the inspection note.",
            },
            {
              name: "Controllers & supervisors",
              status: "Planned",
              description:
                "Review district inspection activity and product history in a shared workspace. Follow up on findings with the supporting evidence in reach.",
            },
            {
              name: "Packers & brands",
              status: "Planned",
              description:
                "Pre-check packaging artwork before print, using the same rule pack in a separate industry workspace. Get practical corrections for your label.",
            },
          ].map((role, index) => (
            <details key={role.name} open={index === 0}>
              <summary>
                <span>
                  {role.name}
                  <small>{role.status}</small>
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <p>{role.description}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function MeasurementDemo() {
  const [height, setHeight] = useState(1.8);
  const [decision, setDecision] = useState<"pending" | "accepted" | "rejected">(
    "pending",
  );
  const below = height + 0.2 < 2.5;
  const uncertain = !below && height - 0.2 < 2.5;
  const label = below
    ? "Below the sample threshold"
    : uncertain
      ? "Within the uncertainty band"
      : "Meets the sample threshold";
  return (
    <section className={s.demoSection} id="try-it" aria-labelledby="demo-title">
      <div className={s.demoInner}>
        <Reveal className={s.demoIntro}>
          <p className={s.eyebrow}>A sample inspection</p>
          <h2 id="demo-title">
            Reading the price
            <br />
            is only half the job.
          </h2>
          <p>
            Move the slider to see how a measurement compares with the example
            minimum. Then accept or reject the finding.
          </p>
          <span className={s.demoDisclaimer}>
            Sample values only. A real inspection needs a known scale and an
            officer’s review.
          </span>
        </Reveal>
        <Reveal className={s.measureCard}>
          <div className={s.measureHeader}>
            <span>MRP · numeral height</span>
            <span className={s.samplePill}>Sample data</span>
          </div>
          <div className={s.glyphStage}>
            <span className={s.glyphLabel}>MRP NUMERAL HEIGHT</span>
            <div className={s.glyphWrap}>
              <span
                className={s.glyph}
                style={{ transform: `scale(${height / 2.5})` }}
              >
                ₹60
              </span>
              <span className={s.glyphGuide}>
                <i />
                {height.toFixed(1)} mm
                <i />
              </span>
            </div>
            <div className={s.ruler} aria-hidden="true" />
          </div>
          <div className={s.measureValues}>
            <div>
              <span>Sample height</span>
              <strong>
                {height.toFixed(1)}
                <small> ± 0.2 mm</small>
              </strong>
            </div>
            <div>
              <span>Example minimum</span>
              <strong>
                2.5<small> mm</small>
              </strong>
            </div>
          </div>
          <label className={s.rangeLabel} htmlFor="type-height">
            Adjust the sample type size <span>Drag to explore ↔</span>
          </label>
          <input
            id="type-height"
            className={s.heightRange}
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={height}
            aria-valuetext={`${height.toFixed(1)} millimetres, plus or minus 0.2 millimetres`}
            onChange={(e) => {
              setHeight(Number(e.target.value));
              setDecision("pending");
            }}
          />
          <div className={s.rangeEnds}>
            <span>1.0 mm</span>
            <span>4.0 mm</span>
          </div>
          <p
            className={s.measureStatus}
            data-status={below ? "below" : uncertain ? "uncertain" : "meets"}
            aria-live="polite"
          >
            <span>{below || uncertain ? "↗" : "✓"}</span>
            {label}
          </p>
          <div id="sample-review" className={s.reviewArea}>
            <div>
              <span>OFFICER REVIEW</span>
              <p aria-live="polite">
                {decision === "pending"
                  ? "Review the sample finding."
                  : decision === "accepted"
                    ? "Sample finding accepted for the inspection note."
                    : "Sample finding rejected. Decision recorded."}
              </p>
            </div>
            <div className={s.reviewButtons}>
              <button
                type="button"
                aria-pressed={decision === "accepted"}
                onClick={() => setDecision("accepted")}
              >
                {decision === "accepted" ? "✓ Accepted" : "Accept finding"}
              </button>
              <button
                type="button"
                aria-pressed={decision === "rejected"}
                onClick={() => setDecision("rejected")}
              >
                {decision === "rejected" ? "✓ Rejected" : "Reject"}
              </button>
              {decision !== "pending" && (
                <button
                  className={s.undo}
                  type="button"
                  onClick={() => setDecision("pending")}
                >
                  Reset
                </button>
              )}
            </div>
            <small>Preview only · no inspection is created or submitted</small>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingExperience() {
  return (
    <div className={s.landing} id="top">
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      <header className={s.header}>
        <BrandLink className={s.brand} />
        <nav aria-label="Main navigation">
          <a className={s.sectionNav} href="#how-it-works">
            How it works
          </a>
          <a className={s.sectionNav} href="#for-you">
            Who it’s for
          </a>
          <a href="#try-it">
            Try the demo <Arrow />
          </a>
          <Link href="/inspect">
            Open field app <Arrow diagonal />
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>
              <span className={s.eyebrowLine} aria-hidden="true" /> Consumer
              protection. Made inspectable.
            </p>
            <h1 id="hero-title">
              Small print.
              <br />
              Big <em>responsibility.</em>
            </h1>
            <p>
              A price on a packet is a promise. {PRODUCT_NAME} helps officers
              turn label checks into evidence-backed decisions—with the image,
              rule and human judgment kept together.
            </p>
            <div className={s.heroActions}>
              <a className={s.button} href="#try-it">
                Explore an inspection <Arrow diagonal />
              </a>
              <a className={s.storyLink} href="#how-it-works">
                Why it’s different <span aria-hidden="true">↓</span>
              </a>
            </div>
            <span className={s.heroNote}>
              The software proposes. The officer decides.
            </span>
          </div>
          <Pack />
          <div className={s.proofRail} aria-label="Inspection principles">
            <div>
              <span>01 / MEASUREMENT</span>
              <p>
                Known scale.
                <br />
                <strong>No guessed millimetres.</strong>
              </p>
            </div>
            <div>
              <span>02 / TRACEABILITY</span>
              <p>
                A cited rule.
                <br />
                <strong>Not a black-box verdict.</strong>
              </p>
            </div>
            <div>
              <span>03 / ACCOUNTABILITY</span>
              <p>
                Officer-reviewed.
                <br />
                <strong>Never an automatic penalty.</strong>
              </p>
            </div>
          </div>
        </section>
        <InspectionWorkflow />
        <div className={s.blend} aria-hidden="true">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none">
            <path d="M0 112C430 128 670 14 1030 29C1200 36 1330 58 1440 24V160H0Z" />
          </svg>
        </div>
        <MeasurementDemo />
        <Audience />
      </main>
      <footer className={s.footer}>
        <div>
          <a href="#top" className={s.footerBrand}>
            {PRODUCT_NAME}
          </a>
          <span>Product prototype · LMPC Rules, 2011</span>
        </div>
        <div className={s.footerActions}>
          <InstallButton />
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>
    </div>
  );
}
