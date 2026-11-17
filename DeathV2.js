// Death V2: Death AI's soldiers and archers, played patiently. Workers are spread evenly over every base's goldmine,
// the army waits until it is big and fights as one, and it walks away when the enemy pulls its workers into a fight.
// Every choice is a pure function of the game state (randomness only from scope.getRandomNumber, sorts tie-break on unit id), so every computer plays it identically.
var me = scope.getMyPlayerNumber();
var S = scope.deathV2;
var byId = function(a, b) { return a.getUnitID() - b.getUnitID(); };
var dist = function(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); };
var now = scope.getCurrentGameTimeInSec();
var costOf = function(t) { return scope.getTypeFieldValue(t, 'cost'); };

if (!S) {
  S = scope.deathV2 = {job: {}, mem: {}, pulled: {}, pulledFight: {}, housePending: -99, raxPending: -99, castlePending: -99, forgePending: -99, nextTrain: 0, spotTry: 0, mode: 'gather', modeSince: 0, enemy: null};
  var players = scope.getArrayOfPlayerNumbers();
  for (var i = 0; i < players.length; i++) {
    if (scope.getTeamNumber(players[i]) !== scope.getMyTeamNumber() && S.enemy === null) { S.enemy = players[i]; }
  }
  S.start = scope.getStartLocationForPlayerNumber(me);
  S.estart = S.enemy === null ? null : scope.getStartLocationForPlayerNumber(S.enemy);
  // the one random draw: how many units the first attack waits for
  S.firstWave = scope.getRandomNumber(16, 20);
}
if (!S.estart || !S.start) { return; }

var isArmyType = function(t) { return t === 'Soldier' || t === 'Archer' || t === 'Mage' || t === 'Raider' || t === 'Priest'; };
var workers = scope.getUnits({type: 'Worker', player: me}).sort(byId);
var army = scope.getUnits({player: me, notOfType: 'Worker'}).filter(function(u) { return isArmyType(u.getTypeName()); }).sort(byId);
var castles = scope.getBuildings({type: 'Castle', player: me}).sort(byId);
var castlesDone = castles.filter(function(b) { return !b.isUnderConstruction(); });
var rax = scope.getBuildings({type: 'Barracks', player: me}).sort(byId);
var raxDone = rax.filter(function(b) { return !b.isUnderConstruction(); });
var houses = scope.getBuildings({type: 'House', player: me}).sort(byId);
var forges = scope.getBuildings({type: 'Forge', player: me}).sort(byId);
var gold = scope.getGold();
var supply = scope.getCurrentSupply();
var maxSupply = scope.getMaxSupply();
var mines = scope.getBuildings({type: 'Goldmine'}).sort(byId);
if (!castles.length && !workers.length) { return; }
var home = castles.length ? castles[0] : null;
var homeX = home ? home.getX() : S.start.x, homeY = home ? home.getY() : S.start.y;
var nearest = function(list, x, y) {
  var best = null, bd = 1e9;
  for (var i = 0; i < list.length; i++) {
    var d = dist(list[i].getX(), list[i].getY(), x, y);
    if (d < bd) { bd = d; best = list[i]; }
  }
  return best;
};
var centerOf = function(list) {
  var x = 0, y = 0;
  for (var i = 0; i < list.length; i++) { x += list[i].getX(); y += list[i].getY(); }
  return list.length ? {x: x / list.length, y: y / list.length} : null;
};

// --- what I know of the enemy: units seen in the last 90 seconds, forgotten when their spot is in sight and they are not there
var enemyUnits = scope.getUnits({enemyOf: me}).sort(byId);
// any enemy unit that can hurt: wolves, mages, catapults and the rest
var enemyArmyVis = enemyUnits.filter(function(u) { return u.getTypeName() !== 'Worker' && (u.getFieldValue('dmg') || 0) > 0; });
var enemyWorkersVis = enemyUnits.filter(function(u) { return u.getTypeName() === 'Worker'; });
var seenNow = {};
for (var i = 0; i < enemyArmyVis.length; i++) {
  var u = enemyArmyVis[i];
  seenNow[u.getUnitID()] = true;
  S.mem[u.getUnitID()] = {x: u.getX(), y: u.getY(), t: now, melee: (u.getFieldValue('range') || 0) < 2};
}
var memIds = Object.keys(S.mem).map(Number).sort(function(a, b) { return a - b; });
var enemyArmyKnown = 0, enemyMelee = 0;
for (var i = 0; i < memIds.length; i++) {
  var m = S.mem[memIds[i]];
  if (!seenNow[memIds[i]] && (now - m.t > 90 || scope.canSeeField(Math.floor(m.x), Math.floor(m.y)))) { delete S.mem[memIds[i]]; continue; }
  enemyArmyKnown++;
  if (m.melee) { enemyMelee++; }
}
var enemyBuildings = scope.getBuildings({enemyOf: me}).filter(function(b) { return !b.isNeutral() && b.getTypeName() !== 'Goldmine'; }).sort(byId);
var enemyCastles = enemyBuildings.filter(function(b) { return b.getTypeName() === 'Castle' || b.getTypeName() === 'Fortress'; });
var enemyHome = enemyCastles.length ? nearest(enemyCastles, S.estart.x, S.estart.y) : null;
var ehX = enemyHome ? enemyHome.getX() : S.estart.x, ehY = enemyHome ? enemyHome.getY() : S.estart.y;

// --- bases: each finished castle and the goldmine beside it
var mineNear = function(x, y, maxD) {
  var best = null, bd = maxD;
  for (var i = 0; i < mines.length; i++) {
    if (mines[i].getValue('gold') <= 0) { continue; }
    var d = dist(mines[i].getX(), mines[i].getY(), x, y);
    if (d < bd) { bd = d; best = mines[i]; }
  }
  return best;
};
var bases = [];
for (var i = 0; i < castlesDone.length; i++) {
  var mm = mineNear(castlesDone[i].getX(), castlesDone[i].getY(), 14);
  if (mm && !bases.some(function(b) { return b.mine.getUnitID() === mm.getUnitID(); })) { bases.push({castle: castlesDone[i], mine: mm}); }
}
var mineById = {};
for (var i = 0; i < bases.length; i++) { mineById[bases[i].mine.getUnitID()] = bases[i]; }
// a new castle's rally point is its goldmine, so new workers mine at once
for (var i = 0; i < bases.length; i++) {
  if (!S['rally' + bases[i].castle.getUnitID()]) { scope.order('Moveto', [bases[i].castle], {unit: bases[i].mine}); S['rally' + bases[i].castle.getUnitID()] = true; }
}

// --- defence: enemy army near any of my castles
var threatAt = null, threats = [];
// the castle the enemy is closest to
var threatD = 1e9;
for (var i = 0; i < castles.length; i++) {
  var cx = castles[i].getX(), cy = castles[i].getY();
  var near = enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), cx, cy) < 26; });
  if (!near.length) { continue; }
  var nd = dist(nearest(near, cx, cy).getX(), nearest(near, cx, cy).getY(), cx, cy);
  if (nd < threatD) { threatD = nd; threatAt = castles[i]; threats = near; }
}
// enemy buildings near my main (proxy barracks)
var proxies = enemyBuildings.filter(function(b) { return dist(b.getX(), b.getY(), homeX, homeY) < 45; });

// --- workers: pulled into a defence only when the army cannot hold alone, and only as many as the fight needs
// they fight only close to the castle and go back to mining as soon as the enemy pulls away, so a feint costs little
var workerById = {};
for (var i = 0; i < workers.length; i++) { workerById[workers[i].getUnitID()] = workers[i]; }
var closeThreats = threatAt ? threats.filter(function(u) { return dist(u.getX(), u.getY(), threatAt.getX(), threatAt.getY()) < 18; }) : [];
var armyNearThreat = threatAt ? army.filter(function(u) { return dist(u.getX(), u.getY(), threatAt.getX(), threatAt.getY()) < 25; }).length : 0;
// workers mine on until the enemy is close, then only as many as the fight needs join in (a worker is worth about a third of a soldier)
var needWorkers = closeThreats.length >= 2 ? Math.ceil((closeThreats.length * 1.4 - armyNearThreat) / 0.33) : 0;
var dTm = threatAt ? mineNear(threatAt.getX(), threatAt.getY(), 14) : null;
var holdPt = threatAt ? (dTm ? {x: (threatAt.getX() + dTm.getX()) / 2, y: (threatAt.getY() + dTm.getY()) / 2} : {x: threatAt.getX(), y: threatAt.getY()}) : null;
var pulledIds = Object.keys(S.pulled).map(Number).sort(function(a, b) { return a - b; });
var keep = [], release = [];
for (var i = 0; i < pulledIds.length; i++) {
  var pw = workerById[pulledIds[i]];
  if (!pw) { delete S.pulled[pulledIds[i]]; continue; }
  if (keep.length < needWorkers) { keep.push(pw); } else { release.push(pw); }
}
if (needWorkers > keep.length) {
  var cands = workers.filter(function(w) {
    return !S.pulled[w.getUnitID()] && (w.getCurrentOrderName() || '').indexOf('Build') !== 0 && w.getCurrentOrderName() !== 'Repair' && dist(w.getX(), w.getY(), threatAt.getX(), threatAt.getY()) < 20;
  });
  cands.sort(function(a, b) { return dist(a.getX(), a.getY(), threatAt.getX(), threatAt.getY()) - dist(b.getX(), b.getY(), threatAt.getX(), threatAt.getY()) || a.getUnitID() - b.getUnitID(); });
  for (var i = 0; i < cands.length && keep.length < needWorkers; i++) { keep.push(cands[i]); S.pulled[cands[i].getUnitID()] = true; delete S.job[cands[i].getUnitID()]; }
}
if (keep.length) {
  if (closeThreats.length) {
    // workers already fighting keep their target; only the others are sent in
    var ct = centerOf(closeThreats);
    var sendW = keep.filter(function(w) { var o = w.getCurrentOrderName(); return (o !== 'AMove' && o !== 'Attack') || !S.pulledFight[w.getUnitID()]; });
    if (sendW.length) { scope.order('AMove', sendW, ct, false); }
    for (var i = 0; i < sendW.length; i++) { S.pulledFight[sendW[i].getUnitID()] = true; }
  } else {
    S.pulledFight = {};
    var wFar = keep.filter(function(w) { return dist(w.getX(), w.getY(), holdPt.x, holdPt.y) > 3; });
    if (wFar.length) { scope.order('AMove', wFar, holdPt, false); }
  }
}
// released workers are handed straight back to the mining step below
var backToMine = {};
for (var i = 0; i < release.length; i++) { delete S.pulled[release[i].getUnitID()]; backToMine[release[i].getUnitID()] = true; }

// --- early scout: one worker walks the ground in front of my base, to find barracks built close to it
if (!S.scouted && now > 70 && workers.length >= 8) {
  var sw = workers.filter(function(w) { return w.getCurrentOrderName() === 'Mine' && !S.pulled[w.getUnitID()]; });
  if (sw.length) {
    var scout = sw[sw.length - 1], ang0 = Math.atan2(ehY - homeY, ehX - homeX);
    var pts = [[24, -0.9], [34, -0.5], [34, 0.5], [24, 0.9], [14, 0]];
    for (var i = 0; i < pts.length; i++) {
      var px = Math.round(homeX + Math.cos(ang0 + pts[i][1]) * pts[i][0]), py = Math.round(homeY + Math.sin(ang0 + pts[i][1]) * pts[i][0]);
      var pf = scope.getClosestReachableField(scout.getX(), scout.getY(), px, py);
      if (pf) { scope.order('Move', [scout], pf, i > 0); }
    }
    S.scouted = true; S.scoutId = scout.getUnitID(); S.scoutT = now; delete S.job[scout.getUnitID()];
  }
}
if (S.scoutId && (!workerById[S.scoutId] || workerById[S.scoutId].getCurrentOrderName() === 'Stop' || now - S.scoutT > 70)) {
  if (workerById[S.scoutId]) { backToMine[S.scoutId] = true; }
  S.scoutId = null;
}
// a barracks going up beside my base, with little to guard it: workers knock it down before it can train anything
var proxyT = proxies.length ? nearest(proxies, homeX, homeY) : null;
var guards = proxyT ? enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), proxyT.getX(), proxyT.getY()) < 12; }).length : 0;
var crewIds = Object.keys(S.crew || {}).map(Number).sort(function(a, b) { return a - b; });
if (proxyT && guards <= 1 && army.length < 6 && !threatAt) {
  S.crew = S.crew || {};
  var crew = [];
  for (var i = 0; i < crewIds.length; i++) { if (workerById[crewIds[i]]) { crew.push(workerById[crewIds[i]]); } }
  var cand = workers.filter(function(w) { return !S.pulled[w.getUnitID()] && !S.crew[w.getUnitID()] && w.getCurrentOrderName() === 'Mine'; });
  cand.sort(function(a, b) { return dist(a.getX(), a.getY(), proxyT.getX(), proxyT.getY()) - dist(b.getX(), b.getY(), proxyT.getX(), proxyT.getY()) || a.getUnitID() - b.getUnitID(); });
  while (crew.length < 6 && cand.length) { var cw = cand.shift(); crew.push(cw); S.crew[cw.getUnitID()] = true; delete S.job[cw.getUnitID()]; }
  if (crew.length) { scope.order('Attack', crew, {unit: proxyT}, false); }
} else if (crewIds.length) {
  for (var i = 0; i < crewIds.length; i++) { if (workerById[crewIds[i]]) { backToMine[crewIds[i]] = true; } }
  S.crew = {};
}

// --- mining: every worker belongs to one base's mine, and the counts are kept level
var counts = {};
for (var i = 0; i < bases.length; i++) { counts[bases[i].mine.getUnitID()] = 0; }
var free = [];
for (var i = 0; i < workers.length; i++) {
  var w = workers[i], wid = w.getUnitID(), o = w.getCurrentOrderName();
  if (backToMine[wid]) { free.push(w); continue; }
  if (S.pulled[wid] || (S.crew && S.crew[wid]) || wid === S.scoutId) { continue; }
  var j = S.job[wid];
  // a worker with a job counts for its mine; only idle workers and new ones from the castle get a mine
  if (j !== undefined && counts[j] !== undefined && o !== 'Stop') { if (o === 'Mine') { counts[j]++; } continue; }
  if (o === 'Stop' || (o === 'Mine' && (j === undefined || counts[j] === undefined))) { free.push(w); }
}
var leastMine = function(x, y) {
  var best = null, bc = 1e9;
  for (var i = 0; i < bases.length; i++) {
    var id = bases[i].mine.getUnitID();
    // one more worker at a mine costs about as much as a ten tile walk to the next
    var score = counts[id] + dist(bases[i].mine.getX(), bases[i].mine.getY(), x, y) / 10 + id * 1e-6;
    if (score < bc) { bc = score; best = bases[i].mine; }
  }
  return best;
};
for (var i = 0; i < free.length; i++) {
  var mt = leastMine(free[i].getX(), free[i].getY());
  if (!mt) { break; }
  scope.order('Mine', [free[i]], {unit: mt});
  S.job[free[i].getUnitID()] = mt.getUnitID();
  counts[mt.getUnitID()]++;
}
if (bases.length > 1) {
  var hi = null, lo = null;
  for (var i = 0; i < bases.length; i++) {
    var id = bases[i].mine.getUnitID();
    if (!hi || counts[id] > counts[hi]) { hi = id; }
    if (!lo || counts[id] < counts[lo]) { lo = id; }
  }
  // the walk between bases costs mining time, so only a real imbalance moves a worker, the one closest to the emptier mine
  if (counts[hi] - counts[lo] >= 3 && counts[hi] > 5 && now - (S.lastMove || 0) >= 3) {
    var lm = mineById[lo].mine, mover = null, md = 1e9;
    for (var i = 0; i < workers.length; i++) {
      var wid = workers[i].getUnitID();
      if (S.job[wid] !== hi || workers[i].getCurrentOrderName() !== 'Mine') { continue; }
      var d = dist(workers[i].getX(), workers[i].getY(), lm.getX(), lm.getY()) + wid * 1e-6;
      if (d < md) { md = d; mover = workers[i]; }
    }
    if (mover) {
      scope.order('Mine', [mover], {unit: lm});
      S.job[mover.getUnitID()] = lo; counts[hi]--; counts[lo]++; S.lastMove = now;
    }
  }
}
var jobIds = Object.keys(S.job).map(Number);
for (var i = 0; i < jobIds.length; i++) { if (!workerById[jobIds[i]]) { delete S.job[jobIds[i]]; } }

// --- supply and workers
var houseCost = costOf('house'), workerCost = costOf('worker'), raxCost = costOf('barracks'), castleCost = costOf('castle');
var housesBuilding = houses.filter(function(h) { return h.isUnderConstruction(); }).length;
var supplyRate = 2 + raxDone.length * 2 + castlesDone.length;
var needHouse = maxSupply < 150 && supply >= maxSupply - supplyRate * 1.5 && housesBuilding < (maxSupply >= 60 ? 2 : 1);
var castlesBuildingNow = castles.length - castlesDone.length;
// about 9 workers to a goldmine: 4 mine at full speed and the rest cover the walk
var wantWorkers = Math.min(60, Math.max(1, bases.length + castlesBuildingNow) * 9 + 4);
// early on the army keeps pace with the workers, so the first big attack meets an army
if (now < 600) { wantWorkers = Math.min(wantWorkers, 12 + Math.round(army.length * 1.2)); }
// soldiers before workers while a bigger enemy army is about
if (enemyArmyKnown > army.length + 2 && workers.length >= 12) { wantWorkers = Math.min(wantWorkers, workers.length); }
// the opening barracks come before more workers
var raxFirst = now >= 45 && workers.length >= 9 && rax.length < (now < 80 ? 1 : Math.max(2, Math.round(castlesDone.length * 1.6))) ? raxCost : 0;
for (var i = 0; i < castlesDone.length; i++) {
  if (workers.length < wantWorkers && gold >= workerCost + raxFirst && !(needHouse && gold < houseCost + workerCost) && !castlesDone[i].getUnitTypeNameInProductionQueAt(2) && supply + 1 <= maxSupply) {
    scope.order('Train Worker', [castlesDone[i]]);
    gold -= workerCost; supply += 1;
  }
}

// --- builders: mining workers nearest the main castle, standing on open ground (a worker inside the mine or castle reaches nothing)
var builders = workers.filter(function(w) { return w.getCurrentOrderName() === 'Mine' && !S.pulled[w.getUnitID()] && scope.positionIsPathable(Math.floor(w.getX()), Math.floor(w.getY())); });
builders.sort(function(a, b) { return dist(a.getX(), a.getY(), homeX, homeY) - dist(b.getX(), b.getY(), homeX, homeY) || a.getUnitID() - b.getUnitID(); });
var builderIdx = 0;
var builder = builders.length ? builders[0] : null;
var nextBuilder = function() { builderIdx++; builder = builderIdx < builders.length ? builders[builderIdx] : null; };
var awayAng = Math.atan2(homeY - S.estart.y, homeX - S.estart.x);
var homeMine = mineNear(homeX, homeY, 16);
// spots start on the side away from the enemy and the goldmine; each retry skips the spot that did not work
var spotNear = function(type, rs) {
  var skip = S.spotTry++ % 6, seen = 0;
  for (var r = rs; r < rs + 14; r += 2) {
    for (var a = 0; a < 12; a++) {
      var ang = awayAng + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * Math.PI / 6;
      var x = Math.round(homeX + Math.cos(ang) * r), y = Math.round(homeY + Math.sin(ang) * r);
      if (homeMine && dist(x, y, homeMine.getX(), homeMine.getY()) < 6) { continue; }
      if (scope.canBuildAt(x, y, type) && scope.isReachable(builder.getX(), builder.getY(), x, y)) {
        if (seen++ >= skip) { return {x: x, y: y}; }
      }
    }
  }
  return null;
};
var buildAt = function(type, cmd, sp) {
  scope.order(cmd, [builder], sp);
  var j = S.job[builder.getUnitID()];
  var back = (j !== undefined && mineById[j]) ? mineById[j].mine : homeMine;
  if (back) { scope.order('Mine', [builder], {unit: back}, true); }
  nextBuilder();
};

// a building whose builder was killed stops: send a worker to finish it
var unfinished = scope.getBuildings({player: me}).filter(function(b) { return b.isUnderConstruction(); }).sort(byId);
for (var i = 0; i < unfinished.length && builder; i++) {
  var ub = unfinished[i], key = 'bt' + ub.getUnitID(), left = ub.getValue('buildTicksLeft');
  if (!S[key] || S[key].left !== left) { S[key] = {left: left, t: now}; continue; }
  if (now - S[key].t > 8 && !threatAt) {
    scope.order('Repair', [builder], {unit: ub});
    var bj = S.job[builder.getUnitID()];
    if (bj !== undefined && mineById[bj]) { scope.order('Mine', [builder], {unit: mineById[bj].mine}, true); }
    S[key].t = now;
    nextBuilder();
  }
}
if (builder && gold >= houseCost && needHouse && now - S.housePending > 10) {
  var sp = spotNear('house', 6);
  if (sp) { buildAt('house', 'Build House', sp); gold -= houseCost; S.housePending = now; }
}

// --- expansion: a castle at the nearest free goldmine on my side, early and again as mines run low
// a walkable tile beside the goldmine, and whether a castle at (x, y) is a short walk from it
var shortWalkToMine = function(mine, x, y, r) {
  var sides = [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3], [-3, 3]];
  for (var k = 0; k < sides.length; k++) {
    var sx = Math.round(mine.getX() + sides[k][0]), sy = Math.round(mine.getY() + sides[k][1]);
    if (!scope.positionIsPathable(sx, sy)) { continue; }
    if (scope.getGroundDistance(x, y, sx, sy) <= r + 8) { return true; }
  }
  return false;
};
var freeMine = null;
if (home && builder) {
  var fd = 1e9;
  var allCastles = scope.getBuildings({type: 'Castle'}).concat(scope.getBuildings({type: 'Fortress'}));
  for (var i = 0; i < mines.length; i++) {
    var mm = mines[i];
    if (mm.getValue('gold') < 1200) { continue; }
    var taken = false;
    for (var j = 0; j < allCastles.length; j++) { if (dist(allCastles[j].getX(), allCastles[j].getY(), mm.getX(), mm.getY()) < 16) { taken = true; } }
    if (taken || now - (S['noSpot' + mm.getUnitID()] || -999) < 120) { continue; }
    var dMe = dist(mm.getX(), mm.getY(), homeX, homeY), dEn = dist(mm.getX(), mm.getY(), ehX, ehY);
    // stay on my half of the map, and well clear of the enemy's main
    var score = dMe - 0.5 * Math.min(dEn, 60);
    // late on, or when my own mines run dry, any goldmine away from their castles will do
    var nearEnemyCastle = enemyCastles.some(function(ec) { return dist(ec.getX(), ec.getY(), mm.getX(), mm.getY()) < 25; });
    if (dEn < 30 || nearEnemyCastle || (dEn < dMe * 0.8 && now < 900 && bases.length >= 2)) { continue; }
    if (score < fd) { fd = score; freeMine = mm; }
  }
}
// barracks: about one and a half per base, and one more whenever gold piles up
var wantRax = Math.min(8, Math.max(1, Math.round(castlesDone.length * 1.6 + (now > 240 ? 1 : 0))));
if (gold > 600 && rax.length >= wantRax) { wantRax = Math.min(10, rax.length + 1); }
// the opening: a barracks at 45 seconds, a second at 80
if (now < 80) { wantRax = now < 45 || workers.length < 7 ? 0 : 1; } else { wantRax = Math.max(wantRax, 2); }
var raxBehind = rax.length < wantRax - 1;
var lowMines = bases.filter(function(b) { return b.mine.getValue('gold') < 1500; }).length;
var castlesBuilding = castles.length - castlesDone.length;
var wantCastles = now < 100 ? 1 : (now < 420 ? 2 : (now < 900 ? 3 : 4));
wantCastles += lowMines;
// the first expansion comes early; later ones only with the barracks built and an army to hold them
var safeToExpand = !threatAt && !proxies.length && enemyArmyKnown <= army.length && (castles.length < 2 || (!raxBehind && army.length >= Math.min(30, enemyArmyKnown)));
if (freeMine && builder && safeToExpand && castles.length < wantCastles && castlesBuilding === 0 && now - S.castlePending > 30 && gold >= castleCost) {
  var cs = null;
  for (var r = 5; r <= 13 && !cs; r += 1) {
    for (var a = 0; a < 24 && !cs; a++) {
      var ang = a * Math.PI / 12;
      var x = Math.round(freeMine.getX() + Math.cos(ang) * r), y = Math.round(freeMine.getY() + Math.sin(ang) * r);
      // the castle must sit on the goldmine's own ground, a short walk from it, or its workers walk around a cliff
      if (scope.canBuildAt(x, y, 'castle') && scope.isReachable(builder.getX(), builder.getY(), x, y) && shortWalkToMine(freeMine, x, y, r)) { cs = {x: x, y: y}; }
    }
  }
  // no castle fits beside this goldmine (or none my workers can reach): try the next one
  if (!cs) { S['noSpot' + freeMine.getUnitID()] = now; }
  if (cs) {
    scope.order('Build Castle', [builder], cs);
    scope.order('Mine', [builder], {unit: freeMine}, true);
    delete S.job[builder.getUnitID()];
    gold -= castleCost; S.castlePending = now; nextBuilder();
  }
}
// save for a wanted castle before spending on more barracks and units
var saveForCastle = freeMine && safeToExpand && castles.length < wantCastles && castlesBuilding === 0 && gold < castleCost && army.length >= 3;

// --- barracks
if (builder && rax.length < wantRax && gold >= raxCost && now - S.raxPending > 12 && (!saveForCastle || raxBehind) && !(needHouse && gold < raxCost + houseCost)) {
  var sp2 = spotNear('barracks', 8);
  if (sp2) { buildAt('barracks', 'Build Barracks', sp2); gold -= raxCost; S.raxPending = now; }
}
// a forge once the economy is up, for attack and armour upgrades
var forgeCost = costOf('forge');
if (builder && forges.length === 0 && castlesDone.length >= 2 && rax.length >= 3 && gold >= forgeCost + 100 && now > 480 && now - S.forgePending > 20 && !saveForCastle) {
  var sp3 = spotNear('forge', 10);
  if (sp3) { buildAt('forge', 'Build Forge', sp3); gold -= forgeCost; S.forgePending = now; }
}
for (var i = 0; i < forges.length; i++) {
  var fg = forges[i];
  if (fg.isUnderConstruction() || fg.getUnitTypeNameInProductionQueAt(1)) { continue; }
  var al = scope.getUpgradeLevel('Attack Upgrade') || 0, ar = scope.getUpgradeLevel('Armor Upgrade') || 0;
  if (gold >= 250 + 100 * Math.min(al, ar) && army.length >= 10) {
    scope.order(al <= ar ? 'Attack Upgrade' : 'Armor Upgrade', [fg]);
    gold -= 200;
  }
}

// --- army production: soldiers in front, archers behind
var soldierCost = costOf('soldier'), archerCost = costOf('archer');
for (var i = 0; i < raxDone.length; i++) {
  var b = raxDone[i];
  if (saveForCastle) { break; }
  if (needHouse && gold < houseCost + 80) { break; }
  if (b.getUnitTypeNameInProductionQueAt(2)) { continue; }
  // three soldiers to two archers, and more soldiers against a melee army like wolves
  var archerSlot = enemyArmyKnown >= 4 && enemyMelee > enemyArmyKnown * 0.7 ? S.nextTrain % 4 === 3 : (S.nextTrain % 5 === 1 || S.nextTrain % 5 === 3);
  var kind = archerSlot ? 'Archer' : 'Soldier';
  var c = kind === 'Soldier' ? soldierCost : archerCost;
  // a missing barracks is paid for before more units
  var raxReserve = builder && ((now >= 80 && rax.length < 2) || raxBehind) ? raxCost : 0;
  if (gold >= c + raxReserve && supply + 2 <= maxSupply) { scope.order('Train ' + kind, [b]); gold -= c; supply += 2; S.nextTrain++; }
}

// --- army orders
// the army waits just in front of the main castle, so a fight there has the workers close by
var hd = Math.max(1, dist(homeX, homeY, ehX, ehY));
var stageX = homeX + (ehX - homeX) * 9 / hd, stageY = homeY + (ehY - homeY) * 9 / hd;
var setMode = function(m) {
  if (S.mode !== m) {
    S.mode = m; S.modeSince = now;
  }
};
// the enemy's workers fight only near their main castle, so the army waits for their army just outside that range
if (!S.fwd || S.fwdFor !== Math.round(ehX) + ',' + Math.round(ehY)) {
  var fd0 = Math.min(36, hd * 0.6);
  var fx = ehX + (homeX - ehX) * fd0 / hd, fy = ehY + (homeY - ehY) * fd0 / hd;
  var from = workers.length ? workers[0] : null;
  var fr = from ? scope.getClosestReachableField(from.getX(), from.getY(), Math.round(fx), Math.round(fy)) : null;
  S.fwd = fr ? {x: fr.x, y: fr.y} : {x: fx, y: fy};
  S.fwdFor = Math.round(ehX) + ',' + Math.round(ehY);
}
// how many workers they could pull into a fight at their main: the most I have seen lately
if (enemyWorkersVis.length >= (S.eWorkers || 0) || now - (S.eWorkersT || 0) > 120) { S.eWorkers = Math.max(enemyWorkersVis.length, now - (S.eWorkersT || 0) > 120 ? 0 : (S.eWorkers || 0)); S.eWorkersT = now; }
var eWorkersGuess = Math.max(S.eWorkers || 0, 12);
// their army: what I remember, but never less than the most I saw lately, nor less than a guess from the clock
if (enemyArmyKnown >= (S.eArmyPeak || 0) || now - (S.eArmyPeakT || 0) > 150) { S.eArmyPeak = enemyArmyKnown; S.eArmyPeakT = now; }
// the clock guess only stands while I have not looked at their main lately
if (scope.canSeeField(Math.floor(ehX), Math.floor(ehY))) { S.sawMain = now; }
var clockGuess = now - (S.sawMain || -999) > 90 ? Math.min(24, Math.floor(now / 40)) : 0;
var eArmyGuess = Math.max(enemyArmyKnown, Math.round((S.eArmyPeak || 0) * 0.7), clockGuess);
var c = centerOf(army);
if (army.length) {
  // the main group: units near the centre of the army
  var mainGroup = army.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) < 14; });
  var nearEnemy = enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) < 16; });
  var enemyNearArmy = nearEnemy.length;
  // enemy workers out fighting near my army, not mining
  var workersOut = enemyWorkersVis.filter(function(u) {
    var o = u.getCurrentOrderName();
    return o !== 'Mine' && (o || '').indexOf('Build') !== 0 && o !== 'Repair' && dist(u.getX(), u.getY(), c.x, c.y) < 14;
  }).length;
  var myPower = army.length;
  var bigEnough = army.length >= Math.max(S.firstWave, Math.ceil(eArmyGuess * 1.3) + 2) || supply >= 140;
  // into their main only with enough to beat their army and all their workers together
  var crushMain = army.length >= (eArmyGuess + eWorkersGuess * 0.35) * 1.5 + 4 || supply >= 146;
  var cDistEnemy = dist(c.x, c.y, ehX, ehY);
  var outlying = enemyBuildings.filter(function(b) { return dist(b.getX(), b.getY(), ehX, ehY) > 30; });

  if (threatAt) {
    setMode('defend');
    // hold beside the workers unless the army wins on its own, so they can join in
    var holdX = holdPt.x, holdY = holdPt.y;
    if (army.length >= threats.length * 1.4 || closeThreats.length) {
      var dc = centerOf(closeThreats.length ? closeThreats : threats);
      scope.order('AMove', army, dc, false);
    } else {
      var farH = army.filter(function(u) { return dist(u.getX(), u.getY(), holdX, holdY) > 4; });
      if (farH.length) { scope.order('Move', farH, {x: holdX, y: holdY}, false); }
      var atH = army.filter(function(u) { return dist(u.getX(), u.getY(), holdX, holdY) <= 4; });
      if (atH.length) { scope.order('AMove', atH, {x: holdX, y: holdY}, false); }
    }
  } else if (proxies.length && army.length >= 6) {
    setMode('defend');
    scope.order('AMove', army, {x: nearest(proxies, homeX, homeY).getX(), y: nearest(proxies, homeX, homeY).getY()}, false);
  } else if (S.mode === 'attack') {
    // pull back when their workers come out, unless I clearly outnumber everything there
    var clearlyAhead = myPower >= (enemyNearArmy + workersOut * 0.4) * 1.6 && myPower >= enemyNearArmy * 2.5;
    if (workersOut >= 3 && !clearlyAhead) {
      setMode('retreat'); S.retreatWorkers = true;
    } else if (enemyNearArmy > myPower * 1.1) {
      setMode('retreat'); S.retreatWorkers = false;
    } else if (army.length < 6 && enemyArmyKnown > army.length) {
      setMode('gather');
    } else {
      var tgt = null;
      if (nearEnemy.length && !(cDistEnemy < 30 && !crushMain)) {
        // fight the army in front of me first
        tgt = nearest(nearEnemy, c.x, c.y);
      } else if (outlying.length) {
        // their outlying buildings: far from their main, their workers do not come out to fight
        tgt = nearest(outlying, c.x, c.y);
      } else if (crushMain && enemyBuildings.length) {
        tgt = nearest(enemyBuildings, c.x, c.y);
      } else if (crushMain) {
        // nothing of theirs in sight: their start, then each goldmine in turn
        if (dist(c.x, c.y, S.estart.x, S.estart.y) < 8) { S.startSeen = true; }
        var spot = S.estart;
        if (S.startSeen && mines.length) {
          var sm = mines[(S.scoutIdx || 0) % mines.length];
          if (dist(c.x, c.y, sm.getX(), sm.getY()) < 8) { S.scoutIdx = (S.scoutIdx || 0) + 1; sm = mines[S.scoutIdx % mines.length]; }
          spot = {x: sm.getX(), y: sm.getY()};
        }
        tgt = {getX: function() { return spot.x; }, getY: function() { return spot.y; }, getTypeName: function() { return 'scout'; }};
      }
      // stragglers catch up with the main group before the group pushes on
      var lead = mainGroup.length >= army.length * 0.6 ? army : mainGroup;
      if (lead !== army && !nearEnemy.length) {
        // spread out: the front waits for the rest
        var mc = centerOf(mainGroup);
        var farM = army.filter(function(u) { return dist(u.getX(), u.getY(), mc.x, mc.y) > 5; });
        if (farM.length) { scope.order('AMove', farM, mc, false); }
        lead = army;
      } else if (tgt) {
        scope.order('AMove', lead, {x: tgt.getX(), y: tgt.getY()}, false);
      } else {
        // wait outside their worker range for their army to walk out
        var farF = lead.filter(function(u) { return dist(u.getX(), u.getY(), S.fwd.x, S.fwd.y) > 6; });
        if (farF.length) { scope.order('AMove', farF, S.fwd, false); }
      }
      if (lead !== army) {
        var rest = army.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) >= 14; });
        scope.order('AMove', rest, c, false);
      }
    }
  }
  if (S.mode === 'retreat') {
    // walk (not fight) back out of their worker range, then come again once their workers are back mining
    var rx = S.retreatWorkers ? S.fwd.x : stageX, ry = S.retreatWorkers ? S.fwd.y : stageY;
    var atSpot = dist(c.x, c.y, rx, ry) < 7;
    // out of their workers' reach, turn on an army that chased me without them
    var turn = cDistEnemy > 30 && workersOut === 0 && enemyNearArmy > 0 && enemyNearArmy * 1.2 < myPower;
    if (turn) {
      scope.order('AMove', army, centerOf(nearEnemy), false);
    } else if (!atSpot) {
      scope.order('Move', army, {x: rx, y: ry}, false);
    }
    var waited = now - S.modeSince;
    if ((atSpot && waited > 12) || waited > 40) { setMode(army.length >= 6 ? 'attack' : 'gather'); }
  }
  if (S.mode === 'gather' || S.mode === 'defend') {
    if (!threatAt && !(proxies.length && army.length >= 6)) {
      if (bigEnough && mainGroup.length >= army.length * 0.7 && dist(c.x, c.y, stageX, stageY) < 12) {
        setMode('attack');
      } else {
        setMode('gather');
        var far = army.filter(function(u) { return dist(u.getX(), u.getY(), stageX, stageY) > 7; });
        if (far.length) { scope.order('AMove', far, {x: stageX, y: stageY}, false); }
      }
    }
  }
}
