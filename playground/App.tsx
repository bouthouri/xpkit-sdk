/**
 * The playground. `bun dev` → this page.
 *
 * It is the intern's runtime: the only place in this repo where you can see something
 * you wrote actually behave. Right now it does three things:
 *
 *  1. parses all three fixtures and renders them as data (proves the contract loads)
 *  2. mounts `<Onboarding>` from `onboarding/` (a placeholder until you build it)
 *  3. offers a button per Progres counter, wired to the real engine — which throws,
 *     by name, until you implement it
 *
 * As you fill in `onboarding/` and `achievements/`, this page starts working. Nothing
 * here is precious; change it freely.
 */

import { useMemo, useState } from "react";

import { applyIncrement, withStatus } from "../achievements/index";
import type { AchievementWithStatus, CounterState } from "../achievements/index";
import { fixtureNames, rawFixtures, type FixtureName } from "../fixtures/index";
import { Onboarding, replayOnboarding } from "../onboarding/index";
import { parseConfig, type XPKitConfig } from "../shared/index";
import { webAssets } from "./assets";
import importedProjectRaw from "./imported-project.json";

/**
 * "imported" is a real export pulled from the editor (xpkit), pasted in and validated
 * against `parseConfig` — not one of the three read-only fixtures. See
 * `imported-project.json` next to this file.
 */
type TabName = FixtureName | "imported";
const tabNames: TabName[] = [...fixtureNames, "imported"];

const LABELS: Record<TabName, string> = {
  "energy-xp": "Energy XP",
  progres: "Progres",
  karv: "Karv",
  imported: "My First Project (imported)",
};

function parse(name: TabName): { config?: XPKitConfig; error?: string } {
  try {
    const raw = name === "imported" ? importedProjectRaw : rawFixtures[name];
    return { config: parseConfig(raw) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function App() {
  const [active, setActive] = useState<TabName>("energy-xp");
  const { config, error } = useMemo(() => parse(active), [active]);

  return (
    <main className="page">
      <h1>XP Kit playground</h1>
      <p className="lede">
        Three fixtures, one runtime. Everything below is driven by the JSON in{" "}
        <code>fixtures/</code> — nothing is hardcoded. Start at{" "}
        <code>docs/05-first-task.md</code>.
      </p>

      <div className="tabs">
        {tabNames.map((name) => (
          <button
            key={name}
            aria-pressed={name === active}
            onClick={() => setActive(name)}
          >
            {LABELS[name]}
          </button>
        ))}
      </div>

      {error && (
        <>
          <h2>Parse failed</h2>
          <div className="card error mono">{error}</div>
        </>
      )}

      {config && (
        <>
          <h2>
            {config.projectName} <span className="pill">schema v{config.schemaVersion}</span>
          </h2>

          <h2>
            Onboarding — rendered by onboarding/{" "}
            <button onClick={() => replayOnboarding()}>Replay onboarding</button>
          </h2>
          <p className="dim">
            Renders <code>null</code> once you finish or skip it — that state persists in{" "}
            <code>localStorage</code>. Click "Replay onboarding" to see it again.
          </p>
          <Onboarding
            config={config.onboarding}
            assets={webAssets}
            onComplete={() => console.log("[playground] onboarding complete")}
            onSkip={() => console.log("[playground] onboarding skipped")}
          />

          <ScreensTable config={config} />
          <Engine config={config} />
          <MilestonesTable config={config} />
        </>
      )}
    </main>
  );
}

function ScreensTable({ config }: { config: XPKitConfig }) {
  const { screens } = config.onboarding;
  if (screens.length === 0) {
    return (
      <>
        <h2>Screens</h2>
        <p className="dim">None — this fixture is gamification only.</p>
      </>
    );
  }

  return (
    <>
      <h2>Screens — {screens.length}</h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>id</th>
              <th>type</th>
              <th>title</th>
              <th>asset</th>
              <th>button</th>
            </tr>
          </thead>
          <tbody>
            {screens.map((screen, index) => (
              <tr key={screen.id}>
                <td className="mono">{index + 1}</td>
                <td className="mono">{screen.id}</td>
                <td className="mono">{screen.type}</td>
                <td>{"title" in screen ? screen.title : "—"}</td>
                <td className="mono">
                  {"source" in screen ? (
                    webAssets[screen.source.key] !== undefined ? (
                      screen.source.key
                    ) : (
                      <span className="error">{screen.source.key} (missing)</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="mono">
                  {"buttonText" in screen && screen.buttonText
                    ? screen.buttonText
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * The 6 Progres domain events, as buttons.
 *
 * Each one calls the real `applyIncrement` from `achievements/engine.ts`. Until that is
 * implemented every click lands in the log as a named NotImplementedError — which is
 * the fastest way to see what you are being asked to build.
 */
function Engine({ config }: { config: XPKitConfig }) {
  const catalog = config.gamification.achievements;
  const variables = config.gamification.variables;

  const [counters, setCounters] = useState<CounterState>({});
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const say = (line: string) => setLog((prev) => [line, ...prev].slice(0, 60));

  function emit(variableId: string) {
    try {
      const next = applyIncrement({ catalog, counters, unlocked, variableId });
      setCounters(next.counters);
      setUnlocked(next.unlocked);
      say(
        `${variableId} → ${next.counters[variableId]}` +
          (next.newlyUnlocked.length
            ? `   UNLOCKED: ${next.newlyUnlocked.join(", ")}`
            : ""),
      );
    } catch (error) {
      say(`${variableId} → ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function resetAll() {
    setCounters({});
    setUnlocked([]);
    setLog([]);
  }

  let rows: AchievementWithStatus[] | null = null;
  let rowsError: string | null = null;
  try {
    rows = catalog.length ? withStatus({ catalog, counters, unlocked }) : [];
  } catch (error) {
    rowsError = error instanceof Error ? error.message : String(error);
  }

  if (variables.length === 0 && catalog.length === 0) {
    return (
      <>
        <h2>Engine</h2>
        <p className="dim">
          No counters or achievements in this fixture. Switch to Progres.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>
        Emit events — {variables.length} counter{variables.length === 1 ? "" : "s"}
      </h2>
      <div className="grid">
        {variables.map((variable) => (
          <button key={variable.id} onClick={() => emit(variable.id)} title={variable.description}>
            {variable.name} <span className="dim">({counters[variable.id] ?? 0})</span>
          </button>
        ))}
      </div>
      <p>
        <button onClick={resetAll}>Reset</button>{" "}
        <span className="dim">
          {unlocked.length}/{catalog.length} unlocked
        </span>
      </p>

      <pre className="log mono">{log.length ? log.join("\n") : "No events yet."}</pre>

      <h2>Achievements — {catalog.length}</h2>
      {/* The catalog is config, so it renders either way. Only the derived columns
          (locked/unlocked, progress) need the engine — they degrade to "—". */}
      {rowsError && <p className="mono error">{rowsError}</p>}
      {catalog.length === 0 ? (
        <p className="dim">None — this fixture has no achievements.</p>
      ) : (
        <div className="scroll-x">
          <table>
            <thead>
              <tr>
                <th>icon</th>
                <th>id</th>
                <th>name</th>
                <th>condition</th>
                <th>progress</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((achievement, index) => {
                const status = rows?.[index];
                // No status yet (engine unimplemented) → show the raw config. Once the
                // engine works, locked rows mask name and icon exactly like the shipped
                // Progres badge does. See examples/achievements/achievement-badge.tsx.
                const locked = status ? !status.isUnlocked : false;
                const [condition] = achievement.conditions;
                return (
                  <tr key={achievement.id} className={locked ? "locked" : undefined}>
                    <td>{locked ? "🔒" : achievement.icon}</td>
                    <td className="mono">{achievement.id}</td>
                    <td>{locked ? "???" : achievement.name}</td>
                    <td className="mono">
                      {condition
                        ? `${condition.variableId} ${condition.operator} ${condition.threshold}`
                        : "—"}
                    </td>
                    <td className="mono">
                      {status ? `${Math.round(status.progress)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function MilestonesTable({ config }: { config: XPKitConfig }) {
  const { milestones } = config.gamification;
  if (milestones.length === 0) return null;

  return (
    <>
      <h2>Milestones — {milestones.length}</h2>
      <div className="scroll-x">
        <table>
          <thead>
            <tr>
              <th>level</th>
              <th>threshold</th>
              <th>label</th>
              <th>tier</th>
              <th>effect</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((milestone) => (
              <tr key={milestone.id}>
                <td className="mono">{milestone.level}</td>
                <td className="mono">{milestone.threshold}</td>
                <td>{milestone.label}</td>
                <td className="mono">{milestone.tier ?? "—"}</td>
                <td className="mono">
                  {milestone.effect ? JSON.stringify(milestone.effect) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
