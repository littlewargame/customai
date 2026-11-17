// Macro bot: grows an economy over several bases and scales production with it. One barracks on one base, up to 4 on two, then a third base and more.
// It holds its army back until it is big, pulls workers only into fights the army would lose alone, and keeps every base's goldmine evenly mined.
// Every choice is a pure function of the game state and scope.getRandomNumber (no Math.random, no Date, sorts tie-break on unit id), so every computer plays it identically.
var me = scope.getMyPlayerNumber();
var S = scope.macro;
var byId = function(a, b) { return a.getUnitID() - b.getUnitID(); };
var dist = function(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); };
var dU = function(u, x, y) { return dist(u.getX(), u.getY(), x, y); };
var now = scope.getCurrentGameTimeInSec();
var costOf = function(t) { return scope.getTypeFieldValue(t, 'cost'); };

if (!S) {
  S = scope.macro = {enemy: null, builds: {}, pulled: {}, repairers: {}, prog: {}, mode: 'gather', nextTrain: 0, spotTry: 0, capped: false};
  var players = scope.getArrayOfPlayerNumbers();
  for (var i = 0; i < players.length; i++) {
    if (scope.getTeamNumber(players[i]) !== scope.getMyTeamNumber() && S.enemy === null) { S.enemy = players[i]; }
  }
  S.start = scope.getStartLocationForPlayerNumber(me);
  S.estart = S.enemy === null ? null : scope.getStartLocationForPlayerNumber(S.enemy);
  S.jitter = scope.getRandomNumber(0, 5);
}
if (!S.estart || !S.start) { return; }
if (!scope.playerIsAlive(S.enemy)) {
  var others = scope.getArrayOfPlayerNumbers();
  for (var i = 0; i < others.length; i++) {
    if (scope.getTeamNumber(others[i]) !== scope.getMyTeamNumber() && scope.playerIsAlive(others[i])) { S.enemy = others[i]; S.estart = scope.getStartLocationForPlayerNumber(others[i]); break; }
  }
}

// ---------- what I have
var units = scope.getUnits({player: me}).sort(byId);
var workers = units.filter(function(u) { return u.getTypeName() === 'Worker'; });
var army = units.filter(function(u) { return u.getTypeName() !== 'Worker' && u.getFieldValue('dmg') > 0; });
var buildings = scope.getBuildings({player: me}).sort(byId);
var ofType = function(t) { return buildings.filter(function(b) { return b.getTypeName() === t; }); };
var castles = buildings.filter(function(b) { return b.getTypeName() === 'Castle' || b.getTypeName() === 'Fortress'; });
var castlesDone = castles.filter(function(b) { return !b.isUnderConstruction(); });
var rax = ofType('Barracks');
var raxDone = rax.filter(function(b) { return !b.isUnderConstruction(); });
var houses = ofType('House');
var towers = ofType('Watchtower');
var forges = ofType('Forge');
var gold = scope.getGold();
var supply = scope.getCurrentSupply();
var maxSupply = scope.getMaxSupply();
var allMines = scope.getBuildings({type: 'Goldmine'}).sort(byId);
var mines = allMines.filter(function(m) { return m.getValue('gold') > 0; });
if (!castles.length && !workers.length) { return; }
var home = castles.length ? castles[0] : workers[0];
var homeX = home.getX(), homeY = home.getY();

var nearest = function(list, x, y) {
  var best = null, bd = 1e9;
  for (var i = 0; i < list.length; i++) {
    var d = dU(list[i], x, y);
    if (d < bd) { bd = d; best = list[i]; }
  }
  return best;
};

// ---------- bases: each finished castle and the goldmine it works
var bases = [];
for (var i = 0; i < castlesDone.length; i++) {
  var c = castlesDone[i];
  var m = nearest(mines, c.getX(), c.getY());
  if (m && dU(m, c.getX(), c.getY()) < 14) { bases.push({castle: c, mine: m, x: c.getX(), y: c.getY(), miners: []}); }
}
var baseOfMine = {};
for (var i = 0; i < bases.length; i++) { baseOfMine[bases[i].mine.getUnitID()] = bases[i]; }
var nearestBase = function(u) {
  var nb = null, nd = 1e9;
  for (var j = 0; j < bases.length; j++) { var d = dU(u, bases[j].x, bases[j].y); if (d < nd) { nd = d; nb = bases[j]; } }
  return nb;
};

// ---------- the enemy
var enemyUnits = scope.getUnits({enemyOf: me}).filter(function(u) { return !u.isNeutral(); }).sort(byId);
var enemyBuildings = scope.getBuildings({enemyOf: me}).filter(function(b) { return !b.isNeutral() && b.getTypeName() !== 'Goldmine'; }).sort(byId);
var enemyArmy = enemyUnits.filter(function(u) { return u.getTypeName() !== 'Worker'; });

// fighting strength: by Lanchester's square law a group's strength is the square of the sum of sqrt(hp * dps), so comparing the sums compares the groups
var power = function(list) {
  var p = 0;
  for (var i = 0; i < list.length; i++) {
    var u = list[i];
    var dmg = u.getFieldValue('dmg') || 0, cd = u.getFieldValue('weaponCooldown') || 20;
    if (dmg <= 0) { continue; }
    var dps = dmg * 20 / cd;
    // reach is worth a lot: archers fire over the soldiers and siege engines fire from out of sight
    var reach = u.getFieldValue('range') || 0;
    if (reach > 2) { dps *= 1 + reach / 10; }
    p += Math.sqrt(Math.max(0, u.getCurrentHP()) * dps);
  }
  return p;
};
var within = function(list, x, y, r) { return list.filter(function(u) { return dU(u, x, y) < r; }); };

// ---------- mining: count each base's miners, spread workers evenly, new and idle workers mine at the base they are at
var isBusy = function(w) {
  var o = w.getCurrentOrderName() || '';
  return o.indexOf('Build') === 0 || o === 'Repair';
};
var pulledIds = S.pulled;
var miners = [];
for (var i = 0; i < workers.length; i++) {
  var w = workers[i];
  var gm = w.getValue('goldMine');
  if (w.getCurrentOrderName() === 'Mine' && gm && baseOfMine[gm.id]) { baseOfMine[gm.id].miners.push(w); miners.push(w); }
}
var busyIds = {};
for (var k in S.builds) { if (S.builds[k] && S.builds[k].wid) { busyIds[S.builds[k].wid] = 1; } }
for (var k in S.repairers) { busyIds[S.repairers[k]] = 1; }
if (S.scoutW) { busyIds[S.scoutW] = 1; }
S.busters = S.busters || {};
for (var k in S.busters) { busyIds[k] = 1; }
// a base with an enemy army at it gets no new miners
for (var i = 0; i < bases.length; i++) { bases[i].danger = within(enemyArmy, bases[i].x, bases[i].y, 16).length > 0; }
var leastMined = function() {
  var best = null;
  for (var i = 0; i < bases.length; i++) { if (!bases[i].danger && (!best || bases[i].miners.length < best.miners.length)) { best = bases[i]; } }
  return best;
};
var sendToMine = function(w, b) { scope.order('Mine', [w], {unit: b.mine}); b.miners.push(w); };
if (bases.length) {
  for (var i = 0; i < workers.length; i++) {
    var w = workers[i], id = w.getUnitID();
    if (pulledIds[id] || busyIds[id]) { continue; }
    var o = w.getCurrentOrderName();
    var gm = w.getValue('goldMine');
    var mining = o === 'Mine' && gm && baseOfMine[gm.id];
    if (mining) { continue; }
    if (o === 'Stop' || o === 'Mine' || o === 'AMove' || o === 'Move' || o === 'Attack' || o === null) {
      if (isBusy(w)) { continue; }
      // the nearest base unless it is full, then the least mined one
      var nb = null, nd = 1e9;
      for (var j = 0; j < bases.length; j++) { var d = dU(w, bases[j].x, bases[j].y); if (d < nd) { nd = d; nb = bases[j]; } }
      if (nb && (nb.miners.length >= 12 || nb.danger)) { nb = leastMined() || nb; }
      if (nb) { sendToMine(w, nb); }
    }
  }
  // rebalance: move a few workers from the most mined base to the least
  if (bases.length > 1 && !(now - (S.lastBal || -99) < 5)) {
    S.lastBal = now;
    var hi = null, lo = null;
    for (var i = 0; i < bases.length; i++) {
      if (!hi || bases[i].miners.length > hi.miners.length) { hi = bases[i]; }
      if (!bases[i].danger && (!lo || bases[i].miners.length < lo.miners.length)) { lo = bases[i]; }
    }
    var moveN = lo ? Math.floor((hi.miners.length - lo.miners.length) / 2) : 0;
    if (lo && moveN >= 1 && hi !== lo) {
      var movers = hi.miners.filter(function(w) { return !busyIds[w.getUnitID()]; }).sort(function(a, b) { return dU(a, lo.x, lo.y) - dU(b, lo.x, lo.y) || a.getUnitID() - b.getUnitID(); }).slice(0, Math.min(moveN, 4));
      if (movers.length) { scope.order('Mine', movers, {unit: lo.mine}); }
    }
  }
}

// a worker for a build near (x, y): a miner, nearest the spot, never one already busy
var takeBuilder = function(x, y) {
  var best = null, bd = 1e9;
  for (var i = 0; i < miners.length; i++) {
    var w = miners[i];
    if (busyIds[w.getUnitID()] || pulledIds[w.getUnitID()]) { continue; }
    var d = dU(w, x, y);
    if (d < bd) { bd = d; best = w; }
  }
  if (!best) {
    for (var i = 0; i < workers.length; i++) {
      var w = workers[i];
      if (busyIds[w.getUnitID()] || pulledIds[w.getUnitID()] || isBusy(w)) { continue; }
      var d = dU(w, x, y);
      if (d < bd) { bd = d; best = w; }
    }
  }
  if (best) { busyIds[best.getUnitID()] = 1; }
  return best;
};

// ---------- threats: enemies at my bases, and enemy buildings near home (proxy barracks)
// the base under the heaviest attack, so a raid on one base does not pull the army away from a real attack on another
var threatAt = null, threatUnits = [], threatPow = -1;
for (var i = 0; i < castles.length; i++) {
  var c = castles[i];
  var near = within(enemyUnits, c.getX(), c.getY(), 16);
  if (near.length && power(near) > threatPow) { threatAt = c; threatUnits = near; threatPow = power(near); }
}
if (!threatAt) {
  for (var i = 0; i < buildings.length; i++) {
    var near = within(enemyUnits, buildings[i].getX(), buildings[i].getY(), 9);
    if (near.length && power(near) > threatPow) { threatAt = buildings[i]; threatUnits = near; threatPow = power(near); }
  }
}
var threatArmy = threatUnits.filter(function(u) { return u.getTypeName() !== 'Worker'; });
var proxies = enemyBuildings.filter(function(b) { return dist(b.getX(), b.getY(), homeX, homeY) < 45 && dist(b.getX(), b.getY(), homeX, homeY) < dist(b.getX(), b.getY(), S.estart.x, S.estart.y); });

// ---------- builds: each kind has one pending order, re-issued until the building stands; a stalled construction gets a new worker
var spotNear = function(type, cx, cy, rs, avoid) {
  var awayAng = Math.atan2(cy - S.estart.y, cx - S.estart.x);
  var skip = (S.spotTry++ + S.jitter) % 5, seen = 0, first = null;
  var mine = nearest(mines, cx, cy);
  for (var r = rs; r < rs + 14; r += 2) {
    for (var a = 0; a < 16; a++) {
      var ang = awayAng + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * Math.PI / 8;
      var x = Math.round(cx + Math.cos(ang) * r), y = Math.round(cy + Math.sin(ang) * r);
      if (x < 2 || y < 2 || x > scope.getMapWidth() - 5 || y > scope.getMapHeight() - 5) { continue; }
      // stay off the walk between the castle and its goldmine
      if (mine && avoid) {
        var mx = mine.getX(), my = mine.getY();
        var vx = mx - cx, vy = my - cy, L = vx * vx + vy * vy;
        var t = L ? Math.max(0, Math.min(1, ((x - cx) * vx + (y - cy) * vy) / L)) : 0;
        if (dist(x, y, cx + vx * t, cy + vy * t) < 5) { continue; }
      }
      if (!scope.canBuildAt(x, y, type)) { continue; }
      var ref = workers.length ? workers[0] : null;
      if (ref && !scope.isReachable(ref.getX(), ref.getY(), x, y)) { continue; }
      if (!first) { first = {x: x, y: y}; }
      if (seen++ >= skip) { return {x: x, y: y}; }
    }
  }
  return first;
};
// a building of this type at about this spot, standing or under construction
var standsAt = function(type, sp) {
  for (var i = 0; i < buildings.length; i++) {
    if (buildings[i].getTypeName() === type && dist(buildings[i].getX(), buildings[i].getY(), sp.x, sp.y) < 4) { return buildings[i]; }
  }
  return null;
};
var workerById = function(id) {
  for (var i = 0; i < workers.length; i++) { if (workers[i].getUnitID() === id) { return workers[i]; } }
  return null;
};
// start or keep alive the build of key (one at a time per key)
var build = function(key, type, typeId, spotFn) {
  var B = S.builds[key];
  var cost = costOf(typeId);
  if (B && standsAt(type, B.sp)) { delete S.builds[key]; return 'placed'; }
  var tries = 0, sp = null;
  if (B) {
    var w = workerById(B.wid);
    if (w && w.getCurrentOrderName() === 'Build ' + type && now - B.t < B.limit) { return 'walking'; }
    // the order failed or the worker died: try again, at another spot after the first retry
    delete S.builds[key];
    busyIds[B.wid] = 0;
    tries = B.tries + 1;
    if (B.tries < 1 && scope.canBuildAt(B.sp.x, B.sp.y, typeId)) { sp = B.sp; }
  }
  if (gold < cost) { return 'waiting'; }
  sp = sp || spotFn();
  if (!sp) { return 'nospot'; }
  var nw = takeBuilder(sp.x, sp.y);
  if (!nw) { return 'nobuilder'; }
  scope.order('Build ' + type, [nw], sp);
  gold -= cost;
  S.builds[key] = {sp: sp, wid: nw.getUnitID(), t: now, limit: 20 + dU(nw, sp.x, sp.y) / 2, tries: tries};
  return 'ordered';
};

// a construction nobody is working on (its builder was killed or pulled away) gets the nearest worker
for (var i = 0; i < buildings.length; i++) {
  var b = buildings[i];
  var id = b.getUnitID();
  if (!b.isUnderConstruction()) { delete S.prog[id]; delete S.repairers[id]; continue; }
  var left = b.getValue('buildTicksLeft');
  var P = S.prog[id];
  S.prog[id] = {left: left, t: now};
  if (!P || P.left !== left) { continue; }
  var rw = S.repairers[id] ? workerById(S.repairers[id]) : null;
  if (rw && rw.getCurrentOrderName() === 'Repair') { continue; }
  // stalled: wait while enemies stand on it, then send a worker
  if (within(enemyArmy, b.getX(), b.getY(), 8).length > within(army, b.getX(), b.getY(), 10).length) { continue; }
  var nw = takeBuilder(b.getX(), b.getY());
  if (nw) {
    scope.order('Repair', [nw], {unit: b});
    S.repairers[id] = nw.getUnitID();
  }
}
for (var k in S.repairers) {
  var rw = workerById(S.repairers[k]);
  if (!rw) { delete S.repairers[k]; }
}

// ---------- expansions
var allCastles = scope.getBuildings({type: 'Castle'}).concat(scope.getBuildings({type: 'Fortress'}));
var freeMines = mines.filter(function(m) {
  if (m.getValue('gold') < 1500) { return false; }
  for (var j = 0; j < allCastles.length; j++) { if (dU(allCastles[j], m.getX(), m.getY()) < 14) { return false; } }
  for (var j = 0; j < enemyBuildings.length; j++) { if (dU(enemyBuildings[j], m.getX(), m.getY()) < 12) { return false; } }
  return true;
});
S.mineDist = S.mineDist || {};
var refW = workers.length ? workers[0] : null;
// ground distances from my start and the enemy's to each goldmine, worked out once
var groundTo = function(m) {
  var id = m.getUnitID();
  if (S.mineDist[id] === undefined && refW) {
    var p = scope.getClosestReachableField(refW.getX(), refW.getY(), m.getX(), m.getY());
    var h = scope.getClosestReachableField(refW.getX(), refW.getY(), S.start.x, S.start.y);
    var e = scope.getClosestReachableField(refW.getX(), refW.getY(), S.estart.x, S.estart.y);
    var dh = p && h ? scope.getGroundDistance(h.x, h.y, p.x, p.y) : 0;
    var de = p && e ? scope.getGroundDistance(e.x, e.y, p.x, p.y) : 0;
    if (!(dh > 0)) { dh = dist(m.getX(), m.getY(), S.start.x, S.start.y) * 1.3; }
    if (!(de > 0)) { de = dist(m.getX(), m.getY(), S.estart.x, S.estart.y) * 1.3; }
    S.mineDist[id] = {h: dh, e: de};
  }
  return S.mineDist[id] || {h: 1e9, e: 0};
};
// the nearest free goldmine to my bases, on my side of the map
var bestExpansion = function() {
  var best = null, bd = 1e9;
  for (var i = 0; i < freeMines.length; i++) {
    var m = freeMines[i], g = groundTo(m);
    var near = 1e9;
    for (var j = 0; j < castles.length; j++) { near = Math.min(near, dU(castles[j], m.getX(), m.getY())); }
    var score = g.h + 0.5 * near - 0.3 * g.e + (g.e < g.h ? 40 : 0);
    if (score < bd) { bd = score; best = m; }
  }
  return best;
};
var castleSpot = function(m) {
  var best = null, bd = 1e9;
  for (var dx = -11; dx <= 11; dx++) {
    for (var dy = -11; dy <= 11; dy++) {
      var x = Math.round(m.getX()) + dx, y = Math.round(m.getY()) + dy;
      var d = dist(x + 2, y + 2, m.getX(), m.getY());
      if (d > 11 || d >= bd) { continue; }
      if (!scope.canBuildAt(x, y, 'castle')) { continue; }
      if (refW && !scope.isReachable(refW.getX(), refW.getY(), x, y)) { continue; }
      bd = d + dist(x, y, homeX, homeY) * 0.01; best = {x: x, y: y};
    }
  }
  return best;
};

// ---------- the plan: one barracks on one base, four on two, a third base, then more
var activeBases = bases.length;
var wantBases = 1;
if (workers.length >= 12 && now > 90) { wantBases = 2; }
if (castlesDone.length >= 2 && workers.length >= 20 && rax.length >= 3) { wantBases = 3; }
if (castlesDone.length >= 3 && workers.length >= 32) { wantBases = 4; }
// a base whose goldmine has run dry is no base, so replace it
wantBases += castlesDone.length - activeBases;
var wantRax = 1;
if (castlesDone.length >= 2) { wantRax = Math.max(1, Math.min(4, 1 + Math.floor((workers.length - 12) / 3))); }
if (castlesDone.length >= 3) { wantRax = Math.max(4, Math.min(7, 4 + Math.floor((workers.length - 26) / 5))); }

// supply: houses before the cap blocks production
var houseCost = costOf('house');
var supplyBuilt = 10 * (castlesDone.length + houses.filter(function(h) { return !h.isUnderConstruction(); }).length);
if (supplyBuilt > maxSupply + 5) { S.capped = true; }
var housesUp = houses.filter(function(h) { return h.isUnderConstruction(); }).length + (S.builds.house ? 1 : 0);
// what production adds in about one house's build time
var buffer = raxDone.length * 3 + castlesDone.length + 1;
var supplyComing = 10 * housesUp;
var needHouse = !S.capped && supply + buffer >= maxSupply + supplyComing && (housesUp < 1 || (housesUp < 3 && buffer > 8));

var workerCost = costOf('worker');
var soldierCost = costOf('soldier'), archerCost = costOf('archer');
var castleCost = costOf('castle'), raxCost = costOf('barracks'), towerCost = costOf('watchtower') + 5 * towers.length;
var underAttack = threatArmy.length > 0;
var homeSafe = !underAttack;

// ---------- spending, in order
// 1. a house when supply is about to block production
if (needHouse || S.builds.house) {
  build('house', 'House', 'house', function() {
    // by the main, or by another base once the main is full
    var sp = spotNear('house', homeX, homeY, 6, true);
    for (var i = 0; i < bases.length && !sp; i++) { sp = spotNear('house', bases[i].x, bases[i].y, 6, true); }
    return sp;
  });
}
var reserve = needHouse && !S.builds.house ? houseCost : 0;

// 2. the army from every barracks, soldiers in front and archers behind; from the third base on, the next castle comes first
if (underAttack) { S.lastThreatT = now; }
// the next castle takes gold ahead of units only while the army is decent and nothing has attacked lately
var castleFirst = castles.length >= 2 && castles.length < wantBases && army.length >= 14 && now - (S.lastThreatT || -99) > 30 && !S.builds.castle && bestExpansion() !== null;
// a forge and its upgrades get their gold ahead of more units once the economy is up
var wantForge = castlesDone.length >= 2 && raxDone.length >= 3 && workers.length >= 18;
var forgeDone = forges.filter(function(f) { return !f.isUnderConstruction(); });
var upgLevel = Math.min(scope.getUpgradeLevel('Attack Upgrade') || 0, scope.getUpgradeLevel('Armor Upgrade') || 0);
var forgeIdle = forgeDone.length > 0 && !forgeDone[0].getUnitTypeNameInProductionQueAt(1) && upgLevel < 5;
var techReserve = (wantForge && forges.length < 1 && !S.builds.forge ? 150 : 0) + (forgeIdle ? 150 + 50 * upgLevel : 0);
var unitReserve = reserve + (castleFirst ? castleCost : 0) + (underAttack ? 0 : techReserve);
for (var i = 0; i < raxDone.length; i++) {
  var b = raxDone[i];
  if (b.getUnitTypeNameInProductionQueAt(2)) { continue; }
  var kind = S.nextTrain % 2 === 0 ? 'Soldier' : 'Archer';
  var c = kind === 'Soldier' ? soldierCost : archerCost;
  if (gold - (underAttack ? 0 : unitReserve) >= c && supply + 2 <= maxSupply) { scope.order('Train ' + kind, [b]); gold -= c; supply += 2; S.nextTrain++; }
}

// 3. workers from every base for its own goldmine, a few ahead for a castle going up
var castlesUp = castles.length - castlesDone.length;
var workerCap = Math.min(54, 12 * activeBases + 1 + 6 * castlesUp);
var trainedWorkers = workers.length;
for (var i = 0; i < bases.length; i++) {
  var c = bases[i].castle;
  if (trainedWorkers >= workerCap) { break; }
  if (c.getUnitTypeNameInProductionQueAt(1)) { trainedWorkers++; continue; }
  if (bases[i].miners.length >= 13) { continue; }
  if (gold - reserve >= workerCost && supply + 1 <= maxSupply) {
    scope.order('Train Worker', [c]);
    gold -= workerCost; supply += 1; trainedWorkers++;
  }
}

// 4. the next castle, when home is safe
// the main gets its first tower before the second castle
var towerFirst = castles.length < 2 && towers.length === 0 && raxDone.length > 0;
// and no second castle while an enemy army is about the main: towers first
if (power(within(enemyArmy, homeX, homeY, 40)) > power(army) * 0.7) { S.lastSeenNear = now; }
if (castles.length < 2 && now - (S.lastSeenNear || -99) < 30 && gold < 600) { towerFirst = true; }
if (S.builds.castle || (castles.length < wantBases && !towerFirst && (homeSafe || castles.length >= 2 || gold >= 600))) {
  var exp = S.builds.castle ? null : bestExpansion();
  if (S.builds.castle || exp) {
    if (exp) { S.expMine = exp; }
    var r = build('castle', 'Castle', 'castle', function() { return S.expMine ? castleSpot(S.expMine) : null; });
    if (r === 'waiting') { reserve += castleCost; }
  }
}

// 5. barracks: one while I have one base, up to four on two
if (rax.length < wantRax || S.builds.rax) {
  if (S.builds.rax || (rax.length === 0 ? (workers.length >= 8 || now > 40) : gold - reserve >= raxCost)) {
    var raxBase = bases.length ? bases[rax.length % bases.length] : {x: homeX, y: homeY};
    if (rax.length < 2) { raxBase = {x: homeX, y: homeY}; }
    if (S.builds.rax && S.builds.rax.bx !== undefined) { raxBase = {x: S.builds.rax.bx, y: S.builds.rax.by}; }
    build('rax', 'Barracks', 'barracks', function() { return spotNear('barracks', raxBase.x, raxBase.y, 7, true); });
    if (S.builds.rax) { S.builds.rax.bx = raxBase.x; S.builds.rax.by = raxBase.y; }
  }
}

// 6. a watchtower by the main goldmine once there is a threat or time, and one at each new base
var wantTowers = 0;
var seenNearHome = within(enemyArmy, homeX, homeY, 40).length;
if (raxDone.length && (proxies.length || seenNearHome || now > 100)) { wantTowers = 1; }
// on one base, gold left over from the one barracks goes into towers while the enemy is about
if (castlesDone.length < 2 && (proxies.length || seenNearHome >= 3)) { wantTowers = gold - reserve > 260 ? 3 : 2; }
if (castlesDone.length >= 2) { wantTowers = Math.max(wantTowers, castlesDone.length + 1); }
if (towers.length < wantTowers || S.builds.tower) {
  var tb = null;
  for (var i = 0; i < bases.length && !tb; i++) {
    if (within(towers, bases[i].x, bases[i].y, 12).length < (i === 0 ? Math.max(2, wantTowers) : 1)) { tb = bases[i]; }
  }
  if (S.builds.tower || (tb && gold - reserve >= towerCost)) {
    build('tower', 'Watchtower', 'watchtower', function() {
      // beside the castle on the side the enemy comes from, so it covers the castle and the miners
      if (!tb) { return null; }
      var src = nearest(proxies, tb.x, tb.y) || nearest(within(enemyArmy, tb.x, tb.y, 40), tb.x, tb.y);
      var sx = src ? src.getX() : S.estart.x, sy = src ? src.getY() : S.estart.y;
      var ang = Math.atan2(sy - tb.y, sx - tb.x) + [0, 0.7, -0.7, 1.4][within(towers, tb.x, tb.y, 12).length % 4];
      var px = tb.x + Math.cos(ang) * 4.5, py = tb.y + Math.sin(ang) * 4.5;
      var vx = tb.mine.getX() - tb.x, vy = tb.mine.getY() - tb.y, L = vx * vx + vy * vy;
      var best = null, bd = 1e9;
      for (var dx = -6; dx <= 6; dx++) {
        for (var dy = -6; dy <= 6; dy++) {
          var x = Math.round(px + dx), y = Math.round(py + dy);
          var d = dist(x, y, px, py);
          var t = L ? Math.max(0, Math.min(1, ((x - tb.x) * vx + (y - tb.y) * vy) / L)) : 0;
          if (dist(x, y, tb.x + vx * t, tb.y + vy * t) < 3) { continue; }
          if (within(towers, x, y, 3).length) { continue; }
          if (d >= bd || !scope.canBuildAt(x, y, 'watchtower')) { continue; }
          if (refW && !scope.isReachable(refW.getX(), refW.getY(), x, y)) { continue; }
          bd = d; best = {x: x, y: y};
        }
      }
      return best;
    });
  }
}

// 7. a forge and upgrades once the economy is up
if (wantForge && (forges.length < 1 || S.builds.forge)) {
  build('forge', 'Forge', 'forge', function() { return spotNear('forge', homeX, homeY, 8, true); });
}
if (forgeIdle && gold >= 150 + 50 * upgLevel) {
  var aL = scope.getUpgradeLevel('Attack Upgrade') || 0, rL = scope.getUpgradeLevel('Armor Upgrade') || 0;
  scope.order(aL <= rL ? 'Attack Upgrade' : 'Armor Upgrade', [forgeDone[0]]);
  gold -= 150 + 50 * upgLevel;
}

// ---------- early scouting: one worker circles the main to find proxy buildings
if (castles.length === 1 && now >= 45 && now < 200 && rax.length > 0) {
  if (!S.scoutPts) {
    var toE = Math.atan2(S.estart.y - homeY, S.estart.x - homeX);
    S.scoutPts = [];
    var rings = [[18, [0, 1, -1, 2, -2]], [30, [-2, -1, 0, 1, 2]], [22, [3, 4, -4, -3]]];
    for (var r = 0; r < rings.length; r++) {
      for (var a = 0; a < rings[r][1].length; a++) {
        var ang = toE + rings[r][1][a] * Math.PI / 5;
        var px = Math.max(2, Math.min(scope.getMapWidth() - 3, Math.round(homeX + Math.cos(ang) * rings[r][0])));
        var py = Math.max(2, Math.min(scope.getMapHeight() - 3, Math.round(homeY + Math.sin(ang) * rings[r][0])));
        var f = refW ? scope.getClosestReachableField(refW.getX(), refW.getY(), px, py) : null;
        if (f) { S.scoutPts.push(f); }
      }
    }
    S.scoutI = 0;
  }
  var sw = S.scoutW ? workerById(S.scoutW) : null;
  if (!sw && !S.scoutDone) {
    sw = takeBuilder(homeX, homeY);
    if (sw) { S.scoutW = sw.getUnitID(); S.scoutI = 0; }
  }
  if (sw && S.scoutPts.length) {
    var pt = S.scoutPts[S.scoutI % S.scoutPts.length];
    if (dU(sw, pt.x, pt.y) < 3) { S.scoutI++; pt = S.scoutPts[S.scoutI % S.scoutPts.length]; }
    if (S.scoutI >= S.scoutPts.length * 2 || within(enemyArmy, sw.getX(), sw.getY(), 7).length) {
      S.scoutDone = true;
    } else {
      scope.order('Move', [sw], pt, false);
    }
  }
  if (S.scoutDone && sw) { var sb0 = nearestBase(sw) || bases[0]; if (sb0) { scope.order('Mine', [sw], {unit: sb0.mine}); } S.scoutW = null; }
} else if (S.scoutW) {
  var sw = workerById(S.scoutW);
  if (sw && bases.length) { scope.order('Mine', [sw], {unit: bases[0].mine}); }
  S.scoutW = null;
}

// ---------- proxy busting: workers kill an enemy building going up by my base, and its builders, before it can make units
var enemyWorkers = enemyUnits.filter(function(u) { return u.getTypeName() === 'Worker'; });
// only a building still going up: one left half built can make nothing
S.eprog = S.eprog || {};
var proxyUp = proxies.filter(function(b) {
  if (!b.isUnderConstruction()) { return false; }
  var left = b.getValue('buildTicksLeft'), was = S.eprog[b.getUnitID()];
  S.eprog[b.getUnitID()] = left;
  return was === undefined || was !== left || within(enemyWorkers, b.getX(), b.getY(), 6).length > 0;
});
var bustOn = false;
if (proxyUp.length && castles.length === 1) {
  var pt0 = nearest(proxyUp, homeX, homeY);
  var guard = power(within(enemyArmy, pt0.getX(), pt0.getY(), 12));
  var squad = [];
  for (var k in S.busters) { var bw = workerById(+k); if (bw) { squad.push(bw); } else { delete S.busters[k]; } }
  var helpers = within(army, pt0.getX(), pt0.getY(), 15);
  if (guard <= (power(squad) + power(helpers)) * 0.6) {
    bustOn = true;
    while (squad.length < Math.min(5, Math.floor(workers.length / 3))) {
      var nw = takeBuilder(pt0.getX(), pt0.getY());
      if (!nw) { break; }
      S.busters[nw.getUnitID()] = 1; squad.push(nw);
    }
    // the builders first, then the building
    var builders = within(enemyWorkers, pt0.getX(), pt0.getY(), 6);
    scope.order('Attack', squad, {unit: builders.length ? nearest(builders, pt0.getX(), pt0.getY()) : pt0}, false);
  }
}
if (!bustOn) {
  for (var k in S.busters) {
    var bw = workerById(+k);
    if (bw && bases.length) { var bb = nearestBase(bw) || bases[0]; scope.order('Mine', [bw], {unit: bb.mine}); }
    delete S.busters[k];
  }
}

// ---------- the army
var armyPower = power(army);
var center = army.length ? scope.getCenterOfUnits(army) : {x: homeX, y: homeY};
var towersDone = towers.filter(function(t) { return !t.isUnderConstruction(); });
// the gathering point: in front of the base nearest the enemy
var front = null, fd = 1e9;
for (var i = 0; i < castles.length; i++) {
  var d = dist(castles[i].getX(), castles[i].getY(), S.estart.x, S.estart.y);
  if (d < fd) { fd = d; front = castles[i]; }
}
var fx = front ? front.getX() : homeX, fy = front ? front.getY() : homeY;
var flen = dist(fx, fy, S.estart.x, S.estart.y) || 1;
var gx = fx + (S.estart.x - fx) / flen * 7, gy = fy + (S.estart.y - fy) / flen * 7;
// a small army waits in the main, by the towers, where the workers can help
if (castles.length < 2 || army.length < 12) {
  var hb = bases.length ? bases[0] : null;
  var ht = hb ? nearest(towersDone, hb.x, hb.y) : null;
  if (ht && dU(ht, hb.x, hb.y) < 12) { gx = ht.getX(); gy = ht.getY(); } else if (hb) { gx = (hb.x + hb.mine.getX()) / 2; gy = (hb.y + hb.mine.getY()) / 2; }
}
if (refW) {
  var gp = scope.getClosestReachableField(refW.getX(), refW.getY(), Math.round(gx), Math.round(gy));
  if (gp) { gx = gp.x; gy = gp.y; }
}

// what I know of the enemy's army: the biggest seen lately
var seenPower = power(enemyArmy);
if (!S.enemyPow || seenPower > S.enemyPow || now - S.enemyPowT > 60) { S.enemyPow = Math.max(seenPower, (S.enemyPow || 0) * 0.9); S.enemyPowT = now; }

var armySupply = 0;
for (var i = 0; i < army.length; i++) { armySupply += army[i].getTypeName() === 'Mage' ? 3 : 2; }

// pulled workers go back to mining at their own base
var releasePulled = function() {
  for (var k in S.pulled) {
    var w = workerById(+k);
    delete S.pulled[k];
    if (!w) { continue; }
    var b = baseOfMine[S.pulledMine && S.pulledMine[k]] || nearestBase(w);
    if (b) { scope.order('Mine', [w], {unit: b.mine}); }
  }
};
S.pulledMine = S.pulledMine || {};
var pulledList = [];
for (var k in S.pulled) { var pw = workerById(+k); if (pw) { pulledList.push(pw); } else { delete S.pulled[k]; } }

if (threatAt && (threatArmy.length || army.length)) {
  var tc = scope.getCenterOfUnits(threatUnits);
  var tx = tc.x, ty = tc.y;
  var enemyHere = within(enemyUnits, tx, ty, 12);
  var enemyPow = power(enemyHere);
  var defenders = army.filter(function(u) { return dU(u, tx, ty) < 30; });
  var towerPow = power(within(towersDone, tx, ty, 10));
  var defPow = power(defenders) + towerPow;
  var tb = nearestBase(threatAt) || {x: homeX, y: homeY, mine: null};
  // fight where the towers and the workers are
  var anchor = nearest(towersDone, tb.x, tb.y);
  var ax = anchor && dU(anchor, tb.x, tb.y) < 12 ? anchor.getX() : tb.x, ay = anchor && dU(anchor, tb.x, tb.y) < 12 ? anchor.getY() : tb.y;
  // in the base: at a goldmine or next to one of my buildings, so attacking it
  var enemyInBase = false;
  for (var i = 0; i < buildings.length && !enemyInBase; i++) { if (within(threatArmy, buildings[i].getX(), buildings[i].getY(), 8).length) { enemyInBase = true; } }
  for (var i = 0; i < bases.length && !enemyInBase; i++) { if (within(threatArmy, bases[i].mine.getX(), bases[i].mine.getY(), 8).length) { enemyInBase = true; } }
  // leave the towers only for a fight the army wins against all the enemy army seen lately, not just the part in sight
  var chaseOk = defPow >= Math.max(enemyPow, castlesDone.length < 2 ? S.enemyPow * 0.8 : 0) * 1.1;
  var pulledPow = power(pulledList);
  var cands = workers.filter(function(w) { return !S.pulled[w.getUnitID()] && !busyIds[w.getUnitID()] && !isBusy(w) && dU(w, tx, ty) < 26; });
  // a fight that even every worker would lose: the workers there go and mine at another base instead
  var hopeless = threatArmy.length && enemyPow > (defPow + pulledPow + power(cands)) * 1.1;
  var refuge = null;
  for (var i = 0; i < bases.length; i++) { if (!bases[i].danger && (!refuge || dist(bases[i].x, bases[i].y, tx, ty) > dist(refuge.x, refuge.y, tx, ty))) { refuge = bases[i]; } }
  // and when the whole army could not win there either, it gathers at that other base instead of arriving a few at a time
  var giveUp = hopeless && refuge && enemyPow > (armyPower + towerPow + power(cands)) * 1.1;
  if (giveUp) {
    var rx = refuge.x, ry = refuge.y;
    var awayR = army.filter(function(u) { return dU(u, rx, ry) > 8; });
    var pressed = awayR.filter(function(u) { return within(enemyArmy, u.getX(), u.getY(), 10).length > 0; });
    var calm = awayR.filter(function(u) { return pressed.indexOf(u) < 0; });
    if (pressed.length) { scope.order('Move', pressed, {x: rx, y: ry}, false); }
    if (calm.length) { scope.order('AMove', calm, {x: rx, y: ry}, false); }
  } else if (chaseOk || enemyInBase || !threatArmy.length) {
    var tgt0 = enemyInBase && !chaseOk ? nearest(threatArmy, ax, ay) : null;
    var dest = tgt0 ? {x: tgt0.getX(), y: tgt0.getY()} : {x: tx, y: ty};
    // the army runs back without stopping for fights on the way, and fights once it is there
    var coming = army.filter(function(u) { return dU(u, tx, ty) < 50 || S.mode !== 'attack'; });
    var runBack = coming.filter(function(u) { return dU(u, dest.x, dest.y) > 22; });
    var fightNow = coming.filter(function(u) { return dU(u, dest.x, dest.y) <= 22; });
    if (runBack.length) { scope.order('Move', runBack, dest, false); }
    if (fightNow.length) { scope.order('AMove', fightNow, dest, false); }
  } else {
    // outnumbered outside the base: wait for them by the towers
    var farD = army.filter(function(u) { return dU(u, ax, ay) > 4; });
    if (farD.length) { scope.order('AMove', farD, {x: ax, y: ay}, false); }
  }
  // workers join only a fight in the base that the army and towers would lose, as few as it takes
  if (hopeless && refuge) {
    releasePulled(); pulledList = [];
    var flee = workers.filter(function(w) { return !busyIds[w.getUnitID()] && !isBusy(w) && dU(w, tb.x, tb.y) < 14; });
    if (flee.length) { scope.order('Mine', flee, {unit: refuge.mine}); }
  } else if (threatArmy.length && enemyInBase && enemyPow > (defPow + pulledPow) * 0.9) {
    cands.sort(function(a, b) { return dU(a, tx, ty) - dU(b, tx, ty) || a.getUnitID() - b.getUnitID(); });
    for (var i = 0; i < cands.length && enemyPow * 1.3 > defPow + pulledPow; i++) {
      pulledList.push(cands[i]);
      pulledPow += power([cands[i]]);
      var gm = cands[i].getValue('goldMine');
      S.pulled[cands[i].getUnitID()] = 1;
      S.pulledMine[cands[i].getUnitID()] = gm && baseOfMine[gm.id] ? gm.id : tb.mine ? tb.mine.getUnitID() : 0;
    }
  }
  if (pulledList.length && (defPow > enemyPow * 1.5 || !enemyInBase)) {
    releasePulled();
  } else if (pulledList.length) {
    var t0 = nearest(enemyHere, ax, ay) || threatUnits[0];
    scope.order('AMove', pulledList, {x: t0.getX(), y: t0.getY()}, false);
  }
  // a small raid does not call off an attack: the towers and the units at home deal with it
  if (S.mode === 'attack' && (defPow >= enemyPow * 1.1 || enemyPow < armyPower * 0.15)) { S.mode = 'attack'; } else { S.mode = 'gather'; }
} else {
  releasePulled();
  var pb0 = proxies.length ? nearest(proxies, center.x, center.y) : null;
  if (pb0 && army.length >= 5 && armyPower > Math.max(power(within(enemyArmy, pb0.getX(), pb0.getY(), 16)), S.enemyPow) * 1.5 + 60) {
    // kill proxy buildings by home once the army can
    var pb = nearest(proxies, center.x, center.y);
    scope.order('AMove', army, {x: pb.getX(), y: pb.getY()}, false);
  } else if (army.length) {
    // each attack that had to pull back waits for a bigger army next time
    var attackAt = Math.max(34, Math.min(64, 20 + now / 20)) + 8 * (S.failed || 0);
    // a big army, well ahead of everything the enemy has shown
    // and a long, stalled game (no attack for five minutes, say the goldmines ran dry) attacks with what it has
    var bigEnough = armySupply >= attackAt || (S.capped && supply >= maxSupply - 6) || (now > 900 && now - (S.lastAttackT || 0) > 300 && army.length >= 12);
    if (S.mode !== 'attack' && bigEnough && armyPower > S.enemyPow * 1.3) {
      S.mode = 'attack'; S.attackSize = army.length; S.lastAttackT = now;
    }
    if (S.mode === 'attack') {
      // pull back when the fight goes wrong
      var localEnemy = power(within(enemyUnits, center.x, center.y, 14));
      var localMine = power(within(army, center.x, center.y, 14));
      var losing = army.length < S.attackSize * 0.4 || (localEnemy > localMine * 1.3 && localEnemy > armyPower * 0.5) || (army.length < S.attackSize * 0.65 && localEnemy > localMine * 0.8);
      if (losing) { S.mode = 'gather'; S.failed = Math.min(4, (S.failed || 0) + 1); }
    }
    if (S.mode === 'attack') {
      var tgt = enemyBuildings.length ? nearest(enemyBuildings, center.x, center.y) : null;
      var aim = tgt ? {x: tgt.getX(), y: tgt.getY()} : null;
      if (!aim) {
        // nothing known: the enemy's start, then the goldmines nearest it, in turn
        if (!S.scoutList) {
          S.scoutList = [{x: S.estart.x, y: S.estart.y}].concat(allMines.slice().sort(function(a, b) { return dU(a, S.estart.x, S.estart.y) - dU(b, S.estart.x, S.estart.y) || a.getUnitID() - b.getUnitID(); }).map(function(m) { return {x: m.getX(), y: m.getY()}; }));
          S.scout = 0;
        }
        var sc = S.scoutList[S.scout % S.scoutList.length];
        if (dist(center.x, center.y, sc.x, sc.y) < 10) { S.scout++; sc = S.scoutList[S.scout % S.scoutList.length]; }
        aim = sc;
      }
      // the army moves as one: units that run ahead of the middle wait for it
      var R = 5 + Math.sqrt(army.length) * 1.2;
      var dc = dist(center.x, center.y, aim.x, aim.y);
      var ahead = army.filter(function(u) { return dU(u, aim.x, aim.y) < dc - R && dU(u, center.x, center.y) > R; });
      var rest = army.filter(function(u) { return ahead.indexOf(u) < 0; });
      if (rest.length) { scope.order('AMove', rest, aim, false); }
      if (ahead.length) { scope.order('AMove', ahead, {x: center.x, y: center.y}, false); }
    } else {
      // units away from the gathering point walk back past enemies without stopping to fight, which draws the enemy onto the towers
      var far = army.filter(function(u) { return dU(u, gx, gy) > 6; });
      var run = far.filter(function(u) { return within(enemyArmy, u.getX(), u.getY(), 10).length > 0; });
      var walk = far.filter(function(u) { return run.indexOf(u) < 0; });
      if (run.length) { scope.order('Move', run, {x: gx, y: gy}, false); }
      if (walk.length) { scope.order('AMove', walk, {x: gx, y: gy}, false); }
    }
  }
}

// siege engines out-range everything I have and hit a crowd: the army near one charges it when it can win there, and the nearest soldiers go for it
var siege = enemyArmy.filter(function(u) { var t = u.getTypeName(); return t === 'Catapult' || t === 'Ballista'; });
if (siege.length) {
  var taken = {};
  for (var i = 0; i < siege.length; i++) {
    var e = siege[i];
    var local = army.filter(function(u) { return !taken[u.getUnitID()] && dU(u, e.getX(), e.getY()) < 14; });
    if (!local.length) { continue; }
    var theirs = power(within(enemyArmy, e.getX(), e.getY(), 9));
    var near = local.filter(function(u) { return u.getTypeName() === 'Soldier'; });
    near.sort(function(a, b) { return dU(a, e.getX(), e.getY()) - dU(b, e.getX(), e.getY()) || a.getUnitID() - b.getUnitID(); });
    near = near.slice(0, 3);
    var rest = local.filter(function(u) { return near.indexOf(u) < 0; });
    for (var j = 0; j < local.length; j++) { taken[local[j].getUnitID()] = 1; }
    if (near.length) { scope.order('Attack', near, {unit: e}, false); }
    if (rest.length && power(local) > theirs * 1.2) { scope.order('AMove', rest, {x: e.getX(), y: e.getY()}, false); }
  }
}

// shot at from out of sight (a catapult in the fog): the units around charge the way the shots came from, rather than stand and take it
if (!threatAt || S.mode === 'attack') {
  var shelled = null;
  for (var i = 0; i < army.length && !shelled; i++) {
    var hit = army[i].getLastAttack();
    if (hit && now - hit.time < 2 && !within(enemyArmy, army[i].getX(), army[i].getY(), 8).length) { shelled = hit; }
  }
  if (shelled) {
    var sx = shelled.x + shelled.direction.x * 9, sy = shelled.y + shelled.direction.y * 9;
    var group = within(army, shelled.x, shelled.y, 12);
    if (group.length >= 4) { scope.order('AMove', group, {x: sx, y: sy}, false); }
  }
}
