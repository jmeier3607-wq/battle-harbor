# Battle Harbor

Battle Harbor is a small multiplayer top-down ship browser game. Players sail through a persistent 20000 x 20000 open world, fight server-controlled bots and other players, collect temporary loot, then secure it by returning to Harbor or surviving a 90-second exit.

## Installation

```bash
npm install
```

## Start

```bash
npm start
```

Open the game at:

```text
http://localhost:3000
```

`localhost` only works on the computer running the server. For people outside your WLAN, deploy the project to a public Node.js host and share the public URL.

## Online Deployment

Battle Harbor is ready for Node.js hosting providers such as Render or Railway.

Deployment steps:

1. Upload the `battle-harbor` project to GitHub.
2. Create a new Web Service on Render or Railway.
3. Connect the GitHub repository.
4. Set the build command to:

```bash
npm install
```

5. Set the start command to:

```bash
npm start
```

6. Deploy the service.
7. Open the public hosting URL after deployment. Other players can use that same URL to join the same world.

Important deployment details:

- The server uses `process.env.PORT || 3000`, so local development still uses port 3000 and Render/Railway can inject their required runtime port.
- The client uses `io()` with no hardcoded localhost URL, so Socket.io connects to the same domain that serves the website.
- Express serves the `public/` folder, including `public/index.html`, `public/style.css`, and `public/client.js`.
- A `render.yaml` file is included for Render blueprint deployments.

Render settings:

```text
Environment: Node
Root Directory: battle-harbor, if your repository contains a parent workspace
Build Command: npm install
Start Command: npm start
```

Railway settings:

```text
Root Directory: battle-harbor, if your repository contains a parent workspace
Build Command: npm install
Start Command: npm start
```

Online multiplayer test:

1. Open the deployed URL on your PC.
2. Open the same URL on a phone using mobile data or another network.
3. Join with two different names.
4. Check that both players appear in the same world.
5. Test chat, movement, shooting, bots, loot, minimap, and respawn.

## Railway Deployment

Battle Harbor is prepared for Railway Hobby as a public Node.js web service.

1. Push the project to GitHub.
2. Create or open a Railway account.
3. Click `New Project`.
4. Choose `Deploy from GitHub Repo`.
5. Select the repository that contains `battle-harbor`.
6. If the repository contains a parent workspace, set the root directory to `battle-harbor`.
7. Railway should detect Node.js automatically.
8. Set the start command to:

```bash
npm start
```

9. Railway sets `PORT` automatically. The server uses `process.env.PORT || 3000` and binds to `0.0.0.0`.
10. After deploy, Railway gives you a public URL. Share that URL with friends.

Runtime checks:

- `GET /health` returns JSON with server status, player count, bot count, and uptime.
- `localhost` only works on the computer running the server.
- The browser client uses `io()` without a localhost URL, so Socket.io connects to the same public Railway domain.
- Railway Hobby is recommended for longer 24/7 sessions instead of temporary tunnel or free/test hosting.

Performance model:

- Server simulation: 30 Hz.
- Detailed network state: 12 Hz per active player.
- Minimap payload: 1 Hz with compact points.
- Debug/server stats: 1 Hz.
- Detailed objects are sent only near the player; static map data is sent once on join.

## Controls

- W or arrow up: accelerate forward in the ship's facing direction
- S or arrow down: brake or reverse slowly
- A/D or arrow left/right: turn the ship's bow
- Shift: hold to boost while boost energy is available
- Mouse: aim
- Left click or Space: shoot
- E: start exit
- M: toggle minimap
- Enter: focus chat
- Esc: leave chat input

## Game Rules

- Harbor secures loot. It no longer gives permanent invulnerability.
- Players spawn at random valid map positions, not in Harbor. Low-level players spawn mainly near Coast, mid-level players can spawn near Wreck Field, and high-level players can spawn farther out.
- After spawning or respawning, players get 5 seconds of spawn protection. During protection they cannot take damage, cannot shoot, and cannot boost.
- Temporary loot is risky and can be lost on death.
- Entering Harbor immediately secures temporary loot.
- Outside Harbor, pressing E starts a 90-second exit. Survive the countdown to secure loot and return to Harbor.
- Bots are managed by a population manager: `targetBots = clamp(150 - playerCount * 15, 45, 150)`. Set `SERVER_PERFORMANCE_MODE=1` for a lower 90-bot cap on small hosting plans.
- Bots spawn away from Harbor, players, obstacles, loot, and items. Coast gets mostly weak bots, Wreck Field gets medium bots, and Storm/Deep Water gets stronger bots.
- Bots can use all 25 ship classes with weighted rarity. Strong endgame bot ships are much rarer and appear mainly farther from beginner areas.
- Destroyed bots grant loot and XP. Kill loot is split between the last hitter and assisting damage dealers.
- Destroyed players keep secured points but lose temporary loot. Half of that temporary loot drops as a crate.
- After 5 seconds without taking damage, players regenerate 5% max HP per second until full HP.
- Full Repair Kits restore HP to full immediately.
- Boost Battery items recharge boost energy by up to 50 points.
- Boost energy is server-authoritative. Holding Shift drains energy; letting go stops boost. Energy slowly regenerates after 8 seconds without boosting.
- Back to Lobby removes the player from the world. Temporary loot is lost after confirmation, but secured progress remains.
- Alliances use server-authoritative invites. Use the player list, "Ally nearest", `/accept name`, `/decline name`, or the Accept/Decline buttons. Alliances are capped at three players and cannot be formed during combat.
- The minimap shows the whole map: own ship in white, other players in blue, allies in green, bots in red/orange, strong bots larger/orange, Harbor, land, rocks, loot, items, and N/S/E/W labels.
- Mobile browsers get touch controls: virtual joystick, Fire, Boost, Exit, and Map buttons. Landscape orientation is recommended.
- Chat has Global and Alliance channels. A simple server-side filter blocks long messages, spam, repeated characters, and placeholder banned words.

## Ships

Battle Harbor has 25 buyable ships:

Dinghy, Scout, Gunboat, Cannoner, Heavy, Skimmer, Patrol MK2, Raider, Twin Scout, Iron Patrol, Storm Cutter, Barracuda, Breaker, Longshot, Guardian, Trident, Viper, Hammerhead, Tempest, Fortress, Phantom, Leviathan, Reaper, Monarch, and Harbor King.

Each ship has separate acceleration, friction, turn speed, top speed, reverse speed, boost multiplier, weapon pattern, and fire cooldown. Larger ships hit harder and survive longer, but accelerate and turn more slowly. Small ships stay useful for looting, escaping, turning, and boost-heavy play.
Buying a ship subtracts its exact price from secured points. Already owned ships can be selected again for free.
Each ship has persistent per-ship upgrades stored in `localStorage`: HP, Speed, Turn, Damage, Reload, and Boost. Upgrades cost secured points and have five levels.

The lobby ship list is scrollable, shows stats and prices for all ships, and includes a selected-ship preview above the list.

Progress is stored locally in the browser with `localStorage`: nickname, secured points, level, XP, unlocked ships, selected ship, and ship upgrades.

## Project Structure

```text
battle-harbor/
  package.json
  server.js
  README.md
  public/
    index.html
    style.css
    client.js
```

## Known Limitations

- Version 1.0 uses Canvas-only graphics: layered water, harbor details, islands, rocks, wrecks, item glow, projectile glow, wake trails, damage flashes, and explosion glows.
- Bot navigation avoids islands and rocks roughly, not with advanced pathfinding.
- Client rendering uses direct server snapshots without advanced interpolation.
- Local progress can be edited by a player because there are no accounts or database yet.
- Ship purchase and local progress are intentionally lightweight for this first version.
- The chat filter uses a small placeholder banned-word list that should be expanded before public use.
- Alliance invites are in-memory only. They reset when the server restarts.
- Bot-vs-bot kills do not create player loot unless a player contributed damage.
- The large map uses fixed procedural-style objects, not streamed map chunks.
- Spawn protection is time-based only; there is no visual collision grace period after it ends.
- Items use simple random respawning and do not yet avoid every possible combat hotspot.
- Hit effects are lightweight Canvas glows rather than a full particle system.
- Upgrades are validated and applied by the server during a session, but without accounts the saved upgrade data still comes from local browser storage.
- Bot population is controlled globally. Clients receive nearby detailed bot state for world rendering and compact all-bot data for the whole-map minimap.

## Next Planned Features For 1.1

- Better bot pathfinding around islands and rocks.
- More ships and deeper weapon tuning.
- Stronger server validation for local progress and ship ownership.
- Sound effects made in-house or generated specifically for the project.
- More interesting map zones, hazards, and visual effects.
