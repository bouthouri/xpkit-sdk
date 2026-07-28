# achievements/native — write this last

Not because it matters less. Because you cannot run it yet, and code you cannot run is
code you cannot verify.

**Nothing you write for `web/` is thrown away.** `types.ts`, `engine.ts` and `store.ts`
sit one level up and are platform-free — the native renderer consumes exactly the same
`withStatus()` output and the same vanilla store. `use-store.ts` here is byte-identical
to the web one. What changes is only the markup:

| web | native |
|---|---|
| `<div>` / CSS grid | `FlatList` with `numColumns={2}` |
| `<span>` | `<Text>` from `react-native` |
| `style={{...}}` objects | `StyleSheet.create` |

Reference: `examples/achievements/achievement-list.tsx` and `achievement-badge.tsx`.
Those are the real shipped components — copy the layout, not the state handling.

## What blocks running it here

Nothing subtle: this repo has no React Native, no Metro, no simulator, and
`react-native` is deliberately absent from `dependencies` (amended Rule 8 — no
*platform* code in the shared layer). `index.tsx` in this folder therefore does not
import `react-native` at all; the imports you'll need are in a comment. Uncomment them
in the app that consumes this folder.
