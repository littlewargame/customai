//BrutalDefault - a LWG AI created by Brutalitywarlord
//This Variant of the Ai works only for default maps
//Its behavior can vary by slight margins dependant on modifiers determined from the start of the gameclock
//As a result of increased dependancy on RNG - this bot is more versatile, and variable in its behavior
//Than the current default AI for LWG - although this current iteration still struggles to defeat the current model.

//Initialization scope - sets variables for use in behavioural augmentations
if(!scope.initialized){
	//generates a randomized multiplier to determine variable behavior in the computer
	scope.meta = ["Rax","Skirmishers","Beast","RaxMech", "BeastMech"];
	scope.goldAlert = false; //Will stop building structures if goldmine running empty - prioritizes a new castle. 
	scope.castPrio = false; //Determines if the bot avoids building anything before 2nd castle is built
	scope.strategy = scope.meta[Random(scope.meta.length)]; //Determines the variant of the meta the bot will use. 
	
	scope.aggression = randBehavior(50, 101);//Controls the interval for aggresive actions
	scope.frugal = randBehavior(100, 26);//Controls how much money the Computer wants to save
	scope.expansion = randBehavior(50, 101);//Controls the interval for most building construction
	scope.defensive = randBehavior(30, 121);//Controls interval for defensive actions
	scope.rshPrio = randBehavior(10, 141);//Controls how often the computer will research new technology
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
	if(prioChoice >= 70){
		scope.castPrio = true;
	}
	
	scope.alertDelay = 10;

	//Logs all the behavioral variables in the console.
	// console.log("Player: ", scope.getMyPlayerNumber(), "I am Malfizar's AI");
	console.log("Meta: ", scope.strategy);
	console.log("------------------");

	//scope.chatMsg("I am BrutalAI")

	scope.attacker = null;

	scope.limit = false;
	scope.initialized = true;
	
}




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
var supDiff = maxSup - supply;




//variables to store allied Buildings
var allBuild = scope.getBuildings({player: me})
var castles = scope.getBuildings({type: "Castle", player: me});
var forts = scope.getBuildings({type: "Fortress", player: me});
var deliverSites = castles.concat(forts);
var houses = scope.getBuildings({type: "House", player: me});
var towers = scope.getBuildings({type: "Watchtower", player: me});
var Rax = scope.getBuildings({type: "Barracks", player: me});
var forges = scope.getBuildings({type: "Forge", player: me});
var labs = scope.getBuildings({type: "Animal Testing Lab", player: me});
var guilds = scope.getBuildings({type: "Mages Guild", player: me});
var churches = scope.getBuildings({type: "Church", player: me});
var Dens = scope.getBuildings({type: "Wolves Den", player: me});
var wereDens = scope.getBuildings({type: "Werewolves Den", player: me});
var Lairs = scope.getBuildings({type: "Dragons Lair", player: me});
var Charmer = scope.getBuildings({type: "Snake Charmer", player: me});
var workshops = scope.getBuildings({type: "Workshop", player: me});
var mills = scope.getBuildings({type: "Mill", player: me});
var advWkShops = scope.getBuildings({type: "Advanced Workshop", player: me});
var impStruct = castles.concat(houses.concat(towers.concat(Rax.concat(Dens.concat(workshops.concat(mills))))));
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
	Army = Wolves.concat(Snakes.concat(Raider.concat(Gats.concat(Gyros.concat(Cats)))));
}
if(scope.strategy == "Rax" || scope.strategy == "Skirmishers"){
	Army = Soldier.concat(Archer.concat(Mage.concat(Raider.concat(Priest))));
}


var birbs = scope.getUnits({type: "Bird", player: me});

//Variables to store arrays of enemy objects
var enemyUnits = scope.getUnits({enemyOf: me});
var enemyArcher = scope.getUnits({type: "Archer", enemyOf: me});
var enemySoldier = scope.getUnits({type: "Soldier", enemyOf: me});
var enemyArmy = enemyArcher.concat(enemySoldier);
var enemyBuildings = scope.getBuildings({enemyOf: me});
var Goldmines = scope.getBuildings({type: "Goldmine"});

//Variables to control action ticks
var mineDelay = false;
var scout = false;
var isBattle = false;
var isSiege = false;
var towerBuild = false;
var workerCheck = false;
var repCheck = false;
var houseCheck = false;
var castleCheck = false;
var upgCheck = false;
var raxCheck = false;
var armyCheck = false;
var birbCheck = false;
var forgeCheck = false;

//Sets the tickrate for each action the computer can do
mineDelay = DecisionTick(2);
scout = DecisionTick(Math.floor(60*scope.aggression));
isBattle = DecisionTick(Math.floor(10*scope.defensive));
isSiege = DecisionTick(Math.floor(120*scope.aggression));
towerBuild = DecisionTick(Math.floor(50*scope.expansion));
workerCheck = DecisionTick(25/scope.expansion);
repCheck = DecisionTick(Math.floor(15*scope.defensive));
houseCheck = DecisionTick(Math.floor(20*scope.expansion));
raxCheck = DecisionTick(Math.floor(25*scope.expansion));
armyCheck = DecisionTick(scope.alertDelay);
upgCheck = DecisionTick(Math.floor(60*scope.rshPrio));
birbCheck = DecisionTick(60);
forgeCheck = DecisionTick(Math.floor(60*scope.expansion));
var minecheck = DecisionTick(60);
var chatCheck = DecisionTick(scope.chatter);
var patrolCheck = DecisionTick(60*scope.defensive);
var retreatCheck = DecisionTick(5*scope.defensive);
var guildCheck = DecisionTick(40*scope.expansion);
var rshCheck = DecisionTick(30*scope.rshPrio);
var constructionCheck = DecisionTick(60);
var busterCheck = DecisionTick(5);
var flashCheck = DecisionTick(7);
var invisCheck = DecisionTick(5);
var churchCheck = DecisionTick(40*scope.expansion);
var charmCheck = DecisionTick(20*scope.expansion);
var lairCheck = DecisionTick(45*scope.expansion);

if(deliverSites.length < 2 && time > 60){
	//If there is less than two castles, tickrate is modified to give an extreme priority...
	//for constructing the second castle
	castleCheck = DecisionTick(5);
}
else{
	//After a second castle is built, tickrate is modified to give less priority to building castles
	castleCheck = DecisionTick(60* scope.expansion);
}

//gives a mining command to any idle workers
if (mineDelay == true){
	startMine();
}
//If the computer has less than 2 birds, it builds new birds.
if(birbCheck == true && birbs.length < 1 && castles.length > 1 && scope.plentyGold == false){
	//If there's few goldmines near the castle from the start, don't make a bird until two castles exist
	TrainUnit(castles, "Train Bird");
}
if(birbCheck == true && birbs.length < 1 && time > 300 && scope.plentyGold == true){
	//If there's plenty of goldmines near the castle, make a bird regardless of number of castles
	TrainUnit(castles, "Train Bird");
}

//Commands small army to move to random location
if (scout == true && time > 60*scope.aggression){
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
if(isBattle == true){
	if(enemyUnits.length > 0 && allAllied.length > 0 && Army.length > 0) {
		e = Random(enemyUnits.length);
		for(var i = 0; i < allAllied.length; i++){
			//For loop cycles through an array of all specified buildings
			var b = allAllied[i];
			var dist = GetDist(b, enemyUnits[e]);//Gets the hypotenouse between allied structure, and enemy
			if(dist < 15){
				//If an enemy unit is within the defensive threshold - deploy army to intercept
				scope.order("AMove", Army, {x: enemyUnits[e].getX(),y: enemyUnits[e].getY()});
				//defenseQuips();
				scope.attacker = enemyUnits[e].getOwnerNumber();
				i = allAllied.length;
			}
		}
	}
}
//Declares an attack against a random enemy building 
if(isSiege == true && (scope.plentyGold == true || time > (30*scope.aggression)*scope.playNum.length)){
	if(Army.length > 10){
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
//calls the function to enable Mage fireball use
if(invisCheck == true && Priest.length > 0){
	Invisibility();
}

//If Comptuers worker count is too small - make more workers
if (workerCheck == true && time > 70){
	if(scope.plentyGold == true && workers.length < 13){
		TrainUnit(deliverSites,"Train Worker");
	}
	if (workers.length < 10 && scope.plentyGold == false){
		TrainUnit(deliverSites,"Train Worker");
	}
	if (workers.length < 7 * deliverSites.length){
		//Will maintain a supply 7 workers per castle built
		//This only really takes effect after a second castle has been built
		TrainUnit(deliverSites,"Train Worker");
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
			if (castles.length > 1){
				unitUpg();
			}
		}
	}
	
	//Upgrades the wolves dens for Beast meta. 
	if(castles.length > 1 && scope.strategy == "Beast" && wereDens.length < 1
	&& Dens.length > 0){
		var selected = []
		selected.push(Dens[Random(Dens.length)]);
		scope.order("Upgrade To Werewolves Den", selected);
	}
	//Upgrades a castle to a Fortress
	if(castles.length > 1){
		var selected = []
		selected.push(castles[Random(castles.length)]);
		scope.order("Upgrade To Fortress", selected);
	}
	
}


//Locates a nearby goldmine, then orders the construction of a new castle near it
if (castleCheck == true && scope.plentyGold == false && workers.length > 0){
	newCastle();
}

//Worker Commands
if (workers.length > 0 && time > 5 && scope.goldAlert == false){
	
	//Deploys a worker to produce a House
	if(houseCheck == true && (scope.castPrio == false || castles.length > 1) && maxSup < 150){
		//If there is no house, construct a house.
		//If the computer gets within 3 supply of its maximum, build a house
		if(houses.length < 1 || (supDiff <= 3 && time > 90)){
			RandBuild("House","Build House", workers, 3, castles, 14, 5);
		}
	}
	//Deploys Workers to build either a Den or a Barracks
	if(raxCheck == true){
		//Barracks
		if((scope.strategy == "Rax" || scope.strategy == "Skirmishers") && Rax.length < deliverSites.length*2){
			RandBuild("Barracks","Build Barracks", workers, 3, castles, 12, 4);
		}
		if(scope.strategy == "RaxMech" && Rax.length < (deliverSites.length + workshops.length)){
			RandBuild("Barracks","Build Barracks", workers, 3, castles, 12, 4);
		}
		//Dens
		if((scope.strategy == "Beast") && Dens.length + wereDens.length < deliverSites.length*2){
			RandBuild("Wolves Den","Build Wolves Den", workers, 3, castles, 12, 4);
		}
		if(scope.strategy == "BeastMech" && Dens.length < (deliverSites.length + workshops.length)){
			RandBuild("Wolves Den","Build Wolves Den", workers, 3, castles, 12, 4);
		}
	}
	//Deploys a worker to construct a Workshop
	if(raxCheck == true && (scope.strategy == "RaxMech" || scope.strategy == "BeastMech")
	&& (workshops.length < castles.length || workshops.length < 1)){
		RandBuild("Workshop","Build Workshop", workers, 4, castles, 14, 7);
	}
	//Deploys a worker to construct a Mill
	if(raxCheck == true && (scope.strategy == "RaxMech")
	&& (mills.length < castles.length || mills.length < 1)){
		RandBuild("Mill","Build Mill", workers, 3, castles, 12, 7);
	}
	//Deploys a worker to build a snake charmer
	if(charmCheck == true && scope.strategy == "Beast" && Charmer.length < 1){
		RandBuild("Snake Charmer","Build Snake Charmer", workers, 3, castles, 10);
	}
	if(lairCheck == true && Lairs.length < 1 && forts.length > 0
	&& (scope.strategy == "Beast" || scope.strategy == "BeastMech")){
		RandBuild("Dragons lair","Build Dragons Lair", workers, 3, castles, 14);
	}
	//Deploys a worker to construct a Mages Guild
	if(guildCheck == true && scope.strategy == "Rax" && guilds.length < 1 && Rax.length > 0){
		RandBuild("Mages Guild","Build Mages Guild", workers, 3, castles, 10);
	}
	//Deploys a worker to construct a Church.
	if(churchCheck == true && scope.strategy == "Skirmishers" && churches.length < 1 && Rax.length > 0){
		RandBuild("Church","Build Church", workers, 3, castles, 10);
	}
	//Deploys a worker to construct a Forge
	if(forgeCheck == true && (time > scope.delay[1] || scope.plentyGold == true)){
		if((scope.strategy == "Rax" || scope.strategy == "Skirmishers")&& forges.length < 1){
			RandBuild("Forge","Build Forge", workers, 3, castles, 16, 7);
		}
		if((scope.strategy == "Beast" || scope.strategy == "BeastMech")&& forges.length < 1){
			RandBuild("Animal Testing Lab","Build Animal Testing Lab", workers, 3, castles, 16, 7);
		}
	}
	//Deploys a worker to construct a Advanced Workshop
	//Deploys a worker to construct a watchtower
	if (towerBuild == true && Rax.length > 1 && castles.length < 2 && towers.length < 1 && scope.plentyGold == false){
		RandBuild("Watchtower","Build Watchtower", workers, 2, impStruct, 10,3);
		//This statement will only run if there is a Barracks built, and there is less than 2 castles
	}
	if ((towerBuild == true  && castles.length > 1) || (towerBuild == true  && scope.plentyGold == true)){
		RandBuild("Watchtower","Build Watchtower", workers, 2, impStruct, 10,3);
		//If there is more than 1 castle, or the map has an excess of gold nearby the starting castle, 
		//Freely build towers when possible during a set interval. 
	}

	//Deploys a worker to repair a damaged building
	if (repCheck == true && time > 10 && Army.length > 4){
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
if (armyCheck == true && scope.plentyGold == false && scope.limit == false){
	var choice = Random(1000);//Generates a random number to act as a method of choosing a unit to build
	if(scope.strategy == "Rax"){
		if(guilds.length > 0){
			if (choice < 450 && choice > 100){
				//Trains an Archer 35% of the time
				TrainUnit(Rax, "Train Archer");
			}
			if(choice < 100){
				//Trains an Mage 10% of the time
				TrainUnit(Rax, "Train Mage");
			}
			if(choice > 450){
				//Trains an Soldier 55% of the time
				TrainUnit(Rax, "Train Soldier");
			}
		}
		else{
			if (choice < 400){
				//Trains an Archer 35% of the time
				TrainUnit(Rax, "Train Archer");
			}
			else{
				//Trains an Soldier 65% of the time
				TrainUnit(Rax, "Train Soldier");
			}
		}
	}
	if(scope.strategy == "Skirmishers"){
		if(churches.length > 0){
			if (choice < 500 && choice > 200){
				//Trains an Archer 30% of the time
				TrainUnit(Rax, "Train Archer");
			}
			if(choice > 500){
				//Trains an Soldier 50% of the time
				TrainUnit(Rax, "Train Soldier");
			}
			if(choice < 100){
				//Trains an Priest 10% of the time
				TrainUnit(churches, "Train Priest");
			}
			if(choice > 100 && choice < 200){
				//Trains a Raider 10% of the time
				TrainUnit(Rax, "Train Raider");
			}
			
		}
		else{
			if (choice < 400 && choice > 100){
				//Trains an Archer 30% of the time
				TrainUnit(Rax, "Train Archer");
			}
			if(choice > 400){
				//Trains an Soldier 60% of the time
				TrainUnit(Rax, "Train Soldier");
			}
			if(choice < 100){
				TrainUnit(Rax, "Train Raider");
			}
		}
	}
	if(scope.strategy == "Beast"){
		if(Charmer.length > 0){
			if(choice <= 350){
				TrainUnit(Dens, "Train Snake");
			}
			if(choice > 350 && choice <= 800 && gold > 220){
				if(wereDens.length > 0){
					TrainUnit(wereDens, "Train Werewolf");
				}
				else{
					TrainUnit(Dens, "Train Wolf");
				}
			}
			if(choice > 800){
				if(Lairs.length > 0){
					TrainUnit(Lairs, "Train Dragon");
				}
				else{
					TrainUnit(Dens, "Train Wolf");
				}
			}
		}
		else{
			TrainUnit(Dens, "Train Wolf");
		}
	}
	if(scope.strategy == "RaxMech"){
		if(mills.length > 0){
			TrainUnit(mills, "Construct Gyrocraft");
		}
		if(choice < 250){
			TrainUnit(Rax, "Train Raider");
		}
		if(choice > 250 && choice < 350){
			TrainUnit(Rax, "Train Archer");
		}
		if(choice > 350){
			TrainUnit(Rax, "Train Soldier");
		}
				if(workshops.length > 0){
			if(choice < 600){
				TrainUnit(workshops, "Construct Gatling Gun");
			}
			else{
				TrainUnit(workshops, "Construct Catapult");
			}
			
		}
	}
	if(scope.strategy == "BeastMech"){
		if(choice < 300){
			TrainUnit(Dens, "Train Snake");
		}
		if(choice > 300){
			TrainUnit(Dens, "Train Wolf");
		}
		if(workshops.length > 0){
			if(choice < 600){
				TrainUnit(workshops, "Construct Gatling Gun");
			}
			else{
				TrainUnit(workshops, "Construct Catapult");
			}
			
		}
		if(Lairs.length > 0 && choice > 700){
			TrainUnit(Lairs, "Train Dragon");
		}

	}
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
	if(time < (300 + 60*scope.playNum.length) && trueEnemy.length < 1){
		//If the game is within the first 10 minutes, scout a random player's start location
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

//Random Number Function - Note: Selection range begins at 0, and ends at max - 1
function Random(max){
	return scope.getRandomNumber(0, max - 1);
}

//same as Random, but also decides if number is positive or negative
function PosNeg(max){
	var n = Random(max);
	var Decision = Random(1000);
	if (Decision < 500){
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
			&& supDiff > 1){
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
		if(b.length >= 1 && !b[i].getUnitTypeNameInProductionQueAt(1)){
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
	var c = 0;//Variable controls loop to prevent infinite recursion
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
		
		if (!Parent || Parent.length == 0){
			//Do nothing
		}
		else{
			//Assign a random Parent Object
			p = Parent[Random(Parent.length)];
		}

		var n = Random(u.length) ;//Aquires random index
		var s = [];
		var check = [];
		var Cost = scope.getTypeFieldValue(b,"cost")*scope.frugal;//Aquires cost of building
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
		while(k < 50){
			
			//Filters out builders who are building other structures
			if(order == "Stop" || order == "Mine" && s.length > 0 && u.length > 0){

				//Attempts to find a valid location 10 times
				//Aquires Random Coordinates

				if(!Parent || Parent.length < 1 ){
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
					if(gold >= Cost){
						//scans the provided coordinates to determine if position is valid.
						var check = false;
						for(var i = 0; i < si; i++){
							for(var z = 0; z < si; z++){
								if (scope.positionIsPathable(X + i, Y + z) == false){
									//if position is invalid, check is false
									check = false;
										z = si;
										i = si;
								}
								else{
									check = true;
								}
							}			
						}
								
						if (check == true){
							//if position is valid, check is true, and an order is issued to build at location
								//Code then breaks the overarching while loop to prevent infinite run time
								
								scope.order("Stop", s);//Stops current Order
								scope.order(c, s,{x: X ,y: Y});//Orders construction at random coordinates
								k = 60;
						}
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
	attackQuips();
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
		var X1 = obj1.getX();
		var X2 = obj2.getX();
		var Y1 = obj1.getY();
		var Y2 = obj2.getY();
		
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
	for(var i = 0; i < mines.length; i++){
		// get nearest goldmine that is not right next to the castle
		var mine = mines[i];
		var dist = GetDist(d, mine);
		if(dist < nearestDist && dist > 12)
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
	if(castles.length > 0)
	{
		if(closeMines.length > 0){
			//If the computer found the next closest gold mine - build next to it
			sel[0] = closeMines[Random(closeMines.length)];
			RandBuild("Castle","Build Castle", workers, 4, sel, 12, 9);
		}
		else{
			//if there was no valid parent found, just build at a random goldmine
			RandBuild("Castle","Build Castle", workers, 4, mines, 12, 9);
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
				if(scope.getHeightLevel(mines[g].getX(), mines[g].getY()) == scope.getHeightLevel(d.getX(), d.getY())){
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

//Sends a preset message related to defense
function defenseQuips(){
	var identity = "Computer: "
	var chatChoice = ["Cowabunga it is", "Please go away", "You're not being very friendly right now", 
	"If you don't get away from my buildings...I am going to rip off your head and shove excrement down your neck"];
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
	//scope.chatMsg(chatLine);
}
//Sends a preset message related to Attack

function attackQuips(){
	var trueEnemy = [];
	for(i = 0; i < enemyBuildings.length; i++){
		if(enemyBuildings[i].isNeutral() == false){
			trueEnemy.push(enemyBuildings[i]);
		}
	}
	var identity = "Computer: "
	var chatChoice = [];
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
	
	if (trueEnemy.length < 1){
		chatChoice = ["You can't hide forever", "I'll find you...", "You could make this easier for both of us if you just surrender"];
		chatLine = identity + chatChoice[Random(chatChoice.length)];
		//scope.chatMsg(chatLine);
	}
}

//Deploys random chatter to make the bot feel more interactive
function randomChatter(){
	var identity = "Computer: "
	var chatChoice =["You ever wonder what it would be like to be a real person?",
	"Only one of us is getting out of here alive....and its not gonna be me since I am not real",
	"Is the sky actually blue?",
	"What is your favorite Song?","When did you start playing Little War Game?","This game is pretty great yea?"
	, "Free Hong Kong!", "Yea...look at my little workers go, you're doing great guys - keep it up"
	, "This is a good map to play on :)"];
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
	//scope.chatMsg(chatLine);
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
