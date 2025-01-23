var me = scope.getMyPlayerNumber();
var team = scope.getMyTeamNumber();
var gold = scope.getGold();
var time = Math.round(scope.getCurrentGameTimeInSec());
const myTeam = scope.getMyTeamNumber();
var eteams = [];
var mteams = [];

var supply = scope.getCurrentSupply();
var maxSupply = scope.getMaxSupply();
var supplyDiff = maxSupply - supply;
var allPlayers = scope.getArrayOfPlayerNumbers();
for(var k = 0; k < allPlayers.length; ++k){
    if(scope.getTeamNumber(allPlayers[k]) === myTeam){
        mteams.push(allPlayers[k]); // Adds teammates numbers to mteam(my team)
    }else if(scope.getTeamNumber(allPlayers[k]) !== myTeam){
        eteams.push(allPlayers[k]); // Adds enemy numbers to eteam
    }
}
randomb = scope.getRandomNumber(1,4);
var randomc = scope.getRandomNumber(-6,5);
var randomNumber = 12;
var randomUnit = scope.getRandomNumber(1, 3);
if(time > 300){
    randomNumber = 15;
}
var saving = 0;
var workers = scope.getUnits({type: "Worker", player: me});
var idleWorkers = scope.getUnits({type: "Worker", player: me, order: "Stop"});
var miningWorkers = scope.getUnits({type: "Worker", player: me, order: "Mine"});
var soldiers = scope.getUnits({type: "Soldier", player: me});
var mages = scope.getUnits({type: "Mage", player: me});
var archers = scope.getUnits({type: "Archer", player: me});
var units = scope.getUnits({notOfType: "Worker", player: me});
var iunits = scope.getUnits({notOfType: "Worker", player: me, order: "Stop"});
var enemyUnits = scope.getUnits({notOfType: "Worker", enemyOf: me});
var Castles = scope.getBuildings({type: "Castle", player: me, onlyFinished: true});
var Houses = scope.getBuildings({type: "House", player: me});
var Guilds = scope.getBuildings({type: "Mages Guild", player: me});
var Towers = scope.getBuildings({type: "Watchtower", player: me});
var Rax = scope.getBuildings({type: "Barracks", player: me});
var Mines = scope.getBuildings({type: "Goldmine"});
var usingMine = [];
var unusedMines = [];
var castleSpot = 0;
var nearestMine = null;
var nearestDist = 99999;
for(var k = 0; k < idleWorkers.length; k++){
    for(var i = 0; i < Mines.length; i++){
        var Mine = Mines[i];
        var dist = Math.pow(Mine.getX() - idleWorkers[k].getX(), 2) + Math.pow(Mine.getY() - idleWorkers[k].getY(), 2);
        if(dist < nearestDist){
            nearestMine = Mine;
            nearestDist = dist;
        }
    }    
}
usingMine.push(nearestMine);
scope.order("Mine", idleWorkers, { unit: nearestMine });
var mined = [];
function findCastleSpot(Mine, randomb) {
    for (let x = -1; x <= 2; x++) {
        for (let y = -1; y <= 2; y++) {
            let xOffset = (randomb == 1 || randomb == 2) ? (randomb == 1 ? -9.5 : 8): randomc + x;
            let yOffset = (randomb == 3 || randomb == 4) ? (randomb == 3 ? -9.5 : 8): randomc + y;
            if(scope.getHeightLevel(Mine.getX()-0.5, Mine.getY()-0.5) == scope.getHeightLevel(Mine.getX()-0.5 + xOffset, Mine.getY()-0.5 + yOffset)) {
                let isAreaValid = true;
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        let checkX = Mine.getX()-0.5 + xOffset + i;
                        let checkY = Mine.getY()-0.5 + yOffset + j;
                        if (!scope.positionIsPathable(checkX, checkY) || scope.fieldIsRamp(checkX, checkY)){
                            isAreaValid = false;
                            break;
                        }
                    }
                    if(!isAreaValid) break;
                }
                if (isAreaValid) {
                    return { x: xOffset, y: yOffset };
                }
            }
        }
    }
    return null;
}
if(Castles.length < 2 && time > 240){
    saving = 1;
}else{
    saving = 0;
}
if(Castles.length >= 1){
    for(let l = 0; l < Castles.length; l++){
        let nearestunDist = 99999;
        let nearestunMined = null;
        let nearestcDist = 99999;
        let nearestcMine = null;

        for(let i = 0; i < Mines.length; i++){
            let Mine = Mines[i];
            let dist = Math.pow(Mine.getX() - Castles[l].getX(), 2) + Math.pow(Mine.getY() - Castles[l].getY(), 2);
            // Check for nearest unmined mine with at least 5980 gold
            if(Mine.getValue('gold') >= 5980 && dist < nearestunDist){
                nearestunMined = Mine;
                nearestunDist = dist;
            }
            // Check for nearest mine overall
            if(dist < nearestcDist){
                nearestcMine = Mine;
                nearestcDist = dist;
            }
        }
        scope.order("Moveto", Castles, {unit:nearestcMine}); // It will always find the most recent built castle last, so we direct all castles production of workers at one goldmine
        scope.order("Research Fireball", Guilds);
        if(!Castles[l].getUnitTypeNameInProductionQueAt(1)){
            if(workers.length <= 7 * Castles.length){
                scope.order("Train Worker", [Castles[l]]);
            }
        }
        var buildlocation3x3x = Castles[l].getX() - scope.getRandomNumber(-randomNumber, randomNumber);
        var buildlocation3x3y = Castles[l].getY() - scope.getRandomNumber(-randomNumber, randomNumber);
        var spotfound3 = 0;
        if(spotfound3 === 0){
            for(let x=-1; x<=2; ++x){
                for(let y=-1; y<=2; ++y){
                    if(scope.positionIsPathable(buildlocation3x3x + x, buildlocation3x3y + y)){
                        if(scope.getHeightLevel(buildlocation3x3x+x, buildlocation3x3y+y) === scope.getHeightLevel(buildlocation3x3x, buildlocation3x3y)){
                            var spotfound3 = 1;
                        }
                    }
                }
            }
        }
        if(saving == 0){ //Is AI saving?
            //Rest of code goes here
            if(gold >= 180){
                if(supplyDiff <= 3){
                    if(spotfound3 === 1){
                        scope.order("Build House", miningWorkers, {x: buildlocation3x3x, y: buildlocation3x3y});
                    }
                }
            }
            if(gold >= 225){
                if(Houses.length > 0){
                    if(Rax.length < 2*Castles.length){
                        if(spotfound3 === 1){
                            scope.order("Build Barracks", miningWorkers, {x: buildlocation3x3x, y: buildlocation3x3y});
                        }
                    }else if(Rax.length >= 1){
                        if(Guilds.length <= 0){
                            scope.order("Build Mages Guild", miningWorkers, {x: buildlocation3x3x, y: buildlocation3x3y});
                        }
                    }
                }
            }
            for(var r = 0; r < Rax.length; r++){
                if(supplyDiff > 2){
                    if(gold >= 100){
                        if(!Rax[r].getUnitTypeNameInProductionQueAt(1)){
                            if(randomUnit === 1){
                                scope.order("Train Soldier", [Rax[r]]);
                            }else if(randomUnit === 2){
                                scope.order("Train Archer", [Rax[r]]);
                            }else if(randomUnit === 3){
                                if(Guilds.length > 0){
                                    scope.order("Train Mage", [Rax[r]]);
                                }
                            }
                        }
                    }
                }else if(supplyDiff < 2){
                    scope.order("Cancel", Rax[r]);
                }
            }
        }else if(saving == 1){
            if(gold > 350 && castleSpot == 0 && Castles.length < 2 || units.length > 6){
                if(randomb >= 1 && randomb <= 4){
                    let castlePosition = findCastleSpot(nearestunMined, randomb);
                    if (castlePosition){
                        castleSpot = 1;
                        scope.order("Build Castle", workers, {x: nearestunMined.getX() + castlePosition.x,y: nearestunMined.getY() + castlePosition.y});
                    }
                }
            }
        }
    }
}
for(var i = 0; i < Mines.length; i++){
    var Mine = Mines[i];
    if(Mine.getValue('gold') < 5900){
        mined.push(Mine);
    }
}
mined = mined.filter(mine => !usingMine.includes(mine));

if(time >= 540){
    if(enemyUnits.length > 0){
        scope.order("AMove", units, scope.getCenterOfUnits[enemyUnits]);
    }else if(enemyUnits.length < 1){
        if(mined.length > 0){
            var randomIndex = scope.getRandomNumber(0, mined.length - 1);
            var randomMine = mined[randomIndex];
            scope.order("AMove", iunits, {x: randomMine.getX() + randomc, y: randomMine.getY() + randomc});
        }
    }
}
for(var m = 0; m < mages.length; m++){
    if(randomUnit === 1){
        scope.order("Slow Field", [mages[m]], scope.getCenterOfUnits(enemyUnits));
    }else if(randomUnit == 2 || 3){
        scope.order("Fireball", [mages[m]], scope.getCenterOfUnits(enemyUnits));
    }
}



