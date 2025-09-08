import { describe, it } from "node:test";
import { compute, generateNumbers } from "./entrypoint.mts";
describe("example test", () => {
  it("runs without crashing", async () => {
    await generateNumbers();
    await compute();
  });
});
