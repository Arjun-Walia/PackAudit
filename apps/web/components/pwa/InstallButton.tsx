"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { PRODUCT_NAME } from "@/lib/site";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallButton({
  variant = "quiet",
}: {
  variant?: "strong" | "quiet";
}) {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setSheetOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previousFocus?.focus();
    };
  }, [sheetOpen]);

  if (installed) {
    return (
      <Link
        className={`btn ${variant === "strong" ? "btn-strong" : "btn-quiet"}`}
        href="/inspect"
      >
        Open field app
      </Link>
    );
  }

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
      return;
    }
    setSheetOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={`btn ${variant === "strong" ? "btn-strong" : "btn-quiet"}`}
        onClick={() => void install()}
      >
        Install on phone
      </button>

      {sheetOpen ? (
        <div className="sheet-root">
          <button
            type="button"
            className="sheet-scrim"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId}>Install the field app</h2>
            {ios ? (
              <ol>
                <li>Tap Share in Safari.</li>
                <li>Tap Add to Home Screen.</li>
                <li>
                  Open {PRODUCT_NAME} from the home screen. It runs without the
                  browser chrome.
                </li>
              </ol>
            ) : (
              <ol>
                <li>Open this page in Chrome or Edge on the phone.</li>
                <li>
                  Use Install app in the browser menu, or the prompt when it
                  appears.
                </li>
                <li>No Play Store listing. The install is this web app.</li>
              </ol>
            )}
            <p className="sheet-note">
              This is the field app on this site. There is no Play Store
              listing.
            </p>
            <button
              ref={closeRef}
              type="button"
              className="btn btn-strong"
              onClick={() => setSheetOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
