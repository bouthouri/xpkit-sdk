import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node is enough: everything under test (schema, engine, stores) is platform-free
    // by design. If a test ever needs a DOM, it belongs in web/.
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // examples/ is vendored React Native source. It does not compile here and is not
    // meant to — see examples/README.md.
    exclude: ["node_modules/**", "examples/**", "dist/**"],
  },
});
