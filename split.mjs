import { spawnSync } from "node:child_process";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parseArgs } from "node:util";

import { ROOT, SETS, taskDirs } from "./lib/cases.mjs";

const USAGE = "node split.mjs --seed N [--apply]\n\nChooses one third of each family's tasks for held-out/ from the seed. Without --apply it only prints the choice.";
const { values: args } = parseArgs({ options: { seed: { type: "string" }, apply: { type: "boolean" } } });
if (!/^\d{1,10}$/.test(args.seed ?? "")) {
  console.error(USAGE);
  process.exit(1);
}
const seed = Number(args.seed);

// FNV-1a of "seed:family" seeds mulberry32, so each family's draw depends only on the seed and that family's own tasks.
function rng(text) {
  let state = 0x811c9dc5;
  for (const char of text) state = Math.imul(state ^ char.charCodeAt(0), 0x01000193) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

function choose(seed, family, tasks) {
  const order = [...tasks].sort();
  const random = rng(`${seed}:${family}`);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Set(order.slice(0, Math.round(order.length / 3)));
}

const tracked = new Set(spawnSync("git", ["-C", ROOT, "ls-files", SETS.published], { encoding: "utf8" }).stdout.split("\n").filter(Boolean).map((file) => dirname(file)));
const all = [...taskDirs("published"), ...taskDirs("held-out")];
const families = [...new Set(all.map((dir) => dir.family))].sort();
const moves = [];
for (const family of families) {
  const dirs = all.filter((dir) => dir.family === family);
  const held = choose(seed, family, dirs.map((dir) => dir.task));
  for (const dir of dirs) {
    const want = held.has(dir.task) ? "held-out" : "published";
    console.log(`${want.padEnd(9)}  ${family}/${dir.task}`);
    if (dir.set !== want) moves.push({ ...dir, to: join(ROOT, SETS[want], family, dir.task), want });
  }
}

const published = moves.filter((move) => move.want === "held-out" && tracked.has(relative(ROOT, move.path)));
if (published.length > 0) {
  console.error(`already committed, so it cannot be held out: ${published.map((move) => `${move.family}/${move.task}`).join(", ")}`);
  process.exit(1);
}
if (!args.apply) {
  console.log(`\n${moves.length} tasks would move. Run again with --apply to move them.`);
  process.exit(0);
}
for (const move of moves) {
  mkdirSync(dirname(move.to), { recursive: true });
  renameSync(move.path, move.to);
}
const counts = Object.fromEntries(families.map((family) => [family, { tasks: all.filter((dir) => dir.family === family).length, heldOut: choose(seed, family, all.filter((dir) => dir.family === family).map((dir) => dir.task)).size }]));
writeFileSync(join(ROOT, "split.json"), `${JSON.stringify({ seed, rule: "per family, round(tasks / 3) tasks held out: Fisher-Yates over the sorted task names, mulberry32 seeded with FNV-1a of seed:family", families: counts }, null, 2)}\n`);
console.log(`\nmoved ${moves.length} tasks; split.json records seed ${seed}`);
