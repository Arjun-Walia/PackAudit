import Link from "next/link";
import { ONE_LINE, PHOTOS, PRODUCT_NAME } from "@/lib/site";
import { InstallButton } from "@/components/pwa/InstallButton";
import {
  IconAlert,
  IconBarcode,
  IconCamera,
  IconDocument,
  IconListing,
  IconOfficer,
  IconRuler,
  IconStorefront,
} from "./icons";

const shelf = PHOTOS[0];
const packs = PHOTOS[1];
const listing = PHOTOS[2];
const bottles = PHOTOS[3];

export function Landing() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link className="brand" href="/">
            {PRODUCT_NAME}
          </Link>
          <Link className="btn btn-strong" href="/inspect">
            View demo
          </Link>
        </div>
      </header>

      <main>
        <section className="wrap hero">
          <div>
            <p className="eyebrow">Department of Consumer Affairs</p>
            <h1 className="display">Check a pack the way the rule is written.</h1>
            <p className="lede">
              Photographs and marketplace listings in. Clause-cited findings out. A Legal Metrology
              officer confirms before anything is signed.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-strong" href="/inspect">
                View demo
              </Link>
              <InstallButton />
              <a className="btn btn-quiet" href="#report">
                See a sample report
              </a>
            </div>
            <p className="proof">
              Built around LMPC Rules 2011, including 2026 e-commerce amendments.
            </p>
          </div>

          <figure className="stage">
            <img src={shelf.file} alt={shelf.alt} />
            <div className="overlay overlay-pdp">PDP</div>
            <div className="overlay overlay-mrp">MRP</div>
            <figcaption className="readout">1.8 mm · need 2.5 mm · Rule 7 Table I</figcaption>
          </figure>
        </section>

        <section className="wrap section" aria-labelledby="problem-title">
          <h2 id="problem-title">What officers still check by hand</h2>
          <div className="cards-3">
            <article className="card">
              <img src={bottles.file} alt={bottles.alt} />
              <h3>MRP and unit sale price</h3>
              <p>
                Missing MRP, wrong wording, or no “inclusive of all taxes” — Rule 6 declarations
                officers still hunt with a torch.
              </p>
            </article>
            <article className="card">
              <img src={packs.file} alt={packs.alt} />
              <h3>Type too small for the panel</h3>
              <p>
                Font height is set by principal display panel area. A pack can carry MRP and still
                fail Rule 7 Table I.
              </p>
            </article>
            <article className="card">
              <img src={listing.file} alt={listing.alt} />
              <h3>Listing is not the pack</h3>
              <p>
                E-commerce pages miss declarations, or skip a searchable, sortable country-of-origin
                filter for imports — Rule 6(10A).
              </p>
            </article>
          </div>
        </section>

        <section className="wrap section" id="product" aria-labelledby="product-title">
          <h2 id="product-title">Two people. Same rule pack.</h2>
          <div className="modes">
            <article className="mode" id="officers">
              <span className="ico">
                <IconCamera title="" />
              </span>
              <h3>Field officer</h3>
              <p>
                Multi-face capture of a pack on the shelf. Barcode, time and place on the evidence.
                Confirm or reject each finding. Install the field app on the phone from this page —
                it is a web app, not a Play Store listing.
              </p>
              <p className="mode-action">
                <InstallButton />
              </p>
            </article>
            <article className="mode" id="packers">
              <span className="ico">
                <IconDocument title="" />
              </span>
              <h3>Packer sandbox</h3>
              <p>
                Upload artwork before print. Same LMPC checks, separate tenant, no inspection note.
                A pre-check — not a licence.
              </p>
            </article>
          </div>
        </section>

        <section className="wrap section" id="how" aria-labelledby="how-title">
          <h2 id="how-title">How it works</h2>
          <ol className="steps">
            <li className="step">
              <span className="ico">
                <IconCamera title="" />
              </span>
              <div>
                <h3>Capture</h3>
                <p>Front, back, and the principal display panel. Listing screenshot if needed.</p>
              </div>
            </li>
            <li className="step">
              <span className="ico">
                <IconRuler title="" />
              </span>
              <div>
                <h3>Scale</h3>
                <p>
                  Barcode or a known object as a ruler. Pixels become millimetres. Uncertainty is
                  shown — we do not pretend 0.1 mm.
                </p>
              </div>
            </li>
            <li className="step">
              <span className="ico">
                <IconBarcode title="" />
              </span>
              <div>
                <h3>Extract</h3>
                <p>MRP, net quantity, unit sale price, packer, date, consumer care, origin.</p>
              </div>
            </li>
            <li className="step">
              <span className="ico">
                <IconDocument title="" />
              </span>
              <div>
                <h3>LMPC rule engine</h3>
                <p>Presence, manner, Table I height, listing duties. Each hit carries a clause.</p>
              </div>
            </li>
            <li className="step">
              <span className="ico">
                <IconOfficer title="" />
              </span>
              <div>
                <h3>Officer-signed report</h3>
                <p>The model proposes. The officer signs. Nothing prosecutes on its own.</p>
              </div>
            </li>
          </ol>
        </section>

        <section className="wrap section" id="evidence" aria-labelledby="evidence-title">
          <h2 id="evidence-title">Evidence the way a notice needs it</h2>
          <div className="findings">
            <article className="ui-card">
              <div className="ui-head">
                <div>
                  <h3>Shrimp Snacks 60 g</h3>
                  <p className="meta">GTIN 8900000000017 · sample pack</p>
                </div>
                <span className="badge badge-fail">
                  <IconAlert /> FAIL
                </span>
              </div>
              <img src={shelf.file} alt="" />
              <p className="clause">
                MRP numeral 1.8 mm vs required 2.5 mm — Rule 7 Table I, Sl. 3 (print). Band:
                fail after uncertainty.
              </p>
              <div className="officer-row">
                <Link className="btn btn-strong" href="/inspect">
                  Confirm
                </Link>
                <Link className="btn btn-quiet" href="/inspect">
                  Reject
                </Link>
              </div>
            </article>

            <article className="ui-card">
              <div className="ui-head">
                <div>
                  <h3>Pack vs marketplace listing</h3>
                  <p className="meta">Same GTIN · listing screenshot</p>
                </div>
                <span className="badge badge-review">REVIEW</span>
              </div>
              <img src={listing.file} alt={listing.alt} />
              <p className="clause">
                Pack shows country of origin. Listing has no searchable, sortable COO filter —
                Rule 6(10A). Dual MRP across channels: Rule 18(2A) flagged for the officer.
              </p>
              <div className="officer-row">
                <Link className="btn btn-strong" href="/inspect">
                  Confirm
                </Link>
                <Link className="btn btn-quiet" href="/inspect">
                  Reject
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="wrap section" id="report" aria-labelledby="report-title">
          <h2 id="report-title">Sample report</h2>
          <div className="report">
            <header>
              <div>
                <h3>Inspection note</h3>
                <p className="meta">{PRODUCT_NAME} · rule pack lmpc.v2026_07</p>
              </div>
              <span className="badge badge-fail">1 confirmed</span>
            </header>
            <p className="meta">Officer A. Rao · 12 Sep 2026 · GTIN 8900000000017</p>
            <table>
              <thead>
                <tr>
                  <th>Clause</th>
                  <th>Finding</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Rule 7 Table I</td>
                  <td>MRP height 1.8 mm; need 2.5 mm</td>
                  <td>Accepted</td>
                </tr>
                <tr>
                  <td>Rule 6(10A)</td>
                  <td>Listing COO filter missing</td>
                  <td>Pending</td>
                </tr>
              </tbody>
            </table>
            <div className="thumbs">
              <img src={shelf.file} alt="" />
              <img src={packs.file} alt="" />
            </div>
            <div className="sign-block">
              A. Rao, LMO · signed 12 Sep 2026 16:42 IST
              <br />
              extract: paddleocr-v4-cpu · engine 0.1.0
            </div>
          </div>
          <p className="caption">Decision support. Not an automatic notice.</p>
        </section>

        <section className="wrap section" aria-labelledby="who-title">
          <h2 id="who-title">Who it is for</h2>
          <div className="who">
            <article>
              <span className="ico">
                <IconOfficer title="" />
              </span>
              <div>
                <h3>Legal Metrology Officer</h3>
                <p>Scan the pack, confirm findings, take the note into the field file.</p>
              </div>
            </article>
            <article>
              <span className="ico">
                <IconStorefront title="" />
              </span>
              <div>
                <h3>Controller / supervisor</h3>
                <p>See repeat SKUs, pending signatures, and district work — not a public dashboard.</p>
              </div>
            </article>
            <article>
              <span className="ico">
                <IconListing title="" />
              </span>
              <div>
                <h3>Packer / importer</h3>
                <p>Pre-check artwork in a sandbox before the print run.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="wrap section" aria-labelledby="refuse-title">
          <h2 id="refuse-title">What we refuse to claim</h2>
          <ul className="refuse">
            <li>We do not prosecute without an officer.</li>
            <li>We do not call a foreign ban an Indian offence.</li>
            <li>We do not invent millimetres the camera cannot support.</li>
          </ul>
        </section>

        <section className="wrap close">
          <h2 className="display">{PRODUCT_NAME}</h2>
          <p className="lede" style={{ marginInline: "auto" }}>
            {ONE_LINE}
          </p>
          <div className="hero-actions hero-actions-center">
            <Link className="btn btn-strong" href="/inspect">
              View demo
            </Link>
            <InstallButton />
          </div>
        </section>
      </main>

      <footer className="wrap foot">
        <p>Team name · Institute · Prototype</p>
      </footer>
    </>
  );
}
