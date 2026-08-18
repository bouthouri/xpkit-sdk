/**
 * onboarding/web — the renderer you can actually run.
 *
 * The full carousel (docs/05-first-task.md, Task 2, steps 1-7): `config.screens[]`
 * pages through with Next/Back, one footer button whose label follows the rules in
 * docs/02-onboarding-explained.md, a back chevron from slide 2, Skip in the header,
 * and pagination dots. Each screen's `type` (the discriminated union from
 * shared/index.ts) picks its design automatically — there is no control that lets
 * someone choose "show me the welcome design":
 *  - `content`  → a welcome-screen layout: title + body + optional image.
 *  - `video`    → the same hero layout with a looping muted video in place of the image.
 *  - `permission` / `notification` → an icon + inline Allow design wired to an
 *                 injected `PermissionHandler` (onboarding/types.ts). No handler → the
 *                 slide still renders, it just can't request anything (never a crash).
 */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { resolveAsset } from "../../shared/index";
import { getOnboardingStore } from "../store";
import type {
  ContentScreen,
  NotificationScreen,
  OnboardingProps,
  OnboardingScreen,
  PermissionHandler,
  PermissionScreen,
  PermissionStatus,
  VideoScreen,
} from "../types";
import { useOnboardingStore } from "./use-store";

// ── shared chrome ──────────────────────────────────────────────────────────
// Neutral palette (no blue, no yellow): charcoal + off-white, coral as the one accent.

const ACCENT = "#E8543E";

/** Fixed, semi-transparent — the app stays visible (dimmed) behind the modal. */
const backdrop: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(10,10,11,0.6)",
  padding: 20,
};

/** The modal itself — ~400px, centered, everything else lives inside it. */
const stage: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "min(400px, 100%)",
  maxHeight: "88vh",
  overflowY: "auto",
  borderRadius: 24,
  boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
  background: "#1c1c1e",
  color: "#f5f4f2",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

const header: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 20px 0",
  flex: "0 0 auto",
};

const iconButton: CSSProperties = {
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.7)",
  cursor: "pointer",
  padding: 0,
};

const skipText: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.55)",
  fontSize: 15,
  cursor: "pointer",
};

const slideArea: CSSProperties = {
  flex: "1 1 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 20px",
};

const footer: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 20,
  padding: "0 20px 32px",
};

const dotsRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

function dotStyle(active: boolean): CSSProperties {
  return {
    height: 6,
    width: active ? 22 : 6,
    borderRadius: 999,
    background: active ? ACCENT : "rgba(255,255,255,0.25)",
    transition: "width 150ms, background 150ms",
  };
}

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  width: "min(360px, 88vw)",
  textAlign: "center",
};

/** Fills the modal's width — the modal (~400px) is the size limit now, not this. */
const videoCard: CSSProperties = {
  ...card,
  width: "100%",
};

const eyebrow: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(245,244,242,0.5)",
};

const titleStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.25,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.5,
  color: "rgba(255,255,255,0.72)",
  margin: 0,
};

const mediaBox: CSSProperties = {
  width: "100%",
  borderRadius: 16,
  overflow: "hidden",
  background: "rgba(255,255,255,0.06)",
};

const missingAsset: CSSProperties = {
  ...mediaBox,
  padding: "32px 16px",
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#ff9f9f",
  border: "1px dashed #ff9f9f",
};

const buttonBase: CSSProperties = {
  width: "min(320px, 100%)",
  padding: "14px 20px",
  borderRadius: 999,
  border: "none",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const primaryButton: CSSProperties = {
  ...buttonBase,
  background: ACCENT,
  color: "#fff",
};

const ghostButton: CSSProperties = {
  ...buttonBase,
  background: "transparent",
  color: "rgba(255,255,255,0.6)",
};

// ── content ("welcome screen") ─────────────────────────────────────────────

function ContentScreenView({
  screen,
  assets,
}: {
  screen: ContentScreen;
  assets: OnboardingProps["assets"];
}) {
  let imageSrc: string | undefined;
  let imageMissing = false;
  if (screen.image) {
    try {
      imageSrc = resolveAsset(assets, screen.image) as string;
    } catch {
      imageMissing = true;
    }
  }

  return (
    <div style={card}>
      <span style={eyebrow}>Welcome</span>
      {screen.image &&
        (imageMissing ? (
          <div style={missingAsset}>ASSET MISSING — {screen.image.key}</div>
        ) : (
          <div style={mediaBox}>
            <img src={imageSrc} alt="" style={{ width: "100%", display: "block" }} />
          </div>
        ))}
      <h1 style={titleStyle}>{screen.title}</h1>
      <p style={subtitleStyle}>{screen.body}</p>
    </div>
  );
}

// ── video ────────────────────────────────────────────────────────────────

function VideoScreenView({
  screen,
  assets,
}: {
  screen: VideoScreen;
  assets: OnboardingProps["assets"];
}) {
  let src: string | undefined;
  let missing = false;
  try {
    src = resolveAsset(assets, screen.source) as string;
  } catch {
    missing = true;
  }

  return (
    <div style={videoCard}>
      <span style={eyebrow}>Welcome</span>
      {missing ? (
        <div style={missingAsset}>ASSET MISSING — {screen.source.key}</div>
      ) : (
        <div style={mediaBox}>
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: "100%", display: "block" }}
          />
        </div>
      )}
      {screen.title && <h1 style={titleStyle}>{screen.title}</h1>}
      {screen.subtitle && <p style={subtitleStyle}>{screen.subtitle}</p>}
    </div>
  );
}

// ── permission / notification ───────────────────────────────────────────

const iconWrap: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(232, 84, 62, 0.12)",
};

const iconWrapGranted: CSSProperties = {
  ...iconWrap,
  background: "rgba(76, 175, 80, 0.16)",
};

function BellIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type PermStatus = "checking" | "idle" | "granted" | "blocked" | "denied";

/** `type: "permission"` looks up its own `permission` field; `notification` looks up `"notifications"` (onboarding/types.ts). */
function permissionKey(screen: PermissionScreen | NotificationScreen): string {
  return screen.type === "permission" ? screen.permission : "notifications";
}

function PermissionScreenView({
  screen,
  handler,
  granted,
  onGranted,
}: {
  screen: PermissionScreen | NotificationScreen;
  handler?: PermissionHandler;
  granted: boolean;
  onGranted: () => void;
}) {
  const [status, setStatus] = useState<PermStatus>(handler ? "checking" : granted ? "granted" : "idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!handler) return;
    let cancelled = false;
    handler.check().then((result: PermissionStatus | undefined) => {
      if (cancelled) return;
      if (result === "granted") {
        setStatus("granted");
        onGranted();
      } else if (result === "blocked") {
        setStatus("blocked");
      } else {
        setStatus("idle");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler]);

  async function handleAllow() {
    if (!handler) {
      setStatus("granted");
      onGranted();
      return;
    }
    setLoading(true);
    try {
      const result = await handler.request();
      setStatus(result);
      if (result === "granted") onGranted();
    } finally {
      setLoading(false);
    }
  }

  if (status === "checking") return null;

  const isGranted = status === "granted";

  return (
    <div style={card}>
      <span style={eyebrow}>Notifications</span>
      <div style={isGranted ? iconWrapGranted : iconWrap}>
        {isGranted ? <CheckIcon /> : <BellIcon />}
      </div>
      <h1 style={titleStyle}>
        {isGranted && screen.grantedTitle ? screen.grantedTitle : screen.title}
      </h1>
      {!isGranted && screen.subtitle && <p style={subtitleStyle}>{screen.subtitle}</p>}
      {isGranted && screen.grantedSubtitle && <p style={subtitleStyle}>{screen.grantedSubtitle}</p>}
      {status === "blocked" && (
        <p style={{ ...subtitleStyle, color: "#ff9f9f" }}>
          Permission was previously denied.
        </p>
      )}

      {(status === "idle" || status === "denied") && (
        <button style={primaryButton} onClick={handleAllow} disabled={loading}>
          {loading ? "Requesting…" : "Allow"}
        </button>
      )}
      {status === "blocked" && handler?.openSettings && (
        <button style={primaryButton} onClick={() => handler.openSettings?.()}>
          Open Settings
        </button>
      )}
    </div>
  );
}

// ── footer button label — docs/02, "The footer button", rules 1-5 in order ──

function isPermissionType(screen: OnboardingScreen): screen is PermissionScreen | NotificationScreen {
  return screen.type === "permission" || screen.type === "notification";
}

function getButtonText(screen: OnboardingScreen, isLast: boolean, granted: boolean): string {
  if (isPermissionType(screen) && !granted) return "Continue without";
  if ("buttonText" in screen && screen.buttonText) return screen.buttonText;
  if (isLast) return "Get Started";
  return "Next";
}

// ── the carousel ────────────────────────────────────────────────────────

export function Onboarding({
  config,
  assets,
  onComplete,
  onSkip,
  showSkip,
  permissions,
  testID,
}: OnboardingProps) {
  const screens = config.screens;
  // `showSkip` can come from the app (prop) or from the config itself
  // (config.showSkip, as exported by the editor) — the prop wins when set.
  const effectiveShowSkip = showSkip ?? config.showSkip ?? true;
  const [index, setIndex] = useState(0);
  const [granted, setGranted] = useState(false);

  // The store decides whether this even renders — `isOnboarded` persists across
  // reloads, `lastSeenVersion !== null` is what tells a completion from a replay
  // apart (docs/02, "Replay — the one non-obvious piece of state").
  const store = getOnboardingStore();
  const isOnboarded = useOnboardingStore(store, (s) => s.isOnboarded);
  const lastSeenVersion = useOnboardingStore(store, (s) => s.lastSeenVersion);
  const complete = useOnboardingStore(store, (s) => s.complete);

  if (isOnboarded || screens.length === 0) return null;

  const screen = screens[index];
  const isFirst = index === 0;
  const isLast = index === screens.length - 1;

  function goToIndex(next: number) {
    setGranted(false);
    setIndex(next);
  }

  function finish() {
    const isFirstRun = lastSeenVersion === null;
    complete();
    // onComplete fires on FIRST completion only — never on a replay (OnboardingProps).
    if (isFirstRun) onComplete?.();
  }

  function goNext() {
    if (index < screens.length - 1) {
      goToIndex(index + 1);
    } else {
      finish();
    }
  }

  function handleSkip() {
    // "Skipping still marks the user onboarded — it is not a cancel." (docs/02)
    complete();
    onSkip?.();
  }

  function goBack() {
    if (index > 0) goToIndex(index - 1);
  }

  function handleGranted() {
    setGranted(true);
    // docs/02: granted → auto-advance after 600ms.
    setTimeout(goNext, 600);
  }

  return (
    <div style={backdrop}>
      <div style={stage} data-testid={testID}>
        <div style={header}>
        {!isFirst ? (
          <button
            style={iconButton}
            onClick={goBack}
            aria-label="Previous slide"
            data-testid={testID ? `${testID}-back` : undefined}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span style={{ width: 32, height: 32 }} />
        )}
        {effectiveShowSkip && onSkip ? (
          <button
            style={skipText}
            onClick={handleSkip}
            data-testid={testID ? `${testID}-skip` : undefined}
          >
            Skip
          </button>
        ) : (
          <span />
        )}
      </div>

      <div style={slideArea} data-testid={testID ? `${testID}-slide-${index}` : undefined}>
        {screen.type === "content" && <ContentScreenView screen={screen} assets={assets} />}
        {screen.type === "video" && <VideoScreenView screen={screen} assets={assets} />}
        {isPermissionType(screen) && (
          <PermissionScreenView
            screen={screen}
            handler={permissions?.[permissionKey(screen)]}
            granted={granted}
            onGranted={handleGranted}
          />
        )}
      </div>

      <div style={footer}>
        {screens.length > 1 && (
          <div style={dotsRow}>
            {screens.map((s, i) => (
              <span key={s.id} style={dotStyle(i === index)} />
            ))}
          </div>
        )}
        <button
          style={isPermissionType(screen) && !granted ? ghostButton : primaryButton}
          onClick={goNext}
          data-testid={testID ? `${testID}-next` : undefined}
        >
          {getButtonText(screen, isLast, granted)}
        </button>
      </div>
      </div>
    </div>
  );
}

export { useOnboardingStore } from "./use-store";
