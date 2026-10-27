---
name: building-maps
description: Build or change a LittleWarGame map file (the JSON the map editor saves and loads), including custom games and campaign-style maps with an AI-run enemy base. Use when writing a map by hand, adding units, buildings, triggers, terrain or modded types to one, setting a computer slot's AI, or checking why a map misbehaves. Covers where the format docs live, the validator, the editor test loop, and the traps that silently break maps.
---

# Building a LittleWarGame map

A map is one JSON file. The editor saves it with Save, and opens it with Load, then Load external. You can write the whole thing by hand.

## Read the docs first

The full guide is published with the game at `https://littlewargame.com/play/modding/` (from the release after v5.8.0). Read it in this order:

1. `map-format.md`: the JSON structure, coordinates, `globalVars`, `players`, the heightmap and the loss rule.
2. `cookbook.md`: how community maps build mechanics (timers, waves, lanes, stages, win conditions). Maps contain no code, so every mechanic is made from abilities, upgrades, modifiers and triggers. Look for an existing pattern before inventing one.
3. `reference/`: every field of every category, with defaults and units, plus the built-in types (`base-types.md`) and the trigger vocabulary.

## Validate after every change

Download `validate-map.js` from the same page and run `node validate-map.js my-map.json`. It's one file with nothing to install. Fix every error, and read every warning: each one is a mistake someone has already made. Then load the map in the editor and press Test to play it.

## Traps

- **Placements use the display name, and references use the id_string.** `units` and `buildings` say `"type": "Barracks"`. `commands`, `summonedUnits`, `modifiers` and other cross-references say `"barracks"`. Rename a type and you must update its placements.
- **`unitData` is ignored unless `globalVars.isModded` is true.**
- **Times are ticks (20 a second), and rates are per tick.** The editor shows seconds, so its field descriptions say "per sec" even though the JSON is per tick.
- **Coordinates run from 1, and y goes down.** A building's `x, y` is its top-left tile. A unit's is its centre.
- **The heightmap is column-major**: the character for tile (x, y) is at `(x - 1) * height + (y - 1)`.
- **Buildings default to `preventsLoss: true`.** A hidden helper building (a timer or spawner) needs `preventsLoss: false`, or its owner can never lose. A side with nothing that prevents loss is eliminated a second into the game.
- **Ability fields are per level**, so use one-element arrays: `"manaCost": [50]`.
- **Keep the file ASCII.** Other characters come out garbled.

## Computer players

Each entry in `players` has a `slot` (`open`, `computer` or `closed`), a `team` and an `ai`.

- `normal AI` plays a standard melee game, so it only suits melee maps.
- `no AI` sits still, but its units still autocast. This is the usual choice for custom games driven by triggers.
- `Campaign AI` is from this repo. It keeps the base the map placed for that player: it rebuilds lost buildings, retrains lost units and defends, and it leaves attacking to triggers. A trigger's `attackMoveTo` over its garrison sends a wave, and the base replaces those units straight away. It pays real gold, so give it workers and a goldmine, or a `giveGold` trigger. Use one computer player per base, on the same team. `examples/CampaignAI-demo.json` is a working example.
- Any other name in `manifest.json` works too. A named AI is locked in the lobby and never concedes.
- Leaderboard maps need every computer slot set to `no AI`.

## Workflow

1. Start small: terrain, one base each, one mechanic. Validate, then Test in the editor.
2. Add one mechanic at a time from the cookbook, validating as you go.
3. Upload from the editor (this needs an account) to make the map playable online.
