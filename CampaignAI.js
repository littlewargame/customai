// Campaign AI: keeps a computer's base the way the map placed it, like the StarCraft campaign AI.
// - Lost buildings are rebuilt on the same spot by a worker.
// - Lost units are retrained and walk back to the post of the unit they replace.
// - A unit a trigger orders away (attackMoveTo) is released: it is left alone and replaced at once.
// - The garrison fights enemies that come into the base, then walks back to its posts.
// - Workers mine, and repair damaged buildings when the base is quiet.
// Attacks are left to the map's triggers. For several bases, give each base its own computer player.
// Everything costs real gold; with no gold the AI waits.

// Needs the getProducers / getOrigin API from newer game versions
if (!scope.getProducers) {
  return;
}

var DEFEND_RANGE = 12;      // enemies this close to a post or building are attacking the base
var HOME_TOLERANCE = 2;     // a guard this close to its post is home
var MINE_RANGE = 20;        // workers only mine goldmines this close to them
var BUILD_TIMEOUT = 30;     // seconds a builder gets to start a building before we try again
var STALL_TIMEOUT = 10;     // seconds without progress before an unfinished building gets a worker
var RETRY_DELAY = 60;       // seconds to wait after a building spot failed a few times
var MAX_BUILD_TRIES = 3;
var MAX_SHIFT = 6;          // how far a building may move when its old spot can't be built on
var CONTESTED_WAIT = 20;    // seconds to wait for a fight at a spot to end before rebuilding anyway
var HIT_MEMORY = 3;         // seconds an attack on us counts as a threat, even from out of sight
var SEARCH_DISTANCE = 10;   // how far towards an unseen attacker to look, about a catapult's range

var me = scope.getMyPlayerNumber();
var now = scope.getCurrentGameTimeInSec();

var producersCache = {};
function producersOf(typeName) {
  if (!(typeName in producersCache)) {
    producersCache[typeName] = scope.getProducers(typeName);
  }
  return producersCache[typeName];
}

function dist2(ax, ay, bx, by) {
  return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
}

// Remember everything the map placed for us: those are the posts and sites we keep filled
if (!scope.campaignAI) {
  var state = { posts: [], sites: [] };

  var startBuildings = scope.getBuildings({ player: me });
  for (var i = 0; i < startBuildings.length; i++) {
    var b = startBuildings[i];
    if (b.getOrigin() != 'map' || producersOf(b.getTypeName()).length == 0) {
      continue;
    }
    var at = b.getBuildPosition();
    state.sites.push({
      typeName: b.getTypeName(), typeId: b.getTypeId(), x: at.x, y: at.y, cx: b.getX(), cy: b.getY(), buildAt: null,
      buildingId: b.getUnitID(), builderId: null, orderedAt: 0, tries: 0, retryAt: 0, lastHp: 0, lastProgressAt: 0, contestedSince: null,
    });
  }

  var startUnits = scope.getUnits({ player: me });
  for (var i = 0; i < startUnits.length; i++) {
    var u = startUnits[i];
    if (u.getOrigin() != 'map' || producersOf(u.getTypeName()).length == 0) {
      continue;
    }
    state.posts.push({ typeName: u.getTypeName(), typeId: u.getTypeId(), x: u.getX(), y: u.getY(), unitId: u.getUnitID() });
  }

  scope.campaignAI = state;
}

var state = scope.campaignAI;
var gold = scope.getGold();
var freeSupply = scope.getMaxSupply() - scope.getCurrentSupply();

var myUnits = scope.getUnits({ player: me });
var myBuildings = scope.getBuildings({ player: me });
var unitById = {};
for (var i = 0; i < myUnits.length; i++) {
  unitById[myUnits[i].getUnitID()] = myUnits[i];
}
var buildingById = {};
for (var i = 0; i < myBuildings.length; i++) {
  buildingById[myBuildings[i].getUnitID()] = myBuildings[i];
}

// Builders are the unit types that can make one of our buildings, e.g. workers
var builderTypes = {};
for (var i = 0; i < state.sites.length; i++) {
  var producers = producersOf(state.sites[i].typeName);
  for (var j = 0; j < producers.length; j++) {
    builderTypes[producers[j].producerId] = true;
  }
}
function isBuilder(u) {
  return !!builderTypes[u.getTypeId()];
}

var ordered = {};  // one order per unit per update
function order(command, units, target) {
  var fresh = [];
  for (var i = 0; i < units.length; i++) {
    if (!ordered[units[i].getUnitID()]) {
      ordered[units[i].getUnitID()] = true;
      fresh.push(units[i]);
    }
  }
  if (fresh.length > 0) {
    scope.order(command, fresh, target);
  }
}

function isIdle(u) {
  return u.getCurrentOrderName() == 'Stop';
}

// Free the posts of units that died or that a trigger took away
var claimed = {};
for (var i = 0; i < state.posts.length; i++) {
  var post = state.posts[i];
  if (post.unitId == null) {
    continue;
  }
  var u = unitById[post.unitId];
  if (!u || u.wasOrderedByTrigger()) {
    post.unitId = null;
  } else {
    claimed[post.unitId] = true;
  }
}

// Units we trained fill the nearest empty post of their type and walk to it
var spare = {};
for (var i = 0; i < myUnits.length; i++) {
  var u = myUnits[i];
  if (u.getOrigin() != 'trained' || claimed[u.getUnitID()] || u.wasOrderedByTrigger()) {
    continue;
  }
  var best = null;
  for (var j = 0; j < state.posts.length; j++) {
    var post = state.posts[j];
    if (post.unitId == null && post.typeName == u.getTypeName() &&
        (!best || dist2(post.x, post.y, u.getX(), u.getY()) < dist2(best.x, best.y, u.getX(), u.getY()))) {
      best = post;
    }
  }
  if (best) {
    best.unitId = u.getUnitID();
    claimed[u.getUnitID()] = true;
  } else {
    spare[u.getTypeName()] = (spare[u.getTypeName()] || 0) + 1;
  }
}

// Enemies inside the base
var enemies = scope.getUnits({ enemyOf: me });
var threats = [];
for (var i = 0; i < enemies.length; i++) {
  var e = enemies[i];
  if (e.isNeutral() || e.getEffectiveValue('isInvincible')) {
    continue;
  }
  var near = false;
  for (var j = 0; j < state.sites.length && !near; j++) {
    near = dist2(state.sites[j].cx, state.sites[j].cy, e.getX(), e.getY()) < DEFEND_RANGE * DEFEND_RANGE;
  }
  for (var j = 0; j < state.posts.length && !near; j++) {
    near = dist2(state.posts[j].x, state.posts[j].y, e.getX(), e.getY()) < DEFEND_RANGE * DEFEND_RANGE;
  }
  if (near) {
    threats.push(e);
  }
}

// Ranged attackers can hit the base from out of sight, so go and look the way the shots came from
function spot(x, y) {
  return { getX: function() { return x; }, getY: function() { return y; } };
}
var attacked = myBuildings.concat(myUnits);
for (var i = 0; i < attacked.length; i++) {
  var hit = attacked[i].getLastAttack();
  if (hit && now - hit.time <= HIT_MEMORY) {
    threats.push(spot(hit.x + hit.direction.x * SEARCH_DISTANCE, hit.y + hit.direction.y * SEARCH_DISTANCE));
  }
}

// Rebuild lost buildings first: production and supply depend on them
var busyBuilders = {};
for (var i = 0; i < state.sites.length; i++) {
  if (state.sites[i].builderId != null) {
    busyBuilders[state.sites[i].builderId] = true;
  }
}

for (var i = 0; i < state.sites.length; i++) {
  var site = state.sites[i];
  var b = site.buildingId != null ? buildingById[site.buildingId] : null;

  // Our rebuild (or anything of the same type) now stands on the spot
  if (!b) {
    site.buildingId = null;
    var spot = site.buildAt || site;
    for (var j = 0; j < myBuildings.length; j++) {
      var at = myBuildings[j].getBuildPosition();
      if (myBuildings[j].getTypeName() == site.typeName && at.x == spot.x && at.y == spot.y) {
        b = myBuildings[j];
        site.buildingId = b.getUnitID();
        site.lastHp = b.getCurrentHP();
        site.lastProgressAt = now;
        break;
      }
    }
  }

  if (b) {
    if (site.builderId != null) {
      delete busyBuilders[site.builderId];
      site.builderId = null;
      site.tries = 0;
    }

    // An unfinished building with nobody working on it gets a worker
    if (b.isUnderConstruction()) {
      if (b.getCurrentHP() > site.lastHp) {
        site.lastHp = b.getCurrentHP();
        site.lastProgressAt = now;
      } else if (now - site.lastProgressAt > STALL_TIMEOUT && threats.length == 0) {
        var helper = null;
        for (var j = 0; j < myUnits.length; j++) {
          var w = myUnits[j];
          if (isBuilder(w) && !busyBuilders[w.getUnitID()] && !w.wasOrderedByTrigger() &&
              (!helper || dist2(w.getX(), w.getY(), site.cx, site.cy) < dist2(helper.getX(), helper.getY(), site.cx, site.cy))) {
            helper = w;
          }
        }
        if (helper) {
          order('repair', [ helper ], { unit: b });
          site.lastProgressAt = now;
        }
      }
    }
    continue;
  }

  // A builder is on its way
  if (site.builderId != null) {
    var builder = unitById[site.builderId];
    if (builder && now - site.orderedAt < BUILD_TIMEOUT && !isIdle(builder)) {
      continue;
    }
    delete busyBuilders[site.builderId];
    site.builderId = null;
    site.tries++;
    if (site.tries >= MAX_BUILD_TRIES) {
      site.tries = 0;
      site.retryAt = now + RETRY_DELAY;
    }
  }

  if (now < site.retryAt) {
    continue;
  }

  // Wait a while for the fighting to end rather than walk a worker into it
  var contested = false;
  for (var j = 0; j < threats.length && !contested; j++) {
    contested = dist2(site.cx, site.cy, threats[j].getX(), threats[j].getY()) < DEFEND_RANGE * DEFEND_RANGE;
  }
  if (!contested) {
    site.contestedSince = null;
  } else if (site.contestedSince == null) {
    site.contestedSince = now;
  }
  if (contested && now - site.contestedSince < CONTESTED_WAIT) {
    continue;
  }

  // Maps may place buildings where the game wouldn't let a worker build, e.g. a castle near a goldmine
  site.buildAt = null;
  if (!scope.canBuildAt(site.x, site.y, site.typeId)) {
    for (var r = 1; r <= MAX_SHIFT && !site.buildAt; r++) {
      for (var dx = -r; dx <= r && !site.buildAt; dx++) {
        for (var dy = -r; dy <= r && !site.buildAt; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) == r && scope.canBuildAt(site.x + dx, site.y + dy, site.typeId)) {
            site.buildAt = { x: site.x + dx, y: site.y + dy };
          }
        }
      }
    }
  }
  var spot = site.buildAt || site;

  var cost = scope.getTypeFieldValue(site.typeId, 'cost') || 0;
  if (gold < cost) {
    gold = 0; // save up for it rather than spending the gold on units
    continue;
  }

  // The nearest free unit that can build it
  var producers = producersOf(site.typeName);
  var best = null;
  var bestCommand = null;
  for (var j = 0; j < myUnits.length; j++) {
    var w = myUnits[j];
    if (busyBuilders[w.getUnitID()] || ordered[w.getUnitID()] || w.wasOrderedByTrigger()) {
      continue;
    }
    for (var k = 0; k < producers.length; k++) {
      if (producers[k].producerId == w.getTypeId() &&
          (!best || dist2(w.getX(), w.getY(), site.cx, site.cy) < dist2(best.getX(), best.getY(), site.cx, site.cy))) {
        best = w;
        bestCommand = producers[k].command;
      }
    }
  }

  if (best) {
    order(bestCommand, [ best ], { x: spot.x, y: spot.y });
    site.builderId = best.getUnitID();
    site.orderedAt = now;
    busyBuilders[best.getUnitID()] = true;
    gold -= cost;
  }
}

// Retrain units for empty posts
var queued = {};
var makers = myBuildings.concat(myUnits);
for (var i = 0; i < makers.length; i++) {
  for (var slot = 1; slot <= 10; slot++) {
    var name = makers[i].getUnitTypeNameInProductionQueAt(slot);
    if (!name) {
      break;
    }
    queued[name] = (queued[name] || 0) + 1;
  }
}

for (var i = 0; i < state.posts.length; i++) {
  var post = state.posts[i];
  if (post.unitId != null) {
    continue;
  }
  if (spare[post.typeName] > 0) {
    spare[post.typeName]--;
    continue;
  }
  if (queued[post.typeName] > 0) {
    queued[post.typeName]--;
    continue;
  }

  var cost = scope.getTypeFieldValue(post.typeId, 'cost') || 0;
  var supply = scope.getTypeFieldValue(post.typeId, 'supply') || 0;
  if (gold < cost || freeSupply < supply) {
    continue;
  }

  var producers = producersOf(post.typeName);
  for (var j = 0; j < producers.length; j++) {
    var makersOfType = [];
    for (var k = 0; k < makers.length; k++) {
      if (makers[k].getTypeId() == producers[j].producerId && !makers[k].isUnderConstruction()) {
        makersOfType.push(makers[k]);
      }
    }
    if (makersOfType.length > 0) {
      scope.order(producers[j].command, makersOfType);
      gold -= cost;
      freeSupply -= supply;
      break;
    }
  }
}

// The garrison: units on posts that aren't builders
for (var i = 0; i < state.posts.length; i++) {
  var post = state.posts[i];
  var u = post.unitId != null ? unitById[post.unitId] : null;
  if (!u || isBuilder(u) || ordered[u.getUnitID()]) {
    continue;
  }

  if (threats.length > 0) {
    var target = null;
    for (var j = 0; j < threats.length; j++) {
      if (!target || dist2(u.getX(), u.getY(), threats[j].getX(), threats[j].getY()) <
                     dist2(u.getX(), u.getY(), target.getX(), target.getY())) {
        target = threats[j];
      }
    }
    if (target) {
      // Head for the threat unless already fighting, or already on the way to it
      var fighting = u.getValue('targetUnit') || u.getCurrentOrderName() == 'Attack';
      var heading = u.getCurrentOrderName() == 'AMove' ? u.getValue('target') : null;
      var onTheWay = heading && dist2(heading.px, heading.py, target.getX(), target.getY()) < 16;
      if (!fighting && !onTheWay) {
        order('amove', [ u ], { x: target.getX(), y: target.getY() });
      }
      continue;
    }
  }

  if (isIdle(u) && dist2(u.getX(), u.getY(), post.x, post.y) > HOME_TOLERANCE * HOME_TOLERANCE) {
    order('amove', [ u ], { x: post.x, y: post.y });
  }
}

// Idle workers repair damaged buildings when the base is quiet, and otherwise mine
var damaged = [];
if (threats.length == 0) {
  for (var i = 0; i < myBuildings.length; i++) {
    var b = myBuildings[i];
    if (!b.isUnderConstruction() && b.getCurrentHP() < b.getEffectiveValue('hp')) {
      damaged.push(b);
    }
  }
}

var mines = scope.getBuildings({ type: 'Goldmine' });
for (var i = 0; i < myUnits.length; i++) {
  var w = myUnits[i];
  if (!isBuilder(w) || !isIdle(w) || busyBuilders[w.getUnitID()] || ordered[w.getUnitID()] || w.wasOrderedByTrigger()) {
    continue;
  }

  if (damaged.length > 0) {
    order('repair', [ w ], { unit: damaged.shift() });
    continue;
  }

  var mine = null;
  for (var j = 0; j < mines.length; j++) {
    var d = dist2(w.getX(), w.getY(), mines[j].getX(), mines[j].getY());
    if (mines[j].getValue('gold') > 0 && d < MINE_RANGE * MINE_RANGE &&
        (!mine || d < dist2(w.getX(), w.getY(), mine.getX(), mine.getY()))) {
      mine = mines[j];
    }
  }
  if (mine) {
    order('mine', [ w ], { unit: mine });
  }
}
