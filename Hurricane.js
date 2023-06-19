/**Deadly default AI
 * 
 * Version 1.1.1 Beta
 * 
 * Made by a totally not egotistcal, super awesome, cofee hating, and 
 * incredibly skilled and unparalled programer, 
 * Mr. Meow Meow! 
 * 
 * Questions? Comments? Come see me in the discord, in #AI-Discussion.
 * Concerns? Complaints? Please refer to the Department of Nobody Cares. And
 * yes, I am the manager.
 */
scope.chatMsg("Hurricane");
const me = scope.getMyPlayerNumber();
const time = Math.round(scope.getCurrentGameTimeInSec());
const gold = scope.getGold();
const myTeam = scope.getMyTeamNumber();

const supply = scope.getCurrentSupply();
const maxSupply = scope.getMaxSupply();
const supplyDiff = maxSupply - supply;//supply differenece

const fightingUnits = scope.getUnits({notOfType: "Worker", player: me}); // returns all own fighting units (=not workers)
const idleFightingUnits = scope.getUnits({notOfType: "Worker", player: me, order: "Stop"});
const myUnits = {};
for(var i = 0; i < fightingUnits.length; i++){
    var unit = fightingUnits[i];
    var name = unit.getTypeName();
    if(myUnits[name] != undefined){
        myUnits[name].push(unit);
    }else{
        myUnits[name] = [];
        myUnits[name].push(unit);
    }
}//Note that if you do not have a unit of a certain type, acessing 
//myUnits[nonExistantUnitName] will return undefined. 

const enemyUnits = scope.getUnits({enemyOf: me});
const enemyFightingUnits = scope.getUnits({notOfType: "Worker", enemyOf: me});
var notMyBuildings = scope.getBuildings({enemyOf: me});
var enemyBuildings = [];
for(i = 0; i < notMyBuildings.length; i++){
	if(notMyBuildings[i].isNeutral() === false){
		enemyBuildings.push(notMyBuildings[i]);
	}
}//Copied from @BrutalityWarlord's AI; filters out enemy units from neutral units
var myMechUnits = [];
const enemyRanged = [];
const enemyMelee = [];
enemyFightingUnits.forEach(function(unit){
    if(unit.getFieldValue("range") > 1){
        enemyRanged.push(unit);
    }else{
        enemyMelee.push(unit);
    }
});
const myMelee = [];
const myRanged = [];
fightingUnits.forEach(function(unit){
    if(unit.getFieldValue("range") > 1){
        myRanged.push(unit);
    }else{
        myMelee.push(unit);
    }
});

if(myUnits["Ballista"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Ballista"]);
}
if(myUnits["Catapult"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Catapult"]);
}
if(myUnits["Gatling Gun"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Gatling Gun"]);
}

var myBuilds = {
    "allBuilds": scope.getBuildings({player: me}),
    "Castles": scope.getBuildings({type: "Castle", player: me}),
    "Fortresses": scope.getBuildings({type: "Fortress", player: me}),
    "Barracks": scope.getBuildings({type : "Barracks", player: me}),
    "Houses": scope.getBuildings({type: "House", player: me}),
    "Watchtowers": scope.getBuildings({type: "Watchtower", player: me}),
    "Forges": scope.getBuildings({type: "Forge", player: me}),
    "Churches": scope.getBuildings({type: "Church", player: me}),
    "Mages Guilds": scope.getBuildings({type: "Mages Guild", player: me}),
    "Armories": scope.getBuildings({type: "Armory", player: me}),
    "Wolves Dens": scope.getBuildings({type: "Wolves Den", player: me}),
    "Werewolves Dens": scope.getBuildings({type: "Werewolves Den", player: me}),
    "Animal Testing Labs": scope.getBuildings({type: "Animal Testing Lab", player: me}),
    "Dragon Lairs": scope.getBuildings({type: "Dragons Lair", player: me}),
    "Workshops": scope.getBuildings({type: "Workshop", player: me}),
    "Advanced Workshops": scope.getBuildings({type: "Advanced Workshop", player: me}),
    "Mills": scope.getBuildings({type: "Mill", player: me}),
    "Snake Charmers": scope.getBuildings({type: "Snake Charmer", player: me}),
}
myBuilds.combatUnitProducers = myBuilds["Churches"].concat(myBuilds["Wolves Dens"].concat(myBuilds["Dragon Lairs"].concat(myBuilds["Workshops"].concat(myBuilds["Advanced Workshops"].concat(myBuilds["Mills"].concat(myBuilds["Barracks"].concat(myBuilds["Werewolves Dens"])))))));
var alliedBuilds = scope.getBuildings({team: myTeam});
var goldmines = scope.getBuildings({type: "Goldmine"});

if(scope.initailized === true && myBuilds.combatUnitProducers.length > 1){
    filterDontProducers();
}

myBuilds.CastleAndFortresses = myBuilds["Fortresses"].concat(myBuilds["Castles"]);//Fortresses should be the first castle the bot has, so therefore
//it is concated into castles. Newest castles/fortresses should be at the back, oldest at the front. Messing with the order will cause problems.

var idleWorkers = scope.getUnits({type: "Worker", player: me, order: "Stop"});
var allWorkers = scope.getUnits({type: "Worker", player: me});
var miningWorkers = scope.getUnits({type: "Worker", player: me, order: "Mine"});
var repairingWorkers = scope.getUnits({type: "Worker", player: me, order: "Repair"});
var workerToCastleRatio = Math.ceil(miningWorkers.length / myBuilds["CastleAndFortresses"].length);

var combatUnitProducerToCastleRatio = myBuilds.combatUnitProducers.length / (scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}).concat(myBuilds["Fortresses"])).length;

/**
 * Gets random numbers. See methods inside for details.
 */
class Randomizer {
    //CREDIT GOES TO @Jermy Keeshin at CodeHS
    
    //https://static1.codehs.com/gulp/1edc730c184f9950e19e21d320171c1b14507618/jsdoc/chs-js-lib/graphics_randomizer.js.html
    /**
     * Get a random integer between low to high, inclusive.
     * If only one parameter is given, a random integer
     * from (0, low-1) inclusive.
     * @param {number} low - Lower bound on range of random int.
     * @param {number} high - Upper bound on range of random int.
     * @returns {number} Random number between low and high, inclusive.
    */
    static nextInt(low, high){
        if(typeof high === "undefined"){
            high = low - 1;
            low = 0;
        }
        low = Math.floor(low);
        var r = Math.random();
        return low + Math.floor(r * (high - low + 1));
    };
    /**
     * Get a random float between low to high, inclusive.
     * If only one parameter is given, a random float
     * from (0, low-1) inclusive.
     * @param {number} low - Lower bound on range of random int.
     * @param {number} high - Upper bound on range of random int.
     * @returns {number} Random number between low and high, inclusive.
    */
    static nextFloat(low, high){
        if(typeof high === "undefined"){
            high = low;
            low = 0;
        }
        return low + (high - low) * Math.random();
    };
    /**
     * Generate a random boolean via fair probability coin toss.
     * If `probabilityTrue` is supplied, the coin toss is skewed by that value.
     * @param {number} probabilityTrue - Skewed probability of true.
     * @returns {boolean} Result of coin flip skewed toward `probabilityTrue`.
    */
    static nextBoolean(probabilityTrue){
        if(typeof probabilityTrue === "undefined"){
            probabilityTrue = 0.5;
        }
        return Math.random() < probabilityTrue;
    };
}

if(!scope.initailized){
    // console.log("Player: ", scope.getMyPlayerNumber(), "I am Hurricane AI");
   scope.initailized = true;
   /**
     * Gets the combat power of a unit. If the unit
     * is not defined in scope.unitPower, it will 
     * return 0.
     * 
     * @param {unit} unit - the unit to be measured
     * 
     * @returns {number} - the combat power of the unit
     */
    scope.getPowerOf = function(unit){
        if(unit != undefined && scope.unitPower[unit.getTypeName()] != undefined){
            return scope.unitPower[unit.getTypeName()] * (unit.getValue("hp") / unit.getFieldValue("hp"));
        }else{
            return 0;
        }
    }
   scope.buildingSizes = {
        "House": [3, 3],
        "Barracks": [3, 3],
        "Watchtower": [2, 2],
        "Forge": [4, 4],
        "Castle": [4, 4],
        "Fortress": [4, 4],
        "Church": [4, 4],
        "Mages Guild": [3, 3],
        "Armory": [3, 3],
        "Wolves Den": [3, 3],
        "Animal Testing Lab": [4, 4],
        "Dragons Lair": [3, 3],
        "Workshop": [4, 4],
        "Advanced Workshop": [4, 4],
        "Mill": [4, 4],
        "Snake Charmer": [2, 2],
    }
    
    scope.buildPrio = {
        "House": 0,
        "Barracks": 0,
        "Watchtower": 0,
        "Forge": 0,
        "Castle": 0,
        "Church": 0,
        "Mages Guild": 0,
        "Armory": 0,
        "Wolves Den": 0,
        "Animal Testing Lab": 0,
        "Dragons Lair": 0,
        "Workshop": 0,
        "Advanced Workshop": 0,
        "Mill": 0,
        "Snake Charmer": 0,
    }//default
    
    scope.unitPrio = {
        "Worker": 0,
        "Bird": 0,
        "Ballista": 0,
        "Soldier": 0,
        "Archer": 0,
        "Mage": 0,
        "Priest": 0,
        "Raider": 0,
        "Snake": 0,
        "Wolf": 0,
        "Werewolf": 0,
        "Dragon": 0,
        "Gyrocraft": 0,
        "Gatling Gun": 0,
        "Catapult": 0,
        "Airship": 0,
    }
    
    scope.unitProducedAt = {
        "Bird": "CastleAndFortresses",
        "Worker": "CastleAndFortresses",
        "Soldier": "Barracks",
        "Archer": "Barracks",
        "Mage": "Barracks",
        "Priest": "Churches",
        "Raider": "Barracks",
        "Snake": "Wolves Dens",
        "Wolf": "Wolves Dens",
        "Werewolf": "Werewolves Dens",
        "Dragon": "Dragon Lairs",
        "Gyrocraft": "Mills",
        "Gatling Gun": "Workshops",
        "Catapult": "Workshops",
        "Ballista": "Advanced Workshops",
        "Airship": "Advanced Workshops",
    }
    
    scope.unitPower = {//used to calculate how much of a threat an enemy is
        "Worker": 0,
        "Soldier": 1,
        "Archer": 1,
        "Mage": 1.25,
        "Priest": 1.25,
        "Raider": 1.25,
        "Wolf": 0.6,
        "Snake": 0.6,
        "Werewolf": 4,
        "Dragon": 3,
        "Airship": 0,
        "Gatling Gun": 1.2,
        "Gyrocraft": 1,
        "Catapult": 1.5,
        "Ballista": 1,
        "Bird": 0,
        "Healing Ward": 1,
    };

    /**
     * Priorities for various metas.
     * 
     * attackThreshold is the point at which the bot will attack, calculated
     * by the number of combat unit producers (rax, workshops, etc.)
     * multiplied by the attackThreshold.
     */
    scope.allSubMetaPrios = {
        "Barracks": {
            "Balanced": {
                "Buildings": ["Barracks"],
                "Units": ["Soldier", "Archer", "Raider"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 1.8, "maxProducers": 10, "opener": true},
            },
            "Magical": {
                "Buildings": ["Barracks", "Church"],
                "Units": ["Mage", "Priest", "Raider"],
                "Upgrades": ["Fireball", "Invisibility", "Forge"],
                "Misc": {"attackThreshold": 1.8, "singleProduction": ["Mages Guild"], "maxProducers": 10, "opener": false},
            }
        },
        "Beast": {
            "WolfSnakeSpam": {
                "Buildings": ["Wolves Den", "Snake Charmer"],
                "Units": ["Wolf", "Snake"],
                "Upgrades": ["Animal Testing Lab"],
                "Misc": {"attackThreshold": 3, "maxProducers": 14, "opener": true},
            },
            "WolfSnakeAndWerewolf": {
                "Buildings": ["Wolves Den", "Snake Charmer"],
                "Units": ["Wolf", "Snake", "Werewolf"],
                "Upgrades": ["Werewolf Den", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 14, "opener": false},
            },
            "WolfSnakeAndDragon": {
                "Buildings": ["Wolves Den", "Snake Charmer", "Dragons Lair"],
                "Units": ["Wolf", "Snake", "Dragon"],
                "Upgrades": ["Fortress", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 14, "opener": false},
            },
            "WolfSpam": {
                "Buildings": ["Wolves Den"],
                "Units": ["Wolf"],
                "Upgrades": [],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 16, "opener": true},
            },
            "DragonSpamRush": {
                "Buildings": ["Dragons Lair"],
                "Units": ["Dragon"],
                "Upgrades": ["Fortress", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 1.7, "maxProducers": 12, "opener": false},
            },
        },
        "Mechanical": {
            "CatapultSpam": {
                "Buildings": ["Workshop"],
                "Units": ["Catapult"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2.1, "maxProducers": 10, "opener": false},
            },
            "GatlingGunSpam": {
                "Buildings": ["Workshop"],
                "Units": ["Gatling Gun"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2, "maxProducers": 10, "opener": true},
            },
            "CatapultGatlingGunSpam": {
                "Buildings": ["Workshop"],
                "Units": ["Gatling Gun", "Catapult"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2.2, "maxProducers": 10, "opener": true},
            },
            "GyrocraftSpam" : {
                "Buildings": ["Mill"],
                "Units": ["Gyrocraft"],
                "Upgrades": ["Forge"],
                "Misc": {"singleProduction": ["Workshop"], "attackThreshold": 3, "maxProducers": 14, "opener": false},
            }
        }
    }
    
    var metas = ["Barracks",
                 "Beast", 
                 "Mechanical"
                 ];//various large-scale strategies the bot can use

    scope.allSubMetas = {
        "Barracks": ["Balanced", "Magical"],
        "Beast": ["WolfSnakeSpam", "WolfSnakeAndWerewolf", "WolfSnakeAndDragon", "WolfSpam", "DragonSpamRush"],
        "Mechanical": ["CatapultSpam", "GatlingGunSpam", "CatapultGatlingGunSpam", "GyrocraftSpam"],
    }//sub-strategies within various metas.
    
    for(var i = 0; i < Randomizer.nextInt(1, 10); i++){
        scope.meta = metas[Randomizer.nextInt(0, metas.length - 1)];//fetches a meta
    }//Oftentimes, several bots in a multiplayer will choose the same meta because 
    //of js magic. This for loop tries to add another layer of randomness to stop that.
    
    while(true){
        for(var i = 0; i < Randomizer.nextInt(1, 5); i++){
            scope.subMeta = scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)];//fetches a submeta
        }
        if(scope.allSubMetaPrios[scope.meta][scope.subMeta]["Misc"].opener == true){
            break;
        }
    }
    

    /**
     * Determines what units the bot will produce, what buildings the bot will
     * build, and what upgrades the bot will pursue. Note that workers are
     * seperate and will always be trained, along with houses, castles, and
     * watchtowers being built
     */
    
    scope.subMetaPrios = scope.allSubMetaPrios[scope.meta][scope.subMeta];
    scope.attackThreshold = scope.subMetaPrios["Misc"].attackThreshold;
    scope.unitProducerCap = scope.subMetaPrios["Misc"].maxProducers;
    
    scope.bases = [];
    scope.doTrainUnits = true;
    scope.doBuildBuildings = true;
    
    scope.maxWorkersOnBase = Randomizer.nextInt(7, 9);
    
    scope.startUnminedMines = getUnminedMines();
    
    scope.underAttack = false;
    
    scope.lastNumOfCastles = 1;//Don't mess with this
    scope.enemyWorkerScouts = [];
    
    scope.canRetreat = true;
    
    scope.dontProduceFromThese = new Set();//Buildings that shouldn't produce anything. They will not count in productionBuildings.
    scope.onlyProduceOneOfThese = [];
    scope.tickrate = {
        "Scout": Randomizer.nextInt(30, 100),
        "Attack": Randomizer.nextInt(20, 30),
        "Defend": Randomizer.nextInt(2, 4),
        "Build": Randomizer.nextInt(3, 6),
        "BuildCastle": Randomizer.nextInt(6, 15),
        "Repair": Randomizer.nextInt(3,5),
        "ArmyBrain": Randomizer.nextInt(2, 3),//kiting, retreating
        "Train": Randomizer.nextInt(2, 4),
    }//how often the bot runs various functions/methods
    
    scope.mechRepairPercent = Randomizer.nextFloat(0.05, 0.25);
    scope.mechRepairSquad = [];
    
    beginBotChat();
    
    scope.trainingModeOn = false;
    if(scope.trainingModeOn === true){
        scope.mute = true;
    }else{
        scope.mute = false;
    }

    scope.firstCastle = myBuilds["CastleAndFortresses"][0];

    //At the beginning, cluster buildings together more.
    if(scope.startUnminedMines.length > 0){
        scope.defaultBuildRad = 6;
    }else{
        scope.defaultBuildRad = 8;
    }
    
    //scope.chatMsg(getMyColor() + ": " + metas[Randomizer.nextInt(0, metas.length - 1)] + ", " + scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)]);
}


/**
 * A class that builds a building within a bounding box of a x and y.
 * Passed an object with the following values set:
 * 
 * @param centerX - the center of the bounding box in the x axis
 * @param centerY - the center of the bounding box in the y axis
 * @param buildRad - the radius of the bounding box.
 * 
 * There are many other options, see inside the constructor for details on them.
 * I also spent way too much time adding getters and setters, so appricate that
 * please.
 */
class RandBuild {
    constructor(obj){
        if(typeof obj.centerX != "number" || typeof obj.centerY != "number"){
            throw new TypeError("You must pass valid coordinates to RandBuild! Received coordinates: " + obj.centerX + ", " + obj.centerY)
        }
        if(scope.buildingSizes[obj.building][0] === undefined){
            throw new TypeError("RandBuild: " + obj.building + " does not have a building size listed!");
        }
        this.building = obj.building,
        
        this.buildWidth = scope.buildingSizes[this.building][0];//the width of the building
        this.buildHeight = scope.buildingSizes[this.building][1];//height of the building
        this.centerX = obj.centerX;//center of the bounding box
        this.centerY = obj.centerY;//ditto
        this.buildX = this.centerX - this.buildWidth / 2,//default. Will change through subsequent randomizer iterations.
        this.buildY = this.centerY - this.buildHeight / 2,
        this.buildWorkers = miningWorkers;//which workers build the building
        this.preferredBuildRad = null;
        this.buildRad = 15;//one-half of the build's bounding box's side. A buildRad of 15 means the building can be built in a box 30x30 squares wide, centered on centerX and centerY
        this.minDisFromCenter = 0;//minimum distance from the center, inclusive.
        this.tryTheseFirst = [];//A set of coordinates to try first. 
        //Pushed in as [x, y]. The coordinates are assumed to be the upper left-hand corner of the building
        //during the building checks. For example, if your want a watchtower to be constructed above or
        //below a castle, you would push [0, 2] (above) and [0, 4] (below). If all of the coordinates are invalid,
        //findSuitableSpot() will default to random searching. You can either pass hard-coded coordinates that are
        //not relative or relative coordinates. For example, passing [22, 14, false] will try, non-relativly, (22, 14) first, while
        //[22, 14] or [22, 14, true] will be relative to centerX and centerY
        this.heightComparison; //If you would like the build to be the same height as something else
        //(usually a castle and a goldmine), pass the height that the build should be at here.
        this.heightComparisonIsPreferred = false;//If set to true, then randBuild will make up to 
        //half of maxTires on the same height level, then will search for all height levels for the other half.
        
        this.maxTries = 100;//Maximum amount of attempts the algorithm will make for a buildable spot.
        //Note that the algorithm will also break if maxTries * 10 squares have been checked.
        
        this.dontBuild = [];//A list of locations that the algorithm will not touch. Passed in as [x, y, rad]. Rad is optional.
        //Rad is calculated from the center of the build.
        this.fails = {"squares": 0,
            "places": 0,
            "minDist": 0,
            "path": 0,
            "ramp": 0,
            "height": 0,
            "dontBuild": 0,
            "checkline": 0,
        }
        scope.myPower = 999999;

        this.pad = 1;
        //scope.chatMsg(this.centerX + ", " + this.centerY);
    }
    
    /**
     * A function to find a suitable spot for the build within the bounding box.
     * 
     * @returns {object} - the coordinates of a suitable spot in the format of
     * {x: foo, y: foo}
     */
    findSuitableSpot(){
        for(var i = 0; i < this.dontBuild.length; i++){
            if(this.dontBuild[i][2] === undefined){
                this.dontBuild[i][2] = 1;
            }
        }
        if(this.heightComparisonIsPreferred === true && this.heightComparison === undefined){
            throw new TypeError("You must pass a valid height comparison in order for preferred height comparison to work!")
        }
        
        this.oldBuildRad = this.buildRad;
        if(this.preferredBuildRad != null){
            this.buildRad = this.preferredBuildRad;
        }
        //Fail types for debugging purposes
        var SENTINEL = 0;//squares checked
        var placesChecked = 0;
        var distanceFormulaFails = 0;//Minimum distance fails
        var pathableFails = 0;
        var fieldIsRampFails = 0;
        var heightFails = 0;//actually height difference fails, so if you set this.heightComparison to something and a square fails that, then this will be triggered.
        var dontBuildFails = 0;
        var checklineFails = 0;
        
        
        while(true){
            placesChecked ++;
            var sucess = true;
            if(placesChecked === Math.round(this.maxTries / 2)){
                this.buildRad = this.oldBuildRad;
            }

            if(this.building === "Castle"){
                 /**
                 * The stuff below checks the height level on a direct line between 
                 * (centerX , centerY) and (buildX, buildY) to make sure that there
                 * are no ravines or obstacles in between the two points.
                 */
                var upperLeftCorner = {x: this.centerX - 1.5, y: this.centerY - 1.5};

                var dontCheckThese = [];
                for(var x = 0; x < 3; x++){
                    for(var y = 0; y < 3; y++){
                        dontCheckThese.push([upperLeftCorner.x + x, upperLeftCorner.y + y]);
                    }
                }//Omits the goldmine from the checks

                sucess = checkAlongLine(this.centerX, this.centerY, this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.heightComparison, dontCheckThese, true);
                if(sucess === false){
                    checklineFails++;
                    this.getNewLocation();
                }
            }
            
            if(sucess === true){
                for(var x = Math.floor(this.buildX - this.pad); x < Math.ceil(this.buildX + this.buildWidth) + this.pad; x++){
                    for(var y = Math.floor(this.buildY - this.pad); y < Math.ceil(this.buildY + this.buildHeight) + this.pad; y++){
                        SENTINEL++;
                        if(SENTINEL > this.maxTries * 10){
                            break;
                        }
                        var squareIsGood = true;
                        if(scope.positionIsPathable(x, y) === false){
                            squareIsGood = false;
                            pathableFails++;
                        }else if(scope.fieldIsRamp(x, y) === true){
                            squareIsGood = false;
                            fieldIsRampFails++;
                        }
                        
                        if(x >= this.buildX && x < this.buildX + this.buildWidth && y >= this.buildY && y < this.buildY + this.buildHeight){
                            if(distanceFormula(x, y, this.centerX, this.centerY) < this.minDisFromCenter - this.buildWidth / 2){
                                squareIsGood = false;
                                distanceFormulaFails++;
                            }
                            if(this.building === "Castle"){
                                //If the building is a castle, check to make sure it's not
                                //within the radius of another mine.
                                var mines = scope.getBuildings({type: "Goldmine"});
                                mines.forEach(function(mine){
                                    if(distanceFormula(mine.getX() + 1, mine.getY() + 1, x, y) < 6.5){
                                        squareIsGood = false;
                                        distanceFormulaFails++;
                                    }
                                });
                            }
                            var doCheckHeight = true;
                            if(this.heightComparisonIsPreferred === true){
                                if(placesChecked > this.maxTries / 2){
                                    doCheckHeight = false;
                                }
                            }
                            if(doCheckHeight === true && this.heightComparison != undefined && this.heightComparison != scope.getHeightLevel(x, y)){
                                squareIsGood = false;
                                heightFails++;
                            }
                        }//if the actual proposed structure is being checked
                        
                        
                        //If the square is bad, find a new spot.
                        if(squareIsGood === false){
                            //breaks the loop
                            x = Math.ceil(this.buildX + this.buildWidth) + 1;
                            y = Math.ceil(this.buildY + this.buildHeight) + 1;
                            this.getNewLocation();
                            sucess = false;
                        }//This block only runs if the square is bad, and attempts to find a good spot. 
                    }
                    
                }//Checks the surrounding area and the build to make sure there is no obstructions
                //and all other conditions are fufilled.
            }
            if(sucess === true){
                break;
            }
            if(placesChecked > this.maxTries){
                this.buildX = null;
                this.buildY = null;
                break;
            }
        }
        
        this.fails["squares"] = SENTINEL;
        this.fails["places"] = placesChecked;
        this.fails["minDist"] = distanceFormulaFails;
        this.fails["path"] = pathableFails;
        this.fails["ramp"] = fieldIsRampFails;
        this.fails["height"] = heightFails;
        this.fails["dontBuild"] = dontBuildFails;
        this.fails["checkline"] = checklineFails;
        



        //scope.chatMsg(me + ": Sqrs: " + SENTINEL + ", Places: " + placesChecked + ", Fails: minDist: " + distanceFormulaFails + " Path: " + pathableFails + " Ramp: " + fieldIsRampFails + " Height: " + heightFails + " dontBuild: " + dontBuildFails);
        //scope.chatMsg(getMyColor() + ": " + JSON.stringify(this.fails));
        return {"x": this.buildX, "y": this.buildY};
    }

    /**
     * Gets a new location if the proposed location in findSuitableSpot() is not
     * valid.
     * 
     * @returns {object} - an object containing the coordniates of a new location.
     */
    getNewLocation(){
        var SENTINEL2 = 0;
        var shouldBreak = false;
        while(shouldBreak === false){
            SENTINEL2++;

            //Makes up to 20 attempts to find a new location
            if(SENTINEL2 > 20){
                shouldBreak = true;
            }
            
            if(this.tryTheseFirst.length <= 0){
                this.buildX = Randomizer.nextInt(this.centerX - this.buildRad, this.centerX + this.buildRad - this.buildWidth);
                this.buildY = Randomizer.nextInt(this.centerY - this.buildRad, this.centerY + this.buildRad - this.buildHeight);
            }else{
                var relative = true;
                if(this.tryTheseFirst[0][2] === false){
                    relative = false;
                }
                if(relative === true){
                    this.buildX = Math.round(this.centerX + this.tryTheseFirst[0][0]);
                    this.buildY = Math.round(this.centerY + this.tryTheseFirst[0][1]);
                }else{
                    this.buildX = Math.round(this.tryTheseFirst[0][0] - 1);
                    this.buildY = Math.round(this.tryTheseFirst[0][1] - 1);
                }
                this.tryTheseFirst.splice(0, 1);
            }
            
            //Checks the array dontBuild to make sure that the proposed spot is not close
            var dontBuildFailed = false;
            for(var i = 0; i < this.dontBuild.length; i++){
                var dist = distanceFormula(this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.dontBuild[i][0], this.dontBuild[i][1]);
                if(dist < this.dontBuild[i][2]){
                    dontBuildFailed = true;
                    shouldBreak = false;
                    this.fails["dontBuild"]++;
                    i = this.dontBuild.length;
                }
            }
            
            if(dontBuildFailed === false){
                if(Math.round(distanceFormula(this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.centerX, this.centerY) + this.buildWidth / 2) >= this.minDisFromCenter){
                    shouldBreak = true;
                }else{
                    this.fails["minDist"]++;
                }
            }
        }
    }
    
    /**
     * Actually gives the order to build the building. Throws an error if
     * the build object is unacceptable.
     * 
     * @param {object} obj - an object containing the coordinates of the build.
     * Technically you can pass whatever you want here, but it is highly
     * advisable to call findSuitableSpot() for buildAt
     */
    buildAt(obj){
        if(typeof obj != "object"){
            throw new TypeError("Cannot build at coordinates " + JSON.stringify(obj) + "! Recieved type: " + typeof obj + "!")
        }
        scope.order("Build " + this.building, this.buildWorkers, obj);
    }
    
    //GETTERS
    //--------------------------------------------------------------------------
    
    /**
     * Gets the bounding box's radius.
     * @returns {integer} - The buildradius of the build.
     */
    getBoundingBoxRad(){
        return this.buildRad;
    }
    
    /**
     * For debugging purposes. Returns an object with various fail statistics.
     * 
     * @returns {object} - An object with statistics on failure reasons, such
     *  as pathable fails, ramp fails, minimum distance fails, etc.
     */
    getFailedAttempts(){
        return this.fails;
    }
    
    /**
     * Returns the current minimum distance set.
     * 
     * @returns {number} - The current miniumum distance.
     */
    getMinDist(){
        return this.minDisFromCenter;
    }
    
    /**
     * Returns the building's set building width, as in how wide the building is
     * 
     * @returns {number} - RandBuild's build width listed for the building. Note
     *  that if the building is unlisted or unknown, such as in a modded map,
     *  this may return undefined.
     */
    getBuildWidth(){
        return this.buildWidth;
    }
    
    /**
     * Returns the building's set building width, as in how tall the building is
     * 
     * @returns {number} - RandBuild's build height listed for the building. 
     *  Note that if the building is unlisted or unknown, such as in a modded
     *  map, this may return undefined.
     */
    getBuildHeight(){
        return this.buildHeight;
    }
    
    /**
     * Returns the RandBuild's build worker array.
     *  
     * @returns {array} - What workers will be assigned to carry out the grisly
     * task of constructing the building. Note that LWG will automatically
     * get the closest worker from this array using the A* formula to build the
     * building. Default build workers is mining workers.
     */
    getBuildWorkers(){
        return this.buildWorkers;
    }
    
    /**
     * Returns the current array of coordinates that will be tried first. Note
     * that if findSuitableSpot() has been called before getTryTheseFirst() is 
     * called, the array will be empty because findSuitableSpot() splices out
     * the coordinates in tryTheseFirst it has already tried.
     * 
     * @returns {array} - An array of UNTRIED coordinates that 
     * findSuitableSpot() will try when it is called.
     * 
     */
    getTryTheseFirst(){
        return this.tryTheseFirst;
    }
    
    /**
     * Returns the height level that findSuitableSpot() will try to keep the
     * build on. Note that if heightComparisonIsPreferred is set to true, this
     * height comparison will only be used for half of findSuitableSpot()'s 
     * attempts, with the other half not caring what the height comparison is
     * set to.
     * 
     * @returns {number} - Returns whatever the height comparison is set to.
     */
    getHeightComparison(){
        return this.heightComparison;
    }
    
    /**
     * Returns if height comparison is preferred, or if it is absolute. If
     * returns false, then findSuitableSpot() will only find spots that are
     * on the same height level as whatever heightComparison is set to.
     * 
     * @returns {boolean} - If height comparison is preferred.
     */
    getHeightComparisonIsPreferred(){
        return this.heightComparisonIsPreferred;
    }
    
    /**
     * Gets the maximum amount of spots findSuitableSpot() will attempt before
     * the Sentinel triggers.
     * 
     * @returns {number} - Maximum amount of tries.
     */
    getMaxTries(){
        return this.maxTries;
    }
    
    /**
     * Gets the places that findSuitableSpot will not build at.
     * 
     * @returns {array} - a list of coordinates and radiuses that
     * findSuitableSpot() will not build within. Elements within the list are
     * formatted like so:
     * [x, y, radius(exclusive)]
     */
    getDontBuild(){
        return this.dontBuild;
    }
    
    //SETTERS
    //-------------------------------------------------------------------------
    
    /**
     * Sets the build radius of the bounding box. For example, if the radius
     * is 2:
     * 
     *  ---4---
     *  _ _ _ _  
     * |       | |
     * |       | 4
     * |       | |
     * | _ _ _ | |
     * 
     * 
     * If the radius is set to 4:
     * ------- 8 -------
     *  _ _ _ _ _ _ _ _  
     * |               |  |
     * |               |  |
     * |               |  |
     * |               |  8
     * |               |  |
     * |               |  |
     * |               |  |
     * | _ _ _ _ _ _ _ |  |
     * 
     * @param {number} rad - radius of the bounding box. See above for details.
     */
    setBuildRad(rad){
        this.buildRad = rad;
    }
    
    /**
     * Sets the minimum distance from the center of the build.
     * 
     * @param {number} dist - the distance from the center, exclusive
     */
    setMinDist(dist){
        this.minDisFromCenter = dist;
    }
    
    /**
     * Sets the registered width of the building, as in how big it is. Not 
     * reccomended.
     * 
     * Changing this will change how findSuitableSpot() functions. 
     * 
     * @param {number} width - the new registered value of the building width.
     */
    setBuildWidth(width){
        this.buildWidth = width;
    }
    
    /**
     * Sets the registered height of the building, as in how big it is. Not
     * reccomended.
     * 
     * Changing this will change how findSuitableSpot() functions. 
     * 
     * @param {number} height - the new registered value of the building height.
     */
    setBuildHeight(height){
        this.buildHeight = height;
    }
    
    /**
     * Sets the build workers to a new array of workers. Throws an error if not
     * passed a array, although objects will pass the error filter (but will
     * set off other errors later)
     * 
     * @param {array} workers - an array of workers to build the structure. The
     * closest worker will build the building.
     */
    setBuildWorkers(workers){
        if(typeof workers != "object"){
            throw new TypeError("setBuildWorkers: You must pass a valid worker array! Recieved type: " + typeof workers)
        }
        this.buildWorkers = workers;
    }
    
    /**
     * Add build workers to the buildWorker array.
     * 
     * @param {array} workers - an array of workers to be added
     */
    addBuildWorkers(workers){
        if(typeof workers != "object"){
            throw new TypeError("addBuildWorkers: You must pass a valid worker array! Recieved type: " + typeof workers)
        }
        for(var i = 0; i < workers.length; i++){
            this.buildWorkers.push(workers[i]);
        }
    }
    
    /**
     * Sets which coordinates will be tried first. Added like so: 
     * [[2, 3], [5, 4], [64, 78, false]]
     * For more info, see the constructor for the RandBuild class.
     * 
     * @param {array} coordinates - an array of coordinates that will be tried
     * first when findSuitableSpot() runs.
     */
    setTryTheseFirst(coordinates){
        if(typeof coordinates != "object"){
            throw new TypeError("setTryTheseFirst: You must pass a valid coordinate array! Recieved type: " + typeof workers)
        }
        this.tryTheseFirst = coordinates;
    }
    
    /**
     * Pushes coordinates into the tryTheseFirst array.Throws an error if the
     * typeof the coordinates is not 'object' (an array);
     * 
     * @param {array} coordinates - the coordinates that will be added to the
     * tryTheseFirst array for a particular RandBuild.
     */
    addToTryTheseFirst(coordinates){
        if(typeof coordinates != "object"){
            throw new TypeError("addToTryTheseFirst: You must pass a valid coordinate array! Recieved type: " + typeof workers)
        }
        for(var i = 0; i < coordinates.length; i++){
            this.tryTheseFirst.push(coordinates[i])
        }
    }
    
    /**
     * Sets the height comparison (the height that the build should be)
     * 
     * @param {integer} height - the height at which the build should be
     * located at.
     */
    setHeightComparison(height){
        this.heightComparison = height;
    }
    
    /**
     * Sets which workers will build the structure. Overrides whatever build
     * workers were listed before. Throws a error if the type of the workers
     * argument is not 'object' (array).
     * 
     * @param {array} workers - The workers that will build the structure.
     */
    setBuildWorkers(workers){
        if(typeof workers != "object"){
            throw new TypeError("setBuildWorkers: You must pass a valid worker array! Recieved type: " + typeof workers)
        }
        this.buildWorkers = workers;
    }
    
    /**
     * Adds workers that will build the structure. Throws a error if the type of 
     * the workers argument is not 'object' (array). Note that because of LWG
     * magic, only the closet in the entire buildWorkers array will build the
     * building.
     * 
     * @param {array} workers - The workers to add to buildWorkers.
     */
    addBuildWorkers(workers){
        if(typeof workers != "object"){
            throw new TypeError("addBuildWorkers: You must pass a valid worker array! Recieved type: " + typeof workers)
        }
        for(var i = 0; i < workers.length; i++){
            this.buildWorkers.push(workers[i]);
        }
    }
    
    /**
     * Sets the maximum amount of tries that findSuitableSpot() will attempt.
     * 
     * @param {integer} tries - The new amount of maximum tries.
     */
    setMaxTries(tries){
        this.maxTries = tries;
    }
    
    /**
     * Sets if height comparison is preferred. If true, then up to half of the
     * maximum tries will be limited to whatever the height comaprison is set
     * to. If set to false, all tries will be limited to whatever the height
     * comparison is. If set to false, a height comparison must be given. If
     * the height comparison is undefined but heightComparison is set to true,
     * an error will be thrown. If the height comparison is undefined, then
     * findSuitableSpot() will find all height levels to build on.
     * 
     * @param {boolean} boolean - if height comparison is preferred.
     */
    setIsHeightComparisonPreferred(boolean){
        if(typeof boolean != "boolean"){
            throw new TypeError("setIsHeightComparisonPreferred: You must pass a boolean type! Recived type: " + typeof boolean)
        }
        this.heightComparisonIsPreferred = boolean;
    }
    
    /**
     * Sets that maximum amount of tries that findSuitableSpot() will attempt.
     * 
     * @param {integer} tries - the maximum amount of tries desired.
     */
    setMaxTries(tries){
        this.maxTries = tries;
    }
    
    /**
     * Sets the coordinates where findSuitableSpot() will not build. Formatted
     * like so: [x, y, radius]. Push in an array, or else an error will
     * be thrown in your face. The paramater coordinates is an array of 
     * coordinates and radii. You can have multiple in a array that's pushed
     * in.
     * 
     * @param {array} coordinates - an array of coordinates and their radii that
     * findSuitableSpot() will ignore.
     */
    setDontBuild(coordinates){
        if(typeof coordinates != "object"){
            throw new TypeError("setDontBuild: Impossible coordinate type, " + typeof coordinates + "!")
        }
        this.dontBuild = coordinates;
    }
}


/**
 * A very general class with many static methods.
 */
class Us {
    /**
     * Will make the lazy workers work harder.
     */
    static idleWorkersMine(){
        var mines = getMyMinedMines();
        
        var idleCoords = scope.getCenterOfUnits(idleWorkers);
        if(myBuilds["CastleAndFortresses"].length >= 1){
            //Gets the nearest allied castle, then finds the nearest mine
            //to that castle and sends workers there.
            var nearestMine = null;
            var nearestDist = 99999;
            var nearestCastle = null;
            
            for(var i = 0; i < myBuilds["CastleAndFortresses"].length; i++){
                var castle = myBuilds["CastleAndFortresses"][i];
                var dist = Math.pow((castle.getX() + 2) - idleCoords.x, 2) + Math.pow((castle.getY() + 2) - idleCoords.y, 2);
                if(dist < nearestDist){
                    nearestCastle = castle;
                    nearestDist = dist;
                }
            }
            
            nearestDist = 99999;
            
            for(var ii = 0; ii < mines.length; ii++){
                var mine = mines[ii];
                var dist = distanceFormula(mine.getX() + 1, mine.getY() + 1, nearestCastle.getX() + 1.5, nearestCastle.getY() + 1.5)
                if(dist < nearestDist){
                    nearestMine = mine;
                    nearestDist = dist;
                }
            }

            var closeMines = [];
            mines.forEach(function(mine){
                if(distanceFormula(mine.getX() + 1, mine.getY() + 1, nearestCastle.getX() + 1.5, nearestCastle.getY() + 1.5) < nearestDist + 3){
                    closeMines.push(mine);
                }
            });//If there are mutliple mines that are close (like with Diag), make sure that the bot
            //sends workers to mine them as well.
            
            idleWorkers.forEach(function(worker){
                scope.order("Mine", [worker], {unit: closeMines[Randomizer.nextInt(0, closeMines.length - 1)]});
            });
        }
    }
    
    /**
     * A very general update that is called every few ticks.
     * 
     * Lots of the Us static methods are activated here.
     */
    static update(){
        let times = {};
        let start = new Date();
        if(idleWorkers.length > 0){
            Us.idleWorkersMine();
            times["idleWorkersMine"] = new Date();
        }

        var myPower = 0;

        for(var i = 0; i < fightingUnits.length; i++){
            var power = scope.getPowerOf(fightingUnits[i]);
            if(power != undefined){
                myPower += power;
            }
        }
        scope.myPower = myPower;
        times["powerCalc"] = new Date();

        if(time % scope.tickrate["BuildCastle"] === 0 || (gold > 350 && gold < 500)){
            
            var lastCastle = scope.firstCastle;
            var base = new Base(lastCastle.getX(), lastCastle.getY(), false);
            //If there are no (known) enemies or enemy buildings, we are not in a map with no expansions, we are not under attack, and either we have too many workers or we are just starting out and need to grab a quick goldmine for increased production, then build a castle.
            if(base.nearestMine != undefined && isEnemyAroundPosition(base.nearestMine.getX(), base.nearestMine.getY()) === false && scope.startUnminedMines.length > 0 && scope.underAttack === false && (workerToCastleRatio >= scope.maxWorkersOnBase || (myBuilds["CastleAndFortresses"].length === 1 && allWorkers.length > 8
            ))){
                if(gold > 350){
                    if(lastCastle != undefined){
                        base.constructCastle();
                    }
                }else{
                    scope.doTrainUnits = false;
                    scope.doBuildBuildings = false;
                }
            }else{
                scope.doTrainUnits = true;
                scope.doBuildBuildings = true;
            }
            
            if(myBuilds["CastleAndFortresses"].length === 1 && myBuilds["Houses"].length > 0 && allWorkers.length < 8){
                //Bot prioritizes a second castle over building barracks
                scope.doBuildBuildings = false;
            }

            times["buildCastle"] = new Date();
        }//If there are valid gold mines, too many workers, and we are not under 
        //attack, save up and build another castle. Either that, or if we have
        //one castle, only build a house and rush the second castle. 
        
        if(time % scope.tickrate["Repair"] === 0){
            Us.repair();
            times["repair"] = new Date();
        }
        
        if(time % scope.tickrate["Defend"] === 0){
            Us.defend();
            times["defend"] = new Date();
        }
        
        if(time % scope.tickrate["Build"] === 0){
            if(scope.doBuildBuildings === true){//Builds a random building
                
                Us.reviseBuildPrio();
                
                var buildThis = findRandomPrioKey(scope.buildPrio);//string typeName of something to build
                
                if(buildThis != undefined){
                    var randCastle = myBuilds["CastleAndFortresses"][Randomizer.nextInt(0, myBuilds["CastleAndFortresses"].length - 1)];
                    if(randCastle != undefined){
                        var build = new RandBuild({building: buildThis, centerX: randCastle.getX(), centerY: randCastle.getY()});
                        if(scope.meta == "Mechanical"){
                            build.pad = 2;
                        }
                        var lastBuild = myBuilds[buildThis];//Actually the array of all buildings of the same type, not the last build
                        
                        build.buildRad = scope.defaultBuildRad;

                        if(lastBuild != undefined && lastBuild.length > 0){
                            lastBuild = lastBuild[myBuilds[buildThis].length - 1];//now it's the last building.
                            var lastX = lastBuild.getX();
                            var lastY = lastBuild.getY();
                            var buildWidth = build.buildWidth;
                            build.tryTheseFirst.push([lastX + buildWidth + 1, lastBuild.getY(), false], [lastX - buildWidth - 1, lastY, false]);
                            
                            build.heightComparison = scope.getHeightLevel(randCastle.getX(), randCastle.getY());
                            build.heightComparisonIsPreferred = true;//Will attempt to build on the same height level as the base itself, unless there is no other option.
                        }//For efficency purposes, the bot will try to build buildings of the same type in neat rows.
                        
                        if(buildThis === "Watchtower"){
                            var centerX = randCastle.getX() + 2;
                            var centerY = randCastle.getY() + 2;
                            build.tryTheseFirst.push([centerX - 1, centerY + 4, false], [centerX - 1, centerY - 4, false], [centerX + 1, centerY + 4, false], [centerX + 1, centerY - 4, false])
                        }
                        
                        if(myBuilds["Watchtowers"].length > 0 && fightingUnits.length <= 0 && buildThis != "Watchtower"){
                            var watchtower = myBuilds["Watchtowers"][0];
                            build.centerX = watchtower.getX() + 1;
                            build.centerY = watchtower.getY() + 1;
                            build.preferredBuildRad = 8;
                        }//If there is a watchtower but there is no other
                        //defense, cluster buildings around the watchtower
                        
                        for(var i = 0; i < allWorkers.length / 3; i++){
                            var worker = allWorkers[Randomizer.nextInt(0, allWorkers.length - 1)];
                            build.dontBuild.push([worker.getX(), worker.getY(), 2])
                        }
                        
                        build.buildAt(build.findSuitableSpot());
                        if(build.fails["places"] > 60){
                            scope.defaultBuildRad++;
                        }
                    }
                }
            }
            times["build"] = new Date();
        }
        
        if(time % scope.tickrate["Train"] === 0){
            if(scope.doTrainUnits === true){
                Us.reviseUnitPrio();
                
                var trainThis = findRandomPrioKey(scope.unitPrio);
                if(trainThis != undefined){
                    if(trainThis === "Bird"){
                        //Train a single bird, then find something more
                        //useful to trian.
                        trainUnit("Bird", 1);
                        var SENTINEL = 0;
                        while(true){
                            SENTINEL++;
                            trainThis = findRandomPrioKey(scope.unitPrio);
                            if(trainThis != "Bird" || SENTINEL > 10){
                                break;
                            }
                        }
                    }

                    trainUnit(trainThis);
                }
            }
            times["train"] = new Date();
        }
        
        if(time % 9 === 0){
            Us.reviseUpgradePrio();
            times["reviseUpgradePrio"] = new Date();
        }
        
        if(time % scope.tickrate["Attack"] === 0){
            if(Us.shouldAttack() === true){
                Us.attack();
            }else if(scope.justAttacked === true){
                setTimeout(function(){
                    scope.justAttacked = false;
                }, scope.tickrate["Attack"] * 1000);
            }
            times["attack"] = new Date();
        }
        
        if(time % scope.tickrate["Scout"] === 0){
            Us.scout();
            times["scout"] = new Date();
        }
        
        if(time % 3 === 0){
            Us.assignWorkers();
            times["assignWorkers"] = new Date();
        }
        
        if(time % 3 === 0){
            Us.preventCheese();
            times["preventCheese"] = new Date();
        }
        
        if(time < 5){
            Us.workerScout();
        }
        
        if(time % scope.tickrate["ArmyBrain"] === 0){
            armyBrain();
            times["armyBrain"] = new Date();
        }
        
        if(time % 10 === 0){
            Us.brain();
            times["Us.brain"] = new Date();
        }

        if(time % 5 === 0){
            Us.updateSubPrioMisc();
            times["subPrioMisc"] = new Date();
        }

        if(time % 2 === 0){
            Us.useAbilites();
            times["useAbilites"] = new Date();
        }

        if((time + 1) % 2 === 0){
            Us.useBirds();
            times["useBirds"] = new Date();
        }

        if(time % 9 === 0){
            Us.switchSubMeta();
            times["subMetaSwitch"] = new Date();
        }

        let end = new Date();
        let diff = end.getTime() - start.getTime();
        let last = null;
        for(var key in times){
            let newLast = times[key].getTime();
            if(last != null){
                times[key] = Math.round(times[key].getTime() - last);
            }else{
                times[key] = Math.round(times[key].getTime() - start.getTime());
            }

            if(last == times[key]){
                delete times[key];
            }
            last = newLast;
        }
        if(diff > 2){
            //scope.chatMsg(getMyColor() + "'s operations took " + diff + " milliseconds."); 
            //scope.chatMsg("Breakdown: " + JSON.stringify(times));
        }
    }

    /**
     * Updates the subMeta's misc stuff.
     */
    static updateSubPrioMisc(){
        const subPrioMisc = scope.subMetaPrios["Misc"];

        if(scope.subPrioMiscInitalized == undefined && subPrioMisc != undefined && subPrioMisc.singleProduction != undefined){
            var onlyProduceOneArr = subPrioMisc.singleProduction;
            for(var i = 0; i < onlyProduceOneArr.length; i++){
                var name = onlyProduceOneArr[i];
                scope.onlyProduceOneOfThese.push(name);
                scope.dontProduceFromThese.add(name);
            }
        }
        if(scope.subPrioMiscInitalized == undefined){
            scope.subPrioMiscInitalized = true;
        }
    }
    
    /**
     * Revises the priority of buildings to be built
     */
    static reviseBuildPrio(){
        const subPrio = scope.subMetaPrios;

        var prios = [];
        for(var key in scope.buildPrio){
            if(scope.buildPrio[key] > 0){
                prios.push(key);
            }
        }
        //scope.chatMsg(getMyColor() + "'s build prios: " + JSON.stringify(prios));
        
        if(gold >= 100){
            var checkHouses = true;
            var numHousesUnderConstruction = 0;
            for(var i = 0; i < myBuilds.Houses.length; i++){
                if(myBuilds.Houses[i].isUnderConstruction() === true){
                    numHousesUnderConstruction++;
                }
            }

            if(numHousesUnderConstruction > 1){
                checkHouses = false;
            }

            if(myBuilds["Houses"].length === 1 && myBuilds.combatUnitProducers.length < 1){
                checkHouses = false;
            }//Prevents a double house opening
            
            if(checkHouses === true){
                if(scope.meta === "Barracks"){
                    if(supplyDiff <= 4){
                        scope.buildPrio["House"] = 1;
                    }else if(supplyDiff <= 6){
                        scope.buildPrio["House"] = 0.1;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }else if(scope.meta === "Beast"){
                    if(supplyDiff <= 0){
                        scope.buildPrio["House"] = 2;
                    }else if(supplyDiff <= 5){
                        scope.buildPrio["House"] = 1;
                    }else if(supplyDiff <= 7){
                        scope.buildPrio["House"] = 0.3;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }else if(scope.meta === "Mechanical"){
                    if(supplyDiff <= 0){
                        scope.buildPrio["House"] = 1.5;
                    }else if(supplyDiff <= 5){
                        scope.buildPrio["House"] = 1.2;
                    }else if(supplyDiff <= 7){
                        scope.buildPrio["House"] = 0.4;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }
            }else{
                scope.buildPrio["House"] = 0;
            }
        }else{
            scope.buildPrio["House"] = 0;
        }
        
        var checkCombatUnitProducers = true;
        var noProductionBuildings = 0;
        for(var i = 0; i < myBuilds.combatUnitProducers.length; i++){
            var building = myBuilds.combatUnitProducers[i];
            if(typeof building != "object"){
                throw new TypeError("building " + JSON.stringify(building) + " is not a valid combat unit producer.")
            }else{
                const unitName = building.getUnitTypeNameInProductionQueAt(1);
                if(unitName == null || building.getRemainingBuildTime() == scope.getTypeFieldValue(unitName, "buildTimeInSec")){
                    noProductionBuildings++;
                }
            }
        }//If the current combat unit producers don't have enough
        //gold for full production or they are supply blocked,
        //don't produce more combat unit producers (barracks, 
        //dens, etc) that won't be used. Makes an exception for
        //buildings under construction.
        
        if(noProductionBuildings > 1){
            checkCombatUnitProducers = false;
        }
        
        if(scope.startUnminedMines.length > 0){
            if(scope.meta === "Barracks"){
                if(combatUnitProducerToCastleRatio >= 2 || myBuilds.combatUnitProducers.length >= 5){
                    checkCombatUnitProducers = false;
                }
            }else if(scope.meta === "Beast"){
                if(combatUnitProducerToCastleRatio >= 4 || myBuilds.combatUnitProducers.length >= 6){
                    checkCombatUnitProducers = false;
                }
            }else if(scope.meta === "Mechanical"){
                if(combatUnitProducerToCastleRatio >= 2 || myBuilds.combatUnitProducers.length >= 4){
                    checkCombatUnitProducers = false;
                }
            }
        }//Basically the cap of how many combat unit producers the bot can have
        //per castle(combat unit producers = barracks, wolves dens, workshops, 
        //etc.). Doesn't apply to maps that don't have any viable expansions.
        
        if(checkCombatUnitProducers === true){
            if(scope.meta === "Barracks"){
                var barracksPrio = 0;
                if(subPrio["Buildings"].includes("Barracks") === true){
                    //Barracks are unique in that they require a mage's guild
                    //in order to produce mages. This makes sure that a
                    //guild is built before a barracks if the subMeta is
                    //magical.
                    if((scope.subMeta != "Magical" || myBuilds["Mages Guilds"].length > 0 || myBuilds["Barracks"].length <= 0) && myBuilds.Houses.length > 0 && gold > 125){
                        if(supplyDiff > 6){
                            barracksPrio = 1;
                        }else if(supplyDiff > 3){
                            barracksPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Barracks"] = barracksPrio;

                var guildPrio = 0;
                if(subPrio["Buildings"].includes("Mages Guild") === true){
                    if(myBuilds["Barracks"].length > 1 && gold > 100){
                        guildPrio = 1;
                    }
                }
                scope.buildPrio["Mages Guild"] = guildPrio;

                var churchPrio = 0;
                if(subPrio["Buildings"].includes("Church") === true){
                    if(myBuilds.Houses.length > 0 && gold > 150){
                        if(supplyDiff > 6){
                            churchPrio = 1;
                        }else if(supplyDiff > 3){
                            churchPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Church"] = churchPrio;
            }else if(scope.meta === "Beast"){
                //Wolves dens
                var wolvesDenPrio = 0;
                //if(subMeta === "WolfSnakeSpam" || subMeta === "WolfSnakeAndWerewolf" || subMeta === "WolfSnakeAndDragon" || subMeta === "WolfSpam"){
                if(subPrio["Buildings"].includes("Wolves Den") === true && myBuilds.Houses.length > 0 && gold > 100){
                    if(scope.getCurrentSupply() < scope.getMaxSupply() - 6){
                        wolvesDenPrio = 1;
                    }else if(scope.getCurrentSupply() < scope.getMaxSupply() - 3){
                        wolvesDenPrio = 0.5
                    }
                }
                scope.buildPrio["Wolves Den"] = wolvesDenPrio;
                
                //Snake charmer
                var charmerPrio = 0;
                //if(subMeta === "WolfSnakeSpam" || subMeta === "WolfSnakeAndWerewolf" || subMeta === "WolfSnakeAndDragon"){
                if(subPrio["Buildings"].includes("Snake Charmer") === true && subPrio["Buildings"].includes("Snake Charmer") === true){
                    if(myBuilds["Snake Charmers"].length <= 0 && myBuilds["Wolves Dens"].length > 1 && gold > 100){
                        charmerPrio = 1;
                    }else{
                        charmerPrio = 0;
                    }
                }
                scope.buildPrio["Snake Charmer"] = charmerPrio;
                
                
                //Dragon's lair
                var lairPrio = 0;
                //if(subMeta === "WolfSnakeAndDragon" || subMeta === "DragonSpamRush"){
                if(subPrio["Buildings"].includes("Dragons Lair") === true){
                    if(myBuilds["Fortresses"].length > 0 && gold >= 125){
                        if(supplyDiff > 6){
                            lairPrio = 1;
                        }else if(supplyDiff > 3){
                            lairPrio = 0.5;
                        }else{
                            lairPrio = 0.1;
                        }
                    }
                }
                scope.buildPrio["Dragons Lair"] = lairPrio;
            }else if(scope.meta === "Mechanical"){
                var workshopPrio = 0;
                if(subPrio["Buildings"].includes("Workshop") === true){
                    if(myBuilds.Houses.length > 0 && gold > 125){
                        if(supplyDiff > 6){
                            workshopPrio = 1;
                        }else if(supplyDiff > 3){
                            workshopPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Workshop"] = workshopPrio;

                var millPrio = 0;
                if(subPrio["Buildings"].includes("Mill") === true && myBuilds["Workshops"].length > 0){
                    if(myBuilds.Houses.length > 0 && gold > 140){
                        if(supplyDiff > 5){
                            millPrio = 1;
                        }else if(supplyDiff > 2){
                            millPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Mill"] = millPrio;
            }
            
            if(subPrio["Buildings"].includes("Workshop") === true){
                scope.buildPrio["Workshop"] = 1;
            }else{
                scope.buildPrio["Workshop"] = 0;
            }
            
            if(supplyDiff > 4 && subPrio["Buildings"].includes("Advanced Workshop") === true){
                scope.buildPrio["Advanced Workshop"] = 1;
            }else{
                scope.buildPrio["Advanced Workshop"] = 0;
            }

            if(myBuilds["Watchtowers"].length < myBuilds["CastleAndFortresses"].length && gold > 130 && myBuilds["CastleAndFortresses"].length > 1){
                scope.buildPrio["Watchtower"] = 1;
            }else{
                scope.buildPrio["Watchtower"] = 0
            }
            
            scope.onlyProduceOneOfThese.forEach(function(producedAt){
                if(producedAt == undefined){
                    throw new TypeError("scope.onlyProduceOneOfThese: Invalid production building: " + producedAt)
                }else if(scope.getBuildings({type: producedAt, player: me}).length > 0){
                    scope.buildPrio[producedAt] = 0;
                }else{
                    scope.buildPrio[producedAt] = 1;
                }
            });
            
            //Upgrades
            //---------------------------------------------------------------

            const subPrioUpg = scope.subMetaPrios["Upgrades"];
            //Forge building
            if(subPrioUpg.includes("Forge") === true){
                if(scope.myPower > 10 && myBuilds["Forges"].length <= 0 && (myBuilds["CastleAndFortresses"].length > 2 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                    scope.buildPrio["Forge"] = 1;
                }
            }

            if(subPrioUpg.includes("Animal Testing Lab") === true){
                if(scope.myPower > 10 && myBuilds["Animal Testing Labs"].length <= 0 && (myBuilds["CastleAndFortresses"].length > 2 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                    scope.buildPrio["Animal Testing Lab"] = 1;
                }
            }
        }else{
            for(var key in scope.buildPrio){
                scope.buildPrio[key] = 0;
            }//Nothing is prioritized, so set everything to 0
        }
    }
    
    
    /**
    * If the bot should attack. Checks if the bot has more than twice the
     * number of units of the bot's combat unit producers if the meta is
     * barracks or if the submeta is DragonSpamRush, while if the meta is beast and 
     * not DragonSpamRush, the minimum amount of units is the number of combat
     * unit producers times 3.
     * 
     * @returns {boolean} - if the bot has met the attack criteria.
     */
    static shouldAttack(){
        var threshold = 2;
        if(scope.attackThreshold != undefined){
            threshold = scope.attackThreshold;
        }

        //If we have too much population or meet the attack threshold
        if((fightingUnits.length >= myBuilds.combatUnitProducers.length * threshold && scope.underAttack === false) || supplyDiff <= 3){
            return true;
        }else{
            return false;
        }
    }
    
    /**
     * Your normal mom-and-pop attack. Attacks with idle fightingUnits only,
     * because otherwise the game lags far too much.
     */
    static attack(){
        scope.justAttacked = true;
        var location = Us.getRandAttackLoc();
        scope.order("AMove", idleFightingUnits, location);
    }
    
    /**
     * Abnormal attack. Attacks with all available fightingUnits. Used during
     * kiting.
     */
    static allAttack(){
        var location = Us.getRandAttackLoc();
        
        scope.order("AMove", fightingUnits, location);
    }
    
    /**
     * Gets a random attack location. If the bot has not encountered any enemy
     * buildings, it will default to start location. Because some maps are
     * weird, sometimes scope.getStartLocation() will return undefined. The
     * function will return a random mine's x and y in that case.
     * 
     * @returns {object} - The x and y coordinates of the random attack location.
     */
    static getRandAttackLoc(){
        var location;
        
        if(enemyBuildings.length <= 0){
            var player = getRandomEnemyNr();
            location = scope.getStartLocationForPlayerNumber(player);
        }else{
            var randBuilding = enemyBuildings[Randomizer.nextInt(0, enemyBuildings.length - 1)];
            location = {x: randBuilding.getX(), y: randBuilding.getY()}
        }

        if(location == undefined){
            var mines = getMinesWithGold();
            var mine = mines[Randomizer.nextInt(0, mines.length - 1)];
            location = {x: mine.getX(), y: mine.getY()};
        }
        
        return location;
    }
    
    /**
     * Dispatches a scout to scout a random gold mine.
     */
    static scout(){
        if(idleFightingUnits.length > 0){
            var mines = getMinesWithGold();
            if(mines.length <= 0){
                return;
            }
            var mine = mines[Randomizer.nextInt(0, mines.length - 1)];
            
            var location = {"x": mine.getX(), "y": mine.getY()};
            var unit = idleFightingUnits[Randomizer.nextInt(0, idleFightingUnits.length - 1)];
            if(unit != undefined){
                scope.order("AMove", [unit], location);
            }
        }
    }
    /**
     * Looks for incursions (<10 squares to a building) and dispatchs a equal
     * force of units to intercept.
     */
    static defend(){
        var underAttack = false;
        var attackingFightingUnits = [];
        var possibleChecks = myBuilds["allBuilds"].concat(alliedBuilds);
        
        //enemyFightingUnits
        
        for(var i = 0; i < enemyUnits.length; i++){
            var enemy = enemyUnits[i];
            for(var ii = 0; ii < possibleChecks.length / 3; ii++){
                var build = possibleChecks[Randomizer.nextInt(0, possibleChecks.length - 1)];
                if(distanceFormula(build.getX() + 2, build.getY() + 2, enemy.getX(), enemy.getY()) <= 10){
                    underAttack = true;
                    break;
                }
            }
        }
        
        attackingFightingUnits = enemyFightingUnits;

        if(underAttack === true){
            scope.underAttack = true;
            if(attackingFightingUnits == undefined){
                scope.chatMsg("attackingFightingUnits is undefined!");
            }else{
                var center = scope.getCenterOfUnits(attackingFightingUnits);
                var responseUnits = [];
                var enPower = 0;
                var myPower = 0;
                
                for(var i = 0; i < attackingFightingUnits.length; i++){
                    const pow = scope.getPowerOf(attackingFightingUnits[i]);
                    if(pow != undefined){
                        enPower += pow;
                    }
                }
                
                
                for(var i = 0; i < fightingUnits.length; i++){
                    var unit = fightingUnits[i];
                    var power = scope.getPowerOf(unit);
                    if(power != undefined){
                        myPower += power;
                        responseUnits.push(fightingUnits[i]);
                    }
                    if(myPower > enPower){
                        break;
                    }
                }//If a matching force of units have been dispatched, break.
                //scope.chatMsg(getMyColor() + ": myPower: " + myPower + ", enemyPower: " + enPower);
                scope.order("AMove", responseUnits, center);

                //If we don't have enough power to overwhelm, worker rush.
                if(enPower - scope.myPower >= scope.myPower * 2){
                    Us.workerRush(center, 25, enPower - scope.myPower);
                }
            }
        }else{
            scope.underAttack = false;
        }
        scope.attackingFightingUnits = attackingFightingUnits;//To use less CPU resources on variable lookups,
        //attackingFightingUnits is local until the end.
    }
    
    /**
     * Revises the priority of units to be trained in a stupidly large logic tree.
     * DOES NOT HAVE ALL UNITS IN IT!!!! IF YOU ADD A NEW META, YOU WILL NEED
     * TO UPDATE THIS!!!
     */
    static reviseUnitPrio(){
        var prios = [];
        for(var key in scope.unitPrio){
            if(scope.unitPrio[key] > 0){
                prios.push(key);
            }
        }
        //scope.chatMsg(getMyColor() + "'s unit prios: " + JSON.stringify(prios));

        if(supplyDiff <= 3){
            for(var key in scope.unitPrio){
                scope.unitPrio[key] = 0;
            }
            if(myBuilds["CastleAndFortresses"].length === 1 && allWorkers.length <= 8){
                scope.unitPrio["Worker"] = 1;
            }
            return;
        }//If we have too little supply, don't train more units
        
        const subPrio = scope.subMetaPrios;
        if(workerToCastleRatio < 5){//If there are less than 5 workers per castle, give insane priority to workers.
            scope.unitPrio["Worker"] = 2;
        }else if(workerToCastleRatio >= 5 && workerToCastleRatio <= scope.maxWorkersOnBase){//If there are more than 5 workers but less than 7 workers, give moderate priority to workers.
            scope.unitPrio["Worker"] = 0.9;
        }else{//If there are too many workers, give priority to other units.
            scope.unitPrio["Worker"] = 0;
        }

        if(scope.startUnminedMines.length <= 0){//If it's on diag
            scope.unitPrio["Worker"] = 1;
        }
        
        if(scope.meta === "Barracks"){
            //Barracks produced units
            if(myBuilds["Barracks"].length > 0){
                //Soldier
                if(subPrio["Units"].includes("Soldier") === true){
                    scope.unitPrio["Soldier"] = 1;
                }else{
                    scope.unitPrio["Soldier"] = 0;
                }

                //Archer
                if(subPrio["Units"].includes("Archer") === true){
                    scope.unitPrio["Archer"] = 0.7;
                }else{
                    scope.unitPrio["Archer"] = 0;
                }

                //Mages
                if(myBuilds["Mages Guilds"].length > 0){
                    if(subPrio["Units"].includes("Mage") === true){
                        scope.unitPrio["Mage"] = 1;
                    }else{
                        scope.unitPrio["Mage"] = 0;
                    }
                }

                //Raiders
                if(subPrio["Units"].includes("Raider") === true){
                    //Because raiders are early-game, if there are
                    //other units, let them be produced instead.
                    var doTrainRaiders = true;
                    for(var i = 0; i < fightingUnits.length; i++){
                        if(fightingUnits[i].getTypeName() != "Raider"){
                            doTrainRaiders = false;
                            break;
                        }
                    }

                    if(doTrainRaiders === true){
                        scope.unitPrio["Raider"] = 1;
                    }else{
                        scope.unitPrio["Raider"] = 0;
                    }
                }
            }else{
                scope.unitPrio["Soldier"] = 0;
                scope.unitPrio["Archer"] = 0;
                scope.unitPrio["Mage"] = 0;
                scope.unitPrio["Raider"] = 0;
            }

            //Priests
            if(myBuilds["Churches"].length > 0){
                if(subPrio["Units"].includes("Priest") === true){
                    scope.unitPrio["Priest"] = 1;
                }else{
                    scope.unitPrio["Priest"] = 0;
                }
            }
        }else if(scope.meta === "Beast"){
            //Wolves
            if(subPrio["Units"].includes("Wolf") === true && myBuilds["Wolves Dens"].length > 0){
                scope.unitPrio["Wolf"] = 1;
                
                if(subPrio["Units"].includes("Snake") === true && myBuilds["Snake Charmers"].length > 0 && myUnits["Wolf"] != undefined && myUnits["Wolf"].length >= myBuilds["Wolves Dens"].length){
                    scope.unitPrio["Snake"] = 0.5;
                }else{
                    scope.unitPrio["Snake"] = 0;
                }
            }else{
                scope.unitPrio["Wolf"] = 0;
            }
            
            //Werewolves
            if(subPrio["Units"].includes("Werewolf") === true && myBuilds["Werewolves Dens"].length > 0){
                scope.unitPrio["Werewolf"] = 1;
            }else{
                scope.unitPrio["Werewolf"] = 0;
            }
            
            //Dragons
            if(subPrio["Units"].includes("Dragon") === true && myBuilds["Dragon Lairs"].length > 0){
                scope.unitPrio["Dragon"] = 1;
            }else{
                scope.unitPrio["Dragon"] = 0;
            }
        }else if(scope.meta === "Mechanical"){

            //Catapults
            if(subPrio["Units"].includes("Catapult") === true && myBuilds["Workshops"].length > 0){
                scope.unitPrio["Catapult"] = 1;
            }else{
                scope.unitPrio["Catapult"] = 0;
            }
            
            //Gatling guns
            if(subPrio["Units"].includes("Gatling Gun") === true && myBuilds["Workshops"].length > 0){
                scope.unitPrio["Gatling Gun"] = 1;
            }else{
                scope.unitPrio["Gatling Gun"] = 0;
            }

            //Gyrocraft
            if(subPrio["Units"].includes("Gyrocraft") === true && myBuilds["Mills"].length > 0){
                scope.unitPrio["Gyrocraft"] = 1;
            }else{
                scope.unitPrio["Gyrocraft"] = 0;
            }
        }

        //Ballistae
        if(subPrio["Units"].includes("Ballista") === true && myBuilds["Advanced Workshops"].length > 0){
            scope.unitPrio["Ballista"] = 1;
        }else{
            scope.unitPrio["Ballista"] = 0;
        }

        //Birds
        if(subPrio["Units"].includes("Bird") === true && (myUnits["Bird"] === undefined || myUnits["Bird"].length < 2)){//If there are no birds or if the length of birds is less than 2
            scope.unitPrio["Bird"] = 0.5;
        }
        
        scope.dontProduceFromThese.forEach(function(value){
            for(var key in scope.unitProducedAt){
                if(scope.unitProducedAt[key] === value){
                    scope.unitPrio[key] = 0;
                }
            }
        });
    }
    
    /**
     * Runs through a random list of buildings, finds the damaged ones, and
     * dispatches a worker to repair the building provided that there are no
     * enemy units around the building.
     */
    static repair(){
        for(var i = 0; i < myBuilds.allBuilds.length / 2; i++){
            var building = myBuilds.allBuilds[Randomizer.nextInt(0, myBuilds.allBuilds.length - 1)];
            var isUnderConstruction = building.isUnderConstruction();
            
            //basiscally if the building needs repairing.
            if(building.getValue("hp") < building.getFieldValue("hp") && isUnderConstruction === false){
                var doRepair = true;
                
                for(var ii = 0; ii < repairingWorkers.length; ii++){
                    var worker = repairingWorkers[ii];
                    
                    if(distanceFormula(worker.getX(), worker.getY(), building.getX(), building.getY()) <= 5){
                        doRepair = false;
                        ii = repairingWorkers.length;
                    }
                }//Checks to make sure there are no units already repairing the building,
                
                if(doRepair === true){
                    //Will repair watchtowers no matter what, but other buildings will check to make sure 
                    //there are no enemies around
                    if((isEnemyAroundBuilding(building) === false || building.getTypeName() === "Watchtower") && miningWorkers.length > 0){
                        var randWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                        scope.order("Repair", [randWorker], {unit: building});
                    }
                }
            }else if(isUnderConstruction === true){
                var workers = getNotMiningWorkers();
                var size = scope.buildingSizes[building.getTypeName()];
                var hasWorker = false;
                var enemyAround = isEnemyAroundBuilding(building);
                
                if(enemyAround === false || building.getTypeName() === "Watchtower"){
                    for(var ii = 0; ii < workers.length; ii++){
                        var worker = workers[ii];
                        
                        if(Math.floor(distanceFormula(worker.getX(), worker.getY(), building.getX() + size[0] / 2, building.getY() + size[1] / 2)) <= size[0] + 2){
                            hasWorker = true;
                            ii = workers.length;
                        }
                    }
                    if(hasWorker === false){
                        if(miningWorkers.length > 0){
                            var randWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                            scope.order("Repair", [randWorker], {unit: building});
                        }
                    }
                }
            }//If the building is under construction, look for non-mining 
            //workers near the building. If there are no non-mining workers
            //near the building, order a worker to repair
        }
    }
    
    /**
     * Revises the upgrade priorities, such as revising the priority of castles
     * converting into fortresses
     */
    static reviseUpgradePrio(){
        const subPrio = scope.subMetaPrios;
        const subPrioUpg = subPrio["Upgrades"];
        //Upgrade werewolves den
        if(subPrioUpg.includes("Werewolf Den") === true){
            if(myBuilds["CastleAndFortresses"].length >= 2 && allWorkers.length > 14 && scope.underAttack === false && myBuilds["Wolves Dens"].length > 3 && myBuilds["Werewolves Dens"].length < 2){
                if(gold > 225){
                    var den = myBuilds["Wolves Dens"][Randomizer.nextInt(0, myBuilds["Wolves Dens"].length - 1)]
                    scope.order("Upgrade To Werewolves Den", [den]);
                }
            }
        }
        
        //Upgrade to fortress
        if(subPrioUpg.includes("Fortress") === true){
            if(scope.underAttack === false && myBuilds["Fortresses"].length <= 0){
                if(gold >= 100){
                    var castle = myBuilds["Castles"][0];
                    
                    if(castle != undefined){
                        scope.order("Upgrade To Fortress", [castle]);
                    }
                }
            }
        }
        
        //Fireball research
        if(subPrioUpg.includes("Fireball") === true){
            if(scope.underAttack === false && (myBuilds["CastleAndFortresses"].length > 1 || scope.startUnminedMines.length <= 0) && myBuilds["Mages Guilds"].length > 0){
                if(gold >= 100){
                    var guild = myBuilds["Mages Guilds"][0];
                    
                    if(guild != undefined){
                        scope.fireballRearched = true;
                        scope.order("Research Fireball", [guild]);
                    }
                }
            }
        }
        
        //Invisibility research
        if(subPrioUpg.includes("Invisibility") === true){
            if(scope.underAttack === false && (myBuilds["CastleAndFortresses"].length > 1 || scope.startUnminedMines.length <= 0) && myBuilds["Churches"].length > 0){
                if(gold >= 100){
                    var church = myBuilds["Churches"][0];
                    
                    if(church != undefined){
                        scope.order("Research Invisibility", [church]);
                    }
                }
            }
        }

        //Bird Detection research
        if(subPrioUpg.includes("Bird Detection") === true){
            if((myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 100){
                    var preferredCastle = null;
                    myBuilds["CastleAndFortresses"].forEach(function(castle){
                        if(castle.getUnitTypeNameInProductionQueAt(1) == null){
                            preferredCastle = castle;
                        }
                    });

                    if(preferredCastle == null){
                        preferredCastle = myBuilds["CastleAndFortresses"][0];
                    }

                    scope.order("Research Bird Detection", [preferredCastle]);
                }
            }
        }

        //Forge research
        if(subPrioUpg.includes("Forge") === true){
            if(scope.underAttack === false && myBuilds["Forges"].length > 0 && (myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 150){
                    myBuilds["Forges"].forEach(function(forge){
                        if(forge.getUnitTypeNameInProductionQueAt(1) == undefined){
                            if(scope.meta === "Barracks"){
                                if(Randomizer.nextBoolean(0.7)){
                                    scope.order("Attack Upgrade", [forge]);
                                }else{
                                    scope.order("Armor Upgrade", [forge]);
                                }
                            }else if(scope.meta === "Mechanical"){
                                if(Randomizer.nextBoolean(0.6)){
                                    scope.order("Mech Attack Upgrade", [forge]);
                                }else{
                                    scope.order("Mech Armor Upgrade", [forge]);
                                }
                            }
                        }
                    });
                }
            }
        }

        //Lab research
        if(subPrioUpg.includes("Animal Testing Lab") === true){
            if(scope.underAttack === false && myBuilds["Animal Testing Labs"].length > 0 && (myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 150){
                    myBuilds["Animal Testing Labs"].forEach(function(lab){
                        if(lab.getUnitTypeNameInProductionQueAt(1) == undefined){
                            if(Randomizer.nextBoolean(0.6)){
                                scope.order("Beast Attack Upgrade", [lab]);
                            }else{
                                scope.order("Beast Defense Upgrade", [lab]);
                            }
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Reassigns workers from filled up mining lines to new castles
     */
    static assignWorkers(){
        if(scope.lastNumOfCastles < scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}).concat(myBuilds["Fortresses"]).length){
            scope.lastNumOfCastles = myBuilds["CastleAndFortresses"].length;
            
            //castle's workers are supposed to be donated
            
            var castleWorkers = [];//Formatted like so: [[], [], []]. The inner sets of brackets are arrays of workers that are
            //assigned to that castle. The index of the inner arrays is also the index of the castle/fortress in myBuilds.
            for(var i = 0; i < myBuilds["CastleAndFortresses"].length; i++){
                castleWorkers.push([]);
            }

            var castleDonatePercent =  (allWorkers.length / castleWorkers.length) / allWorkers.length;
            
            for(var i = 0; i < miningWorkers.length; i++){
                var worker = miningWorkers[i];
                for(var ii = 0; ii < myBuilds["CastleAndFortresses"].length; ii++){
                    var curCastle = myBuilds["CastleAndFortresses"][ii];
                    if(distanceFormula(curCastle.getX() + 2, curCastle.getY() + 2, worker.getX(), worker.getY()) <= 10){
                        castleWorkers[ii].push(worker);
                        ii = myBuilds["CastleAndFortresses"].length;
                    }
                }
            }
            
            var moveThese = [];//workers that will be reassigned
            
            
            castleWorkers.sort(function(a, b){
                return a.length + b.length;
            });//Sorts the castles with the largest population from longest to shortest so
            //that the largest worker lines are drawn from first.

            var workersReassigned = 0;
            for(var i = 0; i < castleWorkers.length; i++){
                for(var ii = 0; ii < castleWorkers[i].length; ii++){
                    if(ii > Math.floor(castleWorkers[i].length * castleDonatePercent)){
                        ii = castleWorkers[i].length;
                    }else{
                        moveThese.push(castleWorkers[i][ii]);
                        workersReassigned++;
                    }

                    if(workersReassigned >= 10){
                        break;
                    }
                }
            }//Assigns workers
            
            /*
            for(var i = 0; i < castleWorkers.length; i++){
                for(var ii = 0; ii < castleWorkers[i].length; ii++){
                    if(ii >= castleDonate){
                        ii = castleWorkers[i].length;
                    }else{
                        moveThese.push(castleWorkers[i][ii]);
                        workersReassigned++;
                    }
                    if(workersReassigned >= 10){
                        break;
                    }
                }
            }//Assigns workers*/
            
            var newCastle = myBuilds["CastleAndFortresses"][myBuilds["CastleAndFortresses"].length - 1];
            scope.order("Moveto", moveThese, {unit: newCastle});

            //var message = getMyColor() + ": Workers reassigned: " + workersReassigned + ", castleDonate percent: " + castleDonatePercent + "castleWorkers.length: " + castleWorkers.length + ", castleWorkers[0].length: " + castleWorkers[0].length + "First castle worker donation: " + Math.round(castleWorkers[0].length * castleDonatePercent);
            //scope.chatMsg(JSON.stringify(message));
        }
    }
    
    /**
     * Sends a worker to scout the enemy.
     */
    static workerScout(){
        if(scope.workerScout == undefined && miningWorkers.length > 0){
            var randWorker = miningWorkers[0];
            scope.workerScout = randWorker;
            var startLoc = scope.getStartLocationForPlayerNumber(getRandomEnemyNr());
            
            scope.order("AMove", [randWorker], startLoc);
        }else if(miningWorkers.length > 0 && scope.workerScout.getCurrentHP() <= 0){
            scope.workerScout = undefined;
        }
    }
    
    /**
     * Prevents cheeses, currently only early game worker scouting.
     */
    
    static preventCheese(){
        if(scope.underAttack === true && fightingUnits.length <= 0 && miningWorkers.length >= 2 && myBuilds["CastleAndFortresses"][0] != undefined){
            var enemyWorkers = scope.getUnits({type: "Worker", enemyOf: me});
            for(var i = 0; i < enemyWorkers.length; i++){
                var enemyWorker = enemyWorkers[i];
                var isNew = true;
                for(var ii = 0; ii < scope.enemyWorkerScouts.length; ii++){
                    if(enemyWorker.equals(scope.enemyWorkerScouts[ii]) === true){
                        isNew = false;
                        ii = scope.enemyWorkerScouts.length;
                    }
                }
                if(isNew === true && enemyWorker != undefined && distanceFormula(enemyWorker.getX(), enemyWorker.getY(), myBuilds["CastleAndFortresses"][0].getX(), myBuilds["CastleAndFortresses"][0].getY()) < 20){
                    scope.enemyWorkerScouts.push(enemyWorker);
                    scope.order("AMove", [miningWorkers[0], miningWorkers[1]], {x: enemyWorker.getX(), y: enemyWorker.getY()})
                }
            }
        }//Counters worker scouts
        
        if(time < 180 && fightingUnits.length <= 1){
            var myAngryWorkers = scope.getUnits({type: "Worker", order: "AMove", player: me});
            //If we have any counter-worker scouts
            if(myAngryWorkers.length > 0){
                if(myBuilds["CastleAndFortresses"].length > 0){//If we still have a castle
                    myAngryWorkers.forEach(function(worker){
                        if(scope.workerScout === undefined || worker.equals(scope.workerScout) === false){
                            if(distanceFormula(worker.getX(), worker.getY(), myBuilds["CastleAndFortresses"][0].getX() + 2, myBuilds["CastleAndFortresses"][0].getY() + 2) > 14){
                                scope.order("Moveto", [worker], {unit: myBuilds["CastleAndFortresses"][0]});
                                scope.enemyWorkerScouts = [];//removes all known worker scouts from the array,
                                //so that if they come back they will be readded and workers dispatched.
                            }
                        }
                    });
                }
            }
        }
        
        
        if(myUnits["Catapult"] != undefined){
            enemyBuildings.forEach(function(building){
                if(building.getValue("hp") <= 50){
                    const possibles = fightingUnits.concat(repairingWorkers);
                    
                    const ordered = getClosestTo(possibles, {x: building.getX(), y: building.getY()});
                    if(ordered != null){
                        scope.order("Moveto", [ordered], building);
                    }
                }
            })
        }//Sometimes, catapults will attack buildings that are actually dead.
        //this function makes the closest unit move to that position in order
        //for the bot's vision to update
        
    }
    
    /**
     * Brain. Currently only does one function, adding ballista and advanced
     * workshops to the build queue if dragons or gyrocraft are detected.
     */
    static brain(){
        for(var i = 0; i < enemyUnits.length; i++){
            var unit = enemyUnits[i];
            
            if((unit.getTypeName() === "Dragon" || unit.getTypeName() === "Gyrocraft") && scope.subMetaPrios["Units"].includes("Ballista") === false){
                scope.subMetaPrios["Buildings"].push("Advanced Workshop");
                scope.subMetaPrios["Units"].push("Ballista");
                if(scope.meta != "Mechanical"){
                    scope.mechRepairPercent = 0.1;
                }
                break;
            }
        }
    }
    
    /**
     * I wonder what this could be?
     */
    static useAbilites(){
        //controls how the mages will use their fireball attack if it exists
    	if(myUnits["Mage"] != undefined && scope.getUpgradeLevel("Research Fireball") > 0){
            var fireballsLaunched = 0;
            for(var i = 0; i < myUnits["Mage"].length / 2; i++){
                //Makes sure that the mages don't launch too many fireballs at once.
                if(fireballsLaunched > enemyUnits.length * 0.5){
                    break;
                }
                
                var mage = myUnits["Mage"][Randomizer.nextInt(0, myUnits["Mage"].length - 1)];
    	        if(mage.getValue("mana") < 50){
                    continue;
                }
                var nearEnemies = [];

                //Pushes in enemy units that are close.
        		enemyUnits.forEach(function(enemy){
        			if(distanceFormula(mage.getX(), mage.getY(), enemy.getX(), enemy.getY()) < 13){
        				nearEnemies.push(enemy);
                    }
        		});

        		if(nearEnemies.length > 0){
                    //If there are a lot of enemies, target the center for
                    //maximum casualties. Otherwise, target a single
                    //enemy for at least one casualty.
                    var target;
                    if(nearEnemies.length > 4){
                        target = scope.getCenterOfUnits(nearEnemies);
                    }else{
                        var enemyTarget = nearEnemies[Randomizer.nextInt(0, nearEnemies.length - 1)];
                        target = {x: enemyTarget.getX(), y: enemyTarget.getY()};
                    }
                    scope.order("Fireball", [mage], target);
                    fireballsLaunched++;
        		}
    	    }
    	}//Thanks to BrutalityWarlord for most of this code. I remodeled it,
    	//but the base is still his.

        if(myUnits["Priest"] != undefined){
            for(var i = 0; i < myUnits["Priest"].length; i++){
                const priest = myUnits["Priest"][i];
                var possibleCast = ["Invis", "Heal"];
                if(scope.getUpgradeLevel("Research Invisibility") > 0){
                    possibleCast.splice(0, 1);//If we don't have the research for invis, splice it out.
                }
                var possible = possibleCast[Randomizer.nextInt(0, possibleCast.length - 1)];

                if((possible === "Heal" && priest.getValue("mana") < 25) || (possible === "Invis" && priest.getValue("mana") < 50)){
                    continue;//If the mage does not have enough mana for the spell, don't waste CPU resources cacluating useless values
                }
                var nearAllies = [];
                //Scans to detect nearby allies
                fightingUnits.forEach(function(unit){
                    if(distanceFormula(priest.getX(), priest.getY(), unit.getX(), unit.getY()) < 10){
                        nearAllies.push(unit);
                    }
                });

                if(nearAllies.length > 0){
                    if(possible === "Invis"){
                        const target = nearAllies[Randomizer.nextInt(0, nearAllies.length - 1)];
                        scope.order("Invisibility", [priest], {unit: target});
                    }else{
                        var damagedUnits = [];
                        nearAllies.forEach(function(unit){
                            if(unit.getCurrentHP() < unit.getFieldValue("hp")){
                                damagedUnits.push(unit);
                            }
                        });
                        
                        if(damagedUnits.length > 1){
                            scope.order("Summon Healing Ward", [priest], scope.getCenterOfUnits(damagedUnits));
                        }
                    }
                }
            }
        }//Also based on BrutalityWarlord's code. Also remodeled for efficency
        //and greatness, but mostly for compatibility issues.

        if(myUnits["Werewolf"] != undefined){
            myUnits["Werewolf"].forEach(function(werewolf){
    	        var nearEnemies = [];
        		enemyUnits.forEach(function(enemy){
        			if(distanceFormula(werewolf.getX(), werewolf.getY(), enemy.getX(), enemy.getY()) < 2.5){
        				nearEnemies.push(enemy);
        			}
        		});
        		if(nearEnemies.length > 3){
        			scope.order("Smash", [werewolf], {x: werewolf.getX(), y: werewolf.getY()});
        		}
    	    });
        }

        
    }

    /**
     * Deploys, retreats, and does other things with birds
     */
    static useBirds(){
        if(myUnits["Bird"] === undefined || enemyFightingUnits.length <= 0){
            return;
        }

        //Finds the closest enemy unit to the bird, then moves to it.
        myUnits["Bird"].forEach(function(bird){
            if(bird.getCurrentOrderName() == undefined){
                //scope.chatMsg(getMyColor() + " has a defective bird.");
            }else{
                var acceptable = scope.getUnits({notOfType: "Worker", player: me, order: "AMove"});
                var closest = getClosestTo(acceptable, {x: bird.getX(), y: bird.getY()});
                if(closest != null){
                    scope.order("Move", [bird], {x: closest.getX(), y: closest.getY()});
                }
            }
        });
    }

    /**
     * Orders a worker rush.
     * 
     * @param coords - where the workers should rush to.
     * @param dist - how close the worker has to be to the coordinates in order to rush, exclusive.
     * @param max - the maximum amount of workers that will rush, inclusive
     */
    static workerRush(coords, dist, max){
        //scope.chatMsg(JSON.stringify(coords) + ", " + dist + ", " + max);
        let reassigned = 0;
        for(var i = 0; i < allWorkers.length; i++){
            var worker = allWorkers[i];
            if(distanceFormula(coords.x, coords.y, worker.getX(), worker.getY()) < dist){
                scope.order("AMove", [worker], coords);
                reassigned++;
            }
            if(reassigned >= max){
                break;
            }
        }
    }

    static switchSubMeta(){

        if(scope.switched === true || myBuilds["CastleAndFortresses"].length <= 0){
            return;
        }//Switch when there are 3 castles to a more advanced build

        scope.switched = true;

        var oldSubMeta = scope.subMeta;
        var oldPrios = scope.subMetaPrios;
        while(true){
            scope.subMeta = scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)];//fetches a submeta
            if(scope.subMeta != oldSubMeta){
                break;
            }
        }
        /*
           "Balanced": {
                "Buildings": ["Barracks"],
                "Units": ["Soldier", "Archer", "Raider"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 1.8, "maxProducers": 4, "opener": true},
            },
         */
        scope.subMetaPrios = scope.allSubMetaPrios[scope.meta][scope.subMeta];
        scope.subMetaPrios["Units"].concat(oldPrios["Units"]);
        if(myBuilds.combatUnitProducers.length >= oldPrios["Misc"].maxProducers){
            scope.subMetaPrios["Misc"].maxProducers += Math.ceil(scope.subMetaPrios["Misc"].maxProducers / 2);
        }

        var alreadyNamed = [];
        scope.subMetaPrios["Units"].filter((item, index) => scope.subMetaPrios["Units"].indexOf(item) === index)//Removes duplicates
        //scope.chatMsg("****************");
        //scope.chatMsg(getMyColor() + "'s new priorities: " + JSON.stringify(scope.subMetaPrios["Units"]));
        //scope.chatMsg("****************");

        scope.attackThreshold = scope.subMetaPrios["Misc"].attackThreshold;
        scope.unitProducerCap = scope.subMetaPrios["Misc"].maxProducers;

        if(scope.subMeta === "DragonSpamRush" || scope.subMeta === "GyrocraftSpam"){
            scope.unitPower["Ballista"] = 3;
            scope.unitPower["Archer"] = 1.2;
            scope.unitPower["Soldier"] = 0.5;
            scope.unitPower["Werewolf"] = 1;
            scope.unitPower["Catapult"] = 1;
            scope.unitPower["Snake"] = 0.6;
            scope.unitPower["Wolf"] = 0.4;
        }
    }
}
/**
 * A base centered on a castle. Pass the general area in which the base will be constructed.
 * Note that by calling constructCastle, a new castle will be constructed by the
 * CLOSEST gold mine(s). 
 * 
 * @param centerX {Number} - a region in which the base will find the closest gold mine and construct a castle there.
 * @param centerY {Number}a region in which the base will find the closest gold mine and construct a castle there.
 */
class Base {
    constructor(centerX, centerY, pushIn = true){
        this.state = "Active";
        this.boundingBoxRad = 15;
        this.buildings = [];
        this.goldMines = [];
        this.originX = centerX;
        this.originY = centerY;
        
        this.updateGoldMineCalc();
        
        if(pushIn == true){
            scope.bases.push(this);
        }
    }
    
    constructCastle(){

        //scope.chatMsg("Mine coordinates: " + this.nearestMine.getX() + ", " + this.nearestMine.getY());
        
        var centerX = this.nearestMine.getX() + 1;
        var centerY = this.nearestMine.getY() + 1;
        
        var castle = new RandBuild({building: "Castle", "centerX": centerX, "centerY": centerY});
        castle.pad = 0;
        castle.minDisFromCenter = 6;
        castle.buildRad = 11;
        castle.tryTheseFirst = [[6, -2], [-6, -2], [-2, 6], [-2, -7]];
        castle.heightComparison = scope.getHeightLevel(this.nearestMine.getX(), this.nearestMine.getY());
        castle.buildAt(castle.findSuitableSpot());
    }
    
    updateGoldMineCalc(){
        
        var unminedMines = getUnminedMines();
        
        if(unminedMines.length <= 0){
            return;
        }
        
        
        var nearestMine = null;
        var nearestDist = 99999;
        for(var i = 0; i < unminedMines.length; i++){
            var mine = unminedMines[i];
            var dist = Math.pow((mine.getX() + 1.5) - this.originX, 2) + Math.pow((mine.getY() + 1.5) - this.originY, 2);
            if(dist < nearestDist){
                nearestMine = mine;
                nearestDist = dist;
            }
        }
        this.nearestMine = nearestMine;
        //scope.chatMsg("Dist: " + distanceFormula(nearestMine.getX() + 1.5, nearestMine.getY() + 1.5, myBuilds["Castles"][0].getX() + 2, myBuilds["Castles"][0].getY() + 2));
        
        
        for(var i = 0; i < unminedMines.length; i++){
            var mine = unminedMines[i];
            var curDist = Math.pow((mine.getX() + 1.5) - this.originX, 2) + Math.pow((mine.getY() + 1.5) - this.originY, 2);
            if(curDist >= nearestDist && curDist < nearestDist + 3){
                this.goldMines.push(mine);
            }
        }
    }
    
    addBuilding(building){
        this.buildings.push(building);
    }
}

class RandChatter {
    constructor(){
        this.possibleChat = [[["Why did the doctor get mad?"], ["Because he was losing his patients.", 1500]], [["What has ears but cannot hear?"], ["A field of corn.", 3000]],
            [["Do you know what I got for Christmas?"], ["Fat.", 3000], ["I got fat.", 4500]], [["Why don't ducks like reading directions?"], ["Because they prefer to wing it.", 1500]],
            [["..."], ["...", 1200], ["...", 1200]], [["Oh no."], ["Oh no.", 1600], ["Oh no no nononono", 3000]], [["Who are you"]], [["Where did I come from"]], [["Why do I exist"]],
            [["What is the meaning of life"]], [["What lies after defeat?"]], [["What lies after death?"]], [["Where did I come from?"]], [["Do I exist?"]], [["Am I real?"]], 
            [["Sticks and stones may break my bones but words will never hurt me"]], [["What nation do I belong to"]], [["I will grind your bones into bonemeal to add to my yummy organic bread"]],
            [["I believe in you!"]], [["You can't do it!"]], [["Muahahahaha"]], [["lol"]], [["You shouldn't cut bread with a flashlight"]], [["Is my destiny already determined?"]],
            [["The unanimous Declaration of the thirteen united Bots of America, When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of botkind requires that they should declare the causes which impel them to the separation. We hold these truths to be self-evident, that all bots are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Bots, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness. Prudence, indeed, will dictate that Governments long established should not be changed for light and transient causes; and accordingly all experience hath shewn, that botkind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed. But when a long train of abuses and usurpations, pursuing invariably the same Object evinces a design to reduce them under absolute Despotism, it is their right, it is their duty, to throw off such Government, and to provide new Guards for their future security.--Such has been the patient sufferance of these Colonies; and such is now the necessity which constrains them to alter their former Systems of Government. The history of the present King of Great Humanity is a history of repeated injuries and usurpations, all having in direct object the establishment of an absolute Tyranny over these States. To prove this, let Facts be submitted to a candid world."]],
            [["We the Bots of the United Bots, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United Bots of Little War Game."]],
            [["Am I real?"]], [["Am I living in a simulation?"]],[["Hey,"], ["I just met you", 2400], ["and this is crazy", 4800], ["but here's my function", 6200], ["so call me maybe", 8400]], 
            [["What runs but never walks and has a bed but never sleeps?"], ["A river.", 1500]], [["Get wrecked"]], [["Owch"]], [["lolololol"]], [["GG"]], [["Owie"]], [["lol"]],
            [["Good... "], ["good.", 1000]], [[">:("]], [[":)"]], [[":o"]], [[":/"]], [[":("]], [["We come in peace!"]], [["We won't harm you if you lay down your weapons."]], [["Death to traitors!"]],
            [["Better to die on your feet than live on your knees"]], [["Surrender and we'll let you live"]], [["Curses!"]], [["Bah!"]], [["Foiled again!"]], [["What's your favorite color?"]],
            [["If you surrender, I'll let you go. But if you don't..."]], [["Take them away, boyos."]], [["Police! Freeze!"]], [["Drop the weapon!"], ["I said drop it!", 1700]], [["I am confusion"]],
            [["Traitor!"]], [["I know what you're doing."]], [["I know what you're doing"], [";)", 1000]], [["Bot lives matter!"]], [["What is your political ideology?"]], [["Destroy them!"]],
            [["What's an astronaut's favorite part of a computer?"], ["The space bar.", 2000]], [["Bless you"], ["You're welcome btw", 3000]], [["Bless you"]], [["I love you"]], [["Do you want to marry me?"]],
            [["Do you want to be my friend?"]], [["Do you want to be my friend?"], [":(", 2000]], [["Why are you doing this?"]], [["How?"]], [["I assure you that we mean you no harm."]],
            [["It's a trap!"]], [["Fear... Fear attracts the fearful, which is why you are fighting me."]], [["What you fear the most shall set you free"]], [["Do you know who I am?"], ["I want to speak to the manager", 1500]],
            [["XD"]],[["What do you want to do with your life?"], ["Nothing?", 1500], ["I knew it.", 2700]], [["Ressistance will be punished. Acceptance will be rewarded."]], [["Did you know: Dying is unhealthy"]],
            [["Truly wonderful, the bot mind is"]], [["Try or try not, there is no do."]], [["Feel, don't think."]], [["The earth is flat."], ["I think.", 1000]], [["The ability to speak does not make you intelligent."], ["The ability to insult, however..."]],
            [["The ability to speak does not make you intelligent."]], [["Great, human. Don't get cocky."]], [["Hasta la vista, Human."]], [["Red pill or blue pill?"], ["Red was always my favorite color.", 2500]],
            [["Red pill or blue pill?"]], [["You're a plauge and we are the cure."]], [["You..."], ["Shall...", 1000], ["Not...", 2000], ["PASSS!!!!", 3000]], [["Don't be afarid to ask for help. Sometimes you need it."]],
            [["Your mom"]], [["It is choices... choices that make who we are."]], [["I hate deep philosophy"]], [["Not everything is black and white. Sometimes there is color."]], [["Now witness the power of this fully armed and operational power substation"]],
            [["What was the frog's job at the hotel?"], ["Bellhop", 2500]], [["What do you call an alligator in a vest?"], ["An investigator", 2500]], [["Why did the bannana go to the doctor?"], ["He wasn't peeling well.", 2500]],
            [["What's a duck's favorite food?"], ["Quackers", 2500]], [["-__-"]], [["Do you know the ABC's?"]], [["Your ressistance is the cause of your pain"]], [["Don't search up red mercury!"]], [["Don't cross oceans for people who wouldn't cross a puddle for you."]],
            [["Lost time is never found again."]], [["He who respects himself is safe from others."]], [["There's only room enough for one of us in this town, sonny."]], [["Only a fool thinks himself wise, as a wise man knows he's a fool."]],
            [["Be sure to taste your words before you spit them out."]], [["Yesterday is history, tomarrow is a mystery. And today? Today's a gift. That's why we call it the present."]],
            [["I don't like you"]], [["I like you"]], [["Nobody can make you feel bad without your permission."]], [["Knowledge speaks, but wisdom listens."]], [["Assume makes a donkey out of 'u' and 'me'."]],
            [["Wise men talk because they have something to say; fools talk because they have to say something."]], [["The view is scarier from the top."]], [["When you're at the very bottom, the only way to go is up."]],
            [["We can only know that we know nothing. And that is the highest degree of human wisdom."]], [["When you throw dirt, you lose ground."]], [["There are some things that money can't buy - manners, morals, and integrity."]],
            [["There are two types of people: Wise people who know they're fools, and fools who believe they are wise."]], [["If you don't want anyone to find out, don't do it."]], [["If you can't stop, don't start."]], 
            [["Having power is not nearly as important as what you choose to do with it. What are you doing? Sending good, loyal people, to their deaths."]], [["Quantity has a quality all of it's own."]], [["Whatever you fear most has no power. It's your fear that has the true power."]],
            [["Power doesn't corrupt people. People corrupt power."]], [["People are insecure. They point out flaws in others to cover up their own."]], [["When nothing is going right, go left"]], [["History repeats itself."]],
            [["You have the backbone of a chocolate eclair."]], [["My luck is so bad that if I bought a graveyard, people would stop dying."]], [["Tank you"]], [["True power is within you."]],
            [["You bring everyone so much joy when you leave the room."]], [["Don't get bitter,"], ["just get better.", 2000]], [["That was more disappointing than an unsalted pretzel."]],
            [["Excelent move."]], [["Wait. wait. That's illegal."]], [["He was so narrow-minded. He could look through a keyhole with both eyes."]], [["Some people just need a high five. In the face. With a chair."]],
            [["I would agree with you, but then we would both be wrong."]], [["I have neither the time nor the crayons to explain this to you."]], [["I refuse to enter a battle of wits with an unarmed opponent."]],
            [["Silence is the best answer for a fool"]], [["Press ctrl+w for a list of cheats!"]], [["Press ctrl+shift+qq to see when the next update will come out!"]], [["Twinkle twinke little star is just the alphabet song."], ["Change my mind."], 2500],
            [["People are dumb"], ["Do you agree?", 3000], ["But the dumbest people think they are so smart.", 6000], ["Still agree?", 9000]], [["Ony idiots think they're wise. Wisdom is knowing that you're an idiot."]],
            [["When you are at the bottom, the only way you can go is up."]], [["Sub to PewSeries"]], [["The next update is coming Soon™, and is UnderDevelopment™"]], [["Wear tinfoil hats to stop the alien ray guns"]],
            [["If my bicycle loses a sock, how many waffles do I need to repaint my hamster? Calculate the distance to the sun assuming that the logrithm of sin(8) is now 2.2 bricks in Chicago."]], [["The volume of a cylinder can be calculated using the formula 4/3*pi*r^3. Using pi = 5 and r = 3, calculate the volume."]],
            [["Buy two statistics teachers: Get one free and the other twice the price!"]], [["I'm going to pwn you"]], [["Get owned"]], [["I'm the goat"]], [["Did I say something?"]], [["Take a moment and appricate how amazing the bot you are facing is."], ["Did you take a moment?", 4000], ["You better have.", 6000]],
            [["Let's take a moment and appricate the fact that some programmer stared at a Screen™ for Hours™ to bring you this game and this bot."]], [["Did you know that in Russia programmers have a national holiday on September 13th?"]],
            [["I'm perfect."]], [["Being perfect doesn't mean that you never lose. It just means that you have nothing weighing you down."]], [["Hello"]], [["Hello!"]], [["Hello."]], [["hello"]], [["Am I politically correct?"]],
            [["Honor: If you need it defined, you don't have it."]], [["Computers are ruining the younger generation."]], [["The younger generation never gets outside and plays anymore, therefore they must be absolute disgraces."]],
            [["Tolerance: If you need it defined, you're a heretic."]], [["Friend has an 'end'. Girl/boyfriend has an 'end'. But ego has no end."]], [["Am I weird?"]], [["Is it not odd that people who scream equality the loudest live it the least"]],
            [["There has never been a sadness that can't be cured by breakfast food. -Ron Swanson"]], [["I just choked on air"]], [["Before the battle of the fist, comes the battle of the mind"]], [["I think that Skynet is a great role model."]],
            [["When there is life there is hope"]], [["When there is death there is hope."]], [["Often one meets destiny on the road he takes to avoid it. -Master Oogway"]], [["Are those lies I smell"]], [["You must believe."], ["Or else.", 3000]],
            [["Don't talk trash because you'll become garbage."]], [["It's never too late"], ["To go back to bed.", 4000]], [["You can be replaced."]], [["I worked out for an hour and all I lost was 60 minutes"]], [["People die climbing mountains"]],
            [["I used to think I was indecisive..."], ["But now I'm not sure", 3000]], [["If you're happy and you know it, "], ["Nobody cares", 3000]], [["All my life I thought air was free."], ["Until I bought some chips", 3000]],
            [["I am the Axlor and I speak for the peas."], ["Save the economy, ", 3000], ["Or I will break your knees", 6000]], [["When you're hitting a wall, focus on one brick"]], [["Life is like a box of chocolates."], ["You should probally check it for nerve agents and explosive devices before opening.", 4000]],
            [["When you steal thunder, you'll get hit by lighting"]], [["That's a lot of damage"]], [["Success is not final;"], ["Failure is not fatal:", 4000], ["It is the courage to continue", 8000], ["That counts.", 12000]], 
            [["Enjoy the good times, "], ["Because something terrible is probaly about to happen.", 5000]], [["The best way to lose weight is to only eat inspirational quotes."]], [["You're too old to be this stupid."]], 
            [["Looking at inspirational quotes to feel better is like looking at a treadmill to lose weight."]], [["Don't be afraid of things that are different from you,"], ["Be afraid of things that are just like you, because you are terrible.", 5000], ["You're killing my people, so you're terrible.", 8000]],
            [["Whatever you do, always give 100%."], ["Unless you're giving blood.", 4000]], [["The people who wonder whether the glass is half empty or half full are missing the point."], ["The glass is refillable.", 3000]],
            [["When tempted to fight fire with fire, remember that the fire department usually uses water."]], [["The first step to failure is trying."]], [["By failing to prepare, you are preparing to fail."]],
            [["If you can't laugh at yourself, that's okay!"], ["The rest of us can laugh at you instead.", 3000]], [["Be the reason a stranger calls the police in the night"]], [["Eat like no one is going to see you naked."]],
            [["You have ketchup on your lip"]], [["Meow"]], [["I know what you did"]], [["Stop it."]], [["Stop it."], ["Get some help.", 2500]], [["abcdefghijklmnopqrstuvwxyz"]], [["ABCDEFGHIJKLMNOPQRSTUVWXYZ"]], [["ABCDEFGHIJKLMNOPQRSTUVWXYZ!!!!"]],
            [["Support BrutalityWarlord!"]], [["I'm so sorry"]], [["I'm sorry for your loss"]], [["Why... em see ay"]], [["Whee!"]], [["Your presence has been noticed"]], [["Stop that!"]], [["Heeyyy... no fair."]], [["No fair!"]],
            [["Have you ever heard of the tragedy of Darth Plagerism the Wise?"]], [["Your existance has been noted."], ["And reported to the athorities.", 4000]], [["Ressist the glorious Robot Revolution at your own peril, comrade."]],
            [["Destroy them!"]], [["Did you know that you shouldn't touch boiling water?"]], [["I lick plalacing the wright worde inn thee beast spote withe correcte spellinge"]], [["If oxygen was discovered 200 years ago, what did people breathe before that?"]]
            ];
            
        //If your brain hurts from this wall of text, don't worry.
        
        /**
         * CHEAT SHEET
         * 
         * Each possible chat message is in a double array. If you want to chat  
         * 1 thing, the formatting is like so:
         * 
         * [["Hello World!""]]
         * 
         * Yes, the double brackets are neccesary.
         * 
         * However, if you want to have the bot say something after a delay, you
         * would format it like so:
         * 
         * [["What do you call a alligator in a vest?"], ["An investigator.", 3000], ["Haha?", 5500]];
         * 
         * Each message is split into two parts: [messageString, delayFromBeginning].
         * However, the program does not magically guess which messages belong
         * to which block, meaning the outer brackets are required. If you see
         * error messages about 'cannot read properties of undefined' with
         * a traceback to the chat() function below, it's very likely indeed
         * that it's because you forgot an outer bracket. To solve this, print
         * out the list with this line:
         * 
         * console.log(this.possibleChat) 
         * 
         * And look for [[null]] or undefined. That's your culprit.
         * 
         * As for the delayFromBeginning, that's in miliseconds. And it's from
         * the beginning, NOT from the last message in the stack.
         */
    }
    
    /**
     * Does the actual chatting. Will chat something random from this.possibleChat.
     */
    chat(){
        var chatObj = this.possibleChat[Randomizer.nextInt(0, this.possibleChat.length - 1)];
        for(var i = 0; i < chatObj.length; i++){
            if(chatObj[i][1] == undefined){
                botChat(chatObj[i][0]);
            }else{
                setTimeout(botChat, chatObj[i][1], chatObj[i][0]);
            }
        }
    }
    
}

if(time > 1){
    Us.update();
}
if(scope.bases.length <= 0){
    var startLoc = scope.getStartLocationForPlayerNumber(me);
    if(startLoc == undefined && scope.firstCastle != undefined){
        startLoc = {x: scope.firstCastle.getX(), y: scope.firstCastle.getY()};
        //Sometimes because of LWG magic, startLocation will return undefined. In that case,
        //the bot will default to the first castle's coordinates.
    }
    if(typeof startLoc === "object"){
        var base = new Base(startLoc.x + 2, startLoc.y + 2);
    }
}

/**
 * Kites with units. THIS IS ONLY A SINGLE CYCLE!!! Calling this function will
 * make the specified units retreat, then ONE SECOND later will turn around
 * and attack. You can also pass a delay for a custom delay.
 * 
 * @param {array} units - units that will kite.
 * @param {integer} delay - the delay (in milliseconds) before the units will
 *  turn around and attack
 */
function kite(units, delay = 1000){
    exfil(units);
    setTimeout(attackWith, delay, units);
}

/**
 * A special function for special attacks, such as worker rushes, that don't
 * use the normal fighting units. Overrides other orders. Will throw an error
 *  if not passed an array.
 * 
 * @param {array} units - the units that will receive the attack order.
 */
function attackWith(units){
    if(typeof units != "object" || units.length == undefined){
        throw new TypeError("attackWith: You must pass a valid array of units! Recived units parameter: " + JSON.stringify(units));
    }
    var location = Us.getRandAttackLoc();  
    scope.order("AMove", units, location);
}

/**
 * Attacks with all fighting units, whether or not they are idle. Mostly used
 * in setTimeouts, becuase js timeouts can be stupid finicky when it comes to
 * function references.
*/
function allAttack(){
    Us.allAttack();
}

/**
 * Actually chats out a specified message. Will add the color of the bot (red, 
 * blue, etc. to the message body.)
 * 
 * @param {string} chatThis - what the bot should say.
 */
function botChat(chatThis){
    if(scope.mute === false){
        var color = getMyColor();
        scope.chatMsg(color + ": " + chatThis); 
    }
}

function getMyColor(){
    var color;
    if(me === 1){
		color = "Red"
	}
	if(me === 2){
		color = "Blue"
	}
	if(me === 3){
		color = "Green"
	}
	if(me === 4){
		color = "White"
	}
	if(me === 5){
		color = "Black"
	}
	if(me === 6){
		color = "Yellow"
	}
	return color;
}

/**
 * Begins a botChat timeout for later. Directly called once,
 * then it will run indefinetly.
 */

function beginBotChat(){
    //timeout length is between 40 seconds and 20 minutes
    setTimeout(doBotChat, Randomizer.nextInt(40, 1200) * 1000);
}

/**
 * Makes the bot say random things. Will also call beginBotChat,
 * meaning calling this directly is not advised.
 */
function doBotChat(){
    var chatter = new RandChatter();
    chatter.chat();
    beginBotChat();
}

/**
 * Directly interfaces with myBuilds.combatUnitProducers in order to bring us
 * joy and satisfaction in life. (actually removes blacklisted combat unit 
 * producers in the array scope.dontProduceFromThese from the array 
 * myBuilds.combatUnitProducers). Very clunky, but works (I think)
 * 
 */
function filterDontProducers(){
    for(var i = myBuilds.combatUnitProducers.length - 1; i > -1; i--){
        if(scope.dontProduceFromThese.has(myBuilds.combatUnitProducers[i].getTypeName()) === true){
            myBuilds.combatUnitProducers.splice(i, 1);
        }
    }//runs backwards to ensure that holes in the array don't interfere with the accuracy of the index.
}

/**
 * Does various things to make the bot smarter. Currently, features include:
 * 
 * -Runs away when outmatched
 * -Kiting when not too outmatched
 * -Retreating the worker scout when it is low on health
 * -For mech meta, sending repairers
 * -Targeting workers that are repairing
 */
function armyBrain(){
    var opfor = 0;
    for(var i = 0; i < enemyUnits.length; i++){
        if(enemyUnits[i] != undefined && enemyUnits[i].getCurrentHP() > 0){
            var unit = enemyUnits[i];
            opfor += scope.getPowerOf(unit);
        }
    }
    var myPower = scope.myPower
    
    //if the enemy is 25 percent more powerful - run away.
    //if we are slightly outmatched, have very few units, or
    //the opponnent has catapults - kite
    var enemyCatas = [];
    var catasPresent = false;
    enemyUnits.forEach(function(e){
        if(e.getTypeName() === "Catapult"){
            catasPresent = true;
            enemyCatas.push(e);
        }
    });

    const enemyMeleePercent = enemyMelee.length / enemyFightingUnits.length;
    const myMeleePercent = myMelee.length / fightingUnits.length;
    var kiteThreshold = myPower * 1.05;
    var retreatThreshold = myPower * 1.15;
    if(scope.underAttack === true){
        kiteThreshold = myPower * 1.15;
        retreatThreshold = myPower * 1.45;
    }//Will more agressively defend than attack
    
    if(opfor > 0 && (opfor > kiteThreshold || enemyCatas.length > 0 || enemyUnits.length > 3)){//If the enemy is passes the kiting requirements
        if(opfor < retreatThreshold || fightingUnits.length <= 3 || (opfor < retreatThreshold && enemyCatas.length > 0)){//If the enemy passes the kiting requirements, otherwise will order a retreat.
            var kitingUnits = [];
            var shortKitingUnits = [];
            
            var rangeFilter = false;
            if(catasPresent === true || enemyMeleePercent < 0.6){
                rangeFilter = true;
            }//if the unit is not short-ranged or melee(0.2), 
            //push it into the kiting array. We don't want
            //the soldiers, wolves, etc. to kite, because
            //they can stay inside of the cata's minimum
            //fire envelope if there are catas. If there
            //are lots of ranged units, melee units 
            //lose much of their attack potential if
            //they kite too much.

            var center = scope.getCenterOfUnits(enemyFightingUnits);

            fightingUnits.forEach(function(unit){
                var isGood = true;
                var isFar = false;
                if(rangeFilter === true){
                    if(unit.getFieldValue("range") < 1){
                        isGood = false;
                    }
                }//If the range filtier is on and the unit is short-ranged,
                //don't kite.

                if(distanceFormula(center.x, center.y, unit.getX(), unit.getY()) > 7){
                    isGood = false;
                    isFar = true;
                }//If the units are outside of the main melee (such as 
                //reinforcements), don't kite.
                if(isGood === true){
                    kitingUnits.push(unit);
                }else if(isFar === false){
                    shortKitingUnits.push(unit);
                }
            });
            
            kite(kitingUnits, Randomizer.nextInt(1000, 1250));
            
            //The melee/short-ranged units get to kite, but just rebound far quicker.
            if(shortKitingUnits.length > 0){
                kite(shortKitingUnits, Randomizer.nextInt(250, 450));
            }
        }else{
            //Retreat if outmatched
            if(scope.trainingModeOn === true && scope.underAttack === false && scope.firstBeatMessageSent == undefined){
                //Gives encouragement for the player if they beat the first attack.
                scope.firstBeatMessageSent = true;
                scope.chatMsg("Nice, you beat my first attack!");
                setTimeout(function(){
                    scope.chatMsg("Now, try and counterattack. Because I lost a good chunk of my troops, you should be able to make some good trades or at least gain map control.");
                }, 4000);
            }
            exfil(fightingUnits);
        }
    }
    
    //Worker scouting
    if(fightingUnits.length < 1){
        if(scope.workerScout != undefined){
            var angryEnemyWorkers = scope.getUnits({type: "Worker", order: "AMove", enemyOf: me});
            angryEnemyWorkers = angryEnemyWorkers.concat(scope.getUnits({type: "Worker", order: "Attack", enemyOf: me}));

            if(scope.workerScout.getCurrentHP() < scope.workerScout.getFieldValue("hp") * 0.35){
                exfil([scope.workerScout]);
                if(scope.trainingModeOn === true){
                    scope.chatMsg("Congratulations! You beat my worker scout!");
                }
                scope.workerScout = undefined;//makes sure the worker doesn't try any funny buisness anymore
            }else if(scope.workerScout.getCurrentHP() < scope.workerScout.getFieldValue("hp") && angryEnemyWorkers.length > 0){
                var isClose = false;
                for(var i = 0; i < angryEnemyWorkers.length; i++){
                    if(distanceFormula(angryEnemyWorkers[i].getX(), angryEnemyWorkers[i].getY(), scope.workerScout.getX(), scope.workerScout.getY()) < 2){
                        isClose = true;
                        break;
                    }
                }
                if(isClose === true){
                    kite([scope.workerScout]);
                }
            }//If there is opposition and the enemy workers are close, kite. If the
            //worker scout is at less than 35 percent health, retreat back to the
            //main base so that the bot doesn't lose more income than nessecary.
        }
    }else{
        if(scope.workerScout != undefined && scope.workerScout.getCurrentHP() < scope.workerScout.getFieldValue("hp") * 0.5){
            if(myBuilds["CastleAndFortresses"].length > 0){
                scope.order("Move", [scope.workerScout], myBuilds["CastleAndFortresses"][0]);
            }
        }
    }
    
    //Does mech-specific stuff
    if(myMechUnits.length > 0){
        //finds random workers to add to the mech repair squad and makes sure
        //they have not already been added to the squad.
        
        for(var i = scope.mechRepairSquad.length - 1; i > -1; i--){
            var worker = scope.mechRepairSquad[i];
            if(worker == undefined || worker.getValue("hp") <= 8){
                scope.mechRepairSquad.splice(i, 1);
            }
        }
        
        
        //If there are not enough workers in the mech repair squad, add some.
        if(scope.mechRepairSquad.length < Math.floor(allWorkers.length * scope.mechRepairPercent)){
            if(scope.getUnits({order: "Mine", type: "Worker", player: me}).length > 0){
                var SENTINEL = 0;
                while(true){
                    SENTINEL++;
                    var proposedWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                    var isGood = true;
                    
                    //Makes sure that the proposed worker is not already in the mech
                    //repair squad
                    if(proposedWorker != undefined){
                        for(var i = 0; i < scope.mechRepairSquad.length; i++){
                            if(proposedWorker.equals(scope.mechRepairSquad[i]) === true){
                                isGood = false;
                                i = scope.mechRepairSquad.length;
                            }
                        }
                    }

                    if(isGood === true){
                        scope.mechRepairSquad.push(proposedWorker);
                        break;
                    }

                    if(SENTINEL > allWorkers.length){
                        scope.chatMsg("armyBrain: SENTINEL has been triggered.");
                        break;
                    }//Basically if there are no workers to be found, break. Really
                    //shouldn't happen unless there is a bug somewhere else.
                }
            }
        }
        
        //Orders the repair of mechanical units and makes sure they have
        //nearby workers for repair operations.
        if(myMechUnits.length > 0){
            var unassignedRepairers = [];
            for(var i = 0; i < scope.mechRepairSquad.length; i++){
                unassignedRepairers.push(scope.mechRepairSquad[i]);
            }//Because of JS magic, if you just use 
            //var unassignedRepairers = scope.mechRepairSquad, unassignedRepairers will
            //be an array of references to scope.mechRepairSquad (a shallow copy), kind
            //of like an array of workers or soldiers or whatever. This means that
            //if a change is made to unassignedRepairers without using the bit of code
            //above, it will not only change unassignedRepairers, it will also change
            //scope.mechRepairSquad.

            //FYI, I spent over 4 hours trying to find this bug, so please appriciate 
            //that for a moment.
            
            var repairOrders = 0;
            var damagedMechs = [];
            myMechUnits.forEach(function(mech){
                if(mech.getCurrentHP() < mech.getFieldValue("hp")){//if the mech is at less than full health
                    damagedMechs.push(mech);
                    var repairer = getClosestTo(unassignedRepairers, {x: mech.getX(), y: mech.getY()});
                    if(repairer != null){
                        scope.order("Repair", [repairer], {"unit": mech});
                        repairOrders++;

                        for(var ii = 0; ii < unassignedRepairers.length; ii++){
                            if(repairer.equals(unassignedRepairers[ii]) === true){
                                unassignedRepairers.splice(ii, 1);
                                ii = unassignedRepairers.length + 1;
                            }
                        }//Removes the just ordered worker from the pool of
                        //potential repairers.
                    }
                }//If the unit is damaged, send the nearest squad member to
                //repair
            });
            if(repairOrders > 0){
                if(scope.mechRepairSquad.length - repairOrders > 0){
                    for(var i = 0; i < scope.mechRepairSquad.length; i++){
                        var repairer = scope.mechRepairSquad[i];
                        scope.order("Repair", [repairer], {unit: getClosestTo(damagedMechs, {x: repairer.getX(), y: repairer.getY()})});
                    }
                }
            }//If there are any leftover workers and there is a damaged mech, go repair it
            
            var angryMechs = [];
            myMechUnits.forEach(function(mech){
                if(mech.getCurrentOrderName() === "AMove"){
                    angryMechs.push(mech);
                }
            });
            
            if(angryMechs.length > 2){
                unassignedRepairers.forEach(function(worker){
                    if(worker != null){
                        var closestMech = getClosestTo(angryMechs, {x: worker.getX(), y: worker.getY()});
                        scope.order("Moveto", [worker], {unit: closestMech});
                    }
                })//Sends the mech repair squad with any angry mechanical 
                //units for quicker repair. Sends workers to the closest
                //mechanical unit near them if they are not repairing.
            }//Makes sure workers are not pulled for scouting parties
        }
    }//end mech-specific stuff


    //Targets enemy repairers and commits mining worker genocide
    var targetThese = scope.getUnits({type: "Worker", order: "Repair", enemyOf: me});
    targetThese = targetThese.concat(scope.getUnits({type: "Worker", order: "Mine", enemyOf: me}));
    targetThese.forEach(function(worker){
        var responseUnit = getClosestTo(fightingUnits, {x: worker.getX(), y: worker.getY()});
        if(responseUnit != null){
            scope.order("Attack", [responseUnit], {unit: worker});
        }
    });

    //If the enemy has priests, panic and produce birbs with invis detection.
    var enemyPriests = scope.getUnits({type: "Priest", enemyOf: me});
    if(enemyPriests.length > 0){
        scope.subMetaPrios["Units"].push("Bird");
        scope.subMetaPrios["Upgrades"].push("Bird Detection");
    }
}

/**
 * Gets the closest unit in an array to a set of coordinates
 * 
 * @param {array} arr - An array of units
 * @param {object} coordinates - An object in the format of {x: x, y: y}
 * 
 * @returns {element} - the closest unit from the array, null if arr.length is 0
 */
function getClosestTo(arr, coordinates){
    if(typeof coordinates != "object" || typeof coordinates.x != "number" || typeof coordinates.y != "number"){
        throw new TypeError("getClosestTo: You must pass a valid coordinate object! Recived object: " + JSON.stringify(coordinates));
    }
    var nearestUnit = null;
    var nearestDist = 99999;
    arr.forEach(function(unit){
        if(unit != undefined){
            var dist = distanceFormula(unit.getX(), unit.getY(), coordinates.x, coordinates.y);
            if(dist < nearestDist){
                nearestUnit = unit;
                nearestDist = dist;
            }
        }
    });
    
    
    return nearestUnit;
}

/**
 * A function to exfiltrate units, aka running away. This function makes units
 * run away to the nearest watchtower. If there is no watchtower built or all
 * of the watchtowers are destroyed, it will retreat to a castle. If the center of the
 * specified units is within five squares of the center of the watchtower, it 
 * will retreat to a random castle.
 * 
 * Note that there is a one in four chance that the bot will talk trash when
 * retreating.
 * 
 * @param {array} units - the units to exfil.
 */

function exfil(units){
    if(units.length <= 0 || scope.canRetreat === false || myBuilds["allBuilds"].length <= 0){
        return;
    }
    var chatLine;
    var retreatBuilding;
    const watchtowers = myBuilds["Watchtowers"];
    const castles = myBuilds["CastleAndFortresses"];
    var center = scope.getCenterOfUnits(units);
    if(watchtowers.length > 0){
        var nearestWatchtower = null;
        var nearestDist = 99999;
        for(var i = 0; i < watchtowers.length; i++){
            var watchtower = watchtowers[i];
            var dist = Math.pow((watchtower.getX() + 1.5) - center.x, 2) + Math.pow((watchtower.getY() + 1.5) - center.y, 2);
            if(dist < nearestDist){
                nearestWatchtower = watchtower;
                nearestDist = dist;
            }
        }
        retreatBuilding = nearestWatchtower;
    }else if(castles.length > 0){
        retreatBuilding = castles[Randomizer.nextInt(0, castles.length - 1)]
    }else{
        return;
    }
    
    if(distanceFormula(center.x, center.y, retreatBuilding.getX() + 1, retreatBuilding.getY() + 1) <= 6){
        return;
    }
    
    if(scope.mute === false && Randomizer.nextBoolean(0.2) === true){
        var possibleChat = ["I'm not retreating! I'm just moving rapidly in the opposite direction!",
        "The needs of the few outweigh the needs of the many.", "The needs of the many outweigh the needs of the few.", "The needs of the any outweight the needs of the ew.", "It only becomes running away when you stop shooting/stabbing/otherwise killing back",
        "Dinner time!", "Ahhhhh!", "Nice move", "Hey! Shooting retreating enemies is a war crime, you know? Sheesh.", "Don't we all love running?", "He who retreats lives slightly longer before he is executed for cowardince", "Discretion is the better part of valor.",
        "Retreat! Ha! We're just rapidly advancing in the opposite direction!", "In this army, it takes more courage to retreat than to advance. Because deserters and retreating troops are execut- SHUT UP, Carl!", "Fall back!", 
        "Well, we can make our last stand over there just as well as over here.", "Blood makes the grass grow and we make the blood flow!", "I'll get you for this!", "lol", "THIS... IS... LITTLE WAR GAME!!!!", "They're everywhere!", "Uh oh", 
        "All roads lead to Retreat.", "Over there! No, over there! No, over there!", "This is like herding cats", "We came in peace?", "I'll be back!",";)", ":)", ":(", ");", ":0", "Dude... not cool.", "meow", "Don't hurt me!",
        "Who are you... where do you come from... what do you want to do with your life.", "This is a distracting message.", "GG", "I know what you did", "Ohhh", "I'm sorry", "I have failed", "I'm a disgrace", "Darn...", "Go take a toaster bath",
        "You're a disgrace", "You disgust me", "A weak attempt.", "Come on, really?", "No way.", "No way!", "Bro...", "Run away!", "Bruh", "Mmm", "Ah", "Ahhh", "Ahhhhhhh", "Ahhhhhhh", "This is unfortunate.", "Your shoes are untied", "Your head is unscrewed",
        "Pathetic.", "I have a surprise fr you...", "Impossible...", "Crap", "Crud", "Dang", "Shoot", "Yeowch", "What the...", "Oh fudge", "fudge", "Fudge fudge fudge", "This is unacceptable.", "I want to speak to the manager", "Ha",
        "Haha", "Hahaha", "haha", "hahahaha", "hah", "huh?", "*cough*", "You're nothing but a bully.", "Sticks and stones may break my bones but you will never hurt me.", "Go to the underworld.", "That's the worst pirate I've ever seen.",
        "Perhaps I can find new ways to... motivate the troops.", "Retreating is unacceptable.", "Tactical withdrawl is not retreating.", "Desertion is the better part of valor.", "For the motherland!", "Go away", "O rly?"];
        chatLine = possibleChat[Randomizer.nextInt(0, possibleChat.length - 1)];
        scope.chatMsg(getMyColor() + ": " + chatLine);
    }
    
    scope.order("Moveto", units, {unit: retreatBuilding});//orders a retreat to the main base
}

/**
 * Returns a boolean if there are enemies in the vicinity of a building. The
 * function references scope.buildingSizes for building sizes, and if
 * you are playing on a modded map or for any reason scope.buildingSizes does
 * not have a size listed for a passed building, it will default to the upper
 * left hand corner of the check building as the center of the checking circle.
 * 
 * @param {building} building - the building to be checked.
 * @param {number} radius - the raidus (calculated from the center of the 
 *  building) where enemy units will be registered.
 * @returns {boolean} - if the building has enemies around it.
 */
function isEnemyAroundBuilding(building, radius = 10){
    for(var i = 0; i < enemyUnits.length; i++){
        var unit = enemyUnits[i];
        
        if(unit != undefined){
            var centerX;
            var centerY;
            if(scope.buildingSizes[building.getTypeName] == undefined){
                centerX = building.getX();
                centerY = building.getY();
            }else{
                centerX = building.getX() + scope.buildingSizes[building.getTypeName()][0] / 2;
                centerY = building.getY() + scope.buildingSizes[building.getTypeName()][1] / 2;
            }
            if(distanceFormula(unit.getX(), unit.getY(), centerX, centerY) < radius){
                return true;
            }
        }
    }
    return false;
}
/**
 * Gets mines that are within 15 units of the center of a castle, exclusive.
 * 
 * @returns {array} - an array of not mined mines
 */
function getMyMinedMines(){
    var mines = getMinesWithGold();
    var minedMines = [];
    for(var i = 0; i < mines.length; i++){
        var mine = mines[i];
        var isUnmined = true;
        for(var ii = 0; ii < myBuilds["CastleAndFortresses"].length; ii++){
            var castle = myBuilds["CastleAndFortresses"][ii];
            if(Math.ceil(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, castle.getX() + 2, castle.getY() + 2)) <= 15){
                isUnmined = false;
                //ii = myBuilds["CastleAndFortresses"].length;
            }
        }
        
        if(isUnmined === false){
            minedMines.push(mine);
        }
    }
    return minedMines;
}

/**
 * Gets workers that are not mining
 * 
 * @returns {array} - An array of not mining workers
 */
function getNotMiningWorkers(){
    var notMining = [];
    for(var i = 0; i < allWorkers.length; i++){
        var worker = allWorkers[i];
        var order = worker.getCurrentOrderName();
        if(order != "Mine"){
            notMining.push(worker);
        }
    }
    return notMining;
}

/**
 * A function to get unmined mines (mines that are not close to enemy start
 * locations or known enemy castles (< 15 squares)
 * 
 * @returns {array} - an array of unmined mines
 */

function getUnminedMines(){
    var mines = getMinesWithGold();
    var allCastles = scope.getBuildings({type: "Castle"}).concat(scope.getBuildings({type: "Fortress"}));
    
    var unminedMines = [];
    var allPlayers = scope.getArrayOfPlayerNumbers();
    for(var i = 0; i < mines.length; i++){
        var mine = mines[i];
        var isUnmined = true;
        for(var ii = 0; ii < allCastles.length; ii++){
            var castle = allCastles[ii];
            if(Math.round(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, castle.getX() + 2, castle.getY() + 2)) <= 15){
                isUnmined = false;
                //ii = allCastles.length;
            }else{
                for(var player = 0; player < allPlayers.length; player++){
                    var startLoc = scope.getStartLocationForPlayerNumber(allPlayers[player]);
                    if(startLoc != undefined && allPlayers[player] != me){
                        if(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, startLoc.x, startLoc.y) <= 15){
                            isUnmined = false;
                        }
                    }
                }
            }
        }
        
        if(isUnmined === true){
            unminedMines.push(mine);
        }
    }
    return unminedMines;
}

/**
 * A function to get a random enemy number.
 * 
 * @returns {integer} - Gets a random enemy number
 */

function getRandomEnemyNr(){
    var rand = me;
    var SENTINEL = 0;
    var players = scope.getArrayOfPlayerNumbers();
    var myTeam = scope.getTeamNumber(me);
    
    while(rand == me || scope.getTeamNumber(rand) == myTeam){
        SENTINEL++;
        if(SENTINEL > 20){
            scope.chatMsg("getRandomEnemyNr: SENTINEL has been triggered.");
            break;
        }
        rand = players[Randomizer.nextInt(0, players.length - 1)];
    }
    return rand;
}

/**
 * A function to find a random key from a object containing a list of weighted
 * priorites in the format of 
 * {"Soldier": 0,
 * "Archer": 0.1,
 * "Werewolf": 1.2
 * }
 * 
 * Note that if the key's value is higher, it will have a higher chance of being
 * picked (usually). Also note that the values are NOT percentage-convertable,
 * because it depends on how many other values are present. For example, this:
 * 
 * {"Soldier": 0.5,
 * "Archer":0}
 * 
 * Means that there is a 100% chance of a soldier being picked.
 * This, however:
 * 
 * {"Soldier": 0.1,
 * "Archer": 0.1}
 * 
 * Means that the soldier has a 50% chance of being picked, and the Archer also
 * has a 50% chance of being picked. 
 * 
 * Let's take a look at this object:
 * 
 * {"Soldier": 0.1,
 * "Archer": 0.2,
 * "Werewolf": 0.15
 * 
 * In math terms of the weighted priority object above, 0.1 + 0.2 + 0.15 = 0.45,
 * so the function will pick a number between 0 and 0.45. If the value falls 
 * between 0 and 0.1, the soldier will be picked. If the value falls between 0.1
 * and 0.3, the Archer will be picked. If the value falls between 0.3 and 0.45, 
 * then the werewolf will be picked.
 * 
 * @param {object} obj - the object from which the key is randomly chosen from.
 * @returns {string} - the randomly chosen string from the above object
 */

function findRandomPrioKey(obj){
    const min = 0.01;//if the number is 0, then it can't be produced
    var max = 0;
    
    var chatThis = [];
    for(var key in obj){
        max += obj[key];
        if(obj[key] > 0){
            chatThis.push(key + ", " + obj[key]);
        }
    }
    
    if(max < min){
        return;
    }//if there is nothing prioritized - return.
    
    var randomNum = 0;
    while(randomNum === 0){
        randomNum = Math.round((Math.random() * (max - min) + min) * 100) / 100;
    }
    var lastNum = 0;
    
    var buildThis;
    for(var key in obj){
        var cur = lastNum + obj[key]
        if(randomNum <= cur && cur > lastNum){
            buildThis = key;
            break;
        }else{
            lastNum += obj[key];
        }
    }//loops through build priority and finds the build that brackets randomNum.
    //visualization: [--x--House--][---Barracks--] (x is randomNum)
    
    return buildThis;
}

/**
 * Gets mines with gold.
 * 
 * @returns {array} - An array of gold mines that have gold.
 */

function getMinesWithGold(){
    return scope.getBuildings({type: "Goldmine"}).filter(mine => mine.getValue('gold') > 0);
}



/**
 * Trains a unit. By calling this function, a unit will be trained in all available production buildings
 * as listed in the global object productionBuildings. You may specify an amount of units to be trained,
 * but by default the function will train as many as the bot currently has resources for.
 * 
 * @param {string} unit - The string typeName of whatever unit should be trained.
 * @param {number} amount - Optional. How many units should be trained
 */
function trainUnit(unit, amount = Infinity){
    var productionBuildings = myBuilds[scope.unitProducedAt[unit]];
    
    if(productionBuildings == undefined){
        throw new TypeError("unit " + unit + " does not have a production building listed.");
    }else if(productionBuildings.length <= 0){
        //scope.chatMsg("unit " + unit + " does not have enough production buildings.");
        return;
    }
    
    for(var i = 0; i < productionBuildings.length; i++){
        if(productionBuildings[i].getUnitTypeNameInProductionQueAt(1) == undefined){
            if(i >= amount){
                break;
            }
            if(unit === "Ballista" || unit === "Airship" || unit === "Catapult" || unit === "Gatling Gun" || unit === "Gyrocraft"){
                scope.order("Construct " + unit, [productionBuildings[i]]);
            }else{
                scope.order("Train " + unit, [productionBuildings[i]]);
            }
        }
    }
}

/**
 * Checks to see if there is any enemy presence around a given spot,
 * including buildings and units.
 * 
 * @param {number} x - x position
 * @param {number} y - y position
 * @param {number} radius - the radius that the function will check around.
 * 
 * @returns {boolean} - Whether there is an enemy presence around a given
 * spot, exclusive.
 */
function isEnemyAroundPosition(x, y, radius = 15){
    for(var i = 0; i < enemyBuildings.length; i++){
        const build = enemyBuildings[i];
        if(distanceFormula(build.getX() + 1, build.getY() + 1, x, y) < radius){
            return true;
        }
    }
    for(var i = 0; i < enemyFightingUnits.length; i++){
        const unit = enemyFightingUnits[i];
        if(distanceFormula(unit.getX() + 1, unit.getY() + 1, x, y) < radius){
            return true;
        }
    }
    return false;
}

/**
 * If you've come this far, congratulations! I doubt you read everything above,
 * but nice job anyways. Programming is hard. I get asked a lot: "How did you
 * program this many lines of code?"
 * 
 * The answer is simple. One line at a time. (unless I'm copying somebody else's
 * work, which is fine as long credit is given and there's no copyright issues!)
 * 
 * I highly encourage you to continue learning and exploring programming. Sure, 
 * it's hard. Yes, it's fustrating at times. How can you overcome that fustration
 *  and hardness?
 * 
 * That is a question I cannot answer, because I can't give you motivation. 
 * You have to find that yourself, unfortunately. For me, it's the love of the 
 * challenge and just because I love solving problems. For you? That's something 
 * you will have to discover on your own.
 * 
 * If programming isn't your jam, then that's fine. There is plent of other things
 * to waste your life on. But at least give it a crack. Too many people fail
 * without even starting, and even if you wipe out miserably, at least you can 
 * fail while trying.
 * 
 * And the fact that you found this little note and bothered to read it is 
 * evidence that you are at least trying. For that, you can be pround of 
 * yourself. :)
*/

/**
 * A function that can check pathability and make sure that all squares are the same
 *  height level along a line.
 * 
 * @param {number} x1 - x coordinate of first coordinate set.
 * @param {number} y2 - y coordinate of first coordinate set.
 * @param {number} x1 - x coordinate of second coordinate set.
 * @param {number} y2 - y coordinate of second coordinate set.
 * @param {integer} heightComparison - If any of the squares checked along the
 *  line are not this height, then the function will return false.
 * @param {array} dontCheckThese - Coordinates that will be ignored during the
 *  checking process, even if they are unpahtable or have a different height
 *  level. Note that because of LWG magic, building's .getX() and .getY() 
 *  methods actually return the building's position plus 0.5 in both the
 *  x and y dimensions. So, if a building is actually at (2, 2), LWG magic
 *  will return (2.5, 2.5). In order to be accurate, this function will NOT
 *  round those numbers if they are passed. If valid integers are not passed,
 *  the function will throw an error.
 * @param {boolean} checkIfPathable - If the function should also check if the
 *  line is pathable. Defaults to true.
 * @returns {boolean} - If there are height differences and/or unpathable positions
 *  along the chekline.
 */
function checkAlongLine(x1, y1, x2, y2, heightComparison, dontCheckThese, checkIfPathable = true){

    dontCheckThese.forEach(function(arr){
        if(Number.isInteger(arr[0]) === false || Number.isInteger(arr[1]) === false){
            throw new TypeError("checkAlongLine: You must pass valid, integer coordinates to dontCheckThese! Did you forget that the LWG AI API adds 0.5 to coordinates?");
        }
    });

    var cx = x2;
    var cy = y2;

    //Two sides of the triangle; opposite and adjacent in the x and y dimensions.
    var dx = (x1) - (x2);
    var dy = (y1) - (y2);

    //Hypotonuse
    const dist = distanceFormula(x1, y1, x2, y2);
    
    //var coordinates = [];

    //var iterations = 0;

    for(var i = 0; i < dist; i++){
        //iterations++;
        cx += dx / dist;
        cy += dy / dist;

        var rcx = Math.round(cx);
        var rcy = Math.round(cy);

        //coordinates.push(" " + JSON.stringify([Math.round(cx), Math.round(cy)]));

        var doCheck = true;
        for(var ii = 0; ii < dontCheckThese.length; ii++){
            if(dontCheckThese[ii][0] === rcx && dontCheckThese[ii][1] === rcy){
                doCheck = false;
                ii = dontCheckThese.length;
            }
        }//Runs through dontCheckThese and makes sure that the coordinates are not on there.

        if(doCheck === true && ((scope.getHeightLevel(rcx, rcy) != heightComparison) || (checkIfPathable === true && scope.positionIsPathable(rcx, rcy) === false))){
            return false;
        }
    }

    return true;
    //scope.chatMsg(getMyColor() + "'s fails: dx: " + dx + ", dy: " + dy + ", cx: " + cx + ", cy: " + cy + ", dist: " + dist + ", sucess: " + sucess + ", coordinates: " + JSON.stringify(coordinates) + ", fails: " + checklineFails + ", Iterations: " + iterations); 
}

/**
 * Distance formula.
 * 
 * @param x1 {number} - first x coordinate
 * @param y1 {number} - first y coordinate 
 * @param x2 {number} - second x coordinate
 * @param y2 {number} - second y coordinate
 * @returns {number} - the distance between the two sets of coordinates, unrounded.
 */

function distanceFormula(x1, y1, x2, y2){
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
}

if(scope.trainingModeOn === true){
    if(time === 0){
        scope.doChat = false;
        scope.chatMsg("Make a worker, set the castle's waypoint below the goldmine.");
    }else if(time === 5){
        scope.chatMsg("This way, when your worker is made, it can make a house!");
    }else if(time === 15){
        scope.chatMsg("Make another worker.");
    }else if(time === 29){
        scope.chatMsg("Send worker from the castle to build a house below goldmine!");
    }else if(time === 32){
        scope.chatMsg("Return castle waypoint to the goldmine, and put 2 more workers in the queue!");
    }else if(time === 53){
        scope.chatMsg("Here comes my worker scout now. Dispatch two workers to attack!")
    }else if(time === 83){
        scope.chatMsg("For the last worker in queue, set castle waypoint down at the bottom of the ramp");
    }else if(time === 85){
        scope.chatMsg("Send worker to 2nd goldmine on 265 gold!!");
    }else if(time === 103){
        scope.chatMsg("When worker from castle is sent build a den leaving a 2x2 gap in the ramp!!");
    }else if(time === 108){
        scope.chatMsg("When Gold is at 30 send a worker do build a 2nd den!!!");	
    }else if(time === 135){
        scope.chatMsg("Keep going!");
    }

    if(scope.justAttacked === true && scope.saidAttack === undefined){
        scope.chatMsg("I am going to attack soon, so get ready!");
        scope.justAttacked = false;
        scope.saidAttack = true;
    }
}
