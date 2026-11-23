// Death V2, Death AI by DeathStroke made stronger: each game it plays soldiers and archers from barracks, or wolves and snakes from wolves dens, played patiently.
// Workers are spread evenly over every base's goldmine, the army waits until it is big and fights as one, and it walks away when the enemy pulls its workers into a fight.
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
  // the coin flip: barracks with soldiers and archers, or wolves dens with wolves and snakes
  S.style = scope.getRandomNumber(1, 2) === 2 ? 'wolf' : 'rax';
}
var WOLF = S.style === 'wolf';
var prodName = WOLF ? 'Wolves Den' : 'Barracks', prodId = WOLF ? 'wolvesden' : 'barracks';
if (!S.estart || !S.start) { return; }

var isArmyType = function(t) { return t === 'Soldier' || t === 'Archer' || t === 'Mage' || t === 'Raider' || t === 'Priest' || t === 'Wolf' || t === 'Snake'; };
// a unit's fighting worth next to a soldier's, from its health and damage; the wolf style weighs armies by it, the barracks style counts units
var worth = function(u) {
  var cd = u.getFieldValue('weaponCooldown') || 20, v = Math.sqrt((u.getFieldValue('hp') || 0) * (u.getFieldValue('dmg') || 0) * 20 / cd) / 58.7;
  return Math.min(3, (u.getFieldValue('range') || 0) >= 2 ? v * 1.15 : v);
};
var powerOf = function(list) {
  if (!WOLF) { return list.length; }
  var p = 0;
  for (var i = 0; i < list.length; i++) { p += worth(list[i]); }
  return p;
};
var workers = scope.getUnits({type: 'Worker', player: me}).sort(byId);
var army = scope.getUnits({player: me, notOfType: 'Worker'}).filter(function(u) { return isArmyType(u.getTypeName()); }).sort(byId);
var castles = scope.getBuildings({type: 'Castle', player: me}).sort(byId);
var castlesDone = castles.filter(function(b) { return !b.isUnderConstruction(); });
var rax = scope.getBuildings({type: prodName, player: me}).sort(byId);
var raxDone = rax.filter(function(b) { return !b.isUnderConstruction(); });
var houses = scope.getBuildings({type: 'House', player: me}).sort(byId);
var forges = scope.getBuildings({type: WOLF ? 'Animal Testing Lab' : 'Forge', player: me}).sort(byId);
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
  S.mem[u.getUnitID()] = {x: u.getX(), y: u.getY(), t: now, melee: (u.getFieldValue('range') || 0) < 2, v: WOLF ? worth(u) : 1};
}
var memIds = Object.keys(S.mem).map(Number).sort(function(a, b) { return a - b; });
var enemyArmyKnown = 0, enemyMelee = 0;
for (var i = 0; i < memIds.length; i++) {
  var m = S.mem[memIds[i]];
  if (!seenNow[memIds[i]] && (now - m.t > 90 || scope.canSeeField(Math.floor(m.x), Math.floor(m.y)))) { delete S.mem[memIds[i]]; continue; }
  enemyArmyKnown += m.v || 1;
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
// the closest castle and goldmine pair up first, so a castle between two goldmines still gets the one the other castle left
var bases = [], pairs = [];
for (var i = 0; i < castlesDone.length; i++) {
  for (var k = 0; k < mines.length; k++) {
    var pd = dist(castlesDone[i].getX(), castlesDone[i].getY(), mines[k].getX(), mines[k].getY());
    if (mines[k].getValue('gold') > 0 && pd < 14) { pairs.push({castle: castlesDone[i], mine: mines[k], d: pd}); }
  }
}
pairs.sort(function(a, b) { return a.d - b.d || byId(a.castle, b.castle) || byId(a.mine, b.mine); });
var mineById = {}, baseOfCastle = {};
for (var i = 0; i < pairs.length; i++) {
  if (baseOfCastle[pairs[i].castle.getUnitID()] || mineById[pairs[i].mine.getUnitID()]) { continue; }
  var nb = {castle: pairs[i].castle, mine: pairs[i].mine};
  bases.push(nb); baseOfCastle[nb.castle.getUnitID()] = nb; mineById[nb.mine.getUnitID()] = nb;
}
bases.sort(function(a, b) { return byId(a.castle, b.castle); });
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
var armyNearThreat = threatAt ? powerOf(army.filter(function(u) { return dist(u.getX(), u.getY(), threatAt.getX(), threatAt.getY()) < 25; })) : 0;
var P = powerOf(army);
// workers mine on until the enemy is close, then only as many as the fight needs join in (a worker is worth about a third of a soldier)
var needWorkers = closeThreats.length >= 2 ? Math.ceil((powerOf(threats) * 1.4 - armyNearThreat) / 0.33) : 0;
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
var houseCost = costOf('house'), workerCost = costOf('worker'), raxCost = costOf(prodId), castleCost = costOf('castle');
var housesBuilding = houses.filter(function(h) { return h.isUnderConstruction(); }).length;
var supplyRate = 2 + raxDone.length * 2 + castlesDone.length;
// the opening trains workers without a break: the first house starts at 8 supply, not before the first worker
var needHouse = maxSupply < 150 && supply >= maxSupply - (rax.length ? supplyRate * 1.5 : 2) && housesBuilding < (maxSupply >= 60 ? 2 : 1);
var castlesBuildingNow = castles.length - castlesDone.length;
// 12 workers to a goldmine: a 13th adds nothing, and its cost is better put towards the next castle
var wantWorkers = Math.min(60, Math.max(1, bases.length) * 12 + (castlesBuildingNow ? 3 : 0));
// early on the army keeps pace with the workers, so the first big attack meets an army
if (now < 600) { wantWorkers = Math.min(wantWorkers, 12 + Math.round(army.length * 1.2)); }
// soldiers before workers while a bigger enemy army is about
if (enemyArmyKnown > P + 2 && workers.length >= 12) { wantWorkers = Math.min(wantWorkers, workers.length); }
// the opening barracks come before more workers
var raxFirst = now >= 45 && workers.length >= 9 && rax.length < (now < 80 ? 1 : Math.max(2, Math.round(castlesDone.length * 1.6))) ? raxCost : 0;
// the castle whose goldmine has the fewest workers trains first, so a new base fills up fast
var crowd = function(c) {
  var cb = baseOfCastle[c.getUnitID()];
  return (cb ? counts[cb.mine.getUnitID()] : 50) + (c.getUnitTypeNameInProductionQueAt(1) ? 2 : 0);
};
var trainAt = castlesDone.slice().sort(function(a, b) { return crowd(a) - crowd(b) || byId(a, b); });
// workers already in a castle's queue count, or the last one or two go over what the goldmines can use
var queued = 0;
for (var i = 0; i < castlesDone.length; i++) {
  for (var q = 1; q <= 2; q++) { if (castlesDone[i].getUnitTypeNameInProductionQueAt(q) === 'Worker') { queued++; } }
}
for (var i = 0; i < trainAt.length; i++) {
  if (workers.length + queued < wantWorkers && gold >= workerCost + raxFirst && !(needHouse && rax.length && gold < houseCost + workerCost) && !trainAt[i].getUnitTypeNameInProductionQueAt(2) && supply + 1 <= maxSupply) {
    scope.order('Train Worker', [trainAt[i]]);
    gold -= workerCost; supply += 1; queued++;
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
// whether every tile within gap tiles of a building at (x, y) is open ground
var openAround = function(x, y, size, gap) {
  for (var tx = x - gap; tx < x + size + gap; tx++) {
    for (var ty = y - gap; ty < y + size + gap; ty++) {
      var inside = tx >= x && tx < x + size && ty >= y && ty < y + size;
      if (!inside && !scope.positionIsPathable(tx, ty)) { return false; }
    }
  }
  return true;
};
var spotNear = function(type, rs) {
  var skip = S.spotTry++ % 6, size = scope.getTypeFieldValue(type, 'size') || 3;
  // two open tiles all round, so buildings never join up with each other or a cliff into a wall that pens the army in;
  // a narrower gap only when no such spot is left
  for (var gap = 2; gap >= 0; gap--) {
    var seen = 0;
    for (var r = rs; r < rs + 14; r += 2) {
      for (var a = 0; a < 12; a++) {
        var ang = awayAng + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * Math.PI / 6;
        var x = Math.round(homeX + Math.cos(ang) * r), y = Math.round(homeY + Math.sin(ang) * r);
        if (homeMine && dist(x, y, homeMine.getX(), homeMine.getY()) < 6) { continue; }
        if (openAround(x, y, size, gap) && scope.canBuildAt(x, y, type) && scope.isReachable(builder.getX(), builder.getY(), x, y)) {
          if (seen++ >= skip) { return {x: x, y: y}; }
        }
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
// a walkable tile beside the goldmine, to measure the walk from a castle spot to it
var sideOfMine = function(mine) {
  var sides = [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3], [3, -3], [-3, 3]];
  for (var k = 0; k < sides.length; k++) {
    var sx = Math.round(mine.getX() + sides[k][0]), sy = Math.round(mine.getY() + sides[k][1]);
    if (scope.positionIsPathable(sx, sy)) { return {x: sx, y: sy}; }
  }
  return null;
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
// an enemy army that only hovers outside does not stop an expansion, as long as mine is about its size
var safeToExpand = !closeThreats.length && !proxies.length && enemyArmyKnown <= P * 1.2 && (castles.length < 2 || (!raxBehind && P >= Math.min(30, enemyArmyKnown)));
if (freeMine && builder && safeToExpand && castles.length < wantCastles && castlesBuilding === 0 && now - S.castlePending > 30 && gold >= castleCost) {
  var cs = null;
  if (scope.getClosestBuildSpot) {
    // the game finds the spot with the shortest walk to the goldmine: on its own ground, straight across from it
    var gs = scope.getClosestBuildSpot('castle', freeMine, 14);
    if (gs && scope.isReachable(builder.getX(), builder.getY(), gs.x, gs.y)) { cs = {x: gs.x, y: gs.y}; }
  } else {
    // an older game: of the spots around the goldmine, the one with the shortest walk to it, never one across a cliff
    var side = sideOfMine(freeMine), bestWalk = 12;
    for (var r = 5; r <= 10 && side; r += 1) {
      for (var a = 0; a < 24; a++) {
        var ang = a * Math.PI / 12;
        var x = Math.round(freeMine.getX() + Math.cos(ang) * r), y = Math.round(freeMine.getY() + Math.sin(ang) * r);
        if (!scope.canBuildAt(x, y, 'castle') || !scope.isReachable(builder.getX(), builder.getY(), x, y)) { continue; }
        var gw = scope.getGroundDistance(x + 1, y + 1, side.x, side.y);
        if (gw > 0 && gw < bestWalk) { bestWalk = gw; cs = {x: x, y: y}; }
      }
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
  var sp2 = spotNear(prodId, 8);
  if (sp2) { buildAt(prodId, 'Build ' + prodName, sp2); gold -= raxCost; S.raxPending = now; }
}
// a forge (or for beasts an animal testing lab) once the economy is up, for attack and armour upgrades
var forgeId = WOLF ? 'animaltestinglab' : 'forge', forgeCost = costOf(forgeId);
if (builder && forges.length === 0 && castlesDone.length >= 2 && rax.length >= 3 && gold >= forgeCost + 100 && now > 480 && now - S.forgePending > 20 && !saveForCastle) {
  var sp3 = spotNear(forgeId, 10);
  if (sp3) { buildAt(forgeId, WOLF ? 'Build Animal Testing Lab' : 'Build Forge', sp3); gold -= forgeCost; S.forgePending = now; }
}
for (var i = 0; i < forges.length; i++) {
  var fg = forges[i];
  if (fg.isUnderConstruction() || fg.getUnitTypeNameInProductionQueAt(1)) { continue; }
  var al = scope.getUpgradeLevel(WOLF ? 'Beast Attack' : 'Damage') || 0, ar = scope.getUpgradeLevel(WOLF ? 'Beast Defense' : 'Armor') || 0;
  if (gold >= 250 + 100 * Math.min(al, ar) && army.length >= 10) {
    if (WOLF) { scope.order(al <= ar ? 'Beast Attack Upgrade' : 'Beast Defense Upgrade', [fg]); } else { scope.order(al <= ar ? 'Attack Upgrade' : 'Armor Upgrade', [fg]); }
    gold -= 200;
  }
}

// --- army production: soldiers in front, archers behind
var soldierCost = costOf(WOLF ? 'wolf' : 'soldier'), archerCost = costOf(WOLF ? 'snake' : 'archer');
// an idle building trains first; a second unit is queued only once every building is busy
var idleRax = raxDone.filter(function(b) { return !b.getUnitTypeNameInProductionQueAt(1); });
var trainers = idleRax.length ? idleRax : raxDone.filter(function(b) { return !b.getUnitTypeNameInProductionQueAt(2); });
// snakes need a finished snake charmer
var charmers = WOLF ? scope.getBuildings({type: 'Snake Charmer', player: me}) : [];
var charmerDone = charmers.some(function(b) { return !b.isUnderConstruction(); });
var charmerCost = WOLF ? costOf('snakecharmer') : 0;
var wantCharmer = WOLF && S.nextTrain >= 6 && charmers.length === 0 && castlesDone.length >= 2;
if (wantCharmer && builder && gold >= charmerCost && now - (S.charmPending || 0) > 20 && !saveForCastle) {
  var sp4 = spotNear('snakecharmer', 10);
  if (sp4) { buildAt('snakecharmer', 'Build Snake Charmer', sp4); gold -= charmerCost; S.charmPending = now; }
}
for (var i = 0; i < trainers.length; i++) {
  var b = trainers[i];
  if (saveForCastle) { break; }
  if (needHouse && gold < houseCost + 80) { break; }
  // three soldiers to two archers, and more soldiers against a melee army like wolves
  var archerSlot = enemyArmyKnown >= 4 && enemyMelee > enemyArmyKnown * 0.7 ? S.nextTrain % 4 === 3 : (S.nextTrain % 5 === 1 || S.nextTrain % 5 === 3);
  var kind = archerSlot ? 'Archer' : 'Soldier';
  // wolves: the first six are wolves, then wolves and snakes in turn
  if (WOLF) { kind = charmerDone && S.nextTrain % 2 === 1 ? 'Snake' : 'Wolf'; }
  var c = kind === 'Soldier' || kind === 'Wolf' ? soldierCost : archerCost;
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
// the clock guess only stands while I have not looked at their main lately, and counts on from what was there at the last look
if (scope.canSeeField(Math.floor(ehX), Math.floor(ehY))) { S.sawMain = now; S.sawArmy = enemyArmyKnown; }
var clockGuess = now - (S.sawMain || -999) > 90 ? Math.min(24, Math.floor((S.sawArmy || 0) + (now - (S.sawMain || 0)) / 40)) : 0;
var eArmyGuess = Math.max(enemyArmyKnown, Math.round((S.eArmyPeak || 0) * 0.7), clockGuess);
// --- raids: a small raid is met by a guard sized to it, which stays at that base while raids keep coming.
// The rest of the army carries on; only a raid too big for a guard brings the whole army home.
S.guardNeed = S.guardNeed || {}; S.guards = S.guards || {};
var castleById = {}, raidAt = {};
for (var i = 0; i < castles.length; i++) { castleById[castles[i].getUnitID()] = castles[i]; }
for (var i = 0; i < castles.length; i++) {
  var gx = castles[i].getX(), gy = castles[i].getY(), gid = castles[i].getUnitID();
  var raiders = enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), gx, gy) < 26; });
  if (!raiders.length) { continue; }
  raidAt[gid] = raiders;
  var gn = Math.max(5, Math.ceil(powerOf(raiders) * 1.8));
  S.guardNeed[gid] = {n: Math.max(gn, S.guardNeed[gid] ? S.guardNeed[gid].n : 0), t: now};
}
var guardIds = Object.keys(S.guardNeed).map(Number).sort(function(a, b) { return a - b; });
var totalNeed = 0;
for (var i = 0; i < guardIds.length; i++) {
  // a base left alone for two and a half minutes gives its guard back
  if (!castleById[guardIds[i]] || now - S.guardNeed[guardIds[i]].t > 150) { delete S.guardNeed[guardIds[i]]; continue; }
  totalNeed += S.guardNeed[guardIds[i]].n;
}
var guardsOn = totalNeed > 0 && totalNeed <= P * 0.5;
var armyDefends = !guardsOn && !!threatAt;
if (!guardsOn) {
  S.guards = {};
} else {
  var armyById = {};
  for (var i = 0; i < army.length; i++) { armyById[army[i].getUnitID()] = army[i]; }
  var gKeys = Object.keys(S.guards).map(Number);
  for (var i = 0; i < gKeys.length; i++) { if (!armyById[gKeys[i]] || !S.guardNeed[S.guards[gKeys[i]]]) { delete S.guards[gKeys[i]]; } }
  for (var i = 0; i < guardIds.length; i++) {
    var gcid = guardIds[i], gneed = S.guardNeed[gcid];
    if (!gneed) { continue; }
    var gc = castleById[gcid], gcx = gc.getX(), gcy = gc.getY();
    var squad = army.filter(function(u) { return S.guards[u.getUnitID()] === gcid; });
    if (powerOf(squad) < gneed.n) {
      // the nearest units not already guarding somewhere fill the guard up
      var spare = army.filter(function(u) { return !S.guards[u.getUnitID()]; });
      spare.sort(function(a, b) { return dist(a.getX(), a.getY(), gcx, gcy) - dist(b.getX(), b.getY(), gcx, gcy) || byId(a, b); });
      while (spare.length && powerOf(squad) < gneed.n) { var gu = spare.shift(); squad.push(gu); S.guards[gu.getUnitID()] = gcid; }
    }
    if (raidAt[gcid]) {
      var gt = nearest(raidAt[gcid], gcx, gcy);
      scope.order('AMove', squad, {x: gt.getX(), y: gt.getY()}, false);
    } else {
      // between raids the guard stands between the castle and its goldmine
      var gm = mineNear(gcx, gcy, 14);
      var gh = gm ? {x: (gcx + gm.getX()) / 2, y: (gcy + gm.getY()) / 2} : {x: gcx, y: gcy};
      var gFar = squad.filter(function(u) { return dist(u.getX(), u.getY(), gh.x, gh.y) > 5; });
      if (gFar.length) { scope.order('AMove', gFar, gh, false); }
    }
  }
  army = army.filter(function(u) { return !S.guards[u.getUnitID()]; });
  P = powerOf(army);
}
// --- scout: one wolf or soldier keeps eyes on the enemy's main and every goldmine, so the army decides from what is really there
var scoutKind = WOLF ? 'Wolf' : 'Soldier';
{
  var sWolf = null;
  // every unit is wanted at home while a base is under attack
  if (threatAt && S.wScout) { S.wScout = null; }
  for (var i = 0; i < army.length; i++) { if (army[i].getUnitID() === S.wScout) { sWolf = army[i]; } }
  if (!sWolf && !threatAt && army.length >= (WOLF ? 3 : 6) && now - (S.wScoutLost || 0) > (WOLF ? 25 : 60)) {
    var wolvesOnly = army.filter(function(u) { return u.getTypeName() === scoutKind; });
    if (wolvesOnly.length) { sWolf = wolvesOnly[0]; S.wScout = sWolf.getUnitID(); S.wScoutStep = 0; S.wScoutT = 0; }
  } else if (!sWolf && S.wScout) { S.wScout = null; S.wScoutLost = now; }
  if (sWolf) {
    army = army.filter(function(u) { return u.getUnitID() !== S.wScout; });
    P = powerOf(army);
    // its round: their main, then each goldmine away from my bases, and round again
    var farMines = mines.filter(function(m) { return dist(m.getX(), m.getY(), homeX, homeY) > 25; });
    // a soldier is slow, so it takes the goldmines nearest their main first: that is where they expand
    if (!WOLF) {
      farMines = farMines.filter(function(m) { return !castles.some(function(cc) { return dist(cc.getX(), cc.getY(), m.getX(), m.getY()) < 16; }); });
      farMines.sort(function(a, b) { return dist(a.getX(), a.getY(), S.estart.x, S.estart.y) - dist(b.getX(), b.getY(), S.estart.x, S.estart.y) || byId(a, b); });
    }
    var route = [S.estart].concat(farMines.map(function(m) { return {x: m.getX(), y: m.getY()}; }));
    var stop = route[(S.wScoutStep || 0) % route.length];
    // it runs from anything that can catch it, back the way it came
    var chasers = enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), sWolf.getX(), sWolf.getY()) < 7; });
    if (chasers.length || dist(sWolf.getX(), sWolf.getY(), stop.x, stop.y) < 7 || now - (S.wScoutT || 0) > (WOLF ? 45 : 150)) {
      S.wScoutStep = (S.wScoutStep || 0) + 1; S.wScoutT = now;
      stop = route[S.wScoutStep % route.length];
      var sf = scope.getClosestReachableField(sWolf.getX(), sWolf.getY(), Math.round(stop.x), Math.round(stop.y));
      if (sf) { scope.order('Move', [sWolf], sf, false); }
    } else if (sWolf.getCurrentOrderName() !== 'Move') {
      var sf2 = scope.getClosestReachableField(sWolf.getX(), sWolf.getY(), Math.round(stop.x), Math.round(stop.y));
      if (sf2) { scope.order('Move', [sWolf], sf2, false); }
    }
  }
}
var c = centerOf(army);
if (army.length) {
  // the main group: units near the centre of the army
  var mainGroup = army.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) < 14; });
  var nearEnemy = enemyArmyVis.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) < 16; });
  var enemyNearArmy = powerOf(nearEnemy);
  // enemy workers out fighting near my army, not mining
  var workersOut = enemyWorkersVis.filter(function(u) {
    var o = u.getCurrentOrderName();
    return o !== 'Mine' && (o || '').indexOf('Build') !== 0 && o !== 'Repair' && dist(u.getX(), u.getY(), c.x, c.y) < 14;
  }).length;
  var myPower = P;
  var bigEnough = P >= Math.max(S.firstWave, Math.ceil(eArmyGuess * 1.3) + 2) || supply >= 140;
  // into their main only with enough to beat their army and all their workers together
  // their finished towers there count too, each about two soldiers
  var mainTowers = enemyBuildings.filter(function(b) { return b.getTypeName() === 'Watchtower' && !b.isUnderConstruction() && dist(b.getX(), b.getY(), ehX, ehY) < 30; }).length;
  var crushMain = P >= (eArmyGuess + eWorkersGuess * 0.35 + mainTowers * 2) * 1.5 + 4 || supply >= 146;
  // a fresh look at their main that shows it can be taken is better than waiting for a big army
  if (!WOLF && crushMain && P >= 8 && now - (S.sawMain || -999) < 90) { bigEnough = true; }
  var cDistEnemy = dist(c.x, c.y, ehX, ehY);
  var outlying = enemyBuildings.filter(function(b) { return dist(b.getX(), b.getY(), ehX, ehY) > 30; });
  var raidable = WOLF ? enemyWorkersVis.filter(function(u) { return dist(u.getX(), u.getY(), ehX, ehY) > 25; }) : [];

  if (armyDefends) {
    // an army called home from an attack goes straight back out afterwards
    if (S.mode === 'attack' || S.mode === 'retreat') { S.wasOut = true; }
    setMode('defend');
    // hold beside the workers unless the army wins on its own, so they can join in
    var holdX = holdPt.x, holdY = holdPt.y;
    // it goes out to them when it wins alone, or when they are in among the workers, who then fight beside it.
    // Otherwise it stands by the workers and does not walk out to an army that only hovers.
    var inBase = threats.filter(function(u) { return dist(u.getX(), u.getY(), holdX, holdY) < 10; });
    if (P >= powerOf(threats) * 1.3 || inBase.length) {
      var dc = centerOf(inBase.length ? inBase : threats);
      scope.order('AMove', army, dc, false);
    } else {
      // fighting its way there: a unit walking home without hitting back just dies
      scope.order('AMove', army, {x: holdX, y: holdY}, false);
    }
  } else if (proxies.length && army.length >= 6) {
    setMode('defend');
    scope.order('AMove', army, {x: nearest(proxies, homeX, homeY).getX(), y: nearest(proxies, homeX, homeY).getY()}, false);
  } else if (WOLF) {
    // the pack: out early to probe, in only where it beats what is actually there, and out again as soon as a fight turns
    setMode('pack');
    var towersAt = function(x, y, r) {
      return enemyBuildings.filter(function(b) { return (b.getTypeName() === 'Watchtower' || b.getTypeName() === 'Tower') && !b.isUnderConstruction() && dist(b.getX(), b.getY(), x, y) < r; }).length;
    };
    // what guards a spot: remembered enemy units near it and its towers, each tower worth about two soldiers
    var guardAt = function(x, y, r) {
      var g = towersAt(x, y, r) * 2;
      for (var i = 0; i < memIds.length; i++) { var m = S.mem[memIds[i]]; if (m && dist(m.x, m.y, x, y) < r) { g += m.v || 1; } }
      return g;
    };
    var groupPow = powerOf(mainGroup);
    var localPow = enemyNearArmy + towersAt(c.x, c.y, 10) * 2 + workersOut * 0.35;
    // once in a fight it stays while it is about even; it only starts one with a clear edge
    var losing = localPow > 0 && localPow > groupPow * (S.engaged ? 1.0 : 0.75);
    // a pack smaller than their whole army does not chase far from home: the rest of theirs is where it is being led
    if (nearEnemy.length && P < eArmyGuess * 1.2 && dist(c.x, c.y, homeX, homeY) > 35) { losing = true; }
    if (losing) { S.wBack = now + 8; S.engaged = false; }
    if (now < (S.wBack || 0)) {
      var bx = stageX, by = stageY;
      if (dist(c.x, c.y, bx, by) > 6) { scope.order('Move', army, {x: bx, y: by}, false); }
    } else if (nearEnemy.length || (workersOut && localPow > 0)) {
      S.engaged = true;
      var near0 = nearEnemy.length ? nearest(nearEnemy, c.x, c.y) : null;
      scope.order('AMove', army, near0 ? {x: near0.getX(), y: near0.getY()} : c, false);
    } else {
      S.engaged = false;
      var tgt = null, best = 1e9;
      var consider = function(x, y, extra) {
        // the walk counts a little; a target is only worth it when the pack beats its guard with room to spare
        if (groupPow < guardAt(x, y, 14) * 1.3 + extra) { return; }
        var d = dist(c.x, c.y, x, y);
        if (d < best) { best = d; tgt = {x: x, y: y}; }
      };
      // workers at their outlying bases, then outlying buildings, then their army where it stands, then their main
      for (var i = 0; i < raidable.length; i++) { consider(raidable[i].getX(), raidable[i].getY(), 1); }
      if (!tgt) { for (var i = 0; i < outlying.length; i++) { consider(outlying[i].getX(), outlying[i].getY(), 2); } }
      if (!tgt && memIds.length && enemyArmyKnown > 0) {
        var mx = 0, my = 0, mv = 0;
        for (var i = 0; i < memIds.length; i++) { var m = S.mem[memIds[i]]; if (m) { mx += m.x * (m.v || 1); my += m.y * (m.v || 1); mv += m.v || 1; } }
        mx /= mv; my /= mv;
        // their army near their main has their workers beside it
        var wk = dist(mx, my, ehX, ehY) < 25 ? eWorkersGuess * 0.35 : 0;
        if (P >= (enemyArmyKnown + wk) * 1.3 + 1) { tgt = {x: mx, y: my}; }
      }
      if (!tgt && crushMain) {
        if (enemyBuildings.length) { var eb = nearest(enemyBuildings, c.x, c.y); tgt = {x: eb.getX(), y: eb.getY()}; } else { tgt = S.estart; }
      }
      if (tgt && mainGroup.length < army.length * 0.6) {
        // stragglers catch up first
        var farM = army.filter(function(u) { return dist(u.getX(), u.getY(), c.x, c.y) > 5; });
        if (farM.length) { scope.order('AMove', farM, c, false); }
      } else if (tgt) {
        scope.order('AMove', army, tgt, false);
      } else {
        // nothing it can win yet: wait outside their worker range if it is not smaller than their army, else at home
        var w = P >= 4 && P >= eArmyGuess * 1.2 ? S.fwd : {x: stageX, y: stageY};
        var farW = army.filter(function(u) { return dist(u.getX(), u.getY(), w.x, w.y) > 6; });
        if (farW.length) { scope.order(w === S.fwd ? 'AMove' : 'Move', farW, w, false); }
      }
    }
  } else if (S.mode === 'attack') {
    // pull back when their workers come out, unless I clearly outnumber everything there
    var clearlyAhead = myPower >= (enemyNearArmy + workersOut * 0.4) * 1.6 && myPower >= enemyNearArmy * 2.5;
    if (workersOut >= 3 && !clearlyAhead) {
      setMode('retreat'); S.retreatWorkers = true;
    } else if (enemyNearArmy > myPower * 1.1) {
      setMode('retreat'); S.retreatWorkers = false;
    } else if (army.length < 6 && enemyArmyKnown > P) {
      setMode('gather');
    } else {
      var tgt = null;
      if (nearEnemy.length && !(cDistEnemy < 30 && !crushMain)) {
        // fight the army in front of me first
        tgt = nearest(nearEnemy, c.x, c.y);
      } else if (WOLF && raidable.length) {
        // wolves are fast: hit the workers at their outlying bases, where nothing comes out to help them
        tgt = nearest(raidable, c.x, c.y);
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
  if (!WOLF && S.mode === 'retreat') {
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
  if (!WOLF && (S.mode === 'gather' || S.mode === 'defend')) {
    if (!armyDefends && !(proxies.length && army.length >= 6)) {
      if (bigEnough && mainGroup.length >= army.length * 0.7 && (dist(c.x, c.y, stageX, stageY) < 12 || S.wasOut)) {
        S.wasOut = false;
        setMode('attack');
      } else {
        setMode('gather');
        var far = army.filter(function(u) { return dist(u.getX(), u.getY(), stageX, stageY) > 7; });
        if (far.length) { scope.order('AMove', far, {x: stageX, y: stageY}, false); }
      }
    }
  }
}
