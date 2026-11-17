// Aggro bot: a fast proxy-barracks rush. Two barracks go up beside the enemy base, off the walking route, and pump soldiers and archers into it.
// Every choice is a pure function of the game state (no Math.random, no Date, sorts tie-break on unit id), so every computer plays it identically.
var me = scope.getMyPlayerNumber();
var S = scope.aggro;
var byId = function(a, b) { return a.getUnitID() - b.getUnitID(); };
var dist = function(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); };
var now = scope.getCurrentGameTimeInSec();

var costOf = function(t) { return scope.getTypeFieldValue(t, 'cost'); };

if (!S) {
  S = scope.aggro = {proxyWorker: null, proxySpot: null, spots: [], raxOrdered: 0, nextTrain: 0, housePending: 0, attacking: false};
  var players = scope.getArrayOfPlayerNumbers();
  S.enemy = null;
  for (var i = 0; i < players.length; i++) {
    if (scope.getTeamNumber(players[i]) !== scope.getMyTeamNumber() && S.enemy === null) { S.enemy = players[i]; }
  }
  S.start = scope.getStartLocationForPlayerNumber(me);
  S.estart = S.enemy === null ? null : scope.getStartLocationForPlayerNumber(S.enemy);
}
console.log("S", JSON.stringify(S.estart), JSON.stringify(S.start), S.enemy);
if (!S.estart || !S.start) { return; }

var workers = scope.getUnits({type: 'Worker', player: me}).sort(byId);
var soldiers = scope.getUnits({type: 'Soldier', player: me}).sort(byId);
var archers = scope.getUnits({type: 'Archer', player: me}).sort(byId);
var army = soldiers.concat(archers).sort(byId);
var castles = scope.getBuildings({type: 'Castle', player: me}).sort(byId);
var rax = scope.getBuildings({type: 'Barracks', player: me}).sort(byId);
var raxDone = rax.filter(function(b) { return !b.isUnderConstruction(); });
var houses = scope.getBuildings({type: 'House', player: me}).sort(byId);
var gold = scope.getGold();
var supply = scope.getCurrentSupply();
var maxSupply = scope.getMaxSupply();
var mines = scope.getBuildings({type: 'Goldmine'}).sort(byId);

// --- proxy spot: beside the enemy base, to the side of the straight line between the bases
var findSpot = function() {
  var ex = S.estart.x, ey = S.estart.y, mx = S.start.x, my = S.start.y;
  // the castle's own tiles are not walkable, so test reachability from a worker
  var ox = workers.length ? workers[0].getX() : mx, oy = workers.length ? workers[0].getY() : my;
  var len = dist(ex, ey, mx, my);
  var dx = (mx - ex) / len, dy = (my - ey) / len;
  var px = -dy, py = dx;
  var best = null, bestScore = 1e9; var cnt={a:0,b:0,c:0,d:0};
  var sides = [1, -1];
  for (var si = 0; si < 2; si++) {
    for (var k = 16; k <= 34; k += 2) {
      for (var s = 12; s <= 26; s += 2) {
        var x = Math.round(ex + dx * k + px * s * sides[si]);
        var y = Math.round(ey + dy * k + py * s * sides[si]);
        if (x < 2 || y < 2 || x > scope.getMapWidth() - 5 || y > scope.getMapHeight() - 5) { continue; }
        cnt.a++; if (!scope.canBuildAt(x, y, 'barracks') || !scope.canBuildAt(x + 4, y, 'barracks')) { continue; }
        cnt.b++; if (!scope.isReachable(ox, oy, x, y)) { continue; } cnt.c++;
        var dEnemy = dist(x, y, ex, ey);
        if (dEnemy < 20) { continue; }
        // prefer close to the enemy, far from the straight line, short walk
        var score = dEnemy + Math.abs(s - 16) * 0.5 + (scope.getGroundDistance(mx, my, x, y) - len) * 0.3;
        if (score < bestScore) { bestScore = score; best = {x: x, y: y}; }
      }
    }
  }
  console.log(JSON.stringify(cnt)); return best;
};
if (!S.proxySpot && S.tried !== 1) {
  S.tried = 1;
  S.proxySpot = findSpot();
  if (S.proxySpot) { console.log('proxy spot', JSON.stringify(S.proxySpot), 'enemy', JSON.stringify(S.estart), 'me', JSON.stringify(S.start)); }
}

// --- idle workers mine the mine nearest the castle
var myCastle = castles.length ? castles[0] : null;
var homeX = myCastle ? myCastle.getX() : S.start.x, homeY = myCastle ? myCastle.getY() : S.start.y;
var nearestMine = null, nd = 1e9;
for (var i = 0; i < mines.length; i++) {
  if (mines[i].getValue('gold') <= 0) { continue; }
  var d = dist(mines[i].getX(), mines[i].getY(), homeX, homeY);
  if (d < nd) { nd = d; nearestMine = mines[i]; }
}
var proxyWorker = null, proxyWorker2 = null;
for (var i = 0; i < workers.length; i++) {
  if (workers[i].getUnitID() === S.proxyWorker) { proxyWorker = workers[i]; }
  if (workers[i].getUnitID() === S.proxyWorker2) { proxyWorker2 = workers[i]; }
}
if (!proxyWorker) { S.proxyWorker = null; }
if (!proxyWorker2) { S.proxyWorker2 = null; }
var idle = workers.filter(function(w) { return w.getCurrentOrderName() === 'Stop' && w !== proxyWorker && w !== proxyWorker2; });
if (nearestMine && idle.length) { scope.order('Mine', idle, {unit: nearestMine}); }

// --- workers from the castle
var wantWorkers = S.raxOrdered >= 2 ? 12 : 9;
var workerCost = costOf('worker');
var queuedWorkers = 0;
if (myCastle && !myCastle.isUnderConstruction() && workers.length < wantWorkers && gold >= workerCost && !myCastle.getUnitTypeNameInProductionQueAt(2)) {
  scope.order('Train Worker', [myCastle]);
  gold -= workerCost;
}

var miners = workers.filter(function(w) { return w !== proxyWorker && w !== proxyWorker2; });

// --- house when supply is about to block production
var houseCost = costOf('house');
var housesBuilding = houses.filter(function(h) { return h.isUnderConstruction(); }).length;
var needHouse = (S.raxOrdered >= 1 || !S.proxySpot) && ((supply >= maxSupply - 3 && housesBuilding === 0 && maxSupply < 100) || (houses.length === 0 && supply >= 9));
if (needHouse && gold >= houseCost && miners.length > 1 && now - S.housePending > 15) {
  var spot = null;
  for (var r = 6; r < 16 && !spot; r += 2) {
    for (var a = 0; a < 8 && !spot; a++) {
      var ang = a * Math.PI / 4;
      var x = Math.round(homeX + Math.cos(ang) * r), y = Math.round(homeY + Math.sin(ang) * r);
      if (scope.canBuildAt(x, y, 'house') && scope.isReachable(miners[0].getX(), miners[0].getY(), x, y)) { spot = {x: x, y: y}; }
    }
  }
  if (spot) {
    scope.order('Build House', [miners[0]], spot);
    scope.order('Mine', [miners[0]], {unit: nearestMine}, true);
    gold -= houseCost;
    S.housePending = now;
  }
}

// --- the proxy barracks
var raxCost = costOf('barracks');
var spotFor = function(n) { return {x: S.proxySpot.x + n * 5, y: S.proxySpot.y}; };
if (S.raxOrdered < 2 && S.proxySpot) {
  if (!proxyWorker && miners.length > 4 && supply >= 8) {
    // the two workers farthest from the mine walk out early so they arrive when the gold does
    proxyWorker = miners[miners.length - 1];
    S.proxyWorker = proxyWorker.getUnitID();
    scope.order('Move', [proxyWorker], spotFor(0));
    miners.pop();
  }
  if (!proxyWorker2 && S.proxyWorker !== null && miners.length > 4) {
    proxyWorker2 = miners[miners.length - 1];
    S.proxyWorker2 = proxyWorker2.getUnitID();
    scope.order('Move', [proxyWorker2], spotFor(1));
  }
  // retry until the building stands: an order can fail (gold spent meanwhile, spot blocked)
  var placed = rax.length;
  var ws = [proxyWorker, proxyWorker2];
  for (var wi = 0; wi < 2; wi++) {
    var w = ws[wi];
    if (!w || placed >= 2 || w.getCurrentOrderName() !== 'Stop' || gold < raxCost) { continue; }
    var sp = spotFor(wi);
    if (dist(w.getX(), w.getY(), sp.x, sp.y) > 12) { continue; }
    scope.order('Build Barracks', [w], sp);
    placed++; gold -= raxCost;
  }
  S.raxOrdered = placed;
}
// once both stand, the proxy worker builds a house by them and more barracks when gold piles up
if (proxyWorker && S.raxOrdered >= 2 && proxyWorker.getCurrentOrderName() === 'Stop') {
  if (rax.length < 4 && gold >= raxCost + 150) {
    var tries = [[-5, 4], [5, 4], [0, 7], [10, 0], [-10, 0], [0, -6]];
    for (var i = 0; i < tries.length; i++) {
      var x = S.proxySpot.x + tries[i][0], y = S.proxySpot.y + tries[i][1];
      if (scope.canBuildAt(x, y, 'barracks')) { scope.order('Build Barracks', [proxyWorker], {x: x, y: y}); gold -= raxCost; break; }
    }
  }
}

// --- army production from every finished barracks
var soldierCost = costOf('soldier'), archerCost = costOf('archer');
for (var i = 0; i < raxDone.length; i++) {
  var b = raxDone[i];
  if (b.getUnitTypeNameInProductionQueAt(2)) { continue; }
  var kind = (S.nextTrain++ % 2 === 0) ? 'Soldier' : 'Archer';
  var c = kind === 'Soldier' ? soldierCost : archerCost;
  if (gold >= c && supply + 2 <= maxSupply) { scope.order('Train ' + kind, [b]); gold -= c; supply += 2; }
}

// --- attack: everything into the nearest known enemy building
var targets = scope.getBuildings({enemyOf: me}).filter(function(b) { return !b.isNeutral() && b.getTypeName() !== 'Goldmine'; }).sort(byId);
var aim = S.estart;
if (targets.length) {
  var best = null, bd = 1e9;
  for (var i = 0; i < targets.length; i++) {
    var d = dist(S.estart.x, S.estart.y, targets[i].getX(), targets[i].getY());
    if (d < bd) { bd = d; best = targets[i]; }
  }
  aim = {x: best.getX(), y: best.getY()};
}
// units gather at the proxy, then go in as a wave; later arrivals form the next wave
var gx = S.proxySpot ? S.proxySpot.x + 2 : S.start.x, gy = S.proxySpot ? S.proxySpot.y + 6 : S.start.y;
S.wave = S.wave || {};
var waveSize = S.sentFirst ? 4 : 8;
var gathered = [], inWave = [];
for (var i = 0; i < army.length; i++) {
  var u = army[i];
  if (S.wave[u.getUnitID()]) { inWave.push(u); }
  else if (dist(u.getX(), u.getY(), gx, gy) < 12) { gathered.push(u); }
  else { scope.order('AMove', [u], {x: gx, y: gy}, false); }
}
if (gathered.length >= waveSize) {
  for (var i = 0; i < gathered.length; i++) { S.wave[gathered[i].getUnitID()] = 1; inWave.push(gathered[i]); }
  S.sentFirst = true;
}
if (inWave.length) { scope.order('AMove', inWave, aim, false); }
