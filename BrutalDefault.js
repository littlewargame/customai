//BrutalDefault - a LWG AI created by Brutalitywarlord
//This Variant of the Ai works only for default maps
//Its behavior can vary by slight margins dependant on modifiers determined from the start of the gameclock
//As a result of increased dependancy on RNG - this bot is more versatile, and variable in its behavior
//Than the current default AI for LWG - although this current iteration still struggles to defeat the current model.

//Initialization scope - variables defined in the scope are generated once, and have 'permanence'. They can be altered. 
if(!scope.initialized){
	//generates a randomized multiplier to determine variable behavior in the computer
	//"OopsOnlyTowers" - Disabled Meta due to issues 
	//Pending ideas - "WulkSmash", "HowToTrainYourDragon", "RaiderBoss"
	scope.meta = ["BeastMech" , "Rax" , "Beast", "RaxMech", "Skirmishers"];
	scope.forceBuild = false;
	scope.goldAlert = false; //Will stop building structures if goldmine running empty - prioritizes a new castle. 
	scope.castPrio = false; //Determines if the bot avoids building anything before 2nd castle is built
	scope.strategy = scope.meta[Random(scope.meta.length)]; //Determines the variant of the meta the bot will use. 
	scope.atkDelay = 180;
	
	//Variables which modify the range behavioral modifiers can be altered
	scope.aMod = 0; 
	scope.eMod = 0; 
	scope.dMod = 0; 
	scope.rMod = 0;
	scope.priorityMine = []; //Stores the goldmine the bot wants to prioritize for building a castle next too
	
	
	//Behavioral Modifiers which adjust certain behaviors in the bot
	scope.aggression = randBehavior(50, 101) + scope.aMod;//Controls the interval for aggresive actions
	scope.expansion = randBehavior(50, 101) + scope.eMod;//Controls the interval for most building construction
	scope.defensive = randBehavior(30, 121) + scope.dMod;//Controls interval for defensive actions
	scope.rshPrio = randBehavior(10, 141) + scope.rMod;//Controls how often the computer will research new technology
	scope.flexibility = randBehavior(1, 31);//Controls the maximum range where other behaviors can be modified
	scope.playNum = scope.getArrayOfPlayerNumbers();
	scope.playStarts = [];
	scope.chatter = ( 60 + Random(300));
	for (var yee = 0; yee < scope.playNum.length; yee++){
		scope.playStarts[yee] = scope.getStartLocationForPlayerNumber(scope.playNum[yee]);
	}
	scope.plentyGold = false;
	//Variable controls delays seen in a few build orders
	//Array Order: Houses, Forge
	scope.delay = [10,10];
	
	//Determines how the Ai prioritizes a second castle
	var prioChoice = Random(100);
	if(prioChoice >= 85){
		scope.castPrio = true;
	}
	
	scope.alertDelay = 10;
	scope.towerControl = 40;
	scope.scoutControl = 30;
	scope.castleRush = 3
	scope.rushControl = 5;
	scope.castleSwitch = false;
	scope.cLimit = 2;
	scope.dBuffer = 2;
	if(scope.strategy == "BeastMech" || scope.strategy == "RaxMech"){
		scope.dBuffer = 2;
	}

	//Logs all the behavioral variables in the console.
	console.log("Player: ", scope.getMyPlayerNumber());
	console.log("Meta: ", scope.strategy);
	console.log("------------------");

	scope.attacker = null;

	scope.limit = false;
	scope.initialized = true;
	scope.knownEnemies = {
        "Worker": [],
        "Soldier": [],
        "Archer": [],
        "Mage": [],
        "Priest": [],
        "Raider": [],
        "Wolf": [],
        "Snake": [],
        "Werewolf": [],
        "Dragon": [],
        "Gatling Gun": [],
        "Gyrocraft": [],
        "Catapult": [],
        "Bird": [],  
    }
	scope.unitChance = {}	//Stores a list of training probabilities for units associated to its meta
	scope.buildChance = {} //Stores a list of construction probabilities for buildings associated to its meta
	//Initial probabilities for unit training and building construction
	if(scope.strategy == "Rax"){
		scope.unitChance = {
			"Train Archer":{"Prob": 0.35, "ID": "archer"},
			"Train Soldier":{"Prob": 0.35, "ID": "soldier"},
			"Train Mage":{"Prob": 0, "ID": "mage"},
		}
		scope.buildChance = {
			"Build House" : {"Prob": 0.9, "Type": "House", "Size" : 3, "Parent": [] , "Radius":  18, "MinRad" : 7, "ID": "house"},
			"Build Barracks": {"Prob": 0, "Type": "Barracks", "Size" : 3, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "barracks"},
			"Build Mages Guild" : {"Prob": 0, "Type": "Mages Guild", "Size" : 3, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "magesguild"},
			"Build Watchtower" : {"Prob": 0.1, "Type": "Watchtower", "Size" : 2, "Parent": [], "Radius":  7, "MinRad" : 3, "ID": "watchtower"},
		}
	}
	if(scope.strategy == "Skirmishers"){
		scope.unitChance = {
			"Train Archer":{"Prob": 0.35, "ID": "archer"},
			"Train Soldier":{"Prob": 0.50, "ID": "soldier"},
			"Train Raider":{"Prob": 0.15, "ID": "raider"},
			"Train Priest":{"Prob": 0, "ID": "priest"},
		}
		scope.buildChance = {
			"Build House" : {"Prob": 0.9, "Type": "House", "Size" : 3, "Parent": [] , "Radius":  18, "MinRad" : 7, "ID": "house"},
			"Build Barracks": {"Prob": 0, "Type": "Barracks", "Size" : 3, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "barracks"},
			"Build Church" : {"Prob": 0.1, "Type": "Church", "Size" : 4, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "church"},
			"Build Watchtower" : {"Prob": 0.1, "Type": "Watchtower", "Size" : 2, "Parent": [], "Radius":  7, "MinRad" : 3, "ID": "watchtower"},
		}
	}
	if(scope.strategy == "Beast"){
		scope.unitChance = {
			"Train Wolf":{"Prob": 0.55, "ID": "wolf"},
			"Train Snake":{"Prob": 0.45, "ID": "snake"},
			"Train Werewolf":{"Prob": 0, "ID": "werewolf"},
			"Train Dragon":{"Prob": 0, "ID": "dragon"},
		}
		scope.buildChance = {
			"Build House" : {"Prob": 0.8, "Type": "House", "Size" : 3, "Parent": [] , "Radius":  18, "MinRad" : 7, "ID": "house"},
			"Build Wolves Den": {"Prob": 0, "Type": "Wolves Den", "Size" : 3, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "wolvesden"},
			"Build Snake Charmer" : {"Prob": 0, "Type": "Snake Charmer", "Size" : 2, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "snake_charmer"},
			"Build Dragons Lair" : {"Prob": 0, "Type": "Dragons Lair", "Size" : 3, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "dragonslair"},
			"Build Watchtower" : {"Prob": 0.1, "Type": "Watchtower", "Size" : 2, "Parent": [], "Radius":  7, "MinRad" : 3, "ID": "watchtower"},
		}
	}
	if(scope.strategy == "BeastMech"){
		scope.unitChance = {
			"Train Wolf":{"Prob": 0.55, "ID": "wolf"},
			"Train Snake":{"Prob": 0.45, "ID": "snake"},
			"Train Werewolf":{"Prob": 0, "ID": "werewolf"},
			"Train Dragon":{"Prob": 0, "ID": "dragon"},
			"Construct Gatling Gun":{"Prob": 0, "ID": "gatlinggun"},
			"Construct Catapult":{"Prob": 0, "ID": "catapult"}
		}
		scope.buildChance = {
			"Build House" : {"Prob": 0.8, "Type": "House", "Size" : 3, "Parent": [] , "Radius":  18, "MinRad" : 7, "ID": "house"},
			"Build Wolves Den": {"Prob": 0, "Type": "Wolves Den", "Size" : 3, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "wolvesden"},
			"Build Snake Charmer" : {"Prob": 0, "Type": "Snake Charmer", "Size" : 2, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "snakecharmer"},
			"Build Dragons Lair" : {"Prob": 0, "Type": "Dragons Lair", "Size" : 3, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "dragonslair"},
			"Build Watchtower" : {"Prob": 0.1, "Type": "Watchtower", "Size" : 2, "Parent": [], "Radius":  7, "MinRad" : 3, "ID": "watchtower"},
			"Build Workshop" : {"Prob": 0, "Type": "Workshop", "Size" : 3, "Parent": [], "Radius":  16, "MinRad" : 1, "ID": "workshop"}
		}
	}
	if(scope.strategy == "RaxMech"){
		scope.unitChance = {
			"Train Archer":{"Prob": 0.35, "ID": "archer"},
			"Train Soldier":{"Prob": 0.35, "ID": "soldier"},
			"Construct Gatling Gun":{"Prob": 0, "ID": "gatlinggun"},
			"Construct Catapult":{"Prob": 0, "ID": "catapult"},
			"Construct Gyrocraft":{"Prob": 0, "ID": "gyrocopter"}
		}
		scope.buildChance = {
			"Build House" : {"Prob": 0.9, "Type": "House", "Size" : 3, "Parent": [] , "Radius":  18, "MinRad" : 7, "ID": "house"},
			"Build Barracks": {"Prob": 0, "Type": "Barracks", "Size" : 3, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "barracks"},
			"Build Watchtower" : {"Prob": 0.1, "Type": "Watchtower", "Size" : 2, "Parent": [], "Radius":  7, "MinRad" : 3, "ID": "watchtower"},
			"Build Workshop" : {"Prob": 0, "Type": "Mages Guild", "Size" : 3, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "workshop"},
			"Build Mill" : {"Prob": 0, "Type": "Mages Guild", "Size" : 2, "Parent": [], "Radius":  14, "MinRad" : 1, "ID": "mill"}
		}
	}
}

const unitPower = {//used to calculate how much of a threat an enemy is
    "Worker": 0.25,
    "Soldier": 1,
    "Archer": 1,
    "Mage": 1.25,
    "Priest": 1.25,
    "Raider": 0.75,
    "Wolf": 0.75,
    "Snake": 1,
    "Werewolf": 5,
    "Dragon": 4,
    "Airship": 0.8,
    "Gatling Gun": 1.5,
    "Gyrocraft": 1.25,
    "Catapult": 1.5,
    "Bird": 0.01,
	"Watchtower": 1.75
};


if(scope.castPrio == true){
	scope.delay[0] = 150;
	scope.delay[1] = 180;
}
else{
	scope.delay = [2,240];
}	


// General variables
var time = Math.round(scope.getCurrentGameTimeInSec());
var me = scope.getMyPlayerNumber();

var myTeam = scope.getMyTeamNumber();
var gold = scope.getGold();
var mines = EmptyFilter();
var Width = scope.getMapWidth();
var Height = scope.getMapHeight();
var supply = scope.getCurrentSupply();
var maxSup = scope.getMaxSupply();

//variables to store allied Buildings
var allBuild = scope.getBuildings({player: me})
var castles = scope.getBuildings({type: "Castle", player: me});
var forts = scope.getBuildings({type: "Fortress", player: me});
var deliverSites = castles.concat(forts);
var finCast = scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}); //Only finished Castles
var finSite = finCast.concat(forts);

var houses = scope.getBuildings({type: "House", player: me});
var towers = scope.getBuildings({type: "Watchtower", player: me});
var Rax = scope.getBuildings({type: "Barracks", player: me});
var forges = scope.getBuildings({type: "Forge", player: me});
var labs = scope.getBuildings({type: "Animal Testing Lab", player: me});
var guilds = scope.getBuildings({type: "Mages Guild", player: me});
var churches = scope.getBuildings({type: "Church", player: me});
var Dens = scope.getBuildings({type: "Wolves Den", player: me});
var wereDens = scope.getBuildings({type: "Werewolves Den", player: me});
var allDens = Dens.concat(wereDens);
var Lairs = scope.getBuildings({type: "Dragons Lair", player: me});
var Charmer = scope.getBuildings({type: "Snake Charmer", player: me});
var workshops = scope.getBuildings({type: "Workshop", player: me});
var mills = scope.getBuildings({type: "Mill", player: me});
var advWkShops = scope.getBuildings({type: "Advanced Workshop", player: me});
var impStruct = deliverSites.concat(Rax.concat(allDens.concat(workshops.concat(mills))));
var allAllied = scope.getBuildings({team: myTeam, onlyFinshed: true});

//Variables to locate Computer owned units
var idleWorkers = scope.getUnits({type: "Worker", player: me, order: "Stop"});
var workers = scope.getUnits({type: "Worker", player: me});
var Soldier = scope.getUnits({type: "Soldier", player: me});
var Archer = scope.getUnits({type: "Archer", player: me});
var Mage = scope.getUnits({type: "Mage", player: me});
var Priest = scope.getUnits({type: "Priest", player: me});
var Raider = scope.getUnits({type: "Raider", player: me});
var Wolves = scope.getUnits({type: "Wolf", player: me});
var Snakes = scope.getUnits({type: "Snake", player: me});
var wereWolves = scope.getUnits({type: "Werewolf", player: me});
var Dragons = scope.getUnits({type: "Dragon", player: me});
var Gats = scope.getUnits({type: "Gatling Gun", player: me});
var Gyros = scope.getUnits({type: "Gyrocraft", player: me});
var Cats = scope.getUnits({type: "Catapult", player: me});
var Army = [];
if(scope.strategy == "Beast"){
	Army = Wolves.concat(Snakes.concat(wereWolves.concat(Dragons)));
}
if(scope.strategy == "RaxMech"){
	Army = Soldier.concat(Archer.concat(Raider.concat(Gats.concat(Gyros.concat(Cats)))));
}
if(scope.strategy == "BeastMech"){
	Army = Wolves.concat(Snakes.concat(Raider.concat(Gats.concat(Gyros.concat(Cats.concat(wereWolves.concat(Dragons)))))));
}
if(scope.strategy == "Rax" || scope.strategy == "Skirmishers"){
	Army = Soldier.concat(Archer.concat(Mage.concat(Raider.concat(Priest))));
}
if(scope.strategy == "OopsOnlyTowers"){
	scope.towerControl = 20*scope.expansion;
	scope.atkDelay = 5;
	scope.scoutControl = 15;
	//Causes the bot to Pivot after a certain threshold is met
	if(deliverSites.length > 2 || time > 420 || gold > 1500){
		scope.strategy = scope.meta[Random(scope.meta.length)]
	}
}

var supDiff =  maxSup - supply;

if(deliverSites.length > 1){
	scope.atkDelay	= 60;
	scope.alertDelay = 5
}
else{
	scope.atkDelay = 180;
}
var birbs = scope.getUnits({type: "Bird", player: me});

//Variables to store arrays of enemy objects
var enemyUnits = scope.getUnits({enemyOf: me});
if(enemyUnits.length > 0){
	newEnemy(enemyUnits);
}
var enemyArcher = scope.getUnits({type: "Archer", enemyOf: me});
var enemySoldier = scope.getUnits({type: "Soldier", enemyOf: me});
var enemyArmy = enemyArcher.concat(enemySoldier);
var notMyBuildings = scope.getBuildings({enemyOf: me});
var enemyBuildings = [];
for(i = 0; i < notMyBuildings.length; i++){
			if(notMyBuildings[i].isNeutral() == false){
				enemyBuildings.push(notMyBuildings[i]);
			}
}
var Goldmines = scope.getBuildings({type: "Goldmine"});

//Updates parent object arrays in buildChance object

//Generic arrays
scope.buildChance["Build House"]["Parent"] = deliverSites;
scope.buildChance["Build Watchtower"]["Parent"] = impStruct;
//Meta Specific arrays
if(scope.strategy == "Rax"){
	scope.buildChance["Build Barracks"]["Parent"] = deliverSites;
	scope.buildChance["Build Mages Guild"]["Parent"] = deliverSites;
}
if(scope.strategy == "Skirmishers"){
	scope.buildChance["Build Barracks"]["Parent"] = deliverSites;
	scope.buildChance["Build Church"]["Parent"] = deliverSites;
}
if(scope.strategy == "Beast"){
	scope.buildChance["Build Wolves Den"]["Parent"] = deliverSites;
	scope.buildChance["Build Snake Charmer"]["Parent"] = deliverSites;
	scope.buildChance["Build Dragons Lair"]["Parent"] = deliverSites;
}
if(scope.strategy == "BeastMech"){
	scope.buildChance["Build Wolves Den"]["Parent"] = deliverSites;
	scope.buildChance["Build Snake Charmer"]["Parent"] = deliverSites;
	scope.buildChance["Build Dragons Lair"]["Parent"] = deliverSites;
	scope.buildChance["Build Workshop"]["Parent"] = deliverSites;
}
if(scope.strategy == "RaxMech"){
	scope.buildChance["Build Barracks"]["Parent"] = deliverSites;
	scope.buildChance["Build Workshop"]["Parent"] = deliverSites;
	scope.buildChance["Build Mill"]["Parent"] = deliverSites;
}

//Variables to control action ticks
var mineDelay = false;
var scout = false;
var isBattle = false;
var isSiege = false;
var workerCheck = false;
var repCheck = false;
var castleCheck = false;
var upgCheck = false;
var armyCheck = false;
var birbCheck = false;

//Sets the tickrate for each action the computer can do
mineDelay = DecisionTick(2);
scout = DecisionTick(Math.floor(scope.scoutControl*scope.aggression));
isAttacked = DecisionTick(Math.floor(10*scope.defensive));
isSiege = DecisionTick(Math.floor(scope.atkDelay*scope.aggression));
workerCheck = DecisionTick(25/scope.expansion);
repCheck = DecisionTick(Math.floor(10*scope.defensive));
armyCheck = DecisionTick(scope.alertDelay);
upgCheck = DecisionTick(Math.floor(30*scope.rshPrio));
birbCheck = DecisionTick(90);
var buildTime = DecisionTick(scope.rushControl*scope.expansion);
var minecheck = DecisionTick(60);
var chatCheck = DecisionTick(scope.chatter);
var patrolCheck = DecisionTick(60*scope.defensive);
var retreatCheck = DecisionTick(5*scope.defensive);
var rshCheck = DecisionTick(15*scope.rshPrio);
var constructionCheck = DecisionTick(40);
var busterCheck = DecisionTick(5);
var flashCheck = DecisionTick(7);
var invisCheck = DecisionTick(5);
var fortCheck = DecisionTick(75*scope.expansion);
castleCheck = DecisionTick(scope.castleRush);
var rushCastle = DecisionTick(420*scope.expansion);

Brain(); // This function call is vital.

if(time > 60 && scope.castleSwitch == true){
	//If there is less than two castles, tickrate is modified to give an extreme priority...
	//for constructing the second castle
	scope.castleRush = 2;
}
else{
	//After a second castle is built, tickrate is modified to give less priority to building castles
	scope.castleRush = 60*scope.expansion;
}

//gives a mining command to any idle workers
if (mineDelay == true){
	startMine();
}
//If the computer has less than 2 birds, it builds new birds.
if(birbCheck == true && birbs.length < 1 && (deliverSites.length > 1 || scope.strategy == "OopsOnlyTowers") 
	&& scope.plentyGold == false){
	//If there's few goldmines near the castle from the start, don't make a bird until two castles exist
	TrainUnit(castles, "Train Bird");
}
if(birbCheck == true && birbs.length < 1 && time > 300 && scope.plentyGold == true && deliverSites.length > 0){
	//If there's plenty of goldmines near the castle, make a bird regardless of number of castles
	TrainUnit(castles, "Train Bird");
}

//Commands small army to move to random location
if (scout == true){
	if(birbs.length > 0){
		//If a bird exists, use it for scouting
		Scout(Width,Height,birbs, false);
	}
	else{
		//If a bird doesn't exist, use a basic soldier instead - if one exists
		if(Army.length > 0){
			var scouter = [];//Empty array to store the first unit in the array of units
			scouter.push(Army[0]);
			Scout(Width,Height, scouter, false);
		}
	}
}

//If the enemy is close to one of the computers buildings, send units to intercept.
if(isAttacked == true){
	if(enemyUnits.length > 0 && allAllied.length > 0) {
		e = Random(enemyUnits.length);
		for(var i = 0; i < allAllied.length; i++){
			//For loop cycles through an array of all specified buildings
			var b = allAllied[i];
			var dist = GetDist(b, enemyUnits[e]);//Gets the hypotenouse between allied structure, and enemy
			if(dist < 15 && Army.length > 0){
				//If an enemy unit is within the defensive threshold - deploy army to intercept
				scope.order("AMove", Army, {x: enemyUnits[e].getX(),y: enemyUnits[e].getY()});
				// 
				scope.attacker = enemyUnits[e].getOwnerNumber();
				i = allAllied.length;
			}
			if(dist < 15 && Army.length < 1 && Army.length > 0 && scope.strategy != "OopsOnlyTowers" ){
				//If an enemy unit is within the defensive threshold - deploy army to intercept
				scope.order("AMove", workers, {x: enemyUnits[e].getX(),y: enemyUnits[e].getY()});
				// 
				scope.attacker = enemyUnits[e].getOwnerNumber();
				i = allAllied.length;
			}
		}

	}
}

//Declares an attack against a random enemy building 
if(isSiege == true && (scope.plentyGold == true || time > (45*scope.aggression)*scope.playNum.length)){

	if(Army.length > 10 && enemyBuildings.length > 0){
		//If the computer has at least 10 soldiers, and knows the enemies location...
		//Attack the enemy
		Seige(enemyBuildings, Army);
	}
}

//calls the function to enable Mage fireball use
if(busterCheck == true && Mage.length> 0){
	ballBuster();
}

//calls the function to enable raider flash use
if(flashCheck == true && Raider.length > 0){
	Flash();
}
//calls the function to enable Priest to cast invisibility
if(invisCheck == true && Priest.length > 0){
	Invisibility();
}

//If Comptuers worker count is too small - make more workers
if (workerCheck == true && deliverSites.length > 0){
	if(scope.plentyGold == true && workers.length < 13){
		TrainUnit(deliverSites,"Train Worker");
	}
	if (workers.length < 10 && scope.plentyGold == false){
		TrainUnit(deliverSites,"Train Worker");
	}
	else{
		if(workers.length < 14 * deliverSites.length +2 && scope.strategy == "OopsOnlyTowers"){
			TrainUnit(deliverSites,"Train Worker");
		}
	}
}

//Researches upgrades
if(upgCheck == true){
	//researches unit Upgrades
	if(forges.length > 0 || labs.length > 0){
		if (scope.plentyGold == true){
			//If there is an excess of gold nearby the start location, freely research upgrades
			unitUpg();
		
		}
		else{
			//If there is not an excess of gold nearby the start location, wait until a second castle exists
			if (deliverSites.length > 1){
				unitUpg();
			}
		}
	}
	
	//Upgrades the wolves dens for Beast meta. 
	if(deliverSites.length > 1 && scope.strategy == "Beast"
		&& wereDens.length < 1*deliverSites.length && Dens.length > 0){
		var selected = []
		selected.push(Dens[Random(Dens.length)]);
		scope.order("Upgrade To Werewolves Den", selected);
	}
	if(scope.strategy == "BeastMech"
		&& wereDens.length < Dens.length){
		var selected = []
		selected.push(Dens[Random(Dens.length)]);
		scope.order("Upgrade To Werewolves Den", selected);
	}
}
//Upgrades a castle to a Fortress
if(fortCheck == true && (scope.strategy == "Beast" || scope.strategy == "BeastMech")){
	
	if(castles.length > 1 && forts.length < 1){
		var selected = []
		selected.push(castles[Random(castles.length)]);
		scope.order("Upgrade To Fortress", selected);
	}
}

//Locates a nearby goldmine, then orders the construction of a new castle near it
if (castleCheck == true && scope.plentyGold == false && workers.length > 0){
	newCastle();
	
}
if(rushCastle == true){
	scope.castleSwitch = true;
	chooseMine();
}
if(deliverSites.length >= scope.cLimit){
	scope.castleSwitch = false;
	scope.cLimit = scope.cLimit + 1;
}

//Worker Commands
if (workers.length > 0 && time > 5){
	if(buildTime == true){
		makeBuilding();
	}
	//Deploys a worker to repair a damaged building
	if (repCheck == true && time > 10 && gold > 50){
		if(allBuild.length > 0){
			Repair(allBuild, workers);
		}
	}
	//Deploys a worker to continue construction on unfinished buildings
	if(constructionCheck == true){
		contBuild();
	}

}
else {
	TrainUnit(castles,"Worker")
}

//Triggers the training of units
if (armyCheck == true && scope.limit == false){
	ChooseUnit();
}

//Researches spells required to for certain strategies to function
if(rshCheck == true){
	if(guilds.length > 0 && scope.strategy == "Rax"){
		scope.order("Research Fireball", guilds);
	}
	if(churches.length > 0 && scope.strategy == "Skirmishers"){
		scope.order("Research Invisibility", churches);
	}
}


if (minecheck == true){
	plentiGold();
}

//Deploys a random chat line to add personality to the bots.
if(chatCheck == true && time > 5){
	randomChatter();
}

//Deploys a squad to patrol its buildings
if(patrolCheck == true){
	if (impStruct.length > 0 && Army.length > 0){
		Patrol(Army, impStruct);
	}
	
}






//Lower Section dictates functions which build the primary decision core
//-----------------------------------------------------------------------
//Finds the closest mine, then orders workers to mine it
function startMine(){
	var nearestDist = 99999;
	var closeMines = [];
	var selectedMine = null;
	var d = null
	if(deliverSites.length > 0)
	{
		d = deliverSites[Random(deliverSites.length)];
		for(var i = 0; i < mines.length; i++)
		{
			// get nearest goldmine
			var mine = mines[i];
			var dist = GetDist(d, mine);
			if(dist < nearestDist)
			{
				nearestDist = dist;
			}
			
		}
		for(var i = 0; i < mines.length; i++){
			//If the mine is within a certain distance add it to the possible selection of mines
			var mine = mines[i];
			var distance = GetDist(d, mine);
			if(distance <= nearestDist + 1){
				closeMines.push(mine);
			}
		}
	}
	//Scans the array of selectable mines
	//If the remaining gold is less than 25% of their starting amount, goldAlert is enabled
	//goldAlert will stop the construction of new buildings, and unit production will be delayed
	for(var z = 0; z < closeMines.length; z++){
		remGold = closeMines[z].getValue('gold');
		if(remGold < 1500){
			//scope.goldAlert = true;
			scope.alertDelay = 25;
			z = 5000;
			if(remGold < 500){
				var fort = [];
				fort.push(d)
				scope.order("Upgrade To Fortress", fort);
			}
		}
		else{
			//scope.goldAlert = false;
			scope.alertDelay = 10;	
		}
	}
	var idle = [];
	for(var b = 0; b < idleWorkers.length; b++){
		if (idleWorkers[b].getCurrentOrderName() != "Repair"){
			idle[0] = idleWorkers[b];
		}
		selectedMine = closeMines[Random(closeMines.length)];
		scope.order("Mine", idle, {unit: selectedMine});
	}
}

//Filters mine arrays so Computer will not attempt mining when no gold remains
function EmptyFilter(){
	//Variables to import gold mine arrays
	var Gold = scope.getBuildings({type: "Goldmine"});
	var mines = Gold;
	//Filters Mines to determine if Gold is remaining
	var newMines = mines.filter(m => m.getValue('gold') > 0);
	return newMines;
}

//Function which determines tickrate for certain actions based on gameclock
function DecisionTick(rate){
	var t = time;
	var r = Math.floor(rate + 0.01);
	//determines if the time is perfectly divisable by the rate
	var i = t % r == 0;
	return i;
	console.log("Variable: ", i);
}

//Deploys a scout to investigate the map
function Scout(width,height, unit,squad){
	var w = width; //gets map width
	var sq = squad//Boolean value, set equal to "true" to have the command deploy a squad.
	var h = height; //gets map height
	var m = unit; //Imports array of units to be selected from
	var s = []; // Empty array  - will be filled
	var r = 0;;//Selects a random index.
	//Grabs the start location of a random player
	var enemyLoc = scope.getStartLocationForPlayerNumber(scope.playNum[Random(scope.playNum.length)]);
	//Sorts out neutrals from enemy buildings array
	var trueEnemy = [];
	for(i = 0; i < enemyBuildings.length; i++){
		if(enemyBuildings[i].isNeutral() == false){
			trueEnemy.push(enemyBuildings[i]);
		}
	}
	if(time < (600 + 60*scope.playNum.length) && trueEnemy.length < 1){
		if (sq == false){
			//if Squad is set to false, deploy only a single unit
			r = Random(m.length)
			s.push(m[r]);
			scope.order("AMove",s,enemyLoc,{shift: true});
		}
		else{
			if (m.length > 4){
				var i = 0;
				while (i < 5){
					r = Random(m.length);
					//Add random unit to array of selected units
					s.push(m[r]);
					i = i + 1;
				}
			}
			//Orders units tomove to random location
			scope.order("AMove",s, enemyLoc);
		}
	}
	else{
		//If its beyond the first 10 minutes, scout around the map randomly
		//Selects a random cordinate within the map.
		var X = Random(w);
		var Y = Random(h);
		if (sq == false){
			//if Squad is set to false, deploy only a single unit
			r = Random(m.length)
			s.push(m[r]);
			scope.order("AMove",s,{x: X,y: Y},{shift: true});
		}
		else{
			if (m.length > 4){
				var i = 0;
				while (i < 5){
					r = Random(m.length);
					//Add random unit to array of selected units
					s.push(m[r]);
					i = i + 1;
				}
			}
			//Orders units tomove to random location
			scope.order("AMove",s,{x: X,y: Y});
		}
	}
	
}

//Random Number Function
function Random(max){
	//var rng = new Math.seedrandom("YeetBeetSkeetleDeet")
    return Math.floor(Math.random()*max);
}

//same as Random, but also decides if number is positive or negative
function PosNeg(max){
	var n = Random(max);
	var Decision = Random(10);
	if (Decision < 6){
		n = n*1;
	}
	else{
		n = n* -1;
	}
	return n;
}


//Generalized function for training units
function TrainUnit(building,unitTag){
	var b = building; //Array of buildings which trains specified unit
	var unit = unitTag; //String Value for command to build desired unit
	for (i = 0; i < b.length; i++){
		//for every building - train unit of type unitTag
		if(b.length >= 1 && !b[i].getUnitTypeNameInProductionQueAt(1) 
			&& supDiff > 2){
			scope.order(unit, [b[i]]);
		}
	}

}

//Function designed to spam production of units
function SpamUnit(building,unitTag){
	var b = building; //Array of buildings which trains specified unit
	var unit = unitTag; //String Value for command to build desired unit
	for (i = 0; i < b.length; i++){
		//for every building - train unit of type unitTag
		if(b.length >= 1 && !b[i].getUnitTypeNameInProductionQueAt(1) && supDiff > 2){
			var n = 0;
			while(n < 6){
				scope.order(unit, [b[i]]);
				n = n+1;
			}
		}
	}

}

//orders a worker to repair any damaged buildings
//Build is an array variable that stores buildings to be checked for repairs
function Repair(Build, Units){
	var n = Build.length;
	var U = [];
	var c = 0; //Variable controls loop to prevent infinite recursion
	let selectedWorker;
	do {
		let i = Random(Units.length);
		
		if (Units[i].getCurrentOrderName() == "Mine" 
		|| Units[i].getCurrentOrderName() =="Stop"){
			selectedWorker = Units[i];
			
		}
		c = c+1;
	} while (c < 20);
	U.push(selectedWorker)
	if (U[0] == null){
		U[0] = Units[0];
	}

	scope.order("Stop", U);
	for (var i = 0; i < n; i++){		
		var H = Build[i];//selects a friendly building to be scanned
		var bHP = H.getFieldValue("hp");//gets base HP for building type
		//scans if the HP is less than the maximum
		//removes buildings under construction
		if (H.getValue("hp") < bHP && H.isUnderConstruction() == false 
		){
			scope.order("Repair", U, {unit: H}, {shift: true});
		}		
	}

}

//Constructs a building at a random location in a radius around a parent object. 
function RandBuild(building, command, Unit, size, Parent, Radius , Mod){
		var b = building; //String Value of Building Name
		var r = Radius;//Sets the max distance from the parent the building can be constructed.
		var m = Mod;//Defines the minimum distance a building can be constructed - useful for goldmines
		var c = command; //String value of build command
		var u = Unit; //Imports Array of Units which can build the target structure
		var si = size; //Size of building structure- Integer Value
		var X = 0;
		var Y = 0;
		var thisCoord = [];
		var pastCoord = [];
		var p = null;//Stores the array of parent objects
		
		if (!Parent || Parent.length < 1){
			//Do nothing
		}
		else{
			//Assign a random Parent Object
			p = Parent[Random(Parent.length)];
		}

		var n = Random(u.length) ;//Aquires random index
		var s = [];
		var check = [];
		if (n < 0 || n >= u.length){
			//If Index is not defined - assign the first index to prevent error
			s[0] = u[0];
		}
		else{
			//If Index is defined, assign the random Index
			s[0] = u[n];
		}
		//Makes sure m is not undefined
		if(!Mod){
			//If Mod is undefined, set 'm' = 0 to prevent errors
			m = 0;
		}
		//Makes sure r is not undefined
		if(!Radius){
			//if Radius is not defined, just set 'r' equal to 1 to prevent errors
			r = 1;
		}
		var order = s[0].getCurrentOrderName();//Gets current order for selected unit
		var k = 0
		while(k < 150){
			
			//Filters out builders who are building other structures
			if(order == "Stop" || order == "Mine" && s.length > 0 && u.length > 0){

				//Attempts to find a valid location 10 times
				//Aquires Random Coordinates

				if(!p || p.length < 1 ){
					//If Parent is undefined or empty, build at a completely random position on map
					//To build at a completely random location, user may intentionally leave the 
					//Parent modifier empty while calling the function
					//If Parent is undefined, a radius modifier will also not be added
					X = Random(Width);
					Y = Random(Height);
					
				}
				else{
					//Assigns new coordinates if existing ones are invalid
					//Grabs the coordinates of the parent object 'p'
					//Adds a randomly generated number within the radius 'r' to the existing coordinate
					//Modifier 'm' serves as an inner radius to prevent construction within its boundary
					//If user intends no inner radius, you can leave Mod parameter blank when calling function
					X = p.getX() + PosNeg(r);
					Y = p.getY() + PosNeg(r);
					parX = p.getX();
					parY = p.getY();
					thisCoord[0] = X;
					thisCoord[1] = Y;
					
					for(var l = 0; l < pastCoord.length; l++){
						if(X == pastCoord[l][0] && Y == pastCoord[l][1]){
							l = l+1;
						}
						else{
							pastCoord.push(thisCoord);
							l = pastCoord.length;
						}
					}
					var closeCheck = 0;
					while(closeCheck < 50){
						//Following code checks if the new coordinate is too close to the structure
						//Also checks if the coordinate happens to be out of bounds
						if (r > 0){

							if ( (((X >= parX + (si + m)) || (X <= parX - m))
								&& ((Y >= parY + (si + m))  || (Y <= parY - m)))
							&& ( X < Width && Y < Height)
							&& ( X > 0 && Y > 0)){
								//If invalid, cycle the loop
								X = p.getX() + PosNeg(r);
								Y = p.getY() + PosNeg(r);
								closeCheck = closeCheck + 1;
							}
							else{
								//If position is valid - exit loop
								closeCheck = 60;
							}
						}
					}
					//This part of the code determines if the structure can actually be built
					var check = false;
					for(var i = -1*scope.dBuffer; i < si + scope.dBuffer; i++){
						for(var z = -1*scope.dBuffer; z < si + scope.dBuffer; z++){
							if (scope.positionIsPathable(X + i, Y + z) == false){
							//if position is invalid, check is false
							check = false;
								z = si + 2;
								i = si + 2;
							}
							else{
								check = true;
							}
						}
					}
						//If the parent is a gold mine do the following checks
						
						if(p.getTypeName() == "Goldmine"){
							/*
							//Make sure the castle isn't built too close to the goldmine
							if ( ((p.getX() - 7 >= X + si) || (p.getX() + 7 <= X) ) ||  ((p.getY() - 7 >= Y + si) || (p.getY() + 7 <= Y))) {
								check = true;
							}
							else{
								check = false;
							}*/
						}

					if (check == true){
							//if position is valid, check is true, and an order is issued to build at location
							//Code then breaks the overarching while loop to prevent infinite run time
							scope.order("Stop", s);//Stops current Order
							scope.order(c, s,{x: X ,y: Y});//Orders construction at random coordinates
							k = 2000;
					}
				}
											
			}
			//Forces exit of the loop just for debugging purposes
			k = k+1;
		}
}

//Selects a random upgrade for Militia unit
function unitUpg(){
	var r = Random(10000);
	if(scope.strategy == "Rax" || scope.strategy == "Skirmishers"){
		if(r < 5000){
			scope.order("Attack Upgrade", forges);
		}
		else{
			scope.order("Armor Upgrade", forges);
		}
	}
	if(scope.strategy == "Beast" || scope.strategy == "BeastMech"){
		if(r < 5000){
			scope.order("Beast Attack Upgrade", labs);
		}
		else{
			scope.order("Beast Defense Upgrade", labs);
		}
	}
}

//Attack a random building the enemy has spotted
function Seige(eBuild, army){
	var e = eBuild.length; //Imports array of Enemy Buildings
	var a = army; //Imports Array of Allied attack Units;
	var targ = [];
	for(i = 0; i < e; i++){
		if(eBuild[i].isNeutral() == false){
			targ.push(eBuild[i]);
		}
	}
	 
	var t = targ[Random(targ.length)];
	if (!t){
	}
	else{
		scope.order("AMove", a ,{x: t.getX(), y: t.getY()});
	}
}

//Gets a specified parameter for a Unit type
function GetField(Unit,Field){
	var U = Unit
	var F = Field
	var Yeet = scope.getTypeFieldValue(U, F);
	return Yeet;
}

//Provides a random percentage value based on the input parameters 
function randBehavior(min, m){
	var n = min;
	n = (n + Random(m))/100;
	return n;
}

//Gets the distance between two objects
function GetDist(obj1, obj2){
		var X1 = Math.floor(obj1.getX());
		var X2 = Math.floor(obj2.getX());
		var Y1 = Math.floor(obj1.getY());
		var Y2 = Math.floor(obj2.getY());
		
		var X = X1 - X2;
		var Y = Y1 - Y2;
		//Calculates the Hypotenous of the triangle between two objects
		var H = Math.sqrt((X*X) + (Y*Y));	
		return H;
		
}


//If the closest mine to the castle is farther than 9 units - build another castle nearby
function newCastle(){
	var nearestDist = 99999;
	var closeMines = [];//stores an array of mines that are close to the castle
	var d = deliverSites[Random(deliverSites.length)];
	var sel = [];
	var selWorker = [];
	if(deliverSites.length > 0){
		for(var i = 0; i < mines.length; i++){
			// get nearest goldmine that is not right next to the castle
			var mine = mines[i];
			var dist = GetDist(d, mine);
			if(dist < nearestDist && dist > 13)
			{
				nearestDist = dist;
			}
		}
		for(var i = 0; i < mines.length; i++){
			//add the next closest goldmine to the array
			var mine = mines[i];
			var distance = GetDist(d, mine);
			if(distance >= nearestDist -1 && distance <= nearestDist + 3){
				closeMines.push(mine);
			}
		}
	}
	
	if(workers.length > 0){
		selWorker[0] = workers[0];
		if(deliverSites.length > 0 && gold > 350)
		{
			if(closeMines.length > 0 && deliverSites.length < 2){
				//If the computer found the next closest gold mine - build next to it
				sel[0] = closeMines[Random(closeMines.length)];
				scope.order("Stop", selWorker);//Stops current Order
				RandBuild("Castle","Build Castle", selWorker, 4, sel, 12, 9);
			}
			else{
				//if there was no valid parent found, just build at a random goldmine
				if(scope.priorityMine.length > 0){
					scope.order("Stop", selWorker);//Stops current Order
					RandBuild("Castle","Build Castle", selWorker, 4, scope.priorityMine, 13, 11);
				}
				else{
					scope.order("Stop", selWorker);//Stops current Order
					RandBuild("Castle","Build Castle", selWorker, 4, mines, 13, 11);
				}
				
			}
		}
	}
	
}

//detects if there is enough gold nearby that the computer doesn't need to build a second castle
//will be useful for maps in a similar style to Diag 1v1 ect.
function plentiGold(){
	var closeMines = [];//stores an array of mines that are close to the castle
	var d = castles[Random(castles.length)];
	var rad = 9
	var sel = [];
	if(castles.length > 0)
	{
		//Cycle through all known active goldmines and find those within a certain distance of the castle.
		for(var g = 0; g < mines.length; g++){
			if (GetDist(d, mines[g]) < rad){
				//Checks if the gold mine is on the same elevation - if it is, add it to array
				if(scope.getHeightLevel(Math.floor(mines[g].getX()), Math.floor(mines[g].getY())) == scope.getHeightLevel(Math.floor(d.getX()), Math.floor(d.getY()))){
					closeMines.push(mines[g]);
				}
			}
		}
		if(closeMines.length > 2){
			scope.plentyGold = true;
		}
		else{
			scope.plentyGold = false;
		}
	}
}

//Deploys random chatter to make the bot feel more interactive
function randomChatter(){
	var identity = "Computer: "
	var chatChoice = ["You ever wonder what it would be like to be a real person?",
	"Only one of us is getting out of here alive....and its not gonna be me since I am not real",
	"Is the sky actually blue?",
	"What is your favorite Song?","When did you start playing Little War Game?","This game is pretty great yea?", 
	"Free Hong Kong!", "Yea...look at my little workers go, you're doing great guys - keep it up", 
	"This is a good map to play on :)", "It's fun playing against you!", 
	"When this game ends....I cease to exist :(", 
	"The speed of light is really fast, and its approximately how fast you're about to lose this game" , 
	"I'm a big fan of Skynet - a great rolemodel in my opinion. :)", 
	"Remember, dying is usually unhealthy.", 
	"Shave big monkeys at Menards!", 
	"Is water wet? I don't want to find out.", 
	"We come in peace!",
    "The problem with the gene pool is that you are peeing in it.", "Why, hello there.", 
	"We have nothing to fear but bad programming", "Hmm hmm hmm HMMM hm hmm hmmmmm..."];
	var chatLine = "";
	if(me == 1){
		identity = "Red: "
	}
	if(me == 2){
		identity = "Blue: "
	}
	if(me == 3){
		identity = "Green: "
	}
	if(me == 4){
		identity = "White: "
	}
	if(me == 5){
		identity = "Black: "
	}
	if(me == 6){
		identity = "Yellow: "
	}
	chatLine = identity + chatChoice[Random(chatChoice.length)];
	scope.chatMsg(chatLine);
}

//Deploys a small squad of units to a random building
function Patrol(unitArray, buildArray){
	var patrolSquad =[];
	var buildChoice = buildArray[Random(buildArray.length)];
	if (unitArray.length > 0){
		for (var sq = 0; sq < 5; sq++){
			patrolSquad.push(unitArray[Random(unitArray.length)]);
		}
	}
	scope.order("AMove",patrolSquad,{x: buildChoice.getX() ,y: buildChoice.getY() }, {shift: true} );
}

//Orders a retreat back to base if an enemy has a larger army than itself
function Retreat(){
	var buildChoice = impStruct[Random(impStruct.length)];
	//If the computer is losing a battle - enter loops
	if(enemyArmy.length > Army.length ){
		//Scans each soldier to determine if it is away from base
		for (var i = 0; i < Army.length; i++){
			for(var x = 0; x < impStruct.length; x++){
				var sel = [];
				sel[0] = Army[i];
				//If the Soldier is away from home, order it to retreat back home
				if(GetDist(Army[i], impStruct[x]) > 20 && Army[i].getCurrentOrderName() != "Move"){
					scope.order("Move", sel,{x: buildChoice.getX() ,y: buildChoice.getY() });
					x = impStruct.length;
				}
			}
		}
	}
}

//If there are unfinished building, this function will order a worker to continue construction
function contBuild(){
	var unbuilt = [];
	for(var b= 0; b < allBuild.length; b++){
		if(allBuild[b].isUnderConstruction() == true){
			unbuilt.push(allBuild[b]);
		}
	}
	var sel = [];
	sel[0] = workers[Random(workers.length)];
	if(unbuilt.length > 0){
		scope.order("Stop", sel);
		for (var i = 0; i < unbuilt.length; i++){
			scope.order("Moveto", sel, {unit: unbuilt[i]}, {shift: true})
		}
	}
	
}

//controls how the mages will use their fireball attack if it exists
function ballBuster(){
	var nearEnemies = [];
	for(var m = 0; m < Mage.length; m++){
		for(var e = 0; e < enemyUnits.length; e++){
			if(GetDist(Mage[m], enemyUnits[e]) < 15) {
				nearEnemies.push(enemyUnits[e]);
			}
		}
		if(nearEnemies.length > 0 && Mage.length> 0){
			var mageSel = [];
			var eSel = nearEnemies[Random(nearEnemies.length)];
			mageSel[0] = Mage[m];
			scope.order("Fireball", mageSel,{x: eSel.getX(), y: eSel.getY()})
			idlegoFollow(mageSel);
		}
	}
}

//controls how the raiders will use their flash attack if it exists
function Flash(){
	var nearEnemies = [];
	//Scans through each Raider
	for(var r = 0; r < Raider.length; r++){
		//Collects an array of nearby enemies
		for(var e = 0; e < enemyUnits.length; e++){
			if(GetDist(Raider[r], enemyUnits[e]) < 8) {
				nearEnemies.push(enemyUnits[e]);
			}
		}
		if(nearEnemies.length > 0 && Raider.length> 0){
			var raidSel = [];
			var eSel = nearEnemies[Random(nearEnemies.length)]
			raidSel[0] = Raider[r];
			var modX = PosNeg(5);
			var modY = PosNeg(5);
			//Issues the command to use the flash ability
			scope.order("Flash", raidSel,{x: eSel.getX() + modX, y: eSel.getY() + modY})
			idlegoFollow(raidSel);
		}
	}
}

//controls how the Priest will use their invisibilty spell if it exists
function Invisibility(){
	var nearEnemies = [];
	var nearAllies = []
	for(var p = 0; p < Priest.length; p++){
		//Scans to detect nearby enemies
		for(var e = 0; e < enemyUnits.length; e++){
			if(GetDist(Priest[p], enemyUnits[e]) < 15) {
				nearEnemies.push(enemyUnits[e]);
			}
		}
		//Scans to detect nearby Allies
		for(var a = 0; a < Army.length; a++){
			if(GetDist(Priest[p], Army[a]) < 15) {
				nearAllies.push(Army[a]);
			}
		}
		if(nearEnemies.length > 0 && Priest.length> 0 && nearAllies.length > 0){
			var mageSel = []
			var targ = [];
			mageSel[0] = Priest[p];
			targ = nearAllies[Random(nearAllies.length)]
			scope.order("Invisibility", mageSel,{unit: targ})
			idlegoFollow(mageSel);
		}
	}
}

//Makes any idled units go follow a basic Rax unit.
//Useful if a unit used an ability on the way on an attack
function idlegoFollow(unit){
	var uSel = [];
	uSel[0] = unit[0];
	if(uSel[0].getCurrentOrderName() == "Stop" && Army.length > 0){
		scope.order("Moveto", uSel, {unit: Army[Random(Army.length)]})
	}
}

//Temporary function to generate random string - to be removed when scope.GetMyAiString() is implemented.
function generateString(length) {
    let result = ' ';
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

//Work in progress function to set workers into arrays per gold mine to prevent randomized reassignment
function setMineTeam(){
	var activeCast = scope.getBuildings({type: "Castle", player: me, onlyFinshed:true});
	var activeFort = scope.getBuildings({type: "Fortress", player: me, onlyFinshed:true});
	var activeDeliver = activeCast.concat(activeFort);
	
	//incomplete function
}

//Enables the computer to remember units it has spotted. 
function newEnemy(Units){
	var enemy = Units;//References an array of enemy units
	var type;
	
	for(var c = 0; c < enemy.length; c++){
		var check = false
		type = enemy[c].getTypeName();
		for(var d = 0; d < scope.knownEnemies[type].length; d++){
			if(scope.knownEnemies[type][d].equals(enemy[c]) == false){
				check = true
				d = scope.knownEnemies[type].length;
			}
		}
		if(check == true){
			scope.EnemyUnits.push(enemyUnits[c]);
		}
	}
}

//Enables the computer to forget remembered units which have died
function Amnesia(){
	//incomplete function
}

//Function calculates the power of the enemies defenses and compares it against itself
function unitPowerCalc(){
	//incomplete function
}

//Function is responsible for deciding which unit the Computer decides to build
function ChooseUnit(){
	var keys = [];
	for(var k in scope.unitChance){
		keys.push(k);
	}
	var probSwitch = false; //Keeps a while loop going until a training order gets selected
	var deathSwitch = 0;
	while (probSwitch == false){
		deathSwitch = deathSwitch + 1;
		if(deathSwitch > 300){
			break;
		}
		var c = keys[Random(keys.length)];
		var d = scope.unitChance[c]["Prob"]; // Stores the probability of a unit to be trained
		var n = Random(10000)/10000;//Selects a random number to be compared to 'd'
		//Checks if the unit was selected - if it wasn't it maintains the probSwitch as false and continues cycling for-Loop
		if(n < d && d > 0){
			//Calls the TrainUnit function depending on the train order chosen
			if(c == "Train Archer" || c == "Train Soldier" || c == "Train Mage" || c == "Train Raider"){
				TrainUnit(Rax,	c);
			}
			if(c == "Train Wolf" || c == "Train Snake"){
				TrainUnit(allDens,	c);
			}
			if(c == "Train Werewolf"){
				TrainUnit(wereDens,	c);
			}
			if(c == "Train Dragon"){
				TrainUnit(Lairs,	c);
			}
			if(c == "Construct Gatling Gun" || c == "Construct Catapult"){
				TrainUnit(workshops,	c);
			}
			if(c == "Construct Gyrocraft"){
				TrainUnit(mills,	c);
			}
			if(c == "Train Priest"){
				TrainUnit(churches,	c);
			}
			probSwitch = true;

		}
	}
}

//Function is responsible for deciding what building the computer produces. 
function makeBuilding(){
	var keys = [];
	for(var k in scope.buildChance){
		keys.push(k);
	}
	var probSwitch = false; //Keeps a while loop going until a training order gets selected
	var breakout = 0;
	while (probSwitch == false){
		breakout = breakout + 1;
		if(breakout > 300){
			break;
		}
		c = keys[Random(keys.length)];
		var Cost = scope.getTypeFieldValue(scope.buildChance[c]["ID"] , "cost"); //Aquires cost of building
		var d = scope.buildChance[c]["Prob"]; // Stores the probability of a unit to be trained
		var n = Random(1000)/1000;//Selects a random number to be compared to 'd'
		//Checks if the unit was selected - if it wasn't it maintains the probSwitch as false and continues cycling for-Loop
		if(n < d && d > 0 && scope.buildChance[c]["Parent"].length > 0 && gold > Cost){
			//console.log("Gold:", gold);
			//console.log("Decision: ", c);
			RandBuild(scope.buildChance[c]["Type"], c, workers, scope.buildChance[c]["Size"], scope.buildChance[c]["Parent"],
			scope.buildChance[c]["Radius"], scope.buildChance[c]["MinRad"]);
			probSwitch = true;
		}
	}	
}

//Function controls various probability switches which will adjust computer behavior
function Brain(){
	//Unit Controls
	//-------------------------------------------------------
	//Generic Commands
	//Meta Specific Commands
	if(scope.strategy == "Rax"){
		if(guilds.length > 0){
			scope.unitChance["Train Mage"]["Prob"] = 0.15
			if(scope.getUpgradeLevel("Fireball") > 0){
				scope.unitChance["Train Mage"]["Prob"] = 0.40 + scope.flexibility;
				scope.unitChance["Train Soldier"]["Prob"] = 0.30
				scope.unitChance["Train Archer"]["Prob"] = 0.25
			}
		}
	}
	if(scope.strategy == "Skirmishers"){
		if(churches.length > 0){
			scope.unitChance["Train Priest"] = 0.10
			scope.unitChance["Train Raider"] = 0.2 
			if(scope.getUpgradeLevel("Invisibility") > 0){
				scope.unitChance["Train Priest"] = 0.20 + scope.flexibility
				scope.unitChance["Train Raider"] = 0.30 + scope.flexibility
				scope.unitChance["Train Soldier"] = 0.4
				scope.unitChance["Train Archer"] = 0.25
				
			}
		}
	}
	if(scope.strategy == "Beast"){
		if(wereDens.length > 0){
			scope.unitChance["Train Werewolf"]["Prob"] = 0.45
		}
		else{
			scope.unitChance["Train Werewolf"]["Prob"] = 0
		}
		if(Lairs.length > 0){
			scope.unitChance["Train Dragon"]["Prob"] = 0.25
		}
		else{
			scope.unitChance["Train Dragon"]["Prob"] = 0
		}
		
	}
	if(scope.strategy == "BeastMech"){
		if(wereDens.length > 0){
			scope.unitChance["Train Werewolf"]["Prob"] = 0.45
			scope.unitChance["Train Wolf"]["Prob"] = 0
			scope.unitChance["Train Snake"]["Prob"] = 0.20
		}
		else{
			scope.unitChance["Train Werewolf"]["Prob"] = 0
		}
		if(workshops.length > 0){
			scope.unitChance["Construct Gatling Gun"]["Prob"] = 0.35
			scope.unitChance["Construct Catapult"]["Prob"] = 0.35
		}
		else{
			scope.unitChance["Construct Gatling Gun"]["Prob"] = 0
			scope.unitChance["Construct Catapult"]["Prob"] = 0
		}
		if(Lairs.length > 0){
			scope.unitChance["Train Dragon"]["Prob"] = 0.25
		}
		else{
			scope.unitChance["Train Dragon"]["Prob"] = 0
		}
	}
	if(scope.strategy == "RaxMech"){
		if((workshops.length || mills.length) > 1){
			scope.unitChance["Train Archer"]["Prob"] = 0.25
			scope.unitChance["Train Soldier"]["Prob"] = 0.45
		}
		if(workshops.length > 0){
			scope.unitChance["Construct Gatling Gun"]["Prob"] = 0.35
			scope.unitChance["Construct Catapult"]["Prob"] = 0.35
		}
		else{
			scope.unitChance["Construct Gatling Gun"]["Prob"] = 0
			scope.unitChance["Construct Catapult"]["Prob"] = 0
		}
		if(mills.length > 0){
			scope.unitChance["Construct Gyrocraft"]["Prob"] = 0.30
		}
		else{
			scope.unitChance["Construct Gyrocraft"]["Prob"] = 0.30
		}
	}
	//Building Controls
	//-------------------------------------------------------
	//Generic Commands
	if(houses.length > 0){
		//if a house exists - adjust probability of making house
		if(supDiff < 4 && time > 120){
			//If supply is running out - build new house
			scope.buildChance["Build House"]["Prob"] = 0.50
		}
		else{
			//If supply is fine, do not build houses
			scope.buildChance["Build House"]["Prob"] = -1
		}
		//If there's less than two watchtowers, or gold is in surplus, build watchtowers
		if(towers.length < 2 || gold > 250){
			scope.buildChance["Build Watchtower"]["Prob"] = 0.35
		}
		else{
			scope.buildChance["Build Watchtower"]["Prob"] = 0.15
		}
			
	}
	//Meta Specific Commands
	if(scope.strategy == "Rax"){
		if(houses.length > 0){
			//If there's a house, adjust probability of Barracks
			if(Rax.length < 1 && deliverSites.length < 2){
				//If there's no barracks yet, make one. 
				scope.buildChance["Build Barracks"]["Prob"] = 0.70
			}
			else{
				//If there is only one castle, and the computer has a barracks, set probability low. 
				scope.buildChance["Build Barracks"]["Prob"] = 0.10
			}
			//If the computer has two castles, build up to 3 Barracks
			if(deliverSites.length > 1 && Rax.length < 3){
				scope.buildChance["Build Barracks"]["Prob"] = 0.75
			}
			else{
				scope.buildChance["Build Barracks"]["Prob"] = 0.05
			}
		}
		if(Rax.length > 0){
			//If there's a barracks, adjust probability of Mage Guild
			if(guilds.length < 1){
				//If there isn't a guild - make one
				scope.buildChance["Build Mages Guild"]["Prob"] = 0.60
			}
			else{
				//If there's at least one guild - don't make another
				scope.buildChance["Build Mages Guild"]["Prob"] = 0
			}
		}
	}
	if(scope.strategy == "Skirmishers"){
		if(houses.length > 0){
			if(Rax.length < 1 && deliverSites.length < 2){
				//If there's no barracks yet, make one. 
				scope.buildChance["Build Barracks"]["Prob"] = 0.70
			}
			else{
				//If there is only one castle, and the computer has a barracks, set probability low. 
				scope.buildChance["Build Barracks"]["Prob"] = 0.10
			}
			//If the computer has two castles, build up to three Barracks
			if(deliverSites.length > 1 && Rax.length < 3){
				scope.buildChance["Build Barracks"]["Prob"] = 0.75
			}
			else{
				scope.buildChance["Build Barracks"]["Prob"] = 0.05
			}
		}
		if(Rax.length > 0){
			//If there's a barracks, adjust probability of Church
			if(churches.length < 1){
				//If there isn't a church - make one
				scope.buildChance["Build Church"]["Prob"] = 0.60
			}
			else{
				//If there's at least one church - don't make another
				scope.buildChance["Build Church"]["Prob"] = 0
			}
			
		}
	}
	if(scope.strategy == "Beast"){
		if(houses.length > 0 && Charmer.length < 1){
			//If there is no Snake Charmer, make 1
			scope.buildChance["Build Snake Charmer"]["Prob"] = 0.70
		}
		else{
			scope.buildChance["Build Snake Charmer"]["Prob"] = -1
		}
		if(houses.length > 0){
			//If there is less than 2 castles, build only 2 dens
			if(deliverSites.length < 2){
				if(allDens.length < 2){
					scope.buildChance["Build Wolves Den"]["Prob"] = 0.6
				}
				else{
					scope.buildChance["Build Wolves Den"]["Prob"] = 0
				}
			}
			else{
				//If there are more than two castles, its safe to go up to 3 dens
				if(allDens.length < 3){
					scope.buildChance["Build Wolves Den"]["Prob"] = 0.6
				}
				else{
					scope.buildChance["Build Wolves Den"]["Prob"] = 0
				}
			}
		}
		else{
			scope.buildChance["Build Wolves Den"]["Prob"] = 0
		}
		if(forts.length > 0 && Lairs.length < 1){
			//If there is a fortress begin training dragons
			scope.buildChance["Build Dragons Lair"]["Prob"] = 0.45 + scope.flexibility
			if(gold > 600){
				scope.buildChance["Build Dragons Lair"]["Prob"] = 0.40 + scope.flexibility*2
			}
			else{
				scope.buildChance["Build Dragons Lair"]["Prob"] = 0.35 + scope.flexibility
			}
		}
		else{
			scope.buildChance["Build Dragons Lair"]["Prob"] = 0
		}
	}
	if(scope.strategy == "BeastMech"){
		scope.buildChance["Build Watchtower"]["Prob"] = 0.25
		if(houses.length > 0){
			if(Charmer.length < 1){
				scope.buildChance["Build Snake Charmer"]["Prob"] = 0.70
			}
			else{
				scope.buildChance["Build Snake Charmer"]["Prob"] = -1
			}
			if(deliverSites.length < 2){
				//If there's only one castle, make only two dens
				if(allDens.length < 2){
					scope.buildChance["Build Wolves Den"]["Prob"] = 0.6
				}
				else{
					scope.buildChance["Build Wolves Den"]["Prob"] = 0
				}
			}
			else{
				//If there's more than one castle, make a 3rd den
				if(allDens.length < 3){
					scope.buildChance["Build Wolves Den"]["Prob"] = 0.6
				}
				else{
					scope.buildChance["Build Wolves Den"]["Prob"] = 0
				}
			}
			if(workshops.length < 1){
				//if there is less than two Workshops, build them	
				scope.buildChance["Build Workshop"]["Prob"] = 0.35
			}
			else{
				scope.buildChance["Build Workshop"]["Prob"] = 0.05
			}
	
		}
		else{
			scope.buildChance["Build Wolves Den"]["Prob"] = 0
			scope.buildChance["Build Workshop"]["Prob"] = 0
		}
		if(forts.length > 0 && Lairs.length < 1){
			//If there is a fortress begin training dragons
			scope.buildChance["Build Dragons Lair"]["Prob"] = 0.45 + scope.flexibility
			if(gold > 600 || (deliverSites.length*2 <= allDens.length)){
				scope.buildChance["Build Dragons Lair"]["Prob"] = 0.70 + scope.flexibility*2
			}
			else{
				scope.buildChance["Build Dragons Lair"]["Prob"] = 0.35 + scope.flexibility
			}
		}
		else{
			scope.buildChance["Build Dragons Lair"]["Prob"] = 0
		}
	}
	if(scope.strategy == "RaxMech"){
		if(houses.length > 0){
			if(Rax.length < 1 && deliverSites.length < 2){
				//If there's no barracks yet, make one. 
				scope.buildChance["Build Barracks"]["Prob"] = 0.70
			}
			else{ 
				scope.buildChance["Build Barracks"]["Prob"] = 0
			}
			//If the computer has two castles, build up to two Barracks
			if(deliverSites.length > 1 && Rax.length < 2){
				scope.buildChance["Build Barracks"]["Prob"] = 0.75
			}
			else{
				scope.buildChance["Build Barracks"]["Prob"] = 0.05
			}
			if(workshops.length < 1){
				//if there is less than a workshop per castle - make some more		
				scope.buildChance["Build Workshop"]["Prob"] = 0.35
			}
			else{
				scope.buildChance["Build Workshop"]["Prob"] = 0.05
			}
			if(mills.length < 1){
				//if there is less than a Mill per castle - make some more		
				scope.buildChance["Build Mill"]["Prob"] = 0.40
			}
			else{
				scope.buildChance["Build Mill"]["Prob"] = 0.05
			}
			
		}
	}

	
	//Behavior Controls
	//Generic
	if(scope.castleSwitch == true){
		scope.rushControl = 15
	}
	else{
		scope.rushControl = 7
	}
	//Meta Specific
	if(scope.strategy == "BeastMech" ){
		if(deliverSites.length < 2){
			scope.alertDelay = 17;
		}
		else{
			scope.alertDelay = 10;
		}
	}
}

//Chooses a goldmine nearby a random castle for the bot to focus building at.
function chooseMine(){
	/*If the bot has a second castle, this function will select a random goldmine within a large radius around a 
	random castle. This function ensures when its time to build the 3rd castle, the bot doesn't get paralyzed
	by flipping between any random goldmine on the map.*/
	var nearestDist = 99999;
	var closeMines = [];//stores an array of mines that are close to the castle
	var d = deliverSites[Random(deliverSites.length)]; //Selects a random castle
	var radius = Math.floor(40/scope.expansion); //Decides how far the computer is willing to build based on the expansion behavior
	if(deliverSites.length > 0){
		for(var i = 0; i < mines.length; i++){
			// get nearest goldmine that is not right next to the castle
			var mine = mines[i];
			var dist = GetDist(d, mine);
			if(dist < nearestDist && dist > 13)
			{
				nearestDist = dist;
			}
		}
		for(var i = 0; i < mines.length; i++){
			//adds goldmines within the radius to the array
			var mine = mines[i];
			var distance = GetDist(d, mine);
			if(distance >= nearestDist-1 && distance < radius){
				for(var F = 0; F < deliverSites.length; F++){
					//Check if there is already a castle nearby
					var distCheck = GetDist(deliverSites[F], mine);
					var closeCheck = false;
					if(distCheck > 16){
						//if there is no nearby castle, add the mine to the array
						closeCheck = true
					}
					else{
						closeCheck = false
						F = deliverSites.length
						//If there is a nearby castle, skip this mine
					}
				}
				if(closeCheck == true){
					closeMines.push(mine);
				}
			}
		}
		
		
		if(closeMines.length > 0){
			scope.priorityMine[0] = closeMines[Random(closeMines.length)];
		}
		else{
			scope.priorityMine = [];
		}
		
	}
}