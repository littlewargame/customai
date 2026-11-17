# Examples

`CampaignAI-demo.json` is a map that shows off `CampaignAI.js`. Load it in the map editor (Load, then "Load a map from your computer") and press Test. You spectate, with the camera on the first enemy base:

- At 0:15 a trigger sends a raid of soldiers and catapults at that base. Its garrison fights back, and goes looking for the catapults even while they shoot from out of sight.
- Once the fighting stops, a worker rebuilds whatever was destroyed on the same spot, and the barracks retrains the lost garrison.
- From 1:00, every 90 seconds a trigger sends the second base's garrison at the player as an attack wave, and that base trains replacements straight away.

Both enemy bases are computer slots set to `Campaign AI` in the map's player settings.

## The triggers are only for the demo

Campaign AI needs no triggers and nothing to set up. Each trigger here stands in for something a real map would have anyway:

| Trigger | Why it's in the demo |
| --- | --- |
| Raid | Gives the base something to defend against and rebuild after. In a real game, that's the player. |
| Wave | Shows a trigger taking units from the base, and the base replacing them. This is how maps already send attack waves. |
| Look at base | Points the camera at the action. |
| Start gold | The one that matters to the AI. Campaign AI pays real gold for everything it rebuilds and retrains, so a base that should keep rebuilding needs income: workers near a goldmine, or a `giveGold` trigger like this one. |
