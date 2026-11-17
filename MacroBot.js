// Macro bot: an economic CPU. Workers non-stop, a Barracks early, a Castle at a second goldmine, and an army that defends first, then attacks.
// Every choice is a pure function of the game state (no Math.random, no Date, sorts tie-break on unit id), so every computer plays it identically.
var me = scope.getMyPlayerNumber();
var S = scope.macro;
var byId = function(a, b) { return a.getUnitID() - b.getUnitID(); };
var dist = function(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); };
var now = scope.getCurrentGameTimeInSec();
var costOf = function(t) { return scope.getTypeFieldValue(t, 'cost'); };

if (!S) {
  S = scope.macro = {housePending: 0, raxPending: 0, castlePending: 0, nextTrain: 0, wave: {}, enemy: null};
  var players = scope.getArrayOfPlayerNumbers();
  for (var i = 0; i < players.length; i++) {
    if (scope.getTeamNumber(players[i]) !== scope.getMyTeamNumber() && S.enemy === null) { S.enemy = players[i]; }
  }
  S.start = scope.getStartLocationForPlayerNumber(me);
  S.estart = S.enemy === null ? null : scope.getStartLocationForPlayerNumber(S.enemy);
}
if (!S.estart || !S.start) { return; }

var workers = scope.getUnits({type: 'Worker', player: me}).sort(byId);
var army = scope.getUnits({player: me, notOftype: 'Worker'}).sort(byId);
army = army.filter(function(u) { var t = u.getTypeName(); return t === 'Soldier' || t === 'Archer' || t === 'Mage'; });
var castles = scope.getBuildings({type: 'Castle', player: me}).sort(byId);
var castlesDone = castles.filter(function(b) { return !b.isUnderConstruction(); });
var rax = scope.getBuildings({type: 'Barracks', player: me}).sort(byId);
var raxDone = rax.filter(function(b) { return !b.isUnderConstruction(); });
var houses = scope.getBuildings({type: 'House', player: me}).sort(byId);
var gold = scope.getGold();
var supply = scope.getCurrentSupply();
var maxSupply = scope.getMaxSupply();
var mines = scope.getBuildings({type: 'Goldmine'}).sort(byId);
if (!castlesDone.length && !castles.length) { return; }
var home = castles.length ? castles[0] : null;
var homeX = home ? home.getX() : S.start.x, homeY = home ? home.getY() : S.start.y;

// --- enemy buildings near my base (proxy barracks) and enemy units near my base
var enemyBuildings = scope.getBuildings({enemyOf: me}).filter(function(b) { return !b.isNeutral() && b.getTypeName() !== 'Goldmine'; }).sort(byId);
var threats = [];
for (var i = 0; i < enemyBuildings.length; i++) {
  if (dist(enemyBuildings[i].getX(), enemyBuildings[i].getY(), homeX, homeY) < 55) { threats.push(enemyBuildings[i]); }
}
var enemyUnits = scope.getUnits({enemyOf: me}).filter(function(u) { return u.getTypeName() !== 'Worker'; }).sort(byId);
var intruders = [];
for (var i = 0; i < enemyUnits.length; i++) {
  if (dist(enemyUnits[i].getX(), enemyUnits[i].getY(), homeX, homeY) < 28) { intruders.push(enemyUnits[i]); }
}

// --- my mines: the mine each castle works; idle workers mine the nearest one with gold to a finished castle
var mineFor = function(x, y) {
  var best = null, bd = 1e9;
  for (var i = 0; i < mines.length; i++) {
    if (mines[i].getValue('gold') <= 0) { continue; }
    var d = dist(mines[i].getX(), mines[i].getY(), x, y);
    if (d < bd) { bd = d; best = mines[i]; }
  }
  return best;
};
var idle = workers.filter(function(w) { return w.getCurrentOrderName() === 'Stop'; });
for (var i = 0; i < idle.length; i++) {
  // spread idle workers across castles by id, each to the mine nearest its castle
  var c = castlesDone.length ? castlesDone[idle[i].getUnitID() % castlesDone.length] : null;
  var m = c ? mineFor(c.getX(), c.getY()) : mineFor(homeX, homeY);
  if (m) { scope.order('Mine', [idle[i]], {unit: m}); }
}

var houseCost = costOf('house');
var housesBuilding = houses.filter(function(h) { return h.isUnderConstruction(); }).length;
var needHouse = supply >= maxSupply - 6 && maxSupply < 100 && housesBuilding === 0;
// --- workers: keep training from every finished castle
var workerCost = costOf('worker');
var wantWorkers = 14 * Math.max(1, castlesDone.length);
if (castlesDone.length > 1) { wantWorkers = 12 * castlesDone.length; }
if (castlesDone.length < 2 && army.length < 8 && now < 330 && now > 90) { wantWorkers = 11; }
for (var i = 0; i < castlesDone.length; i++) {
  if (workers.length < wantWorkers && gold >= workerCost && !(needHouse && gold < houseCost + workerCost) && !castlesDone[i].getUnitTypeNameInProductionQueAt(2) && supply + 1 <= maxSupply) {
    scope.order('Train Worker', [castlesDone[i]]);
    gold -= workerCost; supply += 1;
  }
}

// a worker for builds: one far from the enemy proxy, nearest home
var builders = workers.filter(function(w) { return w.getCurrentOrderName() === 'Mine' || w.getCurrentOrderName() === 'Stop'; });
var builderIdx = 0;
var builder = builders.length ? builders[0] : null;
var nextBuilder = function() { builderIdx++; builder = builderIdx < builders.length ? builders[builderIdx] : null; };
var awayAng = Math.atan2(homeY - S.estart.y, homeX - S.estart.x);
S.spotTry = S.spotTry || 0;
// spots start on the side away from the enemy; each retry skips the spot that did not work
var spotNear = function(type, rs) {
  var skip = S.spotTry++ % 6, seen = 0;
  for (var r = rs; r < rs + 12; r += 2) {
    for (var a = 0; a < 12; a++) {
      var ang = awayAng + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * Math.PI / 6;
      var x = Math.round(homeX + Math.cos(ang) * r), y = Math.round(homeY + Math.sin(ang) * r);
      if (scope.canBuildAt(x, y, type) && scope.isReachable(builder.getX(), builder.getY(), x, y)) {
        if (seen++ >= skip) { return {x: x, y: y}; }
      }
    }
  }
  return null;
};

// --- house
if (builder && gold >= houseCost && housesBuilding === 0 && now - S.housePending > 12 && maxSupply < 100 && needHouse) {
  var sp = spotNear('house', 6);
  if (sp) {
    scope.order('Build House', [builder], sp);
    scope.order('Mine', [builder], {unit: mineFor(homeX, homeY)}, true);
    gold -= houseCost; S.housePending = now; nextBuilder();
  }
}

// --- barracks: first early, more as the economy grows
var raxCost = costOf('barracks');
var wantRax = castlesDone.length > 1 ? 3 : (now > 150 ? 3 : (now > 80 ? 2 : 1));
if (builder && rax.length < wantRax && gold >= raxCost && now > 45 && now - S.raxPending > 15 && workers.length >= 7) {
  var sp2 = spotNear('barracks', 8);
  if (sp2) {
    scope.order('Build Barracks', [builder], sp2);
    scope.order('Mine', [builder], {unit: mineFor(homeX, homeY)}, true);
    gold -= raxCost; S.raxPending = now; nextBuilder();
  }
}

// --- expansion: a Castle at the nearest free goldmine once the first wave is held
var castleCost = costOf('castle');
var freeMine = null;
if (home) {
  var fd = 1e9;
  for (var i = 0; i < mines.length; i++) {
    var mm = mines[i];
    if (mm.getValue('gold') < 3000) { continue; }
    var tooClose = false;
    var allB = scope.getBuildings({type: 'Castle'});
    for (var j = 0; j < allB.length; j++) { if (dist(allB[j].getX(), allB[j].getY(), mm.getX(), mm.getY()) < 16) { tooClose = true; } }
    if (tooClose) { continue; }
    var dMe = dist(mm.getX(), mm.getY(), homeX, homeY), dEn = dist(mm.getX(), mm.getY(), S.estart.x, S.estart.y);
    if (dEn < dMe) { continue; }
    if (dMe < fd) { fd = dMe; freeMine = mm; }
  }
}
var armyHeld = army.length >= 6 && threats.length === 0 && intruders.length === 0;
if (S.castleOrdered && castles.length < 2 && now - S.castlePending > 40) { S.castleOrdered = false; }
if (freeMine && castles.length < 2 && !S.castleOrdered && builder && armyHeld && gold >= castleCost && now > 120) {
  var cs = null;
  for (var r = 6; r <= 12 && !cs; r += 1) {
    for (var a = 0; a < 16 && !cs; a++) {
      var ang = a * Math.PI / 8;
      var x = Math.round(freeMine.getX() + Math.cos(ang) * r), y = Math.round(freeMine.getY() + Math.sin(ang) * r);
      if (scope.canBuildAt(x, y, 'castle') && scope.isReachable(builder.getX(), builder.getY(), x, y)) { cs = {x: x, y: y}; }
    }
  }
  if (cs) {
    scope.order('Build Castle', [builder], cs);
    scope.order('Mine', [builder], {unit: freeMine}, true);
    gold -= castleCost; S.castleOrdered = true; S.castlePending = now;
  }
}

// --- army production
var soldierCost = costOf('soldier'), archerCost = costOf('archer');
var saveForCastle = freeMine && castles.length < 2 && armyHeld && gold < castleCost + 100 && now > 120;
for (var i = 0; i < raxDone.length; i++) {
  var b = raxDone[i];
  if (saveForCastle) { break; }
  if (needHouse && gold < houseCost + 100) { break; }
  if (b.getUnitTypeNameInProductionQueAt(2)) { continue; }
  var kind = (S.nextTrain++ % 2 === 0) ? 'Soldier' : 'Archer';
  var c = kind === 'Soldier' ? soldierCost : archerCost;
  if (gold >= c && supply + 2 <= maxSupply) { scope.order('Train ' + kind, [b]); gold -= c; supply += 2; }
}

// --- army orders: defend, kill proxy buildings, then attack
var rallyX = homeX + (S.estart.x - homeX) * 0.12, rallyY = homeY + (S.estart.y - homeY) * 0.12;
var nearest = function(list, x, y) {
  var best = null, bd = 1e9;
  for (var i = 0; i < list.length; i++) {
    var d = dist(list[i].getX(), list[i].getY(), x, y);
    if (d < bd) { bd = d; best = list[i]; }
  }
  return best;
};
if (army.length) {
  if (intruders.length) {
    var t = nearest(intruders, homeX, homeY);
    // outnumbered: the workers fight too
    if (intruders.length >= 3 && intruders.length > army.length * 0.6) {
      var fighters = workers.filter(function(w) { return w.getCurrentOrderName() !== 'Build'; });
      scope.order('AMove', fighters, {x: t.getX(), y: t.getY()}, false);
    }
    scope.order('AMove', army, {x: t.getX(), y: t.getY()}, false);
  } else if (threats.length && army.length >= 10) {
    var tb = nearest(threats, homeX, homeY);
    scope.order('AMove', army, {x: tb.getX(), y: tb.getY()}, false);
  } else if (army.length >= 12 || (S.attacking && army.length >= 6)) {
    S.attacking = true;
    var tgt = enemyBuildings.length ? nearest(enemyBuildings, S.estart.x, S.estart.y) : null;
    scope.order('AMove', army, tgt ? {x: tgt.getX(), y: tgt.getY()} : S.estart, false);
  } else {
    S.attacking = false;
    var far = army.filter(function(u) { return dist(u.getX(), u.getY(), rallyX, rallyY) > 10; });
    if (far.length) { scope.order('AMove', far, {x: rallyX, y: rallyY}, false); }
  }
}
