# LittleWarGame custom AIs

Community AIs for [LittleWarGame](https://littlewargame.com). Every AI listed in `manifest.json` can be picked for a computer player in the game lobby, and map makers can pin one to a computer slot in their map.

The game always loads the latest commit on `main`, so a merged change is live for everyone straight away.

| AI | By |
| --- | --- |
| Beginner Bot | DeathStroke |
| Malfizars AI | BrutalityWarlord (Malfizar) |
| Hurricane AI | Mr MeowMeow |
| Death AI | DeathStroke |
| Campaign AI | tommy-couzens |

## Campaign AI

`CampaignAI.js` is for map makers who want a StarCraft-style campaign base. It doesn't attack and doesn't expand. It keeps the base the way the map placed it:

- **Rebuilds** a lost building on the same spot, using its nearest worker.
- **Retrains** a lost unit, and walks the new one back to where the old one stood.
- **Defends**: its units fight anything that comes into the base, then go back to their spots. When something shoots the base from out of sight, it heads out in the direction the shots came from, like a player hearing "Our base is under attack".
- **Lets triggers take units.** A unit a trigger orders away (`attackMoveTo`) is let go and replaced straight away, so a repeating trigger over the garrison sends attack waves that refill themselves. Units a trigger spawns are left alone.
- **Pays its way.** Everything costs gold as usual, so give it workers and a goldmine, or a `giveGold` trigger.

To use it, open the map editor's Settings, Player Settings, make a slot a computer and choose `Campaign AI` in the AI column. There's nothing else to set up. For several bases, give each one its own computer player on the same team.

[`examples/CampaignAI-demo.json`](examples/CampaignAI-demo.json) is a map to try it on. See [examples/README.md](examples/README.md).

## Writing an AI

An AI is a plain JavaScript file whose body runs about once a second with a `scope` object, documented in the [AI API docs](https://littlewargame.com/play/AI_docs.html). To try one, start a singleplayer game, click Options, Load Custom AI, and pick it for a CPU player.

To publish it, add the file and a line in `manifest.json` (`name`, `src`, `creator`) and open a pull request.

If you use Claude Code, the skills in `.claude/skills/` cover [writing an AI](.claude/skills/writing-custom-ais/SKILL.md) and [building a map](.claude/skills/building-maps/SKILL.md).
