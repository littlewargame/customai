//controller.js
/* See section labeled ouchy.js */
var ai=this;
ai.DEBUG=false;
ai.DEBUGONEPLAYER=false;
ai.DEBUGEARLYCASTLES=false;
ai.me=scope.getMyPlayerNumber();
ai.clock=Math.round(scope.getCurrentGameTimeInSec());
ai.gold=scope.getGold();
ai.enemies=[];
ai.allies=[];
if(ai.DEBUGONEPLAYER&&scope.getArrayOfPlayerNumbers()[0]!=ai.me){
  return;
}
var playernumbers=scope.getArrayOfPlayerNumbers();
for(var i=0;i<playernumbers.length;i++){
    var team=scope.getMyTeamNumber()==scope.getTeamNumber(playernumbers[i])?ai.allies:ai.enemies;
    team[team.length]=playernumbers[i];
}

if(!ai.log){
  ai.log=function(message){
    if(ai.DEBUG){
      console.log(message);
    }
  }
  ai.lastaccountancy=0;
  ai.queuedbuildings=[];
  ai.format = function(text,replacements) {
    for(var i=0;i<replacements.length;i++) {
      text=text.replace("{" + i + "}",replacements[i]);
    }
    return text;
  };
  ai.measuredistance=function(ob1,ob2){
    return ai.distance(
      ob1.getX(),ob1.getY(),ob2.getX(),ob2.getY());
  }
  ai.joinarrays=function(a1,a2){
    var a3=[];
    for(var i=0;i<a1.length;i++){
      a3[a3.length]=a1[i];
    }
    for(var i=0;i<a2.length;i++){
      a3[a3.length]=a2[i];
    }
    return a3;
  }
  ai.sameobject=function(o1,o2){//TODO can now use equals()
    return o1.getX()==o2.getX()&&o1.getY()==o2.getY();
  }
  ai.random=function(max){
    return scope.getRandomNumber(0, max);
  }
  ai.pick=function(pickarray){
    return pickarray[ai.random(pickarray.length-1)];
  }
  ai.getbuildinginfo=function(name){
//     ai.log('Info about: '+name);
    return ai.buildings[name];
  }
  ai.coordinatestoobject=function(x,y){
    return {
      getX:function(){return x;},
      getY:function(){return y;},
    };
  };
  ai.separatebases=function(){
    var bases=ai.mybases();
    var buildingsperbase=[];
    for(var i=0;i<bases.length;i++){
      buildingsperbase[i]=[bases[i]];
    }
    var mybuildings= 
      scope.getBuildings({player:ai.me,});
    for(var i=0;i<mybuildings.length;i++){
      var mybuilding=mybuildings[i];
        if(ai.DEBUG&&bases.length==0){
          throw 'No bases?2';
        }
      var closestbase=ai.findClosest(mybuilding,bases);
      buildingsperbase[bases.indexOf(closestbase)].push(
        mybuilding); 
    }
    return buildingsperbase;
  }
  ai.shuffle=function(array){
    for(var i = array.length - 1; i > 0; i--) {
        var j = scope.getRandomNumber(0, i);
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
  }
}
//TolZ LWG AI.js
/* Heavily modified from http://www.reddit.com/r/Littlewargame/comments/2dhopi/lwg_ai/ */
if(!ai.distance){
  var MINEDIST = 8; //Used to keep buildings from blocking goldmines
  var ATTACKTIME = 120; //Earliest time the AI will attack

  //Returns the ai.distance between (x1, y1) and (x2, y2)
  ai.distance = function(x1, y1, x2, y2) {
          return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  //Takes in an object: object1 and an array of objects: arr1 and finds the closest object in arr1 to object1
  ai.findClosest = function(object1, arr1) {
    if(!arr1||arr1.length==0) 
        return false;
    var objectX = object1.getX();
    var objectY = object1.getY();
    var closestthing = arr1[0];
    var closestDist = ai.distance(objectX, objectY, closestthing.getX(), closestthing.getY());
    for (var i = 1; i < arr1.length; i++) {
            var currentDist = ai.distance(objectX, objectY, arr1[i].getX(), arr1[i].getY());
            if (closestDist >  currentDist) {
                    closestthing = arr1[i];
                    closestDist = currentDist;
            }
    }
    return closestthing;
  }

  //Sort an array based on the ai.distance from an object (arr1[0] is closest, arr1[arr1.length - 1] is furthest)
  ai.sortDistance = function(obj1, arr1) {
          arr1=arr1.slice();
          var objectX = obj1.getX();
          var objectY = obj1.getY();
          var swapsy;
          //Bubble sort
          for (var i = 0; i < arr1.length; i++) {
                  for (var j = 0; j < arr1.length - i - 1; j++) {
                          if (ai.distance(objectX, objectY, arr1[j].getX(), arr1[j].getY()) >  ai.distance(objectX, objectY, arr1[j + 1].getX(), arr1[j + 1].getY())) {
                                  swapsy = arr1[j];
                                  arr1[j] = arr1[j + 1];
                                  arr1[j + 1] = swapsy;
                          }
                  }
          }
          return arr1;
  }

  //Determines if a building can be built in the box with top-left corner (x1,y1) and bottom-right corner (x2,y2)
  ai.isBuildable = function(x1, y1, x2, y2) {
    for (var x = x1; x <= x2; x++) {
      for (var y = y1; y <= y2; y++) {
        try{
          if (
            x<=0||y<=0||
              x>=scope.getMapWidth()||y>=scope.getMapHeight()||
                game.fieldIsBlocked(x,y)
          ) {
            return false;
          }
        }catch(e){
          if(ai.DEBUG&&false){//TODO notified jbs
            ai.log(ai.format(
              'map {0} {1}',
                [scope.getMapWidth(),scope.getMapHeight(),]));
            ai.log(ai.format('fieldIsBlocked {0} {1}',[x,y,]));
            throw e;
          }else return false;
        }
      }
    }
    return true;
  }

  ai.measurebuilding=function(buildingname){
    if (
      buildingname == "House"|| 
      buildingname == "Barracks"|| 
      buildingname == "Mages Guild"|| 
      buildingname == "Dragons Lair"|| 
      buildingname == "Wolves Den"|| 
      buildingname == "Werewolves Den"
    ) {
      return [3,3];
    }
    if (
      buildingname == "Forge"||
      buildingname == "Castle"||
      buildingname == "Church"||
      buildingname == "Fortress"||
      buildingname == "Workshop"||
      buildingname == "Animal Testing Lab"||
      buildingname == "Advanced Workshop"
    ) {
      return [4,4];
    }
    if(buildingname=='Watchtower'){
      return [2,2];
    }
    throw 'unknown building size:'+buildingname;
  }

  ai.findspot=function(axisxp,axisyp,sizex,sizey,buildingname){
    var axisx=axisxp;
    var axisy=axisyp;
    dance:for(var i=0;i<10000;i++){//TODO maybe make bigger?
      var delta=ai.random(1)==0?-1:1;
      if(ai.random(1)==0){
        axisx+=delta;
      }else{
        axisy+=delta;
      }
      if(axisx<0||axisy<0||axisx>=scope.getMapWidth()||axisy>=scope.getMapHeight()){
        return ai.findspot(axisxp,axisyp,sizex,sizey,buildingname);
      }
      
      var emulator=ai.coordinatestoobject(axisx,axisy);
      if(ai.isBuildable(axisx,axisy,axisx+sizex+1,axisy+sizey+1)){
        var mines=scope.getBuildings({type:'Goldmine'})
        if(ai.DEBUG&&mines.length==0){
          throw 'No goldmines?';
        }
        var distancefromclosestmine=
          ai.measuredistance(emulator,ai.findClosest(emulator,
            mines));
        if(ai.DEBUG&&ai.mybases().length==0){
          throw 'No bases?';
        }
        if(
          distancefromclosestmine<=3||
          (
            ai.measuredistance(emulator,
              ai.findClosest(emulator,ai.mybases()))
            <=MINEDIST
            &&
            distancefromclosestmine<=MINEDIST
          )
        ) continue dance;//looks like it's in between mine and base
        if(ai.DEBUG&&scope.getBuildings({player:ai.me}).length==0){
          throw 'No bases?';
        }
        if(
          ai.measuredistance(emulator,ai.findClosest(emulator,
            scope.getBuildings({player:ai.me})))<=4
        ){
          continue dance;//give some space between buildings
        }
        return [axisx,axisy];
      }
    }
    ai.log('Could not place building!');
    return false;
  }  
  ai.findclosestworker=function(c,workers){
    return [ai.findClosest(ai.coordinatestoobject(c.x,c.y),workers),];
  }
  ai.constructBuilding  = function(newBuilding) {
    var myBuildings = scope.getBuildings({player: ai.me});
    var mines = scope.getBuildings({type: "Goldmine"});
    var buildingX = null;
    var buildingY = null;
    var buildingLength = null;
    var buildingWidth = null;
    var newBuildingX = null;
    var newBuildingY = null;
    var newBuildingLength = null;
    var newBuildingWidth = null;
    var closestMine = null;
    var castleMineDiffX = null;
    var castleMineDiffY = null;
    var startX = null;
    var startY = null;
    var endValue = null;
    var buildOrder = null;
    var newsquare=ai.measurebuilding(newBuilding);
    var lastchoice=false;
    var currentchoice=false;
    var bestspot=false;
    var bases=ai.mybases();
    var buildingsperbase=ai.separatebases();
    var smallestbase=Number.MAX_VALUE;
    for(var i=0;i<bases.length;i++){
      var nbuildings=buildingsperbase[i].length;
      if(nbuildings<smallestbase){
        smallestbase=nbuildings;
      }
    }
    var targetbases=[];
    for(var i=0;i<bases.length;i++){
      var nbuildings=buildingsperbase[i].length;
      if(nbuildings==smallestbase){
        targetbases.push(bases[i]);
      }
    }
    var base=ai.pick(targetbases);
    var basex=base.getX();
    var basey=base.getY();
    for(var i=0;i<5;i++){
      var spot=ai.findspot(
          basex,
          basey,
          newsquare[0],
          newsquare[1],
          newBuilding);
      if(
        !bestspot||
        ai.distance(basex,basey,spot[0]+1,spot[1]+1)<=
        ai.distance(basex,basey,bestspot[0]+1,bestspot[y]+1)
      )bestspot=spot;//+1 offset here to reach closer to center of building
    }
    if(!bestspot){
      ai.log('Trying to pick a spot again!');
      ai.constructBuilding(newBuilding);
      return;
    }
    
    buildOrder = "Build " + newBuilding;
    var c={x:bestspot[0],y:bestspot[1],};
    scope.order(buildOrder,
        ai.findclosestworker(
            c,
            scope.getUnits({type: "Worker", order: "Mine", player: ai.me,})
        ),c);
  }

  //Finds a location and orders construction of a castle
  ai.constructCastle = function() {
    var myBuildings = scope.getBuildings({player: ai.me});
    var workers = scope.getUnits({type: "Worker", order: "Mine", player: ai.me});
    var mines = scope.getBuildings({type: "Goldmine"});
    var minesToBuilding = null;
    var allCastles = scope.getBuildings({type: "Castle"});
    var allForts = scope.getBuildings({type: "Fortress"});
    var allCastlesAndForts = allCastles.concat(allForts);
    var dist = null;
    var suitableMine = null;
    var theGoldmine = null;
    var theGoldmineX = null;
    var theGoldmineY = null;
    var newCastleX = null;
    var newCastleY = null;
    var expansions=[];
    for(var i=0;i<mines.length;i++){
        var m=mines[i];
        if(ai.measuredistance(m,ai.findClosest(m,allCastlesAndForts))>=10){
            expansions[expansions.length]=m;
        }
    }
    mines=expansions;//TODO refactor
    mines.sort(function(a, b){
        return ai.measuredistance(ai.startingcastle,a)-ai.measuredistance(ai.startingcastle,b);
    });
    if(ai.mybases().length>mines.length||mines.length==0)
        return
    theGoldmine=mines[ai.mybases().length];
    if (theGoldmine != null) {
      theGoldmineX = parseInt(theGoldmine.getX());
      theGoldmineY = parseInt(theGoldmine.getY());
      //Above
      if (ai.isBuildable(theGoldmineX - 1, theGoldmineY - 9, theGoldmineX + 2, theGoldmineY - 1)) {
              newCastleX = theGoldmineX - 1;
              newCastleY = theGoldmineY - 9;
      } else if (ai.isBuildable(theGoldmineX, theGoldmineY - 9, theGoldmineX + 3, theGoldmineY - 1)) {
              newCastleX = theGoldmineX;
              newCastleY = theGoldmineY - 9;
      }
      //Below
      else if (ai.isBuildable(theGoldmineX - 1, theGoldmineY + 3, theGoldmineX + 2, theGoldmineY + 11)) {
              newCastleX = theGoldmineX - 1;
              newCastleY = theGoldmineY + 8;
      } else if (ai.isBuildable(theGoldmineX, theGoldmineY + 3, theGoldmineX + 3, theGoldmineY + 11)) {
              newCastleX = theGoldmineX;
              newCastleY = theGoldmineY + 8;
      }
      //Left
      else if (ai.isBuildable(theGoldmineX - 9, theGoldmineY - 1, theGoldmineX - 1, theGoldmineY + 2)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY - 1;
      } else if (ai.isBuildable(theGoldmineX - 9, theGoldmineY, theGoldmineX - 1, theGoldmineY + 3)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY;
      }
      //Right
      else if (ai.isBuildable(theGoldmineX + 3, theGoldmineY - 1, theGoldmineX + 11, theGoldmineY + 2)) {
              newCastleX = theGoldmineX - 9;
              newCastleY = theGoldmineY - 1;
      } else if (ai.isBuildable(theGoldmineX + 3, theGoldmineY, theGoldmineX + 11, theGoldmineY + 3)) {
              newCastleX = theGoldmineX + 8;
              newCastleY = theGoldmineY;
      }
      
      if (newCastleX != null) {
        var c={x: newCastleX, y: newCastleY};
        scope.order(
          "Build Castle",ai.findclosestworker(c,workers),c);
      }else ai.log('Could not build castle');
    }
  }
}
//buildings.js
if(!ai.TOWERINCREMENT){
  ai.TOWERINCREMENT=25;
  ai.SMASHDISTANCE=3;
  ai.SLOWDISTANCE=7;
  ai.HEALDISTANCE=5;
  
  ai.buildings={};
  ai.buildings.Wolf={
    name:'Wolf',
    prefix:'Train',
  };
  ai.validatehumanupgrade=function(){
      return scope.getBuildings({player:ai.me,type:ai.buildings.Barracks.name}).length>=1;
  }
  ai.buildings.AttackUpgrade={
    name:'Attack Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgattack',
  };
  ai.buildings.ArmorUpgrade={
    name:'Armor Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgarmor',
  };
  ai.buildings.SpeedUpgrade={
    name:'Speed Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgspeed',
  };
  ai.buildings.RangeUpgrade={
    name:'Range Upgrade',
    validate:ai.validatehumanupgrade,
    id:'upgrange',
  };
  ai.validatemechupgrade=function(){
    return scope.
      getBuildings({player:ai.me,type:'Workshop'}).length>=1;
  }
  ai.buildings.MechAttackUpgrade={
    name:'Mech Attack Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechattack',
  };
  ai.buildings.MechArmorUpgrade={
    name:'Mech Armor Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechdefense',
  };
  ai.buildings.MechSpeedUpgrade={
    name:'Mech Speed Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechspeed',
  };
  ai.buildings.MechRangeUpgrade={
    name:'Mech Range Upgrade',
    validate:ai.validatemechupgrade,
    id:'upgmechrange',
  };
  ai.buildings.BeastAttackUpgrade={
    name:'Beast Attack Upgrade',
    id:'upgbeastattack',
  };
  ai.buildings.BeastArmorUpgrade={
    name:'Beast Armor Upgrade',
    id:'upgbeastdefense',
  };
  ai.buildings.BeastSpeedUpgrade={
    name:'Beast Speed Upgrade',
    id:'upgbeastspeed',
  };
  ai.buildings.BeastRangeUpgrade={
    name:'Beast Range Upgrade',
    id:'upgbeastrange',
    validate:function(){return scope.getBuildings({player:ai.me,type:ai.buildings.Lair.name,}).length>0;},
  };
  ai.buildings.Worker={
    name:'Worker',
    validate:function(){
      if(ai.isexpanding())
          return false;
      if(scope.getUnits({type:'Worker',player:ai.me,}).length>=ai.MAXWORKERS)
          return false;
      if(ai.queuedbuildings.contains(ai.buildings.Fortress))
          return false;
      return true;
    },
    prefix:'Train',
  };
  ai.buildings.Fortress={
    name:'Fortress',
    role:'passive',
    buildingupgrade:true,
    produce:[ai.buildings.Worker,],
    validate:function(){
      /* Fortress are only built on specific conditions:
       * - if the techtree has an explicit step for it (not a pool step)
       * - if we've reached the worker limit
       * - if we're going beast 
       *        TODO not necessarly all future beast builds need a fortress
       */
      if(ai.isbuilding(ai.buildings.Fortress))return false;
      if(ai.techtree[ai.currenttier]==ai.buildings.Fortress||
          scope.getUnits({type:'Worker',player:ai.me,}).length>=ai.MAXWORKERS)
          return true;
      if(//produce 1 Fortress if we're going beast
          (ai.mybases().length>1||ai.neverexpand)
            &&scope.getBuildings({player:ai.me,type:ai.buildings.Fortress.name,}).length==0&&
          (scope.getBuildings({player:ai.me,type:ai.buildings.Den.name,}).length>0||
          scope.getBuildings({player:ai.me,type:ai.buildings.WerewolvesDen.name,}).length>0||
          scope.getBuildings({player:ai.me,type:ai.buildings.Laboratory.name,}).length>0)
      )return true;
      return false;
    }
  };
  ai.buildings.Castle={
    name:'Castle',
    produce:[
      ai.buildings.Fortress,
      ai.buildings.Worker,
    ],
    role:'neutral',
  };
  ai.buildings.WerewolvesDen={
    name:'Werewolves Den',
    id:'werewolvesden',
    role:'active',
    buildingupgrade:true,
    produce:[ai.buildings.Wolf,{
      name:'Werewolf',
      prefix:'Train',
      ability:function(unit){
        var closest=ai.findClosest(unit,ai.groupenemyunits());
        if(closest&&ai.measuredistance(unit,closest)<=ai.SMASHDISTANCE){
          scope.order('Smash',[unit],{});
        }
      }
    },],
    validate:function(){
        if(ai.isbuilding(ai.buildings.WerewolvesDen))return false;
        var nbases=ai.mybases().length;
        if(!ai.neverexpand&&nbases==1)return false;
        if(scope.getBuildings({
            player:ai.me,
            type:ai.buildings.Den.name,
            onlyFinshed:true,
        }).length<=1) return false; //always have 1 den producing wolves
        return (nbases>(scope.getBuildings({
            player:ai.me,
            type:ai.buildings.WerewolvesDen.name,
        }).length+1))||ai.neverexpand;//1 WerewolvesDen per base at most
    },
  };
  var needshouse=function(){
    return scope.getBuildings({player:ai.me,
      type:ai.buildings.House.name,
      onlyFinshed:true,
    }).length>=1;
  };
  var enemyhasdragons=function(){
      var enemies=ai.groupenemyunits();
      for(var i=0;i<enemies.length;i++){
          if(enemies[i].type==ai.buildings.Dragon.name){
              return true;
          }
      }
      return false;
  }
  ai.buildings.Barrack={
    name:'Barracks',
    role:'active',
    produce:[
      {name:'Archer',prefix:'Train',},
      {
        name:'Soldier',
        prefix:'Train',
        validate:function(){return !enemyhasdragons();},
      },
    ],
    validate:needshouse,
  };
  ai.buildings.Den={
    name:'Wolves Den',
    id:'wolvesden',
    role:'active',
    produce:[ai.buildings.WerewolvesDen,ai.buildings.Wolf],
    validate:needshouse,
  };
  function needmoreupgrades(){
      return scope.getBuildings({player:ai.me,type:ai.buildings.Forge.name,}).length+
             scope.getBuildings({player:ai.me,type:ai.buildings.Laboratory.name,}).length
                <2;
  }
  ai.buildings.Forge={
    name:'Forge',
    role:'passive',
    validate:needmoreupgrades,
    produce:[
      ai.buildings.AttackUpgrade,
      ai.buildings.ArmorUpgrade,
      ai.buildings.SpeedUpgrade,
      //ai.buildings.RangeUpgrade, //TODO range > vision is bad
      ai.buildings.MechAttackUpgrade,
      ai.buildings.MechArmorUpgrade,
      ai.buildings.MechSpeedUpgrade,
      //ai.buildings.MechRangeUpgrade, //TODO range > vision is bad
    ],
  };
  ai.buildings.Guild={
    name:'Mages Guild',
    id:'magesguild',
    role:'passive',
    produce:[{
        name:'Mage',
        prefix:'Train',
        ability:function(unit){
            var closest=ai.findClosest(unit,ai.groupenemyunits());
            if(closest){
                if(ai.measuredistance(unit,closest)<=ai.SLOWDISTANCE){
                    scope.order('Slow Field',[unit],{x:closest.getX(),y:closest.getY()});
                }
            }
        },
    },],
  };
  var healready=false;
  ai.buildings.Church={
    name:'Church',
    role:'passive',
    produce:[
        {
            name:'Research Summon Healing Ward',
            id:'upghealingward',
            validate:function(){return !healready;},
            onbuy:function(){healready=true;},
        }, 
        {
            name:'Priest',
            prefix:'Train',
            ability:function(unit){
                var allies=ai.getsquad(unit);
                for(var i=0;i<allies.length;i++){
                    var a=allies[i];
                    //ai.log(a.getCurrentHP()+'/'+a.getFieldValue('hp')+' d'+ai.measuredistance(unit,a));
                    if(a.getCurrentHP()!=a.getFieldValue('hp')&&
                        ai.measuredistance(unit,a)<=ai.HEALDISTANCE){
                        scope.order('Summon Healing Ward',[unit],{x:a.getX(),y:a.getY()});
                        return;
                    }
                }
            },
        },
    ],
  };
  ai.buildings.House={
    name:'House',
    role:'neutral',
    validate:function(){return !ai.delaybuilding(ai.buildings.House);},
  };
  ai.buildings.Laboratory={
    name:'Animal Testing Lab',
    id:'animaltestinglab',
    role:'passive',
    validate:needmoreupgrades,
    produce:[
      ai.buildings.BeastAttackUpgrade,
      ai.buildings.BeastArmorUpgrade,
      ai.buildings.BeastSpeedUpgrade,
      //ai.buildings.BeastRangeUpgrade, //TODO range > vision is bad
    ],
  };
  ai.buildings.Dragon={name:'Dragon',prefix:'Train',};
  ai.buildings.Lair={
    name:'Dragons Lair',
    id:'dragonslair',
    role:'active',
    produce:[ai.buildings.Dragon,],
    validate:function(){
      return scope.getBuildings({
          player:ai.me,
          type:ai.buildings.Fortress.name,
          onlyFinshed:true,
        }).length>0;
    },
  };
  ai.buildings.Tower={
    name:'Watchtower',
    role:'passive',
  };
  ai.buildings.Workshop={
    name:'Workshop',
    role:'active',
    produce:[{name:'Catapult',prefix:'Construct',},],
  };
  ai.buildings.AdvancedWorkshop={
    name:'Advanced Workshop',
    id:'advancedworkshop',
    role:'active',
    validate:enemyhasdragons,
    produce:[{name:'Ballista',prefix:'Construct',validate:enemyhasdragons,},],
  };
  ai.currenttier=0;
  for(var buildingkey in ai.buildings){
    var building=ai.buildings[buildingkey];
    if(!ai.buildings[building.name]){
      ai.buildings[building.name]=building;
    }
    if(building.produce){
      for(var i=0;i<building.produce.length;i++){
        var production=building.produce[i];
        ai.buildings[production.name]=production;
      }
    }
  }
}

//building.js
if(!ai.BUILDINGUPGRADEORDERPREFIX){
  ai.BUILDINGUPGRADEORDERPREFIX='Upgrade To ';
  ai.canpay=function(product){
    if(!scope.getTypeFieldValue(product.id||product.name.toLowerCase(),'cost')){ 
        throw 'Unknown cost for '+(product.id||product.name.toLowerCase());
    }
    return ai.gold>=scope.getTypeFieldValue(product.id||product.name.toLowerCase(),'cost');
  }
  ai.nextproduction=false;
  ai.orderproduction=function(produce,building){
    var order=produce.name;
    var prefix=false;
    if(produce.prefix){
      prefix=produce.prefix+' ';
    }else if(produce.buildingupgrade){
      prefix=ai.BUILDINGUPGRADEORDERPREFIX;
    }
    if(prefix) order=prefix+order;
    scope.order(order,[building]);
    //if(produce.onbuy)produce.onbuy();
  }
  ai.pickproduction=function(produce){
    var chances=[];
    var totalchance=0;
    var cheapest=9000;
    for(var i=0;i<produce.length;i++){// gold loop
      chances[i]=scope.getTypeFieldValue(produce[i].id||produce[i].name.toLowerCase(),'cost');
      if(chances[i]<cheapest)cheapest=chances[i];
    }
    for(var i=0;i<produce.length;i++){//chance loop
      chances[i]=cheapest/chances[i];//lower cost = higher chance
      totalchance+=chances[i];
    }
    totalchance=scope.getRandomNumber(0, 1000) / 1000 * totalchance;
    for(var i=0;i<produce.length;i++){
      totalchance-=chances[i];
      if(totalchance<=0)return produce[i];
    }
    return produce[produce.length-1];
  }
  ai.produce=function(building){
    if(building.getUnitTypeNameInProductionQueAt(1))return false;
    var produce=ai.getbuildinginfo(building.getTypeName()).produce;
    if(!produce)return false;
    produce=produce.slice();
    var iterate=produce.slice();
    for(var i=0;i<iterate.length;i++){
      var possible=iterate[i];
      if(
          (scope.getTypeFieldValue(possible.id||possible.name.toLowerCase(),'supply'))>
              (scope.getMaxSupply()-scope.getCurrentSupply())||
          (possible.validate&&!possible.validate())
      ) produce.splice(produce.indexOf(possible),1);
    }
    if(produce.length==0)return false;
    var product=ai.pickproduction(produce);
    if(ai.canpay(product))ai.orderproduction(product,building);
    else ai.nextproduction=[product,building];
    return true;
  };
  ai.isbuilding=function(building){
    var buildingname=building.name;
//     ai.log('contains? '+buildingname);
    if(ai.queuedbuildings.contains(building)){
//       ai.log('contains '+buildingname);
      return true;
    }
    if(
      scope.getBuildings({type:buildingname,player:ai.me,}).length
      !=
      scope.getBuildings(
        {type:buildingname,player:ai.me,onlyFinshed:true,}).length
    ){
      return true;
    }
    if(
      scope.getUnits(
        {type:'Worker',player:ai.me,order:'Build '+buildingname,}).length
      >=
      1
    ){
      return true;
    }
    if(building.buildingupgrade){
      var allmybuildings=scope.getBuildings(
        {type:buildingname,player:ai.me,onlyFinshed:true,});
      for(var i=0;i<allmybuildings.length;i++){
        for(var j=1;j<=5;j++){
          var production=
            allmybuildings[i].getUnitTypeNameInProductionQueAt(i);
          if(!production){
            continue;
          }
          if(production==buildingname||
            production==ai.BUILDINGUPGRADEORDERPREFIX+production){
            return true;
          }          
        }
      }
    }
    return false;
  };
  ai.queueprioritybuilding=function(building){
    if(!ai.queuebuilding(building)){
      return false;
    }
    ai.queuedbuildings.pop();
    ai.queuedbuildings.unshift(building);
    var castle=ai.queuedbuildings.indexOf(ai.buildings.Castle);
    if(castle>=0){
      ai.queuedbuildings.splice(
        ai.queuedbuildings.indexOf(ai.buildings.Castle),1);
      ai.queuedbuildings.unshift(ai.buildings.Castle);
    }
  };
  ai.queuebuilding=function(building){
    ai.queuedbuildings[ai.queuedbuildings.length]=building;
    ai.log('Gonna build a '+building.name);
    return true;
  };
  ai.delaybuilding=function(building){
    for(var i=ai.currenttier+1;i<ai.techtree.length;i++){
        if(ai.techtree[i]==building){
            return true
        }
    }
    return false;
  };
}
//economy.js
if(!ai.MAXMINERSPERBASE){
  ai.MAXMINERSPERBASE=10;
  ai.MAXMININGDISTANCE=11;
  ai.MAXWORKERS=35;
  ai.PERIODECONOMY=10;
  ai.isexpanding=function(){
    if(ai.neverexpand){
      return false;
    }
    if(ai.isbuilding(ai.buildings.Castle)){
      return true;
    }
    var totalworkers=scope.getUnits({type:'Worker',player:ai.me,}).length;
    if(totalworkers>=ai.MAXWORKERS){
      return false;
    }
    var bases=ai.mybases(); 
    for(var i=0;i<bases.length;i++){
      if(bases[i].getUnitTypeNameInProductionQueAt(1)=='Worker'){
        totalworkers+=1;  
      }
    }
    return totalworkers>=ai.mymines().length*ai.MAXMINERSPERBASE;
  }
  ai.mymines=function(){
    var bases=ai.joinarrays(
      scope.getBuildings(
        {type:'Castle',player:ai.me,onlyFinshed:true}),
      scope.getBuildings(
        {type:'Fortress',player:ai.me,onlyFinshed:true}));
    var mines=scope.getBuildings({type:'Goldmine'});
    var invalidmines=[];
    for(var i=0;i<mines.length;i++){
      var mine=mines[i];//TODO ignore depleted mines
      if(ai.DEBUG&&bases.length==0)throw 'No bases?1';
      var closestbase=ai.findClosest(mine,bases);
      if( 
        (!closestbase.getX||!mine.getX)||
        ai.measuredistance(closestbase,mine)
            >ai.MAXMININGDISTANCE||
        mines[i].getValue('gold')==0
      ){
        invalidmines.push(mine);
      }
    }
    for(var i=0;i<invalidmines.length;i++){
      mines.splice(mines.indexOf(invalidmines[i]),1);
    }
    return mines;
  }
  ai.mybases=function(){
    var bases=ai.joinarrays(
      scope.getBuildings({type:'Castle',player:ai.me,}),
      scope.getBuildings({type:'Fortress',player:ai.me,})
    );
    var mines=scope.getBuildings({type:'Goldmine',});
    var remove=[];
    basecheck:for(var i=0;i<bases.length;i++){
        for(var j=0;j<mines.length;j++){
            if(ai.measuredistance(bases[i],mines[j])<=ai.MAXMININGDISTANCE&&
                mines[j].getValue('gold')!=0)continue basecheck;
        }
        remove.push(bases[i]);
    }
    for(var i=0;i<remove.length&&remove.length>1;i++){
        bases.splice(bases.indexOf(remove[i]),1);
    }
    return bases;
  }
  ai.debugeconomy=function(label,accountability){//TODO
  };
  ai.lastrepair=0;
  ai.organizeeconomy=function(){
    ai.lastaccountancy=ai.clock;
    var mines=ai.mymines();
    /*for(var i=0;i<mines.length;i++){
        ai.DEBUG=true;
        ai.log(i+': '+mines[i].getValue('gold')+'/'+mines[i].getValue('startGold'));
    }*/
    var bases=ai.mybases();
    if(scope.getUnits({type:'Worker',player:ai.me,}).length==0)return;
    var miners=ai.joinarrays(         
      scope.getUnits({type:'Worker',player:ai.me,order:'Mine',}),
      scope.getUnits({type:'Worker',player:ai.me,order:'Stop',}));
    var civilianfighters=scope.getUnits({type:'Worker',player:ai.me,order:'AMove',});
    var enemies=ai.groupenemyunits();
    for(var i=0;i<civilianfighters.length;i++){
        var civilian=civilianfighters[i];
        if(enemies.length==0||
            ai.measuredistance(civilian,ai.findClosest(civilian,enemies))>
                ai.CIVILDEFENSERADIUS) miners.push(civilian);
    }
    /* REPAIRS */
    if(ai.clock-ai.lastrepair>30){
        var repairing=scope.getUnits({type:'Worker',player:ai.me,order:'Repair',});
        var buildings=scope.getBuildings({player:ai.me});
        for(var i=0;i<buildings.length;i++){
            var b=buildings[i];
            if(repairing.length>0&&ai.measuredistance(b,ai.findClosest(b,repairing))<2)
                continue;
            //ai.log(b.getFieldValue('hp')+'\\'+b.getCurrentHP())
            if(b.getFieldValue('hp')!=b.getCurrentHP()){
                var m=ai.findClosest(b,miners);
                scope.order('Repair',[m],{unit:b,});
                miners.splice(miners.indexOf(m),1);
            }
        }
        ai.lastrepair=ai.clock;
    }
    /* SETUP */
    // console.log("Player: ", scope.getMyPlayerNumber(), "I am Ouchy AI");
    var accountability={};
    for(var i=0;i<mines.length;i++){//initialize data structure
      accountability[i]={workers:[]};
    }
    for(var i=0;i<miners.length;i++){//all workers mine on closest base
      var miner=miners[i];
      var closestmine=ai.sortDistance(miner,mines)[0];
      scope.order('Mine',[miner],{unit:closestmine,});
      closestmine=accountability[mines.indexOf(closestmine)].workers;
      closestmine[closestmine.length]=miner;
    }
    var remainingminers=[];
    for(var i=0;i<mines.length;i++){//check each mine
      var mine=mines[i];
      var miners=accountability[i].workers;
      var extraminers=miners.length-ai.MAXMINERSPERBASE;
      if(extraminers<=0){
        continue;//cancel if mine is operating on decent capacity
      }
      miners=ai.sortDistance(mine,miners);//TODO
      relocatesurplusminer:for(var j=1;j<=extraminers;j++){//relocate surplus miners
        var miner=miners[miners.length-j];
        if(!miner)continue;
        var closestmines=ai.sortDistance(miner,mines);
        for(var k=0;k<closestmines.length;k++){
          var destinationmine=closestmines[k];
          if(destinationmine==mine){
            continue;//can't relocate to here
          }
          var destination=
            accountability[mines.indexOf(destinationmine)].workers;
          if(destination.length>=ai.MAXMINERSPERBASE){
            continue;//relocate only to underloaded mine
          }
          miners.splice(miners.indexOf(miner),1);
          destination[destination.length]=miner;
          scope.order('Mine',[miner],{unit:destinationmine,});
          continue relocatesurplusminer;
        }
        remainingminers[remainingminers.length]=miner;
      }
    }
    if(scope.getUnits({type:'Worker',player:ai.me,}).length<mines.length*10){//don't expand yet
        return;
    }
    ai.debugeconomy('--',accountability);//TODO
    var nremainingminers=remainingminers.length;
    if(nremainingminers!=0){
      ai.log(ai.format('Wtf do I do with these {0} extra miners?!',[nremainingminers]));
    }
    if(!ai.neverexpand&&
       !ai.isbuilding(ai.buildings.Castle)&&
       ai.isexpanding()&&
       !ai.delaybuilding(ai.buildings.Castle)){//starts an expansion
         ai.log('Gotta expand!');
         ai.queuebuilding(ai.buildings.Castle);
    }
  }
  ai.neverexpand=ai.mymines().length>=3;//# of starting mines
  ai.startingcastle=ai.mybases()[0];
}
//army.js
if(!ai.PERIODARMY){
  ai.PERIODARMY=5;
  ai.INCURSIONRANGE=40;
  ai.SCOUTPRECISION=15;
  ai.CIVILDEFENSERADIUS=10;
  ai.lastassignments=0;
  ai.attacksquads=[];
  ai.defencesquads=[];
  ai.scouts=[];
  ai.squaddestination={};
  ai.spread=false;
  for(var i=0;i<ai.enemies.length;i++){
    ai.scouts.push(scope.getStartLocationForPlayerNumber(ai.enemies[i]));
  }
  ai.scouts=ai.shuffle(ai.scouts);
  ai.cleansquads=function(allsquads){
    for(var i=0;i<allsquads.length;i++){//empty squad?
      var deadsquad=allsquads[i];
      if(deadsquad.length>0){
        continue;
      }
      ai.log('lost squad '+i);
      var newarray=[];
      for(var j=0;j<allsquads.length;j++){//removes a squad
        if(j!=i){
          newarray.push(allsquads[j]);
        }
      }
      allsquads=newarray;
      var index=ai.attacksquads.indexOf(deadsquad);
      if(index>=0){
        ai.attacksquads.splice(i,1);
      }else{
        ai.defencesquads.splice(
          ai.defencesquads.indexOf(deadsquad),1);
      }
      //avoid concurrent modifications during array iteration:
      return ai.cleansquads(allsquads);
    }
    return allsquads;
  }
  ai.valueunits=function(us){
    var sum=0;
    for(var i=0;i<us.length;i++){
      sum+=us[i].getFieldValue('supply');
    }
    return sum;
  }
  ai.movesquad=function(movesquad,x,y){
    for(var i=0;i<movesquad.length;i++){
      scope.order('AMove',movesquad,{x:x,y:y,});
    }
  }
  ai.listexpandingbases=function(){
    var expansions=scope.getBuildings(
      {player:ai.me,type:'Castle',});
    var builtexpansions=scope.getBuildings(
      {player:ai.me,type:'Castle',onlyFinshed:true});
    for(var i=0;i<builtexpansions.length;i++){//unfinished exps.
      expansions.splice(
        expansions.indexOf(builtexpansions[i]),1);
    }
    return expansions;
  }
  ai.indexinsquad=function(member,squad){
    //==, indexOf... do not work
    for(var i=0;i<squad.length;i++){
      if(member.equals(squad[i])){
        return i;
      }
    }
    return -1;
  }
  ai.groupenemyunits=function(){
    var enemyunits=[];
    for(var i=0;i<ai.enemies.length;i++){
      var enemyfaction=scope.getUnits({player:ai.enemies[i],});
      for(var j=0;j<enemyfaction.length;j++){
        enemyunits.push(enemyfaction[j]);
      }
    }
    return enemyunits;
  }
  function randomspot(){
    var destination=false;
    while(
        !destination||
        !scope.positionIsPathable(destination.x,destination.y)//TODO: not enough to check if pathable, needs to see if unit can actually walk there
    )destination={x:ai.random(scope.getMapWidth()),y:ai.random(scope.getMapHeight()),};
    return destination;
  }
  ai.spreadout=function(){
      //ai.DEBUG=true;
      //ai.log('spreading! before '+ai.attacksquads.length);//TODO
      ai.spread=false;
      for(var i=0;i<ai.attacksquads.length;i++){
          var squad=ai.attacksquads[i];
          while(squad.length>1){
              ai.attacksquads.push([squad[1]]);
              squad.splice(1,1);
          }
      }
      //ai.log('spreading! after '+ai.attacksquads.length);//TODO
  }
  ai.assign=function(){
    /* WORKER DEFENSE */
    var workers=scope.getUnits({player: ai.me,type:'Worker',order:'Mine',});
    var enemies=ai.groupenemyunits();
    for(var i=0;i<workers.length;i++){
        var w=workers[i];
        var closest=ai.findClosest(w,enemies);
        if(closest&&ai.measuredistance(w,closest)<=ai.CIVILDEFENSERADIUS){
            scope.order('AMove',[w],{x:closest.getX(),y:closest.getY(),});
        }
    }
    /* PREPARATION */
    if(ai.spread)ai.spreadout();
    var units=scope.getUnits({player: ai.me,notOfType:'Worker',});
    var allsquads=ai.joinarrays(ai.attacksquads,ai.defencesquads);
    for(var i=0;i<allsquads.length;i++){//honor the dead
      var squadc=allsquads[i];
      var dead=[];
      for(var j=0;j<squadc.length;j++){
        var alive=false;
        var member=squadc[j];
        for(var k=0;k<units.length;k++){
          if(member.equals(units[k])){
            alive=true;
            squadc[j]=units[k];//update reference
            break;
          }
        }
        if(!alive){
          dead.push(member);
        }
      }
      for(var j=0;j<dead.length;j++){
        squadc.splice(squadc.indexOf(dead[j]),1);
      }
    }
    allsquads=ai.cleansquads(allsquads);//KOed squads
    var first=ai.defencesquads.length==0;
    var rookies=first?[]:ai.defencesquads[0];    
    rookie:for(var i=0;i<units.length;i++){//enlist rookies
        for(var j=0;j<allsquads.length;j++){
            if(ai.indexinsquad(units[i],allsquads[j])>=0){
                continue rookie;
            }
        }
        if(ai.valueunits(rookies)>9){
            ai.log('Creating new defence squad');
            rookies=[];
            ai.defencesquads.unshift(rookies);
        }
        rookies.push(units[i]);
    }
    if(first&&rookies.length>0){
      ai.defencesquads[0]=rookies;
    }
    var populationvalue=ai.valueunits(scope.getUnits(
      {player: ai.me}));
    var militaryvalue=0;
    for(var i=0;i<allsquads.length;i++){
      militaryvalue+=ai.valueunits(allsquads[i]);
    }
    if(militaryvalue==0){
      return;
    }
    if(
      (militaryvalue>=(populationvalue-militaryvalue)||
        (scope.getMaxSupply()-scope.getCurrentSupply())<10)
      &&ai.defencesquads.length>0
      &&ai.defencesquads[ai.defencesquads.length-1].length>2
    ){
      ai.log('Attack! ');
      var newsquad=[];
      for(var i=0;i<Math.ceil(ai.defencesquads.length/2);i++){
        var fromsquad=ai.defencesquads.pop();
        for(var j=0;j<fromsquad.length;j++){
          newsquad.push(fromsquad[j]);
        }
      }
      ai.attacksquads.push(newsquad);
    }
    
    /* PLANNING */
    var expansions=ai.listexpandingbases();
    var alliancebuildings=[];
    for(var i=0;i<ai.allies.length;i++){
        alliancebuildings=ai.joinarrays(alliancebuildings,scope.getBuildings({player:ai.allies[i],}));
    }
    var enemyunits=ai.groupenemyunits();
    var underattack=false;
    checkattack:for(var i=0;i<enemyunits.length;i++){
      var enemy=enemyunits[i];
      if(
        ai.measuredistance(
          ai.findClosest(enemy,alliancebuildings),enemy)
        <=ai.INCURSIONRANGE
      ){
        underattack=true;
        break checkattack;
      }
    }
    if(underattack){//defend
      ai.log('Under attack!');
      for(var i=0;i<ai.defencesquads.length;i++){
        var member=ai.pick(ai.defencesquads[i]);
        var closestenemy=ai.findClosest(member,enemyunits);
        scope.order('AMove',ai.defencesquads[i],
          {x:closestenemy.getX(),y:closestenemy.getY(),});
      }
    }else{
      for(var i=0;i<ai.defencesquads.length;i++){//patrol
        var squadd=ai.defencesquads[i];
        if(squadd.length==0){
          continue;
        }
        if(i<expansions.length){//defend expansions
          ai.movesquad(
            squadd,expansions[i].getX(),expansions[i].getY());
        }else{//defend nearest base to a random unit
          var buildingsperbase=ai.separatebases();
          var unit=ai.pick(squadd);
          var bases=ai.mybases();
          var closestbase=ai.findClosest(unit,bases);
          var building=
            buildingsperbase[bases.indexOf(closestbase)];
          building=ai.pick(building);
          ai.movesquad(squadd,building.getX(),building.getY());
        }
      }
    }
    var enemybuildings=[];
    for(var i=0;i<ai.enemies.length;i++){
      var enemystructures=
        scope.getBuildings({player:ai.enemies[i],});
      for(var j=0;j<enemystructures.length;j++){
        enemybuildings.push(enemystructures[j]);
      }
    }
    for(var i=0;i<ai.attacksquads.length;i++){//attack 
      var attacksquad=ai.attacksquads[i];
      if(attacksquad.length==0){
        throw 'Attack squad should not be empty!';
      }
      var member=ai.pick(attacksquad);
      if(enemybuildings.length==0){//scout
        ai.log('scout');
        var destination=ai.squaddestination[i];
        if(!destination){
          if(ai.scouts.length==0){
              ai.spread=true;
              destination=randomspot();
          } else destination=ai.scouts[0];
          ai.squaddestination[i]=destination;
        }
        scope.order('AMove',attacksquad,destination);
        if(//arrival
          ai.distance(
            member.getX(),member.getY(),
            destination.x,destination.y)<ai.SCOUTPRECISION
        ){
          var isplayerlocation=ai.scouts.indexOf(destination);
          if(isplayerlocation>=0)ai.scouts.splice(isplayerlocation,1);
          ai.squaddestination[i]=false;
        }
      }else{//attack
        ai.log('incursion');
        enemybuildings=ai.sortDistance(member,enemybuildings);
        var target=enemybuildings[0];
        for(var j=0;j<enemybuildings.length;j++){
          if(
            enemybuildings[j].getTypeName()!=
            ai.buildings.Tower.name
          ){
            target=enemybuildings[j];
            break;
          }
        }
        scope.order('AMove',attacksquad,
          {x:target.getX(),y:target.getY(),});
      }
    }
  }
  ai.getsquad=function(unit){
    var allsquads=ai.joinarrays(ai.attacksquads,ai.defencesquads);
    for(var i=0;i<allsquads.length;i++){
      var squad=allsquads[i];
      for(var j=0;j<squad.length;j++){
        if(unit.equals(squad[j])){
          return squad;
        }
      }
    }
    ai.log('Returning empty squad since none found');
    return [];
  }
}
//ouchy.js
/*
File: Ouchy! Artificial intelligence script for Littlewargame with easily customizable builds
Author: omegletrollz

For LWG Version: v3.62
AI Version: 3.0
Project Start Date: Feb 3, 2015
Version Release Date: Dec 4, 2015

More info at https://github.com/tukkek/ouchy
You can find Littlewargame at http://littlewargame.com/
*/
if(!ai.beastmode){
  var humanpool=[
    ai.buildings.Barrack,ai.buildings.Forge,
    ai.buildings.Guild,ai.buildings.Church,
    ai.buildings.Workshop,ai.buildings.AdvancedWorkshop,
    ai.buildings.Tower,ai.buildings.Tower,
  ];
  var beastpool=[
    ai.buildings.Den,ai.buildings.Den,
    ai.buildings.Fortress,ai.buildings.Fortress,//details at Fortress#validate
    ai.buildings.Lair,ai.buildings.Lair,
    ai.buildings.Laboratory,ai.buildings.Laboratory,
    ai.buildings.Tower,ai.buildings.Tower,
  ];
  ai.raxor=[//double rax
    ai.buildings.House,
    ai.buildings.Barrack,ai.buildings.Barrack,
    humanpool,
  ];
  ai.warlock=[ //rax into mages
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Guild,
    [
        ai.buildings.Barrack,ai.buildings.Barrack,
        ai.buildings.Forge,
        ai.buildings.Guild,
        ai.buildings.Tower,
    ]];
  ai.paladin=[ //rax into priests
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Church,
    [
        ai.buildings.Barrack,ai.buildings.Barrack,
        ai.buildings.Forge,
        ai.buildings.Church,
        ai.buildings.Tower,
    ]];
  ai.beastmode=[//den into dragon
    ai.buildings.House,
    ai.buildings.Den,ai.buildings.Den,
    ai.buildings.Castle,//delays autoexpansion
    ai.buildings.Fortress,
    ai.buildings.Lair,
    [
      ai.buildings.Den,ai.buildings.Laboratory,
      ai.buildings.Lair,ai.buildings.Lair,
    ],
  ];
  ai.catastrophe=[//den and cata
    ai.buildings.Den,
    ai.buildings.Workshop,
    ai.buildings.Castle,
    ai.pick([ai.buildings.Den,ai.buildings.Workshop,]),
    [
      ai.buildings.Den,ai.buildings.Den,
      ai.buildings.Workshop,ai.buildings.Workshop,
      ai.buildings.AdvancedWorkshop,ai.buildings.AdvancedWorkshop,
      ai.buildings.Forge,ai.buildings.Laboratory,
    ],
  ];
  ai.raxexpand=[ //rax -> expand
    ai.buildings.House,
    ai.buildings.Barrack,
    ai.buildings.Castle,
    ai.buildings.Tower,
    humanpool,
  ];
  ai.tworaxexpand=[ //expand first -> 2 rax
    ai.buildings.Castle,
    ai.buildings.Tower,
    ai.buildings.House,
    ai.buildings.Barrack,ai.buildings.Barrack,
    humanpool,
  ];
  ai.denexpand=[ //den -> expand
    ai.buildings.House,
    ai.buildings.Den,
    ai.buildings.Castle,
    ai.buildings.Tower,
    beastpool,
  ];
  ai.twodenexpand=[ //expand -> 2 den
    ai.buildings.Castle,
    ai.buildings.Tower,
    ai.buildings.House,
    ai.buildings.Den,ai.buildings.Den,
    beastpool,
  ];
  var aggressive=ai.pick([
    ai.pick([ai.raxor,ai.pick([ai.warlock,ai.paladin,]),]), //50% chance human
    ai.pick([ai.beastmode,ai.beastmode,ai.catastrophe,]), //50% chance beast
  ]);
  var defensive=ai.pick([ai.raxexpand,ai.denexpand,ai.tworaxexpand,ai.twodenexpand,]);
  ai.techtree=ai.pick([aggressive,defensive,defensive,]);//jbs wants the AI to be defensive 2 out of 3 times
  /*
   * jbs asked that for a first in-game version there be 50% of castle first
   * and 50% of defensive build. This line coincidentally ensures that:
   */
  ai.techtree=defensive;
}

try{
  if(ai.clock-ai.lastassignments>=ai.PERIODARMY){
    ai.lastassignments=ai.clock;
    ai.assign();
  }
  var fighting=scope.getUnits({notOfType:'Worker',player:ai.me,});
  for(var i=0;i<fighting.length;i++){//activate powers
    var power=ai.buildings[fighting[i].getTypeName()];
    if(!power)
        continue;
    power=power.ability
    if(power&&power(fighting[i])){
      //TODO cannot `return` yet because not sure if power is being actived or just spammed
    }
  }

    
  if(//organize economy
    ai.clock-ai.lastaccountancy>=ai.PERIODECONOMY||
    scope.getUnits(
      {type:'Worker',player:ai.me,order:'Stop',}).length!=0||
    ai.clock==0
  ){
    ai.organizeeconomy();
    return;
  }

  if(ai.nextproduction){
    if(ai.canpay(ai.nextproduction[0])){
      ai.orderproduction(ai.nextproduction[0],ai.nextproduction[1]);
      ai.nextproduction=false;
    }
    return;
  }
  var buildings=scope.getBuildings({player:ai.me,onlyFinshed:true,});
  for(var i=0;i<buildings.length;i++){//produce units
    if(ai.produce(buildings[i]))return;
  }
  
  if(scope.getUnits({type: "Worker", order: "Mine", player: ai.me,}).length==0)
      return;//no builders
      
  if(//build house
    scope.getMaxSupply()<100
    &&scope.getMaxSupply()-scope.getCurrentSupply()<10
    &&!ai.isbuilding(ai.buildings.House)&&!ai.isbuilding(ai.buildings.Castle)
    &&ai.techtree[ai.currenttier]!=ai.buildings.House
    &&ai.techtree[ai.currenttier]!=ai.buildings.Castle//early expand
    &&!ai.delaybuilding(ai.buildings.House)
  ){
    ai.queuebuilding(ai.buildings.House);
    return;
  }
  
  if(ai.queuedbuildings.length!=0){//build queued building
    var nextbuilding=ai.queuedbuildings[0];
    if(ai.neverexpand&&nextbuilding.name=='Castle'){
        ai.queuedbuildings.shift();
        return;
    }
    if(!ai.canpay(nextbuilding)){
      return;
    }
    ai.queuedbuildings.shift();
    if(nextbuilding.buildingupgrade){
        ai.log('Upgrading to '+nextbuilding.name);//TODO
      var buildings=scope.getBuildings({player:ai.me,});
      var found=false;
      for(var i=0;i<buildings.length;i++){
        var targetbuilding=
          ai.getbuildinginfo(buildings[i].getTypeName()).produce;
        if(
          targetbuilding&&
            targetbuilding.indexOf(nextbuilding)>=0
        ){
          scope.order(
            'Upgrade To '+nextbuilding.name,[buildings[i]]);
          found=true;
          break;
        }
      }
      if(!found)throw 'Could not upgrade to '+nextbuilding.name;
    } 
    else if (nextbuilding.name=='Castle') ai.constructCastle();
    else ai.constructBuilding(nextbuilding.name);
    return;
  }else{//let's think of a new building to make
    if(ai.currenttier>=ai.techtree.length){
      return;
    }
    var nextbuilding=ai.techtree[ai.currenttier];
    var finalstep=nextbuilding.constructor===Array;
    if(finalstep){//optional building step
      var verifyrole=nextbuilding;
      var buildings=scope.getBuildings({player:ai.me,});
      var activedelta=0;
      for(var i=0;i<buildings.length;i++){
        var role=
          ai.getbuildinginfo(buildings[i].getTypeName()).role;
        if(role=='active'){
          activedelta+=1;
        }else if(role=='passive'){
          activedelta-=1;
        }else if(role!='neutral')
          throw 'Unknown role: '+buildings[i].name;
      }
      ai.log('active delta: '+activedelta);
      if(-1<=activedelta&&activedelta<=+1){
        activedelta==ai.random(1)==1?-1:+1;
      }
      var activeoptions=[];
      var passiveoptions=[];
      for(var i=0;i<nextbuilding.length;i++){
        var optionalbuilding=nextbuilding[i];
        var role=optionalbuilding.role;
        if(role=='active'){
          activeoptions[activeoptions.length]=optionalbuilding;
        }else if(role=='passive'){
          passiveoptions[passiveoptions.length]=optionalbuilding;
        }else if(role!='neutral')
          throw 'Unknown role: '+optionalbuilding.name;
      }
      var choices=false;
      if(activedelta>0){
        choices=[passiveoptions,activeoptions,];
      }else{
        choices=[activeoptions,passiveoptions,];
      }
      nextbuilding=false;
      for(var i=0;i<choices.length;i++){
        if(choices[i].length>0){
          nextbuilding=ai.pick(choices[i]);
          break;
        }
      }
      if(!optionalbuilding)throw 'No building options?!';
    }
    if(nextbuilding.validate&&!nextbuilding.validate()){
      return;//wait until time is right
    }
    ai.queuebuilding(nextbuilding);
    if(!finalstep){
      /*var totalneeded=0;
      for(var i=0;i<=ai.currenttier;i++){
        if(ai.techtree[i]==nextbuilding){
          totalneeded+=1;
        }
      }
      if(1+scope.getBuildings({player:ai.me,type:nextbuilding.name}).length<totalneeded){
        //need to wait to make more as per build declaration
        ai.log('Still need more '+nextbuilding.name+
            ' '+scope.getBuildings({player:ai.me,type:nextbuilding.name}).length+'/'+totalneeded);
        return;
      }*/
      ai.currenttier+=1;
      ai.log('Advancing to tier '+ai.currenttier);
    }
    return;
  }
}catch(e){
  console.log(e.stack);
  if(ai.DEBUG){//if an exception is raised the game freezes
    throw e;
  }
}
