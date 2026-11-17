---
name: writing-custom-ais
description: Write or change a LittleWarGame custom AI in this repo (a JavaScript file run with a `scope` object about once a second). Use when creating a new AI, fixing or tuning an existing one such as CampaignAI.js, adding an AI to manifest.json, or answering how the AI API behaves. Covers how the file runs, keeping state, what the AI can see, giving orders, staying deterministic, and how to test.
---

# Writing a LittleWarGame custom AI

The API reference is the [AI docs](https://littlewargame.com/play/AI_docs.html). Read the section for any method before relying on it. This skill covers what the reference doesn't make obvious.

## How the file runs

- The whole file is the body of a function, `(scope) => { <file> }`. Don't wrap it in a function, and don't `export` anything. A top-level `return` ends this update early.
- It runs once a second: on every game tick where `tick % 20 == 2` (20 ticks a second).
- **`var` starts fresh on every call.** Keep anything you need between calls on `scope`, e.g. `var state = scope.myAI || (scope.myAI = { posts: [] });`. Each computer player has its own `scope` for the whole game.
- **An uncaught error stops the game**, not just the AI. Wrap anything that might throw, such as an index into a list that could be empty.
- Orders take effect on the next tick, so a unit you just ordered still reports its old order in the same update.

## What the AI can see

- `scope.getUnits(filter)` returns only units the AI's team can see right now. `scope.getBuildings(filter)` returns buildings it has ever seen, as fog-of-war memory.
- Filters take display names (`'Barracks'`). Some methods take the internal lowercase name instead (`'barracks'`): `getTypeFieldValue`, `canBuildAt`, `unitOfTypeExistsOrIsMade`. Convert with `scope.getTypeId(name)`.
- The filter keys `notOftype` and `onlyFinshed` really are spelt like that.
- `unit.getLastAttack()` says when one of your own units or buildings was hit, where it stood and the rough compass direction the attack came from. It tells you the direction of an attacker you can't see, but not where it is. That's deliberate: the AI should know what a player hearing "under attack" knows.

## Giving orders

- `scope.order(command, units, target, shift)`. `command` is a display name (`'Train Soldier'`, `'AMove'`) or an internal id (`'trainsoldier'`). Prefer the id: modded maps rename things, and the ids stay put.
- A target is `{ x, y }` for a point, or `{ unit: wrapper }` for a unit. Pass `null` when the command needs no target.
- To make something without hardcoding which building makes it, use `scope.getProducers(typeName)`. It works on modded maps too.
- To rebuild a building in the same place, keep `unit.getBuildPosition()` from while it was alive, and pass that as the build target.
- Training is paid for when it's queued, and a building when the worker arrives to start it. Without enough gold at that moment nothing happens, so check `scope.getGold()` against `scope.getTypeFieldValue(id, 'cost')` first.

## Stay deterministic

In a multiplayer game, every player's computer runs the AI and must reach the same decisions, or the game desyncs.

- Use `scope.getRandomNumber(min, max)`, never `Math.random()`.
- Never read the clock (`Date`, `performance`). Use `scope.getCurrentGameTimeInSec()`.
- Don't depend on anything outside `scope`: no globals, no `setTimeout` other than `scope.setTimeout`.
- Loop over arrays in their order, not over object keys in an order you assume.

## AIs that maps pin to a slot

A map can set a computer slot's `ai` to any name in `manifest.json`. That AI is locked in the lobby, runs in the editor's Test, and never concedes. So an AI written for maps should cope with any map:
- no Start Location
- modded unit names
- no workers or no goldmine
- triggers that take its units (`unit.wasOrderedByTrigger()`) or add new ones (`unit.getOrigin() == 'trigger'`)

`CampaignAI.js` is the worked example: everything it does is driven by what the map placed for it at the first update.

## Testing

1. Start a singleplayer game, click Options, then Load Custom AI, and pick your file. It shows up as "Custom AI 1" for the CPU players.
2. Use `console.log` while developing. The AI runs in the game's Web Worker, so the output is in the browser dev tools console under the worker's context.
3. For an AI meant for maps, test it on a map whose computer slot is set to it. A map can only pin an AI that's in `manifest.json` on `main`, so try your branch with a local game server. Point its `AI_MAIN_COMMIT_URL` at `https://api.github.com/repos/littlewargame/customai/commits/<branch>`, and delete the server's `cached_ai_commit` file before starting it.

## Publishing

Add the file, and an entry in `manifest.json`: `{ "name": "...", "src": "File.js", "creator": "..." }`. The `name` is what players and map files see, so don't rename it later: maps that pinned the old name stop finding it. The game loads `main`'s latest commit, so merging puts it live straight away.
