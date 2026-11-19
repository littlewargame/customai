/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RangerBot = void 0;
var chatting_1 = __webpack_require__(2);
var data_hub_1 = __webpack_require__(3);
var print_expansion_data_1 = __webpack_require__(17);
var manage_states_1 = __webpack_require__(29);
var macro_bot_1 = __webpack_require__(40);
var army_bot_1 = __webpack_require__(60);
var micro_units_1 = __webpack_require__(76);
var constants_1 = __webpack_require__(5);
var RangerBot = (function () {
    function RangerBot(_a) {
        var team_cache_key = _a.team_cache_key, player_cache_key = _a.player_cache_key;
        this.team_cache_key = team_cache_key;
        this.player_cache_key = player_cache_key;
        this.game_time = scope.getCurrentGameTimeInSec();
        this.begin_at = Date.now();
    }
    RangerBot.prototype.Step = function () {
        if (constants_1.DEBUG) {
            console.log('\nscope.getCurrentGameTimeInSec(): ' + this.game_time);
        }
        (0, chatting_1.ChatGlhf)({ game_time: this.game_time });
        this.data_hub = new data_hub_1.DataHub({
            team_cache_key: this.team_cache_key,
            player_cache_key: this.player_cache_key,
        });
        if (constants_1.DEBUG && !scope.ranger_bot.map_printed) {
            (0, print_expansion_data_1.PrintExpansionData)({ expansions: this.data_hub.map.expansions });
            scope.ranger_bot.map_printed = true;
        }
        (0, manage_states_1.ManageStates)({ data_hub: this.data_hub });
        this.macro_bot = new macro_bot_1.MacroBot({ data_hub: this.data_hub });
        this.macro_bot.Step();
        this.army_bot = new army_bot_1.ArmyBot({ data_hub: this.data_hub });
        this.army_bot.Step();
        (0, micro_units_1.MicroUnits)({ data_hub: this.data_hub });
        this.Save();
        if (constants_1.DEBUG) {
            var tick_sec = (Date.now() - this.begin_at) / 1000;
            console.log('\ntick_sec: ' + tick_sec);
        }
    };
    RangerBot.prototype.Save = function () {
        if (!this.data_hub || !this.army_bot) {
            throw new Error('Save called out of order');
        }
        this.data_hub.Save();
        this.army_bot.Save();
    };
    return RangerBot;
}());
exports.RangerBot = RangerBot;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatGlhf = ChatGlhf;
function ChatGlhf(_a) {
    var game_time = _a.game_time;
    if (5 < game_time && !scope.ranger_bot.glhf) {
        scope.chatMsg('Ranger Bot: Good Luck, Have Fun!');
        scope.ranger_bot.glhf = true;
    }
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataHub = void 0;
var analyze_teams_1 = __webpack_require__(4);
var location_is_visible_1 = __webpack_require__(7);
var analyze_map_1 = __webpack_require__(8);
var calculate_upgrades_1 = __webpack_require__(23);
var get_cached_gold_mines_1 = __webpack_require__(24);
var get_neutral_buildings_1 = __webpack_require__(25);
var update_piece_caches_1 = __webpack_require__(27);
var update_neutral_objects_1 = __webpack_require__(28);
var utils_1 = __webpack_require__(6);
var DataHub = (function () {
    function DataHub(_a) {
        var team_cache_key = _a.team_cache_key, player_cache_key = _a.player_cache_key;
        this.team_cache_key = team_cache_key;
        this.player_cache_key = player_cache_key;
        this.teams = (0, analyze_teams_1.AnalyzeTeams)({ player_cache_key: player_cache_key });
        this.map = (0, analyze_map_1.AnalyzeMap)({ player_cache_key: this.player_cache_key, teams: this.teams });
        this.gold_mines = (0, get_cached_gold_mines_1.GetCachedGoldMines)({ team_cache_key: this.team_cache_key });
        this.neutral_buildings = (0, get_neutral_buildings_1.GetNeutralBuildings)({
            team_cache_key: this.team_cache_key,
            teams: this.teams,
        });
        this.threats = {
            'buildings': [],
            'units': [],
        };
        this.targets = [];
        this.busy_units = {};
        this.my_buildings = scope.getBuildings({ player: this.teams.my.id }).map(function (v) { return v.unit; });
        this.my_units = scope.getUnits({ player: this.teams.my.id }).map(function (v) { return v.unit; });
        this.my_castles = scope.getBuildings({ player: this.teams.my.id, type: 'Castle' }).map(function (v) { return v.unit; });
        this.my_castles_under_construction = this.my_castles.filter(function (c) { return c.isUnderConstruction; });
        this.my_houses = scope.getBuildings({ player: this.teams.my.id, type: 'House' }).map(function (v) { return v.unit; });
        this.my_barracks = scope.getBuildings({ player: this.teams.my.id, type: 'Barracks' }).map(function (v) { return v.unit; });
        this.my_wolf_dens = scope.getBuildings({ player: this.teams.my.id, type: 'Wolves Den' }).map(function (v) { return v.unit; });
        this.my_watchtowers = scope.getBuildings({ player: this.teams.my.id, type: 'Watchtower' }).map(function (v) { return v.unit; });
        this.my_upgraded_watchtowers = scope.getBuildings({ player: this.teams.my.id, type: 'Watchtower (detection)' }).map(function (v) { return v.unit; });
        this.my_forges = scope.getBuildings({ player: this.teams.my.id, type: 'Forge' }).map(function (v) { return v.unit; });
        this.my_armories = scope.getBuildings({ player: this.teams.my.id, type: 'Armory' }).map(function (v) { return v.unit; });
        this.my_snake_charmers = scope.getBuildings({ player: this.teams.my.id, type: 'Snake Charmer' }).map(function (v) { return v.unit; });
        this.my_workers = scope.getUnits({ player: this.teams.my.id, type: 'Worker' }).map(function (v) { return v.unit; });
        this.my_wolves = scope.getUnits({ player: this.teams.my.id, type: 'Wolf' }).map(function (v) { return v.unit; });
        this.my_snakes = scope.getUnits({ player: this.teams.my.id, type: 'Snake' }).map(function (v) { return v.unit; });
        this.my_archers = scope.getUnits({ player: this.teams.my.id, type: 'Archer' }).map(function (v) { return v.unit; });
        this.my_soldiers = scope.getUnits({ player: this.teams.my.id, type: 'Soldier' }).map(function (v) { return v.unit; });
        this.my_fighting_units = this.my_wolves.concat(this.my_archers).concat(this.my_soldiers).concat(this.my_snakes);
        this.spendable_gold = scope.player.gold + 0;
        this.units_supply_producing = 0;
        this.supply_under_construction = 0;
        this.workers_needed = 0;
        this.worker_supply_reserved = 0;
        this.active_mining_bases = 0;
        this.gross_gold_per_min = 0;
        this.gold_spend_per_min = 0;
        this.net_gold_per_sec = 0;
        this.available_supply = scope.getMaxSupply() - scope.getCurrentSupply();
        this.count_melee = this.my_wolves.length + this.my_soldiers.length;
        this.count_ranged = this.my_archers.length + this.my_snakes.length;
        this.friendly_buildings = this.my_buildings.map(function (b) { return b; });
        for (var i = 0; i < this.teams.allies.length; i++) {
            var ally_id = this.teams.allies[i];
            var ally_buildings = scope.getBuildings({ player: ally_id }).map(function (v) { return v.unit; });
            this.friendly_buildings = this.friendly_buildings.concat(ally_buildings);
        }
        this.friendly_units = this.my_units.map(function (u) { return u; });
        for (var i = 0; i < this.teams.allies.length; i++) {
            var ally_id = this.teams.allies[i];
            var ally_units = scope.getUnits({ player: ally_id }).map(function (v) { return v.unit; });
            this.friendly_units = this.friendly_units.concat(ally_units);
        }
        (0, update_piece_caches_1.UpdatePieceCaches)({ data_hub: this });
        (0, update_neutral_objects_1.UpdateNeutralObjects)({ data_hub: this });
    }
    DataHub.prototype.Save = function () {
        if (scope.ranger_bot.team_caches === undefined || this.gold_mines === undefined || this.neutral_buildings === undefined) {
            throw new Error('DataHub#Save called out of order');
        }
        else {
            scope.ranger_bot.team_caches[this.team_cache_key].gold_mines = this.gold_mines;
            scope.ranger_bot.team_caches[this.team_cache_key].neutral_buildings = this.neutral_buildings;
        }
    };
    DataHub.prototype.LocationIsVisible = function (map_location) {
        if (this.friendly_buildings === undefined || this.friendly_units === undefined) {
            throw new Error('DataHub#_LocationIsVisible called out of order');
        }
        return (0, location_is_visible_1.LocationIsVisible)({
            map_location: map_location,
            friendly_buildings: this.friendly_buildings,
            friendly_units: this.friendly_units,
        });
    };
    DataHub.prototype.NeedReplacementExpansion = function () {
        if (!this.viable_gold_mines) {
            throw new Error('Missing viable_gold_mines for NeedReplacementExpansion');
        }
        var active_mining_bases = scope.ranger_bot.player_caches[this.player_cache_key].active_mining_bases;
        if (!active_mining_bases) {
            throw new Error('Missing active_mining_bases for NeedReplacementExpansion');
        }
        if (this.viable_gold_mines.length <= 0) {
            return false;
        }
        if (this.active_mining_bases >= 4) {
            return false;
        }
        return (this.active_mining_bases < active_mining_bases);
    };
    DataHub.prototype.AttackUpgradeLevel = function () {
        if (this._attack_upgrade_level === undefined) {
            this._attack_upgrade_level = (0, calculate_upgrades_1.CalculateUpgradeLevel)({
                data_hub: this,
                upgrade_type: 'upgattack',
            });
        }
        return this._attack_upgrade_level;
    };
    DataHub.prototype.ArmorUpgradeLevel = function () {
        if (this._armor_upgrade_level === undefined) {
            this._armor_upgrade_level = (0, calculate_upgrades_1.CalculateUpgradeLevel)({
                data_hub: this,
                upgrade_type: 'upgarmor',
            });
        }
        return this._armor_upgrade_level;
    };
    DataHub.prototype.AttackUpgradeCost = function () {
        if (!this._attack_upgrade_cost) {
            this._attack_upgrade_cost = (0, calculate_upgrades_1.CalculateUpgradeCost)({
                upgrade_type: 'upgattack',
                upgrade_level: this.AttackUpgradeLevel(),
            });
        }
        return this._attack_upgrade_cost;
    };
    DataHub.prototype.ArmorUpgradeCost = function () {
        if (!this._armor_upgrade_cost) {
            this._armor_upgrade_cost = (0, calculate_upgrades_1.CalculateUpgradeCost)({
                upgrade_type: 'upgarmor',
                upgrade_level: this.ArmorUpgradeLevel(),
            });
        }
        return this._armor_upgrade_cost;
    };
    DataHub.prototype.TowerCost = function () {
        if (!this._tower_cost) {
            var base_cost = (0, utils_1.GetNumberFieldValue)({ piece_name: 'watchtower', field_name: 'cost' });
            var increment_cost = (0, utils_1.GetNumberFieldValue)({ piece_name: 'watchtower', field_name: 'costIncrease' });
            this._tower_cost = base_cost + increment_cost * (this.my_watchtowers.length + this.my_upgraded_watchtowers.length);
        }
        return this._tower_cost;
    };
    return DataHub;
}());
exports.DataHub = DataHub;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyzeTeams = AnalyzeTeams;
exports.ConfigureStartLocation = ConfigureStartLocation;
var constants_1 = __webpack_require__(5);
function AnalyzeTeams(_a) {
    var player_cache_key = _a.player_cache_key;
    if (scope.ranger_bot.player_caches === undefined) {
        throw new Error('AnalyzeTeams called out of order');
    }
    if (scope.ranger_bot.player_caches[player_cache_key].teams === undefined) {
        var my_id = scope.getMyPlayerNumber();
        var my_team_id = scope.getMyTeamNumber();
        var my_start = ConfigureStartLocation(my_id);
        var new_my = {
            'id': my_id,
            'team_id': my_team_id,
            'start': my_start,
        };
        var allies = [];
        var enemies = [];
        var new_players = {};
        var player_ids = scope.getArrayOfPlayerNumbers();
        for (var i = 0; i < player_ids.length; i++) {
            var player_id = player_ids[i];
            if (player_id == my_id || player_id == 0) {
                continue;
            }
            var team_id = scope.getTeamNumber(player_id);
            var is_ally = (team_id == my_team_id);
            if (is_ally) {
                allies.push(player_id);
            }
            else {
                enemies.push(player_id);
            }
            var start_location = ConfigureStartLocation(player_id);
            var new_player = {
                'team_id': team_id,
                'is_ally': is_ally,
                'start_location': start_location,
            };
            new_players[player_id] = new_player;
        }
        var new_teams = {
            'my': new_my,
            'players': new_players,
            'allies': allies,
            'enemies': enemies,
        };
        scope.ranger_bot.player_caches[player_cache_key].teams = new_teams;
    }
    return scope.ranger_bot.player_caches[player_cache_key].teams;
}
var CONFIGURED_START_LOCATIONS = {
    '2vs2 Cloud Kingdom': {
        1: { 'x': 103, 'y': 8 },
        2: { 'x': 115, 'y': 33 },
        3: { 'x': 19, 'y': 114 },
        4: { 'x': 7, 'y': 89 },
    },
};
function ConfigureStartLocation(player_id) {
    var raw_start_location = scope.getStartLocationForPlayerNumber(player_id);
    if (raw_start_location) {
        return raw_start_location;
    }
    var map_name = game.data.name;
    if (!map_name) {
        if (constants_1.DEBUG) {
            console.log(game);
        }
        throw new Error('Cannot find map name for ConfigureStartLocation');
    }
    var start_locations_config = CONFIGURED_START_LOCATIONS[map_name];
    if (!start_locations_config) {
        if (constants_1.DEBUG) {
            console.log(game);
            console.log(game.start_locations);
        }
        throw new Error('No start locations configured for "' + map_name + '"');
    }
    var configured_start_location = start_locations_config[player_id];
    if (!configured_start_location) {
        if (constants_1.DEBUG) {
            console.log(game);
            console.log('map_name: ' + map_name + ', player_id: ' + player_id);
            console.log(start_locations_config);
        }
        throw new Error('No start location configured for player ' + player_id + ' on "' + map_name + '"');
    }
    else {
        return configured_start_location;
    }
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SNAKE_COST = exports.WOLF_COST = exports.WORKER_COST = exports.FORGE_COST = exports.ARMORY_COST = exports.BARRACKS_COST = exports.SNAKE_CHARMER_COST = exports.WOLF_DEN_COST = exports.HOUSE_COST = exports.CASTLE_COST = exports.TOWER_HEIGHT = exports.TOWER_WIDTH = exports.MINE_HEIGHT = exports.MINE_WIDTH = exports.CASTLE_HEIGHT = exports.CASTLE_WIDTH = exports.WORKER_DISRESPECT = exports.SCOUTS = exports.SCOUT_RADIUS = exports.PASSIVE_THREAT_FACTOR = exports.TARGET_RESET_THRESHOLD = exports.AGGRO_STOP_GAP = exports.AGGRO_START_GAP = exports.MINE_SCOUT_INTERVAL = exports.THREAT_DECAY = exports.CALM_DOWN_DISTANCE = exports.CONSCRIPTION_DISTANCE = exports.LAZY_ORDER_DISTANCE = exports.AGGRO_RETREAT_THRESHOLD = exports.AGGRO_ATTACK_THRESHOLD = exports.RETREAT_THRESHOLD = exports.ATTACK_THRESHOLD = exports.RETREAT_RADIUS = exports.ATTACK_RADIUS = exports.CONSCRIPTION_THREAT_RESPONSE = exports.MAX_THREAT_RESPONSE = exports.MIN_THREAT_RESPONSE = exports.BASE_TARGET_RADIUS = exports.MAX_BARRACKS = exports.MAX_FORGES = exports.REPLACEMENT_BASE_THRESHOLD = exports.GOLD_PER_MIN = exports.MAX_MINING_DISTANCE = exports.NEAR_MAX_SUPPLY = exports.BUILDING_SPACE_BUFFER = exports.PRE_QUEUE_BUFFER = exports.MAX_WORKERS = exports.WORKERS_PER_CASTLE = exports.SPEED_FACTOR = exports.DEBUG = void 0;
exports.WATCHTOWER_DETECTION_COST = exports.MAX_ARMOR_UPGRADE_LEVEL = exports.MAX_ATTACK_UPGRADE_LEVEL = exports.WORKER_SPEED = exports.SOLDIER_BUILD_TIME = exports.ARCHER_BUILD_TIME = exports.SNAKE_BUILD_TIME = exports.WOLF_BUILD_TIME = exports.WORKER_BUILD_TIME = exports.HOUSE_BUILD_TIME = exports.SOLDIER_SUPPLY = exports.ARCHER_SUPPLY = exports.SNAKE_SUPPLY = exports.WOLF_SUPPLY = exports.WORKER_SUPPLY = exports.ARCHER_RANGE_COST = exports.SOLDIER_COST = exports.ARCHER_COST = void 0;
var utils_1 = __webpack_require__(6);
exports.DEBUG = false;
exports.SPEED_FACTOR = 20;
exports.WORKERS_PER_CASTLE = 12;
exports.MAX_WORKERS = 50;
exports.PRE_QUEUE_BUFFER = 7;
exports.BUILDING_SPACE_BUFFER = 2;
exports.NEAR_MAX_SUPPLY = 10;
exports.MAX_MINING_DISTANCE = 6;
exports.GOLD_PER_MIN = {
    '0': 0,
    '1': 63,
    '2': 126,
    '3': 188,
    '4': 236,
    '5': 280,
    '6': 312,
    '7': 343,
    '8': 374,
    '9': 404,
    '10': 435,
    '11': 466,
    '12': 497,
    '13': 503,
};
exports.REPLACEMENT_BASE_THRESHOLD = 1000;
exports.MAX_FORGES = 3;
exports.MAX_BARRACKS = 10;
exports.BASE_TARGET_RADIUS = 3;
exports.MIN_THREAT_RESPONSE = 2;
exports.MAX_THREAT_RESPONSE = 5;
exports.CONSCRIPTION_THREAT_RESPONSE = 2;
exports.ATTACK_RADIUS = 19;
exports.RETREAT_RADIUS = 9;
exports.ATTACK_THRESHOLD = 1.65;
exports.RETREAT_THRESHOLD = 0.85;
exports.AGGRO_ATTACK_THRESHOLD = 0.5;
exports.AGGRO_RETREAT_THRESHOLD = 0.25;
exports.LAZY_ORDER_DISTANCE = 2;
exports.CONSCRIPTION_DISTANCE = 10;
exports.CALM_DOWN_DISTANCE = 13;
exports.THREAT_DECAY = 0.993;
exports.MINE_SCOUT_INTERVAL = 180;
exports.AGGRO_START_GAP = 2;
exports.AGGRO_STOP_GAP = 20;
exports.TARGET_RESET_THRESHOLD = 0.01;
exports.PASSIVE_THREAT_FACTOR = 13;
exports.SCOUT_RADIUS = 20;
exports.SCOUTS = 4;
exports.WORKER_DISRESPECT = 0.15;
exports.CASTLE_WIDTH = (0, utils_1.GetNumberFieldValue)({ piece_name: 'castle', field_name: 'sizeX' });
exports.CASTLE_HEIGHT = (0, utils_1.GetNumberFieldValue)({ piece_name: 'castle', field_name: 'sizeY' });
exports.MINE_WIDTH = (0, utils_1.GetNumberFieldValue)({ piece_name: 'goldmine', field_name: 'sizeX' });
exports.MINE_HEIGHT = (0, utils_1.GetNumberFieldValue)({ piece_name: 'goldmine', field_name: 'sizeY' });
exports.TOWER_WIDTH = (0, utils_1.GetNumberFieldValue)({ piece_name: 'watchtower', field_name: 'sizeX' });
exports.TOWER_HEIGHT = (0, utils_1.GetNumberFieldValue)({ piece_name: 'watchtower', field_name: 'sizeY' });
exports.CASTLE_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'castle', field_name: 'cost' });
exports.HOUSE_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'house', field_name: 'cost' });
exports.WOLF_DEN_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'wolvesden', field_name: 'cost' });
exports.SNAKE_CHARMER_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'snakecharmer', field_name: 'cost' });
exports.BARRACKS_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'barracks', field_name: 'cost' });
exports.ARMORY_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'armory', field_name: 'cost' });
exports.FORGE_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'forge', field_name: 'cost' });
exports.WORKER_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'worker', field_name: 'cost' });
exports.WOLF_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'wolf', field_name: 'cost' });
exports.SNAKE_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'snake', field_name: 'cost' });
exports.ARCHER_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'archer', field_name: 'cost' });
exports.SOLDIER_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'soldier', field_name: 'cost' });
exports.ARCHER_RANGE_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'upgrange', field_name: 'cost' });
exports.WORKER_SUPPLY = (0, utils_1.GetNumberFieldValue)({ piece_name: 'worker', field_name: 'supply' });
exports.WOLF_SUPPLY = (0, utils_1.GetNumberFieldValue)({ piece_name: 'wolf', field_name: 'supply' });
exports.SNAKE_SUPPLY = (0, utils_1.GetNumberFieldValue)({ piece_name: 'snake', field_name: 'supply' });
exports.ARCHER_SUPPLY = (0, utils_1.GetNumberFieldValue)({ piece_name: 'archer', field_name: 'supply' });
exports.SOLDIER_SUPPLY = (0, utils_1.GetNumberFieldValue)({ piece_name: 'soldier', field_name: 'supply' });
exports.HOUSE_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'house', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.WORKER_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'worker', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.WOLF_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'wolf', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.SNAKE_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'snake', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.ARCHER_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'archer', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.SOLDIER_BUILD_TIME = Math.floor((0, utils_1.GetNumberFieldValue)({ piece_name: 'soldier', field_name: 'buildTime' }) / exports.SPEED_FACTOR);
exports.WORKER_SPEED = (0, utils_1.GetNumberFieldValue)({ piece_name: 'worker', field_name: 'movementSpeed' }) * exports.SPEED_FACTOR;
exports.MAX_ATTACK_UPGRADE_LEVEL = (0, utils_1.GetNumberFieldValue)({ piece_name: 'upgattack', field_name: 'maxLevel' });
exports.MAX_ARMOR_UPGRADE_LEVEL = (0, utils_1.GetNumberFieldValue)({ piece_name: 'upgarmor', field_name: 'maxLevel' });
exports.WATCHTOWER_DETECTION_COST = (0, utils_1.GetNumberFieldValue)({ piece_name: 'watchtower2', field_name: 'cost' });


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetNumberFieldValue = GetNumberFieldValue;
exports.DrawRectangle = DrawRectangle;
exports.GetGoldMines = GetGoldMines;
exports.AssignMiner = AssignMiner;
exports.WolvesAreObsolete = WolvesAreObsolete;
exports.GetStringFieldValue = GetStringFieldValue;
var constants_1 = __webpack_require__(5);
function GetNumberFieldValue(_a) {
    var piece_name = _a.piece_name, field_name = _a.field_name;
    var raw = scope.getTypeFieldValue(piece_name, field_name);
    if (typeof (raw) == 'number') {
        return raw;
    }
    else {
        throw new Error('"' + field_name + '" of "' + piece_name + '" is not a number');
    }
}
function GetStringFieldValue(_a) {
    var piece_name = _a.piece_name, field_name = _a.field_name;
    var raw = scope.getTypeFieldValue(piece_name, field_name);
    if (typeof (raw) == 'string') {
        return raw;
    }
    else {
        throw new Error('"' + field_name + '" of "' + piece_name + '" is not a string');
    }
}
function DrawRectangle(_a) {
    var corner = _a.corner, width = _a.width, height = _a.height;
    var output = [];
    for (var dx = 0; dx < width; dx++) {
        var x = corner.x + dx;
        var ceiling = { 'x': x, 'y': corner.y };
        output.push(ceiling);
        var floor = { 'x': x, 'y': corner.y + height - 1 };
        output.push(floor);
    }
    for (var dy = 1; dy < (height - 1); dy++) {
        var y = corner.y + dy;
        var left_wall = { 'x': corner.x, 'y': y };
        output.push(left_wall);
        var right_wall = { 'x': corner.x + width - 1, 'y': y };
        output.push(right_wall);
    }
    return output;
}
function GetGoldMines() {
    if (undefined === scope.ranger_bot.raw_gold_mines) {
        var all_mines = scope.getBuildings({ type: 'Goldmine' })
            .map(function (g) { return g.unit; });
        var unique_mines = [];
        var mine_locations = [];
        for (var i = 0; i < all_mines.length; i++) {
            var mine = all_mines[i];
            if (mine_locations[mine.x] === undefined) {
                mine_locations[mine.x] = [];
            }
            if (mine_locations[mine.x][mine.y]) {
                continue;
            }
            unique_mines.push(mine);
            mine_locations[mine.x][mine.y] = true;
        }
        scope.ranger_bot.raw_gold_mines = unique_mines;
    }
    return scope.ranger_bot.raw_gold_mines;
}
function WolvesAreObsolete() {
    if (scope.player.upgrades.upgattack && scope.player.upgrades.upgattack > 0) {
        return true;
    }
    if (scope.player.upgrades.upgarmor && scope.player.upgrades.upgarmor > 0) {
        return true;
    }
    return false;
}
function AssignMiner(worker, assigned_mine) {
    if (!assigned_mine.gold_mine) {
        if (constants_1.DEBUG) {
            console.log(assigned_mine);
        }
        throw new Error('Missing gold mine for assigned mine');
    }
    var gold_mine = assigned_mine.gold_mine;
    if (!gold_mine.castle) {
        if (constants_1.DEBUG) {
            console.log(gold_mine);
        }
        throw new Error('Missing castle for assigned gold mine');
    }
    var assigned_castle = gold_mine.castle;
    assigned_mine.workers.push(worker);
    worker.ranger_bot = {
        'job': 'mine',
        'mine': gold_mine,
        'castle': assigned_castle,
    };
    scope.order('Move', [{ 'unit': worker }], assigned_mine.midpoint);
}


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocationIsVisible = LocationIsVisible;
function LocationIsVisible(_a) {
    var map_location = _a.map_location, friendly_buildings = _a.friendly_buildings, friendly_units = _a.friendly_units;
    var z = scope.getHeightLevel(map_location.x, map_location.y);
    for (var i = 0; i < friendly_buildings.length; i++) {
        var friendly_building = friendly_buildings[i];
        if (scope.getHeightLevel(friendly_building.x, friendly_building.y) < z) {
            continue;
        }
        var building_data = friendly_building.ranger_bot;
        var distance = Math.sqrt(Math.pow((map_location.x - building_data.center.x), 2) + Math.pow((map_location.y - building_data.center.y), 2));
        if (distance <= friendly_building.type.vision) {
            return true;
        }
    }
    for (var i = 0; i < friendly_units.length; i++) {
        var friendly_unit = friendly_units[i];
        if (scope.getHeightLevel(friendly_unit.pos.x, friendly_unit.pos.y) < z) {
            continue;
        }
        var distance = Math.sqrt(Math.pow((map_location.x - friendly_unit.pos.x), 2) + Math.pow((map_location.y - friendly_unit.pos.y), 2));
        if (distance <= friendly_unit.type.vision) {
            return true;
        }
    }
    return false;
}


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyzeMap = AnalyzeMap;
var pathable_locations_1 = __webpack_require__(9);
var rush_distance_1 = __webpack_require__(10);
var analyze_gold_mines_1 = __webpack_require__(12);
var identify_start_1 = __webpack_require__(21);
var score_expansions_1 = __webpack_require__(22);
var constants_1 = __webpack_require__(5);
function AnalyzeMap(_a) {
    var player_cache_key = _a.player_cache_key, teams = _a.teams;
    if (scope.ranger_bot.player_caches === undefined) {
        throw new Error('AnalyzeMap called out of order');
    }
    if (scope.ranger_bot.pathable_locations === undefined) {
        scope.ranger_bot.pathable_locations = (0, pathable_locations_1.PathableLocations)();
    }
    if (scope.ranger_bot.player_caches[player_cache_key].rush_distance === undefined) {
        scope.ranger_bot.player_caches[player_cache_key].rush_distance = (0, rush_distance_1.RushDistance)({ teams: teams });
    }
    if (scope.ranger_bot.player_caches[player_cache_key].expansions === undefined) {
        var expansions = (0, analyze_gold_mines_1.AnalyzeGoldMines)(teams);
        var starting_castle = (0, identify_start_1.IdentifyStartingCastle)({ teams: teams });
        var starting_expansion = (0, identify_start_1.IdentifyStartingExpansion)({
            expansions: expansions,
            starting_castle: starting_castle,
        });
        _PopulateStartingCastleCache(starting_castle, starting_expansion);
        var player_expansions = (0, score_expansions_1.ScoreExpansions)({
            expansions: structuredClone(expansions),
            starting_expansion: structuredClone(starting_expansion),
            teams: teams,
        });
        scope.ranger_bot.player_caches[player_cache_key].expansions = player_expansions;
    }
    var map_data = {
        'pathable_locations': scope.ranger_bot.pathable_locations,
        'rush_distance': scope.ranger_bot.player_caches[player_cache_key].rush_distance,
        'expansions': scope.ranger_bot.player_caches[player_cache_key].expansions,
    };
    return map_data;
}
function _PopulateStartingCastleCache(starting_castle, starting_expansion) {
    if (!starting_castle.ranger_bot) {
        var dx = (constants_1.CASTLE_WIDTH - 1) / 2;
        var dy = (constants_1.CASTLE_HEIGHT - 1) / 2;
        var center = {
            'x': starting_castle.x + dx,
            'y': starting_castle.y + dy,
        };
        var new_building_cache = {
            'center': center,
        };
        starting_castle.ranger_bot = new_building_cache;
    }
    if (!starting_castle.ranger_bot.mining_data) {
        var placement = starting_expansion.castle_placements.find(function (pl) {
            return starting_castle.x == pl.castle_location.x && starting_castle.y == pl.castle_location.y;
        });
        if (placement === undefined) {
            if (constants_1.DEBUG) {
                console.log(starting_castle);
                console.log(starting_expansion);
            }
            throw new Error('Misplaced starting castle');
        }
        var active_mines_data = placement.mines_data.map(function (md) {
            return {
                'gold_mine_id': md.gold_mine_id,
                'midpoint': md.midpoint,
                'worker_paths': md.worker_paths,
                'workers': [],
            };
        });
        starting_castle.ranger_bot.mining_data = {
            'mines_data': active_mines_data,
            'tower_location': placement.tower_location,
        };
    }
}


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PathableLocations = PathableLocations;
function PathableLocations() {
    var output = [];
    var map_width = scope.getMapWidth();
    var map_height = scope.getMapHeight();
    for (var x = 0; x <= map_width; x++) {
        output[x] = [];
        for (var y = 0; y <= map_height; y++) {
            output[x][y] = !!(scope.positionIsPathable(x, y));
        }
    }
    return output;
}


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RushDistance = RushDistance;
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
function RushDistance(_a) {
    var teams = _a.teams;
    var enemy_start_distances = teams.enemies.map(function (enemy_id) {
        var enemy_start = teams.players[enemy_id].start_location;
        var ground_distance = (0, ground_distance_1.SafeGroundDistance)(teams.my.start, enemy_start);
        if (isNaN(ground_distance)) {
            if (constants_1.DEBUG) {
                console.log('Error: missing SafeGroundDistance for RushDistance');
            }
            return Math.sqrt(Math.pow((teams.my.start.x - enemy_start.x), 2) + Math.pow((teams.my.start.y - enemy_start.y), 2));
        }
        else {
            return ground_distance;
        }
    });
    return Math.min.apply(Math, enemy_start_distances);
}


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SafeGroundDistance = SafeGroundDistance;
exports.GroundDistanceBetweenBuildings = GroundDistanceBetweenBuildings;
exports.GetShortestGroundDistanceToActiveCastle = GetShortestGroundDistanceToActiveCastle;
exports.GetClosestActiveCastleToLocation = GetClosestActiveCastleToLocation;
exports.GetClosestActiveCastleToLocationData = GetClosestActiveCastleToLocationData;
exports.GetClosestActiveMineToBuilding = GetClosestActiveMineToBuilding;
exports.GetClosestUnitToBuilding = GetClosestUnitToBuilding;
exports.GetClosestActiveMineToLocation = GetClosestActiveMineToLocation;
exports.GetClosestUnitToLocation = GetClosestUnitToLocation;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function SafeGroundDistance(p1, p2) {
    if (p1.x == p2.x && p1.y == p2.y) {
        return 0;
    }
    return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
}
function GroundDistanceBetweenBuildings(building_1, building_2) {
    var building_1_width = (0, utils_1.GetNumberFieldValue)({
        piece_name: building_1.type.id_string,
        field_name: 'sizeX',
    });
    var building_1_height = (0, utils_1.GetNumberFieldValue)({
        piece_name: building_1.type.id_string,
        field_name: 'sizeY',
    });
    var outside_corner_1 = { 'x': building_1.x - 1, 'y': building_1.y - 1 };
    var perimeter_1 = (0, utils_1.DrawRectangle)({
        corner: outside_corner_1,
        width: building_1_width + 2,
        height: building_1_height + 2,
    });
    perimeter_1 = perimeter_1.filter(function (loc) {
        return scope.positionIsPathable(loc.x, loc.y);
    });
    if (perimeter_1.length <= 0) {
        return NaN;
    }
    var building_2_width = (0, utils_1.GetNumberFieldValue)({
        piece_name: building_2.type.id_string,
        field_name: 'sizeX',
    });
    var building_2_height = (0, utils_1.GetNumberFieldValue)({
        piece_name: building_2.type.id_string,
        field_name: 'sizeY',
    });
    var outside_corner_2 = { 'x': building_2.x - 1, 'y': building_2.y - 1 };
    var perimeter_2 = (0, utils_1.DrawRectangle)({
        corner: outside_corner_2,
        width: building_2_width + 2,
        height: building_2_height + 2,
    });
    perimeter_2 = perimeter_2.filter(function (loc) {
        return scope.positionIsPathable(loc.x, loc.y);
    });
    if (perimeter_2.length <= 0) {
        return NaN;
    }
    var pairs = [];
    for (var i = 0; i < perimeter_1.length; i++) {
        var loc_1 = perimeter_1[i];
        for (var j = 0; j < perimeter_2.length; j++) {
            var loc_2 = perimeter_2[j];
            var air_distance = Math.sqrt(Math.pow((loc_1.x - loc_2.x), 2) + Math.pow((loc_1.y - loc_2.y), 2));
            pairs.push({
                'loc_1': loc_1,
                'loc_2': loc_2,
                'air_distance': air_distance,
            });
        }
    }
    var output = NaN;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (isNaN(output)) {
            var ground_distance = SafeGroundDistance(pair.loc_1, pair.loc_2);
            if (!isNaN(ground_distance)) {
                output = ground_distance;
            }
        }
        else if (pair.air_distance < output) {
            var ground_distance = SafeGroundDistance(pair.loc_1, pair.loc_2);
            if (!isNaN(ground_distance) && ground_distance < output) {
                output = ground_distance;
            }
        }
    }
    return output;
}
function GetShortestGroundDistanceToActiveCastle(_a) {
    var map_location = _a.map_location, active_castles = _a.active_castles, with_workers = _a.with_workers;
    var ac_data = GetClosestActiveCastleToLocationData({
        map_location: map_location,
        active_castles: active_castles,
        with_workers: with_workers,
    });
    return ac_data.ground_distance;
}
function GetClosestActiveCastleToLocation(_a) {
    var map_location = _a.map_location, active_castles = _a.active_castles, with_workers = _a.with_workers;
    var ac_data = GetClosestActiveCastleToLocationData({
        map_location: map_location,
        active_castles: active_castles,
        with_workers: with_workers,
    });
    return ac_data.active_castle;
}
function GetClosestActiveCastleToLocationData(_a) {
    var map_location = _a.map_location, active_castles = _a.active_castles, with_workers = _a.with_workers;
    var useful_castles = (function () {
        if (with_workers) {
            return active_castles.filter(function (ac) {
                var mines_data = ac.ranger_bot.mining_data.mines_data;
                return mines_data.some(function (md) { return md.workers.length > 0; });
            });
        }
        else {
            return active_castles;
        }
    })();
    if (useful_castles.length <= 0) {
        return { 'active_castle': undefined, 'ground_distance': NaN };
    }
    var with_air_distances = useful_castles.map(function (ac) {
        var mines_data = ac.ranger_bot.mining_data.mines_data;
        var air_distances = [];
        var locations = mines_data.map(function (md) {
            var air_distance = Math.sqrt(Math.pow((md.midpoint.x - map_location.x), 2) + Math.pow((md.midpoint.y - map_location.y), 2));
            air_distances.push(air_distance);
            return {
                'midpoint': md.midpoint,
                'air_distance': air_distance,
            };
        });
        return {
            'active_castle': ac,
            'locations': locations.sort(function (a, b) { return a.air_distance - b.air_distance; }),
            'min_air_distance': Math.min.apply(Math, air_distances),
        };
    }).sort(function (a, b) { return a.min_air_distance - b.min_air_distance; });
    var shortest_distance = NaN;
    var closest_active_castle;
    for (var i = 0; i < with_air_distances.length; i++) {
        var data = with_air_distances[i];
        if (!isNaN(shortest_distance) && data.min_air_distance >= shortest_distance) {
            continue;
        }
        for (var j = 0; j < data.locations.length; j++) {
            var location_1 = data.locations[j];
            if (isNaN(shortest_distance)) {
                var ground_distance = SafeGroundDistance(map_location, location_1.midpoint);
                if (isNaN(ground_distance)) {
                    continue;
                }
                shortest_distance = ground_distance;
                closest_active_castle = data.active_castle;
            }
            else if (location_1.air_distance < shortest_distance) {
                var ground_distance = SafeGroundDistance(map_location, location_1.midpoint);
                if (isNaN(ground_distance) || ground_distance >= shortest_distance) {
                    continue;
                }
                shortest_distance = ground_distance;
                closest_active_castle = data.active_castle;
            }
        }
    }
    return { 'active_castle': closest_active_castle, 'ground_distance': shortest_distance };
}
function GetClosestUnitToLocation(map_location, units) {
    if (units.length <= 0) {
        return undefined;
    }
    var stuff = units.map(function (unit) {
        return {
            'original': unit,
            'location': unit.pos,
        };
    });
    var response = _GetClosestToLocation(map_location, stuff);
    if (response) {
        return response.original;
    }
    else {
        return undefined;
    }
}
function GetClosestActiveMineToLocation(map_location, active_mines) {
    if (active_mines.length <= 0) {
        return undefined;
    }
    var stuff = active_mines.map(function (active_mine) {
        return {
            'original': active_mine,
            'location': active_mine.midpoint,
        };
    });
    var response = _GetClosestToLocation(map_location, stuff);
    if (response) {
        return response.original;
    }
    else {
        return undefined;
    }
}
function GetClosestUnitToBuilding(building, units) {
    if (units.length <= 0) {
        return undefined;
    }
    var stuff = units.map(function (unit) {
        return {
            'original': unit,
            'location': unit.pos,
        };
    });
    var response = _GetClosestToBuilding(building, stuff);
    if (response) {
        return response.original;
    }
    else {
        return undefined;
    }
}
function GetClosestActiveMineToBuilding(building, active_mines) {
    if (active_mines.length <= 0) {
        return undefined;
    }
    var stuff = active_mines.map(function (active_mine) {
        return {
            'original': active_mine,
            'location': active_mine.midpoint,
        };
    });
    var response = _GetClosestToBuilding(building, stuff);
    if (response) {
        return response.original;
    }
    else {
        return undefined;
    }
}
function _GetClosestToBuilding(building, stuff) {
    var building_width = (0, utils_1.GetNumberFieldValue)({
        piece_name: building.type.id_string,
        field_name: 'sizeX',
    });
    var building_height = (0, utils_1.GetNumberFieldValue)({
        piece_name: building.type.id_string,
        field_name: 'sizeY',
    });
    var outside_corner = { 'x': building.x - 1, 'y': building.y - 1 };
    var perimeter = (0, utils_1.DrawRectangle)({
        corner: outside_corner,
        width: building_width + 2,
        height: building_height + 2,
    }).filter(function (loc) {
        return scope.positionIsPathable(loc.x, loc.y);
    });
    if (perimeter.length <= 0) {
        return undefined;
    }
    var pairs = [];
    for (var i = 0; i < perimeter.length; i++) {
        var perimeter_location = perimeter[i];
        for (var j = 0; j < stuff.length; j++) {
            var thing = stuff[j];
            var air_distance = Math.sqrt(Math.pow((perimeter_location.x - thing.location.x), 2) +
                Math.pow((perimeter_location.y - thing.location.y), 2));
            pairs.push({
                'per_loc': perimeter_location,
                'thing': thing,
                'air_distance': air_distance,
            });
        }
    }
    pairs = pairs.sort(function (a, b) { return a.air_distance - b.air_distance; });
    var output;
    var closest_distance = NaN;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        if (isNaN(closest_distance)) {
            var ground_distance = SafeGroundDistance(pair.per_loc, pair.thing.location);
            if (isNaN(ground_distance)) {
                if (constants_1.DEBUG) {
                    console.log('Error: missing SafeGroundDistance for _GetClosestToBuilding 1');
                }
                continue;
            }
            closest_distance = ground_distance;
            output = pair.thing;
        }
        else if (pair.air_distance < closest_distance) {
            var ground_distance = SafeGroundDistance(pair.per_loc, pair.thing.location);
            if (isNaN(ground_distance)) {
                if (constants_1.DEBUG) {
                    console.log('Error: missing SafeGroundDistance for _GetClosestToBuilding 2');
                }
                continue;
            }
            if (ground_distance < closest_distance) {
                closest_distance = ground_distance;
                output = pair.thing;
            }
        }
    }
    if (!output) {
        if (constants_1.DEBUG) {
            console.log(building);
            console.log(stuff);
            console.log(pairs);
        }
        throw new Error('No ground paths for _GetClosestToBuilding');
    }
    return output;
}
function _GetClosestToLocation(map_location, stuff) {
    var with_air_distance = stuff.map(function (thing) {
        var air_distance = Math.sqrt(Math.pow((map_location.x - thing.location.x), 2) +
            Math.pow((map_location.y - thing.location.y), 2));
        return {
            'thing': thing,
            'air_distance': air_distance,
        };
    }).sort(function (a, b) { return a.air_distance - b.air_distance; });
    var output;
    var closest_distance = NaN;
    for (var i = 0; i < with_air_distance.length; i++) {
        var data = with_air_distance[i];
        if (isNaN(closest_distance)) {
            var ground_distance = SafeGroundDistance(map_location, data.thing.location);
            if (isNaN(ground_distance)) {
                if (constants_1.DEBUG) {
                    console.log('Error: missing SafeGroundDistance for _GetClosestToLocation 1');
                }
                continue;
            }
            closest_distance = ground_distance;
            output = data.thing;
        }
        else if (data.air_distance < closest_distance) {
            var ground_distance = SafeGroundDistance(map_location, data.thing.location);
            if (isNaN(ground_distance)) {
                if (constants_1.DEBUG) {
                    console.log('Error: missing SafeGroundDistance for _GetClosestToLocation 2');
                }
                continue;
            }
            if (ground_distance < closest_distance) {
                closest_distance = ground_distance;
                output = data.thing;
            }
        }
    }
    if (!output) {
        if (constants_1.DEBUG) {
            console.log(map_location);
            console.log(stuff);
            console.log(with_air_distance);
        }
        throw new Error('No ground paths for _GetClosestToLocation');
    }
    return output;
}


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnalyzeGoldMines = AnalyzeGoldMines;
var map_exclusion_zone_1 = __webpack_require__(13);
var map_gold_mine_perimeter_1 = __webpack_require__(14);
var calculate_viable_castle_locations_1 = __webpack_require__(16);
var select_castle_locations_1 = __webpack_require__(18);
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function AnalyzeGoldMines(teams) {
    if (scope.ranger_bot.expansions === undefined) {
        var raw_gold_mines = (0, utils_1.GetGoldMines)();
        var center_offset_x = (constants_1.MINE_WIDTH - 1) / 2;
        var center_offset_y = (constants_1.MINE_HEIGHT - 1) / 2;
        for (var i = 0; i < raw_gold_mines.length; i++) {
            var raw_mine = raw_gold_mines[i];
            if (raw_mine.ranger_bot === undefined) {
                var center = {
                    'x': raw_mine.x + center_offset_x,
                    'y': raw_mine.y + center_offset_y,
                };
                raw_mine.ranger_bot = { 'center': center };
            }
        }
        for (var i = 0; i < raw_gold_mines.length; i++) {
            var raw_mine = raw_gold_mines[i];
            var mine_cache = raw_mine.ranger_bot;
            if (mine_cache.exclusion_zone === undefined) {
                mine_cache.exclusion_zone = (0, map_exclusion_zone_1.MapExclusionZone)({ raw_mine: raw_mine });
            }
        }
        for (var i = 0; i < raw_gold_mines.length; i++) {
            var raw_mine = raw_gold_mines[i];
            var mine_cache = raw_mine.ranger_bot;
            if (mine_cache.perimeter === undefined) {
                mine_cache.perimeter = (0, map_gold_mine_perimeter_1.MapGoldMinePerimeter)({
                    raw_mine: raw_mine,
                    raw_gold_mines: raw_gold_mines,
                    teams: teams,
                });
            }
        }
        for (var i = 0; i < raw_gold_mines.length; i++) {
            var raw_mine = raw_gold_mines[i];
            var mine_cache = raw_mine.ranger_bot;
            if (mine_cache.viable_castle_locations === undefined) {
                mine_cache.viable_castle_locations = (0, calculate_viable_castle_locations_1.CalculateViableCastleLocations)({
                    raw_mine: raw_mine,
                    raw_gold_mines: raw_gold_mines,
                    teams: teams,
                });
            }
        }
        var new_expansions = (0, select_castle_locations_1.SelectCastleLocations)({
            raw_gold_mines: raw_gold_mines,
            teams: teams,
        });
        scope.ranger_bot.expansions = new_expansions;
    }
    return scope.ranger_bot.expansions;
}


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MapExclusionZone = MapExclusionZone;
function MapExclusionZone(_a) {
    var raw_mine = _a.raw_mine;
    var RELATIVE_MAP = {
        '-6': [-3, -2, -1, 0, 1, 2, 3],
        '-5': [-4, -3, -2, -1, 0, 1, 2, 3, 4],
        '-4': [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
        '-3': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
        '-2': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
        '-1': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
        '0': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
        '1': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
        '2': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
        '3': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
        '4': [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
        '5': [-4, -3, -2, -1, 0, 1, 2, 3, 4],
        '6': [-3, -2, -1, 0, 1, 2, 3],
    };
    var output = [];
    var mine_cache = raw_mine.ranger_bot;
    for (var _i = 0, _b = Object.entries(RELATIVE_MAP); _i < _b.length; _i++) {
        var _c = _b[_i], raw_x = _c[0], y_list = _c[1];
        var dx = Number(raw_x);
        if (isNaN(dx)) {
            continue;
        }
        var x = mine_cache.center.x + Number(raw_x);
        output[x] = [];
        for (var i = 0; i < y_list.length; i++) {
            var dy = Number(y_list[i]);
            if (isNaN(dy)) {
                continue;
            }
            var y = mine_cache.center.y + dy;
            output[x][y] = true;
        }
    }
    return output;
}


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MapGoldMinePerimeter = MapGoldMinePerimeter;
var buildable_1 = __webpack_require__(15);
function MapGoldMinePerimeter(_a) {
    var raw_mine = _a.raw_mine, raw_gold_mines = _a.raw_gold_mines, teams = _a.teams;
    var mine_cache = raw_mine.ranger_bot;
    if (mine_cache.exclusion_zone === undefined) {
        throw new Error('MapGoldMinePerimeter called out of order');
    }
    var z = scope.getHeightLevel(mine_cache.center.x, mine_cache.center.y);
    var output = [];
    var _loop_1 = function (raw_x) {
        var x = Number(raw_x);
        if (isNaN(x)) {
            return "continue";
        }
        var y_list = mine_cache.exclusion_zone[x];
        var _loop_2 = function (raw_y) {
            var y = Number(raw_y);
            if (isNaN(y)) {
                return "continue";
            }
            var new_x = (function () {
                if (x < mine_cache.center.x) {
                    return x - 1;
                }
                else if (x > mine_cache.center.x) {
                    return x + 1;
                }
                else {
                    return x;
                }
            })();
            if (_IsValid(new_x, y, z, raw_gold_mines, teams)) {
                if (output[new_x] === undefined) {
                    output[new_x] = [];
                }
                output[new_x][y] = true;
            }
            var new_y = (function () {
                if (y < mine_cache.center.y) {
                    return y - 1;
                }
                else if (y > mine_cache.center.y) {
                    return y + 1;
                }
                else {
                    return y;
                }
            })();
            if (_IsValid(x, new_y, z, raw_gold_mines, teams)) {
                if (output[x] === undefined) {
                    output[x] = [];
                }
                output[x][new_y] = true;
            }
        };
        for (var raw_y in y_list) {
            _loop_2(raw_y);
        }
    };
    for (var raw_x in mine_cache.exclusion_zone) {
        _loop_1(raw_x);
    }
    return output;
}
function _IsValid(x, y, z, raw_gold_mines, teams) {
    if (scope.getHeightLevel(x, y) != z) {
        return false;
    }
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var other_raw_mine = raw_gold_mines[i];
        var exclusion_zone = other_raw_mine.ranger_bot.exclusion_zone;
        var y_list = exclusion_zone[x];
        if (y_list === undefined) {
            continue;
        }
        if (y_list[y]) {
            return false;
        }
    }
    var map_location = { 'x': x, 'y': y };
    return (0, buildable_1.IsBuildable)({
        map_location: map_location,
        teams: teams,
        exclude_worker_paths: false,
    });
}


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsBuildable = IsBuildable;
exports.AreBuildable = AreBuildable;
var constants_1 = __webpack_require__(5);
function IsBuildable(_a) {
    var map_location = _a.map_location, exclude_worker_paths = _a.exclude_worker_paths, raw_gold_mines = _a.raw_gold_mines, data_hub = _a.data_hub, teams = _a.teams;
    if (map_location.x < 0 || scope.getMapWidth() < map_location.x) {
        return false;
    }
    if (map_location.y < 0 || scope.getMapHeight() < map_location.y) {
        return false;
    }
    if (scope.fieldIsRamp(map_location.x, map_location.y)) {
        return false;
    }
    if (!scope.positionIsPathable(map_location.x, map_location.y)) {
        if (exclude_worker_paths) {
            return false;
        }
        if (teams) {
            var start_locations = [teams.my.start];
            var players_data = Object.values(teams.players);
            for (var i = 0; i < players_data.length; i++) {
                var player_data = players_data[i];
                start_locations.push(player_data.start_location);
            }
            for (var i = 0; i < start_locations.length; i++) {
                var start_location = start_locations[i];
                if (start_location.x <= map_location.x && map_location.x <= (start_location.x + constants_1.CASTLE_WIDTH) &&
                    start_location.y <= map_location.y && map_location.y <= (start_location.y + constants_1.CASTLE_HEIGHT)) {
                    return true;
                }
            }
            return false;
        }
    }
    if (exclude_worker_paths) {
        if (raw_gold_mines) {
            return _UseGoldMines(map_location, raw_gold_mines);
        }
        else if (data_hub) {
            return _UseExpansionDataFromDataHub(map_location, data_hub);
        }
        else {
            throw new Error('Missing data for IsBuildable with exclude_worker_paths');
        }
    }
    else {
        return true;
    }
}
function AreBuildable(_a) {
    var x_min = _a.x_min, x_max = _a.x_max, y_min = _a.y_min, y_max = _a.y_max, exclude_worker_paths = _a.exclude_worker_paths, raw_gold_mines = _a.raw_gold_mines, data_hub = _a.data_hub, teams = _a.teams;
    for (var x = x_min; x <= x_max; x++) {
        for (var y = y_min; y <= y_max; y++) {
            var map_location = { 'x': x, 'y': y };
            var kwargs = {
                'map_location': map_location,
                'exclude_worker_paths': exclude_worker_paths,
            };
            if (raw_gold_mines) {
                kwargs['raw_gold_mines'] = raw_gold_mines;
            }
            if (data_hub) {
                kwargs['data_hub'] = data_hub;
            }
            if (teams) {
                kwargs['teams'] = teams;
            }
            if (!IsBuildable(kwargs)) {
                return false;
            }
        }
    }
    return true;
}
function _UseGoldMines(map_location, raw_gold_mines) {
    var _loop_1 = function (i) {
        var raw_mine = raw_gold_mines[i];
        var mine_cache = raw_mine.ranger_bot;
        var all_worker_paths = (function () {
            if (mine_cache._worker_paths) {
                return [mine_cache._worker_paths];
            }
            else if (mine_cache.expansion_data) {
                return mine_cache.expansion_data.map(function (ed) { return ed.worker_paths; });
            }
            else {
                throw new Error('all_worker_paths missing for _UseGoldMines');
            }
        })();
        for (var j = 0; j < all_worker_paths.length; j++) {
            var worker_paths = all_worker_paths[j];
            if (_OverlapsWorkerPaths(map_location, worker_paths)) {
                return { value: false };
            }
        }
        var castle_locations = (function () {
            if (mine_cache._castle_location) {
                return [mine_cache._castle_location];
            }
            else if (mine_cache.expansion_data) {
                return mine_cache.expansion_data.map(function (ed) { return ed.castle_location; });
            }
            else {
                throw new Error('castle_locations missing for _UseGoldMines');
            }
        })();
        for (var j = 0; j < castle_locations.length; j++) {
            var castle_location = castle_locations[j];
            if (_OverlapsCastle(map_location, castle_location)) {
                return { value: false };
            }
        }
        var tower_locations = (function () {
            if (mine_cache.expansion_data) {
                return mine_cache.expansion_data.map(function (ed) { return ed.tower_location; });
            }
            else {
                return [];
            }
        })();
        for (var j = 0; j < tower_locations.length; j++) {
            var tower_location = tower_locations[j];
            if (_OverlapsTower(map_location, tower_location)) {
                return { value: false };
            }
        }
    };
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    return true;
}
function _UseExpansionDataFromDataHub(map_location, data_hub) {
    for (var i = 0; i < data_hub.map.expansions.length; i++) {
        var player_expansion = data_hub.map.expansions[i];
        if (_OverlapsExpansion(map_location, player_expansion)) {
            return false;
        }
    }
    return true;
}
function _OverlapsExpansion(map_location, player_expansion) {
    var castles = [];
    for (var i = 0; i < player_expansion.castle_placements.length; i++) {
        var placement = player_expansion.castle_placements[i];
        for (var j = 0; j < placement.mines_data.length; j++) {
            var active_mine = placement.mines_data[j];
            if (!active_mine.gold_mine) {
                if (constants_1.DEBUG) {
                    console.log(active_mine);
                }
                throw new Error('Missing gold_mine for _OverlapsExpansion');
            }
            if (!active_mine.gold_mine.castle) {
                continue;
            }
            castles[active_mine.gold_mine.castle.id] = active_mine.gold_mine.castle;
        }
    }
    if (castles.length <= 0) {
        return _OverlapsAnyPlacement(map_location, player_expansion.castle_placements);
    }
    for (var _i = 0, _a = Object.entries(castles); _i < _a.length; _i++) {
        var _b = _a[_i], raw_id = _b[0], castle = _b[1];
        var id = Number(raw_id);
        if (isNaN(id)) {
            continue;
        }
        if (!castle.ranger_bot.mining_data) {
            if (constants_1.DEBUG) {
                console.log(castle);
            }
            throw new Error('Missing mining_data for _OverlapsExpansion');
        }
        if (_OverlapsTower(map_location, castle.ranger_bot.mining_data.tower_location)) {
            return true;
        }
        for (var i = 0; i < castle.ranger_bot.mining_data.mines_data.length; i++) {
            var active_mine = castle.ranger_bot.mining_data.mines_data[i];
            if (_OverlapsWorkerPaths(map_location, active_mine.worker_paths)) {
                return true;
            }
        }
    }
    return false;
}
function _OverlapsAnyPlacement(map_location, castle_placements) {
    for (var i = 0; i < castle_placements.length; i++) {
        var placement = castle_placements[i];
        if (_OverlapsCastle(map_location, placement.castle_location)) {
            return true;
        }
        if (_OverlapsTower(map_location, placement.tower_location)) {
            return true;
        }
        for (var j = 0; j < placement.mines_data.length; j++) {
            var active_mine = placement.mines_data[j];
            if (_OverlapsWorkerPaths(map_location, active_mine.worker_paths)) {
                return true;
            }
        }
    }
    return false;
}
function _OverlapsCastle(map_location, castle_location) {
    for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
        var xx = castle_location.x + dx;
        if (xx != map_location.x) {
            continue;
        }
        for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
            var yy = castle_location.y + dy;
            if (yy == map_location.y) {
                return true;
            }
        }
    }
    return false;
}
function _OverlapsTower(map_location, tower_location) {
    for (var dx = 0; dx < constants_1.TOWER_WIDTH; dx++) {
        var xx = tower_location.x + dx;
        if (xx != map_location.x) {
            continue;
        }
        for (var dy = 0; dy < constants_1.TOWER_HEIGHT; dy++) {
            var yy = tower_location.y + dy;
            if (yy == map_location.y) {
                return true;
            }
        }
    }
    return false;
}
function _OverlapsWorkerPaths(map_location, worker_paths) {
    var y_list = worker_paths[map_location.x];
    if (y_list && y_list[map_location.y]) {
        return true;
    }
    return false;
}


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateViableCastleLocations = CalculateViableCastleLocations;
exports.CalculateMidpoint = CalculateMidpoint;
var constants_1 = __webpack_require__(5);
var buildable_1 = __webpack_require__(15);
var ground_distance_1 = __webpack_require__(11);
var utils_1 = __webpack_require__(6);
var constants_2 = __webpack_require__(5);
var print_expansion_data_1 = __webpack_require__(17);
function CalculateViableCastleLocations(_a) {
    var raw_mine = _a.raw_mine, raw_gold_mines = _a.raw_gold_mines, teams = _a.teams;
    var mine_cache = raw_mine.ranger_bot;
    if (mine_cache.perimeter === undefined) {
        throw new Error('CalculateViableCastleLocations called out of order');
    }
    var z = scope.getHeightLevel(raw_mine.x, raw_mine.y);
    var output = [];
    for (var raw_x in mine_cache.perimeter) {
        var x = Number(raw_x);
        if (isNaN(x)) {
            continue;
        }
        var y_list = mine_cache.perimeter[x];
        for (var raw_y in y_list) {
            var y = Number(raw_y);
            if (isNaN(y)) {
                continue;
            }
            for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
                var xx = x - dx;
                for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
                    var yy = y - dy;
                    if (!_IsViable(xx, yy, z, raw_gold_mines, teams)) {
                        continue;
                    }
                    var mining_distance = _CalculateMiningDistance(xx, yy, raw_mine.id);
                    if (isNaN(mining_distance) || mining_distance > constants_1.MAX_MINING_DISTANCE) {
                        continue;
                    }
                    var midpoint = CalculateMidpoint(xx, yy, raw_mine);
                    if (z != scope.getHeightLevel(midpoint.x, midpoint.y)) {
                        continue;
                    }
                    if (scope.fieldIsRamp(midpoint.x, midpoint.y)) {
                        continue;
                    }
                    if (!scope.positionIsPathable(midpoint.x, midpoint.y)) {
                        continue;
                    }
                    if (output[xx] === undefined) {
                        output[xx] = [];
                    }
                    output[xx][yy] = mining_distance;
                }
            }
        }
    }
    if (0 == output.length) {
        if (constants_2.DEBUG) {
            var debug = [];
            debug[raw_mine.x + 1] = [];
            debug[raw_mine.x + 1][raw_mine.y + 1] = true;
            (0, print_expansion_data_1.PrintExpansionData)({ debug: debug });
        }
        throw new Error('No viable castle locations');
    }
    return output;
}
function CalculateMidpoint(castle_x, castle_y, raw_gold_mine) {
    var castle_center_x = castle_x + (constants_1.CASTLE_WIDTH - 1) / 2;
    var castle_center_y = castle_y + (constants_1.CASTLE_HEIGHT - 1) / 2;
    var mine_cache = raw_gold_mine.ranger_bot;
    return {
        'x': (castle_center_x + mine_cache.center.x) / 2,
        'y': (castle_center_y + mine_cache.center.y) / 2,
    };
}
function _IsViable(base_x, base_y, z, raw_gold_mines, teams) {
    if (z != scope.getHeightLevel(base_x, base_y)) {
        return false;
    }
    for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
        var x = base_x + dx;
        for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
            var y = base_y + dy;
            for (var i = 0; i < raw_gold_mines.length; i++) {
                var raw_mine = raw_gold_mines[i];
                var exclusion_zone = raw_mine.ranger_bot.exclusion_zone;
                if (!exclusion_zone[x]) {
                    continue;
                }
                if (exclusion_zone[x][y]) {
                    return false;
                }
            }
        }
    }
    return (0, buildable_1.AreBuildable)({
        x_min: base_x,
        x_max: base_x + constants_1.CASTLE_WIDTH - 1,
        y_min: base_y,
        y_max: base_y + constants_1.CASTLE_HEIGHT - 1,
        teams: teams,
        exclude_worker_paths: false,
    });
}
function _CalculateMiningDistance(base_x, base_y, mine_id) {
    var real_gold_mine = (0, utils_1.GetGoldMines)().find(function (g) { return g.id == mine_id; });
    if (!real_gold_mine) {
        throw new Error('could not find gold mine with id ' + mine_id);
    }
    var castle_wrapper = scope.getBuildings({ type: 'Castle' }).find(function () { return true; });
    if (!castle_wrapper) {
        throw new Error('no castles for _CalculateMiningDistance');
    }
    var castle_type = castle_wrapper.unit.type;
    var dx = (constants_1.CASTLE_WIDTH - 1) / 2;
    var dy = (constants_1.CASTLE_HEIGHT - 1) / 2;
    var hypothetical_castle = {
        'id': -1,
        'hp': castle_type.hp,
        'type': castle_type,
        'x': base_x,
        'y': base_y,
        'isUnderConstruction': false,
        'ranger_bot': {
            'center': { 'x': base_x + dx, 'y': base_y + dy },
        },
        'order': {
            'name': 'Stop',
        },
        'buildTicksLeft': 0,
        'queue': [],
        'owner': scope.player,
        'modifierMods': {},
    };
    return (0, ground_distance_1.GroundDistanceBetweenBuildings)(hypothetical_castle, real_gold_mine);
}


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrintExpansionData = PrintExpansionData;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
var analyze_teams_1 = __webpack_require__(4);
function PrintExpansionData(_a) {
    var expansions = _a.expansions, castle_locations = _a.castle_locations, mines_data = _a.mines_data, debug = _a.debug, midpoints = _a.midpoints;
    var map = [];
    var map_width = scope.getMapWidth();
    var map_height = scope.getMapHeight();
    for (var x = 0; x <= map_width; x++) {
        map[x] = [];
        for (var y = 0; y <= map_height; y++) {
            map[x][y] = ' ';
        }
    }
    var raw_gold_mines = (0, utils_1.GetGoldMines)();
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var raw_mine = raw_gold_mines[i];
        var mine_cache = raw_mine.ranger_bot;
        if (mine_cache.exclusion_zone) {
            for (var _i = 0, _b = Object.entries(mine_cache.exclusion_zone); _i < _b.length; _i++) {
                var _c = _b[_i], raw_x = _c[0], y_list = _c[1];
                var x = Number(raw_x);
                if (isNaN(x) || x < 0 || x > map_width) {
                    continue;
                }
                for (var raw_y in y_list) {
                    var y = Number(raw_y);
                    if (isNaN(y) || y < 0 || y > map_height) {
                        continue;
                    }
                    map[x][y] = 'X';
                }
            }
        }
        if (mine_cache.perimeter) {
            for (var _d = 0, _e = Object.entries(mine_cache.perimeter); _d < _e.length; _d++) {
                var _f = _e[_d], raw_x = _f[0], y_list = _f[1];
                var x = Number(raw_x);
                if (isNaN(x) || x < 0 || x > map_width) {
                    continue;
                }
                for (var raw_y in y_list) {
                    var y = Number(raw_y);
                    if (isNaN(y) || y < 0 || y > map_height) {
                        continue;
                    }
                    map[x][y] = 'P';
                }
            }
        }
    }
    if (expansions) {
        for (var i = 0; i < expansions.length; i++) {
            var expansion = expansions[i];
            var castle_placement = expansion.castle_placements[0];
            for (var j = 0; j < castle_placement.mines_data.length; j++) {
                var mine_data = castle_placement.mines_data[j];
                for (var _g = 0, _h = Object.entries(mine_data.worker_paths); _g < _h.length; _g++) {
                    var _j = _h[_g], raw_x = _j[0], y_list = _j[1];
                    var x = Number(raw_x);
                    if (isNaN(x) || x < 0 || x > map_width) {
                        continue;
                    }
                    for (var raw_y in y_list) {
                        var y = Number(raw_y);
                        if (isNaN(y) || y < 0 || y > map_height) {
                            continue;
                        }
                        map[x][y] = 'W';
                    }
                }
            }
            for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
                var cx = castle_placement.castle_location.x + dx;
                for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
                    var cy = castle_placement.castle_location.y + dy;
                    map[cx][cy] = 'C';
                }
            }
            for (var dx = 0; dx < constants_1.TOWER_WIDTH; dx++) {
                var tx = castle_placement.tower_location.x + dx;
                for (var dy = 0; dy < constants_1.TOWER_HEIGHT; dy++) {
                    var ty = castle_placement.tower_location.y + dy;
                    map[tx][ty] = 'T';
                }
            }
        }
    }
    if (mines_data) {
        for (var i = 0; i < mines_data.length; i++) {
            var mine_data = mines_data[i];
            for (var _k = 0, _l = Object.entries(mine_data.worker_paths); _k < _l.length; _k++) {
                var _m = _l[_k], raw_x = _m[0], y_list = _m[1];
                var x = Number(raw_x);
                if (isNaN(x) || x < 0 || x > map_width) {
                    continue;
                }
                for (var raw_y in y_list) {
                    var y = Number(raw_y);
                    if (isNaN(y) || y < 0 || y > map_height) {
                        continue;
                    }
                    map[x][y] = 'W';
                }
            }
        }
    }
    if (castle_locations) {
        for (var i = 0; i < castle_locations.length; i++) {
            var castle_location = castle_locations[i];
            for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
                var cx = castle_location.x + dx;
                for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
                    var cy = castle_location.y + dy;
                    map[cx][cy] = 'C';
                }
            }
        }
    }
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var raw_mine = raw_gold_mines[i];
        var mine_cache = raw_mine.ranger_bot;
        if (mine_cache.viable_castle_locations) {
            for (var _o = 0, _p = Object.entries(mine_cache.viable_castle_locations); _o < _p.length; _o++) {
                var _q = _p[_o], raw_x = _q[0], y_list = _q[1];
                var x = Number(raw_x);
                if (isNaN(x) || x < 0 || x > map_width) {
                    continue;
                }
                for (var raw_y in y_list) {
                    var y = Number(raw_y);
                    if (isNaN(y) || y < 0 || y > map_height) {
                        continue;
                    }
                    map[x][y] = 'V';
                }
            }
        }
    }
    if (expansions) {
        for (var i = 0; i < expansions.length; i++) {
            var expansion = expansions[i];
            for (var j = 0; j < expansion.castle_placements.length; j++) {
                var castle_placement = expansion.castle_placements[j];
                map[castle_placement.castle_location.x][castle_placement.castle_location.y] = 'E';
            }
        }
    }
    for (var x = 0; x <= map_width; x++) {
        for (var y = 0; y <= map_height; y++) {
            if (scope.fieldIsRamp(x, y)) {
                map[x][y] = 'R';
            }
            else if (!scope.positionIsPathable(x, y)) {
                map[x][y] = '#';
            }
        }
    }
    var players = scope.getArrayOfPlayerNumbers();
    for (var i = 0; i < players.length; i++) {
        var player_id = players[i];
        var start_location = (0, analyze_teams_1.ConfigureStartLocation)(player_id);
        for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
            var x = start_location.x + dx;
            for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
                var y = start_location.y + dy;
                map[x][y] = String(player_id);
            }
        }
    }
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var raw_mine = raw_gold_mines[i];
        for (var dx = 0; dx < constants_1.MINE_WIDTH; dx++) {
            var x = raw_mine.x + dx;
            for (var dy = 0; dy < constants_1.MINE_HEIGHT; dy++) {
                var y = raw_mine.y + dy;
                map[x][y] = '$';
            }
        }
    }
    if (midpoints) {
        for (var i = 0; i < midpoints.length; i++) {
            var midpoint = midpoints[i];
            var x = Math.round(midpoint.x);
            var y = Math.round(midpoint.y);
            map[x][y] = '+';
        }
    }
    if (debug) {
        for (var _r = 0, _s = Object.entries(debug); _r < _s.length; _r++) {
            var _t = _s[_r], raw_x = _t[0], y_list = _t[1];
            var x = Number(raw_x);
            if (isNaN(x)) {
                continue;
            }
            for (var raw_y in y_list) {
                var y = Number(raw_y);
                if (isNaN(y)) {
                    continue;
                }
                if (!debug[x][y]) {
                    continue;
                }
                map[x][y] = '?';
            }
        }
    }
    var printable_map = '';
    for (var _u = 0, _v = Object.entries(map); _u < _v.length; _u++) {
        var _w = _v[_u], raw_x = _w[0], y_list = _w[1];
        var x = Number(raw_x);
        if (isNaN(x) || x < 0 || x > map_width) {
            continue;
        }
        printable_map += '\n';
        for (var _x = 0, _y = Object.entries(y_list); _x < _y.length; _x++) {
            var _z = _y[_x], raw_y = _z[0], char = _z[1];
            var y = Number(raw_y);
            if (isNaN(y) || y < 0 || y > map_height) {
                continue;
            }
            printable_map += char;
        }
    }
    console.log(printable_map);
}


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SelectCastleLocations = SelectCastleLocations;
var calculate_worker_paths_1 = __webpack_require__(19);
var calculate_tower_location_1 = __webpack_require__(20);
var calculate_viable_castle_locations_1 = __webpack_require__(16);
var constants_1 = __webpack_require__(5);
function SelectCastleLocations(_a) {
    var raw_gold_mines = _a.raw_gold_mines, teams = _a.teams;
    var grouping = new _GroupCastleLocations(raw_gold_mines);
    var placements = grouping.Run();
    return placements.map(function (placement, index) {
        return _AddCastlePositionData(placement, index, teams);
    });
}
var _GroupCastleLocations = (function () {
    function _GroupCastleLocations(raw_gold_mines) {
        this.raw_gold_mines = raw_gold_mines;
        this.placements = [];
    }
    _GroupCastleLocations.prototype.Run = function () {
        for (var i = 0; i < this.raw_gold_mines.length; i++) {
            var raw_mine = this.raw_gold_mines[i];
            var mine_cache = raw_mine.ranger_bot;
            if (!mine_cache.viable_castle_locations || mine_cache.viable_castle_locations.length <= 0) {
                throw new Error('viable_castle_locations missing for gold mine ' + raw_mine.id);
            }
            this._Place(raw_mine);
        }
        return this.placements;
    };
    _GroupCastleLocations.prototype._Place = function (raw_mine) {
        var mine_cache = raw_mine.ranger_bot;
        if (mine_cache.viable_castle_locations === undefined) {
            throw new Error('SelectCastleLocations called out of order');
        }
        var viable_castle_locations = mine_cache.viable_castle_locations;
        for (var i = 0; i < this.placements.length; i++) {
            var existing_placement = this.placements[i];
            var shared_locations = existing_placement.viable_castle_locations.filter(function (location) {
                var y_list = viable_castle_locations[location.x];
                if (!y_list) {
                    return false;
                }
                var ground_distance = y_list[location.y];
                if (ground_distance === undefined) {
                    return false;
                }
                return !isNaN(ground_distance);
            });
            if (shared_locations.length <= 0) {
                continue;
            }
            existing_placement.viable_castle_locations = shared_locations;
            existing_placement.raw_gold_mines.push(raw_mine);
            return;
        }
        var new_locations = [];
        for (var raw_x in mine_cache.viable_castle_locations) {
            var x = Number(raw_x);
            if (isNaN(x)) {
                continue;
            }
            var y_list = mine_cache.viable_castle_locations[x];
            for (var raw_y in y_list) {
                var y = Number(raw_y);
                if (isNaN(y)) {
                    continue;
                }
                var new_location = { 'x': x, 'y': y };
                new_locations.push(new_location);
            }
        }
        var new_placement = {
            'viable_castle_locations': new_locations,
            'raw_gold_mines': [raw_mine],
        };
        this.placements.push(new_placement);
    };
    return _GroupCastleLocations;
}());
function _AddCastlePositionData(partial, expansion_id, teams) {
    var castle_placements = partial.viable_castle_locations.map(function (location) {
        return _CalculateCastlePositionData(location, partial.raw_gold_mines, teams);
    });
    var _loop_1 = function (i) {
        var raw_mine = partial.raw_gold_mines[i];
        var mine_cache = raw_mine.ranger_bot;
        if (mine_cache.expansion_data) {
            return "continue";
        }
        var new_expansion_data = [];
        for (var j = 0; j < castle_placements.length; j++) {
            var castle_data = castle_placements[j];
            var mine_data = castle_data.mines_data
                .find(function (md) { return md.gold_mine_id == raw_mine.id; });
            if (mine_data === undefined) {
                if (constants_1.DEBUG) {
                    console.log(castle_data);
                }
                throw new Error('Missing mine_data for _AddCastlePositionData');
            }
            new_expansion_data.push({
                'castle_location': castle_data.castle_location,
                'midpoint': mine_data.midpoint,
                'worker_paths': mine_data.worker_paths,
                'tower_location': castle_data.tower_location,
            });
        }
        mine_cache.expansion_data = new_expansion_data;
    };
    for (var i = 0; i < partial.raw_gold_mines.length; i++) {
        _loop_1(i);
    }
    var new_expansion_placement = {
        'castle_placements': castle_placements.sort(function (a, b) { return a.score - b.score; }),
        'id': expansion_id,
    };
    return new_expansion_placement;
}
function _CalculateCastlePositionData(castle_location, raw_gold_mines, teams) {
    var mines_data = [];
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var raw_mine = raw_gold_mines[i];
        var mine_cache = raw_mine.ranger_bot;
        var midpoint = (0, calculate_viable_castle_locations_1.CalculateMidpoint)(castle_location.x, castle_location.y, raw_mine);
        var worker_paths = (0, calculate_worker_paths_1.CalculateWorkerPaths)({
            raw_mine: raw_mine,
            castle_location: castle_location,
            teams: teams,
        });
        mine_cache._worker_paths = worker_paths;
        mine_cache._castle_location = castle_location;
        mines_data.push({
            'gold_mine_id': raw_mine.id,
            'midpoint': midpoint,
            'worker_paths': worker_paths,
        });
    }
    var tower_location = (0, calculate_tower_location_1.CalculateTowerLocation)({
        mines_data: mines_data,
        raw_gold_mines: raw_gold_mines,
    });
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var mine_cache = raw_gold_mines[i].ranger_bot;
        delete mine_cache['_worker_paths'];
        delete mine_cache['_castle_location'];
    }
    var score = 0;
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var raw_mine = raw_gold_mines[i];
        var viable_castle_locations = raw_mine.ranger_bot.viable_castle_locations;
        var y_list = viable_castle_locations[castle_location.x];
        if (!y_list) {
            throw new Error('viable_castle_locations missing for mine ' + raw_mine.id + ' at ' + castle_location.x);
        }
        var ground_distance = y_list[castle_location.y];
        if (ground_distance === undefined) {
            throw new Error('viable_castle_location missing for mine ' + raw_mine.id + ' at ' + castle_location.x + ', ' + castle_location.y);
        }
        if (isNaN(ground_distance)) {
            score += 9001;
        }
        else {
            score += ground_distance;
        }
    }
    var new_castle_placement = {
        'castle_location': castle_location,
        'mines_data': mines_data,
        'tower_location': tower_location,
        'score': score,
    };
    return new_castle_placement;
}


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateWorkerPaths = CalculateWorkerPaths;
var constants_1 = __webpack_require__(5);
var buildable_1 = __webpack_require__(15);
function CalculateWorkerPaths(_a) {
    var raw_mine = _a.raw_mine, castle_location = _a.castle_location, teams = _a.teams;
    var castle_points = [];
    for (var dx = 0; dx < constants_1.CASTLE_WIDTH; dx++) {
        for (var dy = 0; dy < constants_1.CASTLE_HEIGHT; dy++) {
            castle_points.push({ 'x': castle_location.x + dx,
                'y': castle_location.y + dy });
        }
    }
    var mine_points = [];
    for (var dx = 0; dx < constants_1.MINE_WIDTH; dx++) {
        for (var dy = 0; dy < constants_1.MINE_HEIGHT; dy++) {
            mine_points.push({ 'x': raw_mine.x + dx, 'y': raw_mine.y + dy });
        }
    }
    var output = [];
    for (var i = 0; i < castle_points.length; i++) {
        var start = castle_points[i];
        var _loop_1 = function (j) {
            var finish = mine_points[j];
            var point = start;
            while (point.x != finish.x || point.y != finish.y) {
                var dx = (function () {
                    if (finish.x > point.x) {
                        return 1;
                    }
                    else if (finish.x < point.x) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                })();
                var dy = (function () {
                    if (finish.y > point.y) {
                        return 1;
                    }
                    else if (finish.y < point.y) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                })();
                var candidates = [];
                if (dx != 0) {
                    candidates.push({ 'x': point.x + dx, 'y': point.y });
                }
                if (dy != 0) {
                    candidates.push({ 'x': point.x, 'y': point.y + dy });
                }
                if (candidates.length <= 0) {
                    point = finish;
                }
                else if (candidates.length == 1) {
                    point = candidates[0];
                }
                else {
                    candidates.sort(function (a, b) {
                        var dist_a = Math.sqrt(Math.pow((finish.x - a.x), 2) + Math.pow((finish.y - a.y), 2));
                        var dist_b = Math.sqrt(Math.pow((finish.x - b.x), 2) + Math.pow((finish.y - b.y), 2));
                        return dist_a - dist_b;
                    });
                    point = candidates[0];
                }
                if ((0, buildable_1.IsBuildable)({ map_location: point, teams: teams, exclude_worker_paths: false })) {
                    if (output[point.x] === undefined) {
                        output[point.x] = [];
                    }
                    output[point.x][point.y] = true;
                }
            }
        };
        for (var j = 0; j < mine_points.length; j++) {
            _loop_1(j);
        }
    }
    return output;
}


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateTowerLocation = CalculateTowerLocation;
var constants_1 = __webpack_require__(5);
var buildable_1 = __webpack_require__(15);
function CalculateTowerLocation(_a) {
    var mines_data = _a.mines_data, raw_gold_mines = _a.raw_gold_mines;
    var midpoints = [];
    var perimeter = [];
    var _loop_1 = function (i) {
        var mine_data = mines_data[i];
        var z = scope.getHeightLevel(mine_data.midpoint.x, mine_data.midpoint.y);
        midpoints.push(mine_data.midpoint);
        var _loop_2 = function (raw_x, y_list) {
            var x = Number(raw_x);
            if (isNaN(x)) {
                return "continue";
            }
            var new_x = (function () {
                if (x < mine_data.midpoint.x) {
                    return x - 1;
                }
                else {
                    return x + 1;
                }
            })();
            var _loop_3 = function (raw_y) {
                var y = Number(raw_y);
                if (isNaN(y)) {
                    return "continue";
                }
                if (_IsValid(new_x, y, z, raw_gold_mines)) {
                    if (perimeter[new_x] === undefined) {
                        perimeter[new_x] = [];
                    }
                    perimeter[new_x][y] = true;
                }
                var new_y = (function () {
                    if (y < mine_data.midpoint.y) {
                        return y - 1;
                    }
                    else {
                        return y + 1;
                    }
                })();
                if (_IsValid(x, new_y, z, raw_gold_mines)) {
                    if (perimeter[x] === undefined) {
                        perimeter[x] = [];
                    }
                    perimeter[x][new_y] = true;
                }
            };
            for (var raw_y in y_list) {
                _loop_3(raw_y);
            }
        };
        for (var _g = 0, _h = Object.entries(mine_data.worker_paths); _g < _h.length; _g++) {
            var _j = _h[_g], raw_x = _j[0], y_list = _j[1];
            _loop_2(raw_x, y_list);
        }
    };
    for (var i = 0; i < mines_data.length; i++) {
        _loop_1(i);
    }
    var candidates = [];
    for (var _i = 0, _b = Object.entries(perimeter); _i < _b.length; _i++) {
        var _c = _b[_i], raw_x = _c[0], y_list = _c[1];
        var x = Number(raw_x);
        if (isNaN(x)) {
            continue;
        }
        for (var raw_y in y_list) {
            var y = Number(raw_y);
            if (isNaN(y)) {
                continue;
            }
            for (var dx = (-1 * constants_1.TOWER_WIDTH); dx <= constants_1.TOWER_WIDTH; dx++) {
                var xx = x - dx;
                for (var dy = (-1 * constants_1.TOWER_HEIGHT); dy <= constants_1.TOWER_HEIGHT; dy++) {
                    var yy = y - dy;
                    if (candidates[xx] === undefined) {
                        candidates[xx] = [];
                    }
                    candidates[xx][yy] = true;
                }
            }
        }
    }
    var viable = [];
    for (var _d = 0, _e = Object.entries(candidates); _d < _e.length; _d++) {
        var _f = _e[_d], raw_x = _f[0], y_list = _f[1];
        var x = Number(raw_x);
        if (isNaN(x)) {
            continue;
        }
        for (var raw_y in y_list) {
            var y = Number(raw_y);
            if (isNaN(y)) {
                continue;
            }
            if (!_AreBuildable(x, y, raw_gold_mines)) {
                continue;
            }
            var center_x = x + (constants_1.TOWER_WIDTH - 1) / 2;
            var center_y = y + (constants_1.TOWER_HEIGHT - 1) / 2;
            var score = 0;
            for (var i = 0; i < midpoints.length; i++) {
                var midpoint = midpoints[i];
                score += Math.sqrt(Math.pow((center_x - midpoint.x), 2) + Math.pow((center_y - midpoint.y), 2));
            }
            viable.push({ 'x': x, 'y': y, 'score': score });
        }
    }
    if (viable.length <= 0) {
        if (constants_1.DEBUG) {
            console.log(perimeter);
            console.log(candidates);
        }
        throw new Error('no viable tower locations');
    }
    var winner = viable.sort(function (a, b) { return a.score - b.score; })[0];
    return { 'x': winner.x, 'y': winner.y };
}
function _IsValid(x, y, z, raw_gold_mines) {
    if (scope.getHeightLevel(x, y) != z) {
        return false;
    }
    return (0, buildable_1.IsBuildable)({
        map_location: { 'x': x, 'y': y },
        exclude_worker_paths: true,
        raw_gold_mines: raw_gold_mines,
    });
}
function _AreBuildable(x, y, raw_gold_mines) {
    return (0, buildable_1.AreBuildable)({
        x_min: x,
        x_max: x + constants_1.TOWER_WIDTH - 1,
        y_min: y,
        y_max: y + constants_1.TOWER_HEIGHT - 1,
        exclude_worker_paths: true,
        raw_gold_mines: raw_gold_mines,
    });
}


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdentifyStartingCastle = IdentifyStartingCastle;
exports.IdentifyStartingExpansion = IdentifyStartingExpansion;
var constants_1 = __webpack_require__(5);
function IdentifyStartingCastle(_a) {
    var teams = _a.teams;
    var my_castles = scope.getBuildings({ player: teams.my.id, type: 'Castle' })
        .map(function (c) { return c.unit; });
    if (my_castles.length != 1) {
        if (constants_1.DEBUG) {
            console.log(my_castles);
        }
        throw new Error('wrong number of castles for IdentifyStartingExpansion');
    }
    var starting_castle = my_castles[0];
    if (starting_castle.x != teams.my.start.x || starting_castle.y != teams.my.start.y) {
        if (constants_1.DEBUG) {
            console.log(teams);
            console.log(starting_castle);
        }
        throw new Error("dude where's my castle?");
    }
    return starting_castle;
}
function IdentifyStartingExpansion(_a) {
    var expansions = _a.expansions, starting_castle = _a.starting_castle;
    var output = expansions.find(function (expansion) {
        return expansion.castle_placements.some(function (placement) {
            return starting_castle.x == placement.castle_location.x && starting_castle.y == placement.castle_location.y;
        });
    });
    if (!output) {
        if (constants_1.DEBUG) {
            console.log(expansions);
            console.log(starting_castle);
        }
        throw new Error('IdentifyStartingExpansion failed');
    }
    return output;
}


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScoreExpansions = ScoreExpansions;
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
function ScoreExpansions(_a) {
    var expansions = _a.expansions, starting_expansion = _a.starting_expansion, teams = _a.teams;
    var start = starting_expansion.castle_placements[0].mines_data[0].midpoint;
    return expansions.map(function (expansion) {
        var destination = expansion.castle_placements[0].mines_data[0].midpoint;
        var score = (0, ground_distance_1.SafeGroundDistance)(start, destination);
        if (isNaN(score)) {
            if (constants_1.DEBUG) {
                console.log(start);
                console.log(destination);
                console.log('Error: missing my ground distance for ScoreExpansions');
            }
            score = Math.sqrt(Math.pow((start.x - destination.x), 2) + Math.pow((start.y - destination.y), 2));
        }
        var enemy_start_distances = [];
        for (var i = 0; i < teams.enemies.length; i++) {
            var enemy_id = teams.enemies[i];
            var enemy_start = teams.players[enemy_id].start_location;
            var ground_distance = (0, ground_distance_1.SafeGroundDistance)(enemy_start, destination);
            if (isNaN(ground_distance)) {
                if (constants_1.DEBUG) {
                    console.log(enemy_start);
                    console.log(destination);
                    console.log('Error: missing enemy ground distance for ScoreExpansions');
                }
                ground_distance = Math.sqrt(Math.pow((enemy_start.x - destination.x), 2) + Math.pow((enemy_start.y - destination.y), 2));
            }
            enemy_start_distances.push(ground_distance);
        }
        score -= Math.min.apply(Math, enemy_start_distances);
        var player_castle_placements = expansion.castle_placements.map(function (placement) {
            var active_mines_data = placement.mines_data.map(function (md) {
                return {
                    'gold_mine_id': md.gold_mine_id,
                    'midpoint': structuredClone(md.midpoint),
                    'worker_paths': structuredClone(md.worker_paths),
                    'workers': [],
                };
            });
            return {
                'castle_location': structuredClone(placement.castle_location),
                'mines_data': active_mines_data,
                'tower_location': structuredClone(placement.tower_location),
                'score': placement.score,
            };
        });
        var new_player_expansion = {
            'castle_placements': player_castle_placements,
            'id': expansion.id,
            'score': score,
        };
        return new_player_expansion;
    }).sort(function (a, b) { return a.score - b.score; });
}


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateUpgradeLevel = CalculateUpgradeLevel;
exports.CalculateUpgradeCost = CalculateUpgradeCost;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function CalculateUpgradeLevel(_a) {
    var data_hub = _a.data_hub, upgrade_type = _a.upgrade_type;
    var output = scope.player.upgrades[upgrade_type];
    if (!output) {
        output = 0;
    }
    var name_for_type = (0, utils_1.GetStringFieldValue)({ piece_name: upgrade_type, field_name: 'name' });
    for (var i = 0; i < data_hub.my_forges.length; i++) {
        var forge = data_hub.my_forges[i];
        if (forge.isUnderConstruction) {
            continue;
        }
        for (var j = 0; j < 5; j++) {
            var order = forge.queue[j];
            if (!order) {
                continue;
            }
            if (order.name == name_for_type) {
                output++;
            }
        }
    }
    return output;
}
function CalculateUpgradeCost(_a) {
    var upgrade_type = _a.upgrade_type, upgrade_level = _a.upgrade_level;
    var base_cost = (0, utils_1.GetNumberFieldValue)({ piece_name: upgrade_type, field_name: 'cost' });
    var effects_fields = scope.getTypeFieldValue(upgrade_type, 'effectsFields');
    if (!Array.isArray(effects_fields)) {
        if (constants_1.DEBUG) {
            console.log(effects_fields);
        }
        throw new Error('Wrong type of effects_fields for CalculateUpgradeCost');
    }
    var cost_index = effects_fields.indexOf('cost');
    var effects_modifications = scope.getTypeFieldValue(upgrade_type, 'effectsModifications');
    if (!Array.isArray(effects_modifications)) {
        if (constants_1.DEBUG) {
            console.log(effects_modifications);
        }
        throw new Error('Wrong type of effects_modifications for CalculateUpgradeCost');
    }
    var increment_cost = effects_modifications[cost_index];
    return base_cost + increment_cost * upgrade_level;
}


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetCachedGoldMines = GetCachedGoldMines;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function GetCachedGoldMines(_a) {
    var team_cache_key = _a.team_cache_key;
    if (scope.ranger_bot.team_caches === undefined) {
        throw new Error('DataHub#_GetGoldMines called out of order');
    }
    if (scope.ranger_bot.team_caches[team_cache_key].gold_mines === undefined) {
        var new_gold_mines = [];
        var raw_gold_mines = (0, utils_1.GetGoldMines)();
        for (var i = 0; i < raw_gold_mines.length; i++) {
            var raw_mine = raw_gold_mines[i];
            var raw_cache = raw_mine.ranger_bot;
            if (raw_cache === undefined) {
                if (constants_1.DEBUG) {
                    console.log(raw_gold_mines);
                }
                throw new Error('no cache for gold mine ' + raw_mine.id);
            }
            var exclusion_zone = raw_cache.exclusion_zone;
            if (exclusion_zone === undefined) {
                if (constants_1.DEBUG) {
                    console.log(raw_gold_mines);
                }
                throw new Error('no exclusion_zone for gold mine ' + raw_mine.id);
            }
            var perimeter = raw_cache.perimeter;
            if (perimeter === undefined) {
                if (constants_1.DEBUG) {
                    console.log(raw_gold_mines);
                }
                throw new Error('no perimeter for gold mine ' + raw_mine.id);
            }
            var viable_castle_locations = raw_cache.viable_castle_locations;
            if (viable_castle_locations === undefined) {
                if (constants_1.DEBUG) {
                    console.log(raw_gold_mines);
                }
                throw new Error('no viable_castle_locations for gold mine ' + raw_mine.id);
            }
            var expansion_data = raw_cache.expansion_data;
            if (expansion_data === undefined) {
                if (constants_1.DEBUG) {
                    console.log(raw_gold_mines);
                }
                throw new Error('no expansion_data for gold mine ' + raw_mine.id);
            }
            var new_gold_mine = {
                'x': raw_mine.x,
                'y': raw_mine.y,
                'id': raw_mine.id,
                'gold': raw_mine.gold,
                'center': raw_cache.center,
                'type': { 'id_string': raw_mine.type.id_string },
                'exclusion_zone': exclusion_zone,
                'perimeter': perimeter,
                'viable_castle_locations': viable_castle_locations,
                'expansion_data': expansion_data,
            };
            new_gold_mines.push(new_gold_mine);
        }
        scope.ranger_bot.team_caches[team_cache_key].gold_mines = new_gold_mines;
    }
    return scope.ranger_bot.team_caches[team_cache_key].gold_mines;
}


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetNeutralBuildings = GetNeutralBuildings;
var utils_1 = __webpack_require__(6);
var unit_stats_1 = __webpack_require__(26);
function GetNeutralBuildings(_a) {
    var team_cache_key = _a.team_cache_key, teams = _a.teams;
    if (scope.ranger_bot.team_caches === undefined) {
        throw new Error('DataHub#_GetNeutralBuildings called out of order');
    }
    if (scope.ranger_bot.team_caches[team_cache_key].neutral_buildings === undefined) {
        var new_neutral_buildings = [];
        var raw_neutral_buildings = scope.getBuildings({ player: 0 }).map(function (b) { return b.unit; });
        for (var i = 0; i < raw_neutral_buildings.length; i++) {
            var neutral_building = raw_neutral_buildings[i];
            if (neutral_building.type.id_string == 'goldmine') {
                continue;
            }
            if (neutral_building.type.id_string == 'castle' &&
                neutral_building.x == teams.my.start.x &&
                neutral_building.y == teams.my.start.y) {
                continue;
            }
            var neutral_building_width = (0, utils_1.GetNumberFieldValue)({
                piece_name: neutral_building.type.id_string,
                field_name: 'sizeX',
            });
            var center_offset_x = (neutral_building_width - 1) / 2;
            var neutral_building_height = (0, utils_1.GetNumberFieldValue)({
                piece_name: neutral_building.type.id_string,
                field_name: 'sizeY',
            });
            var center_offset_y = (neutral_building_height - 1) / 2;
            var center = {
                'x': neutral_building.x + center_offset_x,
                'y': neutral_building.y + center_offset_y,
            };
            var new_neutral_building = {
                'id': neutral_building.id,
                'x': neutral_building.x,
                'y': neutral_building.y,
                'type': neutral_building.type.id_string,
                'name': neutral_building.type.name,
                'hp': neutral_building.hp,
                'armor': (0, unit_stats_1.CalculateArmor)(neutral_building),
                'center': center,
            };
            new_neutral_buildings.push(new_neutral_building);
        }
        scope.ranger_bot.team_caches[team_cache_key].neutral_buildings = new_neutral_buildings;
    }
    return scope.ranger_bot.team_caches[team_cache_key].neutral_buildings;
}


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateDps = CalculateDps;
exports.CalculateArmor = CalculateArmor;
exports.CalculateRange = CalculateRange;
exports.ArmorFactor = ArmorFactor;
exports.IsFlying = IsFlying;
exports.IsInvisible = IsInvisible;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function CalculateDps(piece) {
    var dmg = (0, utils_1.GetNumberFieldValue)({ piece_name: piece.type.id_string, field_name: 'dmg' });
    var attack_cooldown = (0, utils_1.GetNumberFieldValue)({ piece_name: piece.type.id_string, field_name: 'weaponCooldown' });
    var attack_speed = constants_1.SPEED_FACTOR / attack_cooldown;
    return dmg * attack_speed;
}
function CalculateArmor(piece) {
    return piece.type.armor;
}
function CalculateRange(piece) {
    if ('archer' == piece.type.id_string && piece.owner.upgrades.upgrange && 1 >= piece.owner.upgrades.upgrange) {
        return piece.type.range + 1;
    }
    else {
        return piece.type.range;
    }
}
function ArmorFactor(armor) {
    return 13 / (13 - armor);
}
function IsFlying(unit) {
    return !!unit.type.flying || !!unit.type.isFlying;
}
function IsInvisible(piece) {
    return piece.modifierMods && undefined !== piece.modifierMods.isInvisible && 0 < piece.modifierMods.isInvisible;
}


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatePieceCaches = UpdatePieceCaches;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function UpdatePieceCaches(_a) {
    var data_hub = _a.data_hub;
    for (var i = 0; i < data_hub.friendly_buildings.length; i++) {
        var friendly_building = data_hub.friendly_buildings[i];
        if (friendly_building.ranger_bot === undefined) {
            var friendly_building_width = (0, utils_1.GetNumberFieldValue)({
                piece_name: friendly_building.type.id_string,
                field_name: 'sizeX',
            });
            var friendly_building_height = (0, utils_1.GetNumberFieldValue)({
                piece_name: friendly_building.type.id_string,
                field_name: 'sizeY',
            });
            var dx = (friendly_building_width - 1) / 2;
            var dy = (friendly_building_height - 1) / 2;
            var center = {
                'x': friendly_building.x + dx,
                'y': friendly_building.y + dy,
            };
            var new_building_cache = {
                'center': center,
            };
            friendly_building.ranger_bot = new_building_cache;
        }
        if (friendly_building.ranger_bot.mining_data) {
            _AssociateMiningData(friendly_building, data_hub.gold_mines);
        }
    }
    for (var i = 0; i < data_hub.friendly_units.length; i++) {
        var friendly_unit = data_hub.friendly_units[i];
        if (friendly_unit.ranger_bot === undefined) {
            var new_unit_cache = {};
            friendly_unit.ranger_bot = new_unit_cache;
        }
    }
    for (var i = 0; i < data_hub.map.expansions.length; i++) {
        var expansion = data_hub.map.expansions[i];
        for (var j = 0; j < expansion.castle_placements.length; j++) {
            var placement = expansion.castle_placements[j];
            var _loop_1 = function (k) {
                var active_mine = placement.mines_data[k];
                if (!active_mine.gold_mine) {
                    var new_mine = data_hub.gold_mines
                        .find(function (mine) { return mine.id == active_mine.gold_mine_id; });
                    if (!new_mine) {
                        if (constants_1.DEBUG) {
                            console.log(active_mine);
                            console.log(data_hub.gold_mines);
                        }
                        throw new Error('Missing gold mine for _UpdatePieceCaches');
                    }
                    active_mine.gold_mine = new_mine;
                }
            };
            for (var k = 0; k < placement.mines_data.length; k++) {
                _loop_1(k);
            }
        }
    }
}
function _AssociateMiningData(friendly_castle, gold_mines) {
    var mining_data = friendly_castle.ranger_bot.mining_data;
    var _loop_2 = function (i) {
        var active_mine = mining_data.mines_data[i];
        if (!active_mine.gold_mine) {
            var new_mine = gold_mines
                .find(function (mine) { return mine.id == active_mine.gold_mine_id; });
            if (!new_mine) {
                if (constants_1.DEBUG) {
                    console.log(active_mine);
                    console.log(gold_mines);
                }
                throw new Error('Missing gold mine for _AssociateMiningData');
            }
            active_mine.gold_mine = new_mine;
            if (!new_mine.castle) {
                new_mine.castle = friendly_castle;
            }
        }
    };
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        _loop_2(i);
    }
}


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateNeutralObjects = UpdateNeutralObjects;
var utils_1 = __webpack_require__(6);
function UpdateNeutralObjects(_a) {
    var data_hub = _a.data_hub;
    var raw_gold_mines = (0, utils_1.GetGoldMines)();
    var raw_neutral_buildings = scope.getBuildings({ player: 0 }).map(function (b) { return b.unit; });
    raw_neutral_buildings = raw_neutral_buildings.filter(function (b) { return b.type.id_string != 'goldmine'; });
    for (var i = 0; i < data_hub.gold_mines.length; i++) {
        var gold_mine = data_hub.gold_mines[i];
        if (!data_hub.LocationIsVisible(gold_mine.center)) {
            continue;
        }
        for (var j = 0; j < raw_gold_mines.length; j++) {
            var raw_mine = raw_gold_mines[j];
            if (raw_mine.x != gold_mine.x || raw_mine.y != gold_mine.y) {
                continue;
            }
            gold_mine.gold = raw_mine.gold;
            break;
        }
    }
    for (var i = 0; i < data_hub.neutral_buildings.length; i++) {
        var neutral_building = data_hub.neutral_buildings[i];
        if (!data_hub.LocationIsVisible(neutral_building.center)) {
            continue;
        }
        for (var j = 0; j < raw_neutral_buildings.length; j++) {
            var raw_neutral_building = raw_neutral_buildings[j];
            if (raw_neutral_building.x != neutral_building.x || raw_neutral_building.y != neutral_building.y) {
                continue;
            }
            neutral_building.hp = raw_neutral_building.hp;
            break;
        }
    }
    data_hub.neutral_buildings = data_hub.neutral_buildings.filter(function (b) { return b.hp > 0; });
}


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageStates = ManageStates;
var manage_gold_mines_1 = __webpack_require__(30);
var manage_miners_1 = __webpack_require__(31);
var manage_builders_1 = __webpack_require__(32);
var manage_repairers_1 = __webpack_require__(35);
var filter_viable_gold_mines_1 = __webpack_require__(36);
var manage_active_castles_1 = __webpack_require__(37);
var get_workable_mines_1 = __webpack_require__(38);
var manage_active_castle_cache_1 = __webpack_require__(39);
function ManageStates(_a) {
    var data_hub = _a.data_hub;
    var gold_mines = data_hub.gold_mines;
    (0, manage_gold_mines_1.ManageGoldMines)({ gold_mines: gold_mines });
    data_hub.miners = data_hub.my_workers.filter(function (w) { return w.ranger_bot.job == 'mine'; });
    (0, manage_miners_1.ManageMiners)({ miners: data_hub.miners });
    data_hub.miners = data_hub.miners.filter(function (m) { return m.ranger_bot.job == 'mine'; });
    data_hub.builders = data_hub.my_workers.filter(function (w) { return w.ranger_bot.job == 'build'; });
    (0, manage_builders_1.ManageBuilders)({ builders: data_hub.builders });
    data_hub.builders = data_hub.builders.filter(function (b) { return b.ranger_bot.job == 'build'; });
    data_hub.house_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build House'; });
    data_hub.wolf_den_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Wolves Den'; });
    data_hub.castle_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Castle'; });
    data_hub.barracks_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Barracks'; });
    data_hub.tower_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Watchtower'; });
    data_hub.armory_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Armory'; });
    data_hub.forge_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Forge'; });
    data_hub.snake_charmer_builders = data_hub.builders.filter(function (b) { return b.ranger_bot.order == 'Build Snake Charmer'; });
    data_hub.traveling_house_builders = data_hub.house_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_wolf_den_builders = data_hub.wolf_den_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_barracks_builders = data_hub.barracks_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_tower_builders = data_hub.tower_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_armory_builders = data_hub.armory_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_forge_builders = data_hub.forge_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.traveling_snake_charmer_builders = data_hub.snake_charmer_builders.filter(function (b) { return !b.ranger_bot.target_building; });
    data_hub.repairers = data_hub.my_workers.filter(function (w) { return w.ranger_bot.job == 'repair'; });
    (0, manage_repairers_1.ManageRepairers)({ repairers: data_hub.repairers });
    data_hub.repairers = data_hub.repairers.filter(function (r) { return r.ranger_bot.job == 'repair'; });
    data_hub.viable_gold_mines = (0, filter_viable_gold_mines_1.FilterViableGoldMines)({ data_hub: data_hub });
    data_hub.active_castles = (0, manage_active_castles_1.ManageActiveCastles)({ data_hub: data_hub });
    (0, get_workable_mines_1.GetWorkableMines)({ data_hub: data_hub });
    (0, manage_active_castle_cache_1.ManageActiveCastleCache)({
        player_cache_key: data_hub.player_cache_key,
        active_mining_bases: data_hub.active_mining_bases,
        active_castles: data_hub.active_castles,
    });
    data_hub.idle_workers = data_hub.my_workers.filter(function (u) { return !u.ranger_bot.job; });
}


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageGoldMines = ManageGoldMines;
function ManageGoldMines(_a) {
    var gold_mines = _a.gold_mines;
    for (var i = 0; i < gold_mines.length; i++) {
        var gold_mine = gold_mines[i];
        if (gold_mine.tower && !gold_mine.tower.isAlive && gold_mine.tower.hp <= 0) {
            delete gold_mine['tower'];
        }
        if (gold_mine.castle && !gold_mine.castle.isAlive && gold_mine.castle.hp <= 0) {
            delete gold_mine['castle'];
        }
    }
}


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageMiners = ManageMiners;
function ManageMiners(_a) {
    var miners = _a.miners;
    for (var i = 0; i < miners.length; i++) {
        var miner = miners[i];
        var castle = miner.ranger_bot.castle;
        if (!castle.isAlive && castle.hp <= 0) {
            miner.ranger_bot = {};
        }
    }
}


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageBuilders = ManageBuilders;
var assign_repairers_1 = __webpack_require__(33);
var constants_1 = __webpack_require__(5);
function ManageBuilders(_a) {
    var builders = _a.builders;
    for (var i = 0; i < builders.length; i++) {
        var builder = builders[i];
        if (builder.order.name == 'Repair' && !builder.ranger_bot.target_building) {
            builder.ranger_bot.target_building = builder.targetUnit;
            if (builder.ranger_bot.order == 'Build Watchtower') {
                _AttachTower(builder);
            }
            else if (builder.ranger_bot.order == 'Build Castle') {
                _AttachCastle(builder);
            }
        }
        _DealocateIfFinishedOrDestroyed(builder);
    }
}
function _AttachTower(builder) {
    var target_tower = builder.ranger_bot.target_building;
    if (builder.ranger_bot.castle) {
        builder.ranger_bot.castle.ranger_bot.tower = target_tower;
    }
    var active_mines = builder.ranger_bot.active_mines;
    for (var i = 0; i < active_mines.length; i++) {
        var active_mine = active_mines[i];
        if (!active_mine.gold_mine) {
            if (constants_1.DEBUG) {
                console.log(builder.ranger_bot);
            }
            throw new Error('Missing gold mine for _AttachTower');
        }
        active_mine.gold_mine.tower = target_tower;
    }
}
function _AttachCastle(builder) {
    if (!builder.ranger_bot.placement) {
        if (constants_1.DEBUG) {
            console.log(builder.ranger_bot);
        }
        throw new Error('Missing castle placement on castle builder for _AttachCastle');
    }
    var target_castle = builder.ranger_bot.target_building;
    target_castle.ranger_bot.mining_data = {
        'mines_data': builder.ranger_bot.placement.mines_data,
        'tower_location': builder.ranger_bot.placement.tower_location,
    };
    for (var i = 0; i < builder.ranger_bot.placement.mines_data.length; i++) {
        var active_mine = builder.ranger_bot.placement.mines_data[i];
        if (!active_mine.gold_mine) {
            if (constants_1.DEBUG) {
                console.log(active_mine);
            }
            throw new Error('Missing gold_mine for _AttachCastle');
        }
        active_mine.gold_mine.castle = target_castle;
    }
}
function _DealocateIfFinishedOrDestroyed(builder) {
    if (!builder.ranger_bot.target_building) {
        return;
    }
    var target_building = builder.ranger_bot.target_building;
    if (!target_building.isUnderConstruction) {
        if (target_building.hp >= target_building.type.hp) {
            builder.ranger_bot = {};
        }
        else {
            (0, assign_repairers_1.AssignWorkerToRepair)(builder, target_building);
        }
    }
    else if (!target_building.isAlive && target_building.hp <= 0) {
        builder.ranger_bot = {};
    }
}


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssignRepairers = AssignRepairers;
exports.AssignWorkerToRepair = AssignWorkerToRepair;
var allocate_worker_1 = __webpack_require__(34);
function AssignRepairers(_a) {
    var data_hub = _a.data_hub;
    var builders = data_hub.builders;
    var repairers = data_hub.repairers;
    var needs_repair = {};
    for (var i = 0; i < data_hub.my_buildings.length; i++) {
        var my_building = data_hub.my_buildings[i];
        if (!my_building.isUnderConstruction && my_building.hp >= my_building.type.hp) {
            continue;
        }
        needs_repair[String(my_building.id)] = {
            'building': my_building,
            'repairers': [],
        };
    }
    for (var i = 0; i < builders.length; i++) {
        var builder = builders[i];
        if (!builder.ranger_bot.target_building) {
            continue;
        }
        if (!needs_repair[String(builder.ranger_bot.target_building.id)]) {
            continue;
        }
        needs_repair[String(builder.ranger_bot.target_building.id)].repairers.push(builder);
    }
    for (var i = 0; i < repairers.length; i++) {
        var repairer = repairers[i];
        if (!repairer.ranger_bot.target_building) {
            continue;
        }
        if (!needs_repair[String(repairer.ranger_bot.target_building.id)]) {
            continue;
        }
        needs_repair[String(repairer.ranger_bot.target_building.id)].repairers.push(repairer);
    }
    for (var _i = 0, _b = Object.entries(needs_repair); _i < _b.length; _i++) {
        var _c = _b[_i], _id = _c[0], data = _c[1];
        var my_building = data.building;
        var repairers_needed = my_building.type.maxUnitsToRepair - data.repairers.length;
        if (repairers_needed <= 0) {
            continue;
        }
        repairers_needed = Math.min(repairers_needed, 3);
        for (var n = 0; n < repairers_needed; n++) {
            var new_repairer = (0, allocate_worker_1.AllocateAvailableWorkerClosestToBuilding)({
                building: my_building,
                active_mines: data_hub.active_mines,
                idle_workers: data_hub.idle_workers,
            });
            if (!new_repairer) {
                continue;
            }
            AssignWorkerToRepair(new_repairer, my_building);
            repairers.push(new_repairer);
        }
    }
}
function AssignWorkerToRepair(worker, building) {
    worker.ranger_bot = {
        'job': 'repair',
        'target_building': building,
    };
    scope.order('Move', [{ 'unit': worker }], building.ranger_bot.center);
}


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AllocateAvailableWorkerClosestToLocation = AllocateAvailableWorkerClosestToLocation;
exports.AllocateWorkerFromActiveCastle = AllocateWorkerFromActiveCastle;
exports.AllocateAvailableWorkerClosestToBuilding = AllocateAvailableWorkerClosestToBuilding;
exports.AllocateWorkerFromActiveMine = AllocateWorkerFromActiveMine;
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
function AllocateAvailableWorkerClosestToBuilding(_a) {
    var building = _a.building, active_mines = _a.active_mines, idle_workers = _a.idle_workers;
    var useful_mines = active_mines.filter(function (mine) { return mine.workers.length > 0; });
    if (useful_mines.length > 0) {
        var giver_mine = (0, ground_distance_1.GetClosestActiveMineToBuilding)(building, useful_mines);
        if (giver_mine) {
            var new_worker = AllocateWorkerFromActiveMine(giver_mine);
            if (new_worker) {
                return new_worker;
            }
            else if (constants_1.DEBUG) {
                console.log('Error: Missing new_worker for AllocateAvailableWorkerClosestToBuilding');
            }
        }
        else if (constants_1.DEBUG) {
            console.log('Error: Missing giver_mine for AllocateAvailableWorkerClosestToBuilding');
        }
    }
    else if (constants_1.DEBUG) {
        console.log('Error: No useful_mines  for AllocateAvailableWorkerClosestToBuilding');
    }
    if (idle_workers.length > 0) {
        var closest_idle_worker = (0, ground_distance_1.GetClosestUnitToBuilding)(building, idle_workers);
        if (closest_idle_worker) {
            closest_idle_worker.ranger_bot = {};
            return closest_idle_worker;
        }
        else {
            if (constants_1.DEBUG) {
                console.log('Error: Missing idle worker for AllocateAvailableWorkerClosestToBuilding');
            }
            return undefined;
        }
    }
    else {
        if (constants_1.DEBUG) {
            console.log('Error: AllocateAvailableWorkerClosestToBuilding Failed');
        }
        return undefined;
    }
}
function AllocateWorkerFromActiveMine(active_mine) {
    if (!active_mine.gold_mine) {
        if (constants_1.DEBUG) {
            console.log(active_mine);
        }
        throw new Error('Missing gold mine for AllocateWorkerFromActiveMine');
    }
    var gold_mine = active_mine.gold_mine;
    if (!gold_mine.castle) {
        if (constants_1.DEBUG) {
            console.log(gold_mine);
        }
        throw new Error('Missing castle for AllocateWorkerFromActiveMine');
    }
    var castle = gold_mine.castle;
    var empty_hands = active_mine.workers.filter(function (w) { return (!w.carriedGoldAmount || w.carriedGoldAmount <= 0); });
    if (empty_hands.length <= 0) {
        empty_hands = active_mine.workers;
    }
    if (empty_hands.length <= 0) {
        return undefined;
    }
    var with_distance = empty_hands.map(function (worker) {
        return {
            'worker': worker,
            'distance': Math.sqrt(Math.pow((castle.ranger_bot.center.x - worker.pos.x), 2) +
                Math.pow((castle.ranger_bot.center.y - worker.pos.y), 2)),
        };
    }).sort(function (a, b) { return a.distance - b.distance; });
    var output = with_distance[0].worker;
    active_mine.workers = active_mine.workers.filter(function (w) { return w.id != output.id; });
    output.ranger_bot = {};
    return output;
}
function AllocateWorkerFromActiveCastle(giver_castle) {
    var active_mines = giver_castle.ranger_bot.mining_data.mines_data;
    for (var i = 0; i < active_mines.length; i++) {
        var active_mine = active_mines[i];
        var new_worker = AllocateWorkerFromActiveMine(active_mine);
        if (new_worker) {
            return new_worker;
        }
    }
    return undefined;
}
function AllocateAvailableWorkerClosestToLocation(_a) {
    var map_location = _a.map_location, active_mines = _a.active_mines, idle_workers = _a.idle_workers;
    var useful_mines = active_mines.filter(function (mine) { return mine.workers.length > 0; });
    if (useful_mines.length > 0) {
        var giver_mine = (0, ground_distance_1.GetClosestActiveMineToLocation)(map_location, useful_mines);
        if (giver_mine) {
            var new_worker = AllocateWorkerFromActiveMine(giver_mine);
            if (new_worker) {
                return new_worker;
            }
            else if (constants_1.DEBUG) {
                console.log('Error: Missing new_worker for AllocateAvailableWorkerClosestToLocation');
            }
        }
        else if (constants_1.DEBUG) {
            console.log('Error: Missing giver_mine for AllocateAvailableWorkerClosestToLocation');
        }
    }
    else if (constants_1.DEBUG) {
        console.log('Error: No useful_mines for AllocateAvailableWorkerClosestToLocation');
    }
    if (idle_workers.length > 0) {
        var closest_idle_worker = (0, ground_distance_1.GetClosestUnitToLocation)(map_location, idle_workers);
        if (closest_idle_worker) {
            closest_idle_worker.ranger_bot = {};
            return closest_idle_worker;
        }
        else {
            if (constants_1.DEBUG) {
                console.log('ERROR: Missing idle worker for AllocateAvailableWorkerClosestToLocation');
            }
            return undefined;
        }
    }
    else {
        if (constants_1.DEBUG) {
            console.log('ERROR: AllocateAvailableWorkerClosestToLocation Failed');
        }
        return undefined;
    }
}


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageRepairers = ManageRepairers;
function ManageRepairers(_a) {
    var repairers = _a.repairers;
    for (var i = 0; i < repairers.length; i++) {
        var repairer = repairers[i];
        var target_building = repairer.ranger_bot.target_building;
        if (!target_building.isUnderConstruction && target_building.hp >= target_building.type.hp) {
            repairer.ranger_bot = {};
        }
        else if (!target_building.isAlive && target_building.hp <= 0) {
            repairer.ranger_bot = {};
        }
    }
}


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilterViableGoldMines = FilterViableGoldMines;
function FilterViableGoldMines(_a) {
    var data_hub = _a.data_hub;
    var gold_mines = data_hub.gold_mines;
    return gold_mines.filter(function (gold_mine) {
        if (gold_mine.gold <= 0 || gold_mine.castle) {
            return false;
        }
        for (var i = 0; i < data_hub.friendly_buildings.length; i++) {
            var friendly_castle = data_hub.friendly_buildings[i];
            if (friendly_castle.type.name != 'Castle' || !friendly_castle.ranger_bot.mining_data) {
                continue;
            }
            for (var j = 0; j < friendly_castle.ranger_bot.mining_data.mines_data.length; j++) {
                var active_mine_data = friendly_castle.ranger_bot.mining_data.mines_data[j];
                if (active_mine_data.gold_mine_id == gold_mine.id) {
                    return false;
                }
            }
        }
        return true;
    });
}


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageActiveCastles = ManageActiveCastles;
var constants_1 = __webpack_require__(5);
function ManageActiveCastles(_a) {
    var data_hub = _a.data_hub;
    var output = [];
    for (var i = 0; i < data_hub.my_castles.length; i++) {
        var castle = data_hub.my_castles[i];
        if (!castle.ranger_bot.mining_data) {
            if (constants_1.DEBUG) {
                console.log(castle.ranger_bot);
            }
            throw new Error('Missing mining data');
        }
        var has_mine = false;
        for (var j = 0; j < castle.ranger_bot.mining_data.mines_data.length; j++) {
            var active_mine = castle.ranger_bot.mining_data.mines_data[j];
            active_mine.workers = active_mine.workers.filter(function (w) {
                return (w.isAlive || w.hp > 0) && w.ranger_bot.job == 'mine';
            });
            var gold_mine = active_mine.gold_mine;
            if (castle.ranger_bot.tower && !castle.ranger_bot.tower.isAlive && castle.ranger_bot.tower.hp <= 0) {
                delete castle.ranger_bot['tower'];
            }
            if (!castle.ranger_bot.tower && gold_mine.tower) {
                castle.ranger_bot.tower = gold_mine.tower;
            }
            if (gold_mine.gold <= 0) {
                _ReleaseWorkers(active_mine);
            }
            else if (castle.isUnderConstruction) {
                data_hub.active_mining_bases++;
            }
            else if (gold_mine.gold > constants_1.REPLACEMENT_BASE_THRESHOLD) {
                data_hub.active_mining_bases++;
                has_mine = true;
            }
            else {
                has_mine = true;
            }
        }
        if (has_mine) {
            output.push(castle);
        }
    }
    return output;
}
function _ReleaseWorkers(inactive_mine) {
    for (var i = 0; i < inactive_mine.workers.length; i++) {
        var miner = inactive_mine.workers[i];
        miner.ranger_bot = {};
    }
    inactive_mine.workers = [];
}


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetWorkableMines = GetWorkableMines;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
function GetWorkableMines(_a) {
    var data_hub = _a.data_hub;
    var active_mines = [];
    var workable_mines = [];
    var active_castles = data_hub.active_castles;
    for (var i = 0; i < active_castles.length; i++) {
        var castle = active_castles[i];
        var mining_data = castle.ranger_bot.mining_data;
        for (var j = 0; j < mining_data.mines_data.length; j++) {
            var active_mine = mining_data.mines_data[j];
            var gold_mine = active_mine.gold_mine;
            if (gold_mine.gold <= 0) {
                continue;
            }
            active_mines.push(active_mine);
            workable_mines.push(active_mine);
        }
    }
    data_hub.active_mines = active_mines;
    for (var i = 0; i < data_hub.my_castles.length; i++) {
        var castle = data_hub.my_castles[i];
        if (!castle.isUnderConstruction) {
            continue;
        }
        var mining_data = castle.ranger_bot.mining_data;
        if (!mining_data.closest_time) {
            var closest_time = _CalculateClosestTime(mining_data, active_castles);
            if (isNaN(closest_time)) {
                continue;
            }
            mining_data.closest_time = closest_time;
        }
        var build_time_left = castle.buildTicksLeft / constants_1.SPEED_FACTOR;
        if (build_time_left < mining_data.closest_time) {
            for (var j = 0; j < mining_data.mines_data.length; j++) {
                var active_mine = mining_data.mines_data[j];
                var gold_mine = active_mine.gold_mine;
                if (gold_mine.gold <= 0) {
                    continue;
                }
                workable_mines.push(active_mine);
            }
        }
    }
    data_hub.workable_mines = workable_mines;
}
function _CalculateClosestTime(mining_data, active_castles) {
    var distances = [];
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        var active_mine = mining_data.mines_data[i];
        var closest_distance = (0, ground_distance_1.GetShortestGroundDistanceToActiveCastle)({
            map_location: active_mine.midpoint,
            active_castles: active_castles,
            with_workers: false,
        });
        if (isNaN(closest_distance)) {
            continue;
        }
        distances.push(closest_distance);
    }
    if (distances.length <= 0) {
        if (constants_1.DEBUG) {
            console.log('Error: Missing GetShortestGroundDistanceToActiveCastle for _CalculateClosestTime');
        }
        return NaN;
    }
    return Math.min.apply(Math, distances) / constants_1.WORKER_SPEED;
}


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageActiveCastleCache = ManageActiveCastleCache;
var constants_1 = __webpack_require__(5);
function ManageActiveCastleCache(_a) {
    var player_cache_key = _a.player_cache_key, active_mining_bases = _a.active_mining_bases, active_castles = _a.active_castles;
    _ManageActiveMiningBasesCache(player_cache_key, active_mining_bases);
    _ManageActiveCastleCache(player_cache_key, active_castles);
}
function _ManageActiveMiningBasesCache(player_cache_key, active_mining_bases) {
    if (!scope.ranger_bot.player_caches[player_cache_key].active_mining_bases) {
        scope.ranger_bot.player_caches[player_cache_key].active_mining_bases = active_mining_bases;
    }
    else {
        scope.ranger_bot.player_caches[player_cache_key].active_mining_bases = Math.max(scope.ranger_bot.player_caches[player_cache_key].active_mining_bases, active_mining_bases);
    }
}
function _ManageActiveCastleCache(player_cache_key, active_castles) {
    var new_active_castle_ids = active_castles.map(function (ac) { return ac.id; }).sort();
    if (!scope.ranger_bot.player_caches[player_cache_key].active_castle_ids) {
        scope.ranger_bot.player_caches[player_cache_key].active_castle_ids = new_active_castle_ids;
        return;
    }
    var old_active_castle_ids = scope.ranger_bot.player_caches[player_cache_key].active_castle_ids;
    var cache_invalid = (function () {
        if (new_active_castle_ids.length != old_active_castle_ids.length) {
            return true;
        }
        for (var i = 0; i < new_active_castle_ids.length; i++) {
            var new_id = new_active_castle_ids[i];
            var old_id = old_active_castle_ids[i];
            if (new_id != old_id) {
                return true;
            }
        }
        return false;
    })();
    if (cache_invalid) {
        if (constants_1.DEBUG) {
            console.log('ERROR: cache_invalid');
        }
    }
    scope.ranger_bot.player_caches[player_cache_key].active_castle_ids = new_active_castle_ids;
}


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MacroBot = void 0;
var assign_repairers_1 = __webpack_require__(33);
var assign_idle_workers_1 = __webpack_require__(41);
var count_workers_needed_1 = __webpack_require__(42);
var redistribute_miners_1 = __webpack_require__(43);
var survey_production_1 = __webpack_require__(44);
var constants_1 = __webpack_require__(5);
var estimate_income_1 = __webpack_require__(45);
var reserve_gold_for_builders_1 = __webpack_require__(46);
var build_house_if_needed_1 = __webpack_require__(47);
var train_workers_if_needed_1 = __webpack_require__(51);
var use_barracks_1 = __webpack_require__(52);
var use_wolves_den_1 = __webpack_require__(53);
var research_upgrades_1 = __webpack_require__(54);
var next_build_order_step_1 = __webpack_require__(55);
var MacroBot = (function () {
    function MacroBot(_a) {
        var data_hub = _a.data_hub;
        this.data_hub = data_hub;
    }
    MacroBot.prototype.Step = function () {
        (0, assign_repairers_1.AssignRepairers)({ data_hub: this.data_hub });
        (0, assign_idle_workers_1.AssignIdleWorkers)({ data_hub: this.data_hub });
        this.data_hub.workers_needed = (0, count_workers_needed_1.CountWorkersNeeded)({ data_hub: this.data_hub });
        this.data_hub.worker_supply_reserved = this.data_hub.workers_needed * constants_1.WORKER_SUPPLY;
        (0, redistribute_miners_1.RedistributeMiners)({ data_hub: this.data_hub });
        (0, survey_production_1.SurveyProduction)({ data_hub: this.data_hub });
        (0, estimate_income_1.EstimateIncome)({ data_hub: this.data_hub });
        (0, reserve_gold_for_builders_1.ReserveGoldForBuilders)({ data_hub: this.data_hub });
        (0, build_house_if_needed_1.BuildHouseIfNeeded)({ data_hub: this.data_hub });
        (0, train_workers_if_needed_1.TrainWorkersIfNeeded)({ data_hub: this.data_hub });
        (0, use_barracks_1.UseBarracks)({ data_hub: this.data_hub });
        (0, use_wolves_den_1.UseWolvesDen)({ data_hub: this.data_hub });
        (0, research_upgrades_1.ResearchUpgrades)({ data_hub: this.data_hub });
        (0, next_build_order_step_1.NextBuildOrderStep)({ data_hub: this.data_hub });
    };
    return MacroBot;
}());
exports.MacroBot = MacroBot;


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssignIdleWorkers = AssignIdleWorkers;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
var utils_1 = __webpack_require__(6);
function AssignIdleWorkers(_a) {
    var data_hub = _a.data_hub;
    var workable_mines = data_hub.workable_mines;
    if (workable_mines.length <= 0) {
        return;
    }
    var idle_workers = data_hub.idle_workers;
    var _loop_1 = function (i) {
        var idle_worker = idle_workers[i];
        var need_workers = workable_mines.filter(function (am) { return am.workers.length < constants_1.WORKERS_PER_CASTLE; });
        if (need_workers.length <= 0) {
            _AssignToLeastOverfull(idle_worker, workable_mines);
            return "continue";
        }
        var with_air_distance = need_workers.map(function (active_mine) {
            return {
                'active_mine': active_mine,
                'air_distance': Math.sqrt(Math.pow((active_mine.midpoint.x - idle_worker.pos.x), 2) + Math.pow((active_mine.midpoint.y - idle_worker.pos.y), 2)),
            };
        }).sort(function (a, b) { return a.air_distance - b.air_distance; });
        var assigned_mine = void 0;
        var shortest_distance = NaN;
        for (var j = 0; j < with_air_distance.length; j++) {
            var data = with_air_distance[j];
            if (isNaN(shortest_distance)) {
                var ground_distance = (0, ground_distance_1.SafeGroundDistance)(data.active_mine.midpoint, idle_worker.pos);
                if (isNaN(ground_distance)) {
                    if (constants_1.DEBUG) {
                        console.log('Error: missing SafeGroundDistance for AssignIdleWorkers 1');
                    }
                    continue;
                }
                shortest_distance = ground_distance;
                assigned_mine = data.active_mine;
            }
            else if (data.air_distance < shortest_distance) {
                var ground_distance = (0, ground_distance_1.SafeGroundDistance)(data.active_mine.midpoint, idle_worker.pos);
                if (isNaN(ground_distance)) {
                    if (constants_1.DEBUG) {
                        console.log('Error: missing SafeGroundDistance for AssignIdleWorkers 2');
                    }
                    continue;
                }
                if (ground_distance < shortest_distance) {
                    shortest_distance = ground_distance;
                    assigned_mine = data.active_mine;
                }
            }
        }
        if (!assigned_mine) {
            if (constants_1.DEBUG) {
                console.log(idle_worker);
                console.log(with_air_distance);
            }
            throw new Error('Unable to assign idle worker');
        }
        (0, utils_1.AssignMiner)(idle_worker, assigned_mine);
    };
    for (var i = 0; i < idle_workers.length; i++) {
        _loop_1(i);
    }
    data_hub.idle_workers = idle_workers.filter(function (u) { return !u.ranger_bot.job; });
}
function _AssignToLeastOverfull(idle_worker, workable_mines) {
    var by_overfull = workable_mines.sort(function (a, b) { return a.workers.length - b.workers.length; });
    (0, utils_1.AssignMiner)(idle_worker, by_overfull[0]);
}


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CountWorkersNeeded = CountWorkersNeeded;
var constants_1 = __webpack_require__(5);
function CountWorkersNeeded(_a) {
    var data_hub = _a.data_hub;
    if (data_hub.my_workers.length >= constants_1.MAX_WORKERS) {
        return 0;
    }
    var output = (constants_1.WORKERS_PER_CASTLE + 1) * data_hub.active_mining_bases;
    output = Math.min(output, constants_1.MAX_WORKERS);
    output = Math.max(output, 1);
    output -= data_hub.my_workers.length;
    for (var i = 0; i < data_hub.my_castles.length; i++) {
        var castle = data_hub.my_castles[i];
        for (var j = 0; j < castle.queue.length; j++) {
            var queued_unit = castle.queue[j];
            if (!queued_unit) {
                continue;
            }
            if (queued_unit.id_string == 'worker') {
                output--;
            }
        }
    }
    return output;
}


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedistributeMiners = RedistributeMiners;
var ground_distance_1 = __webpack_require__(11);
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function RedistributeMiners(_a) {
    var data_hub = _a.data_hub;
    var workable_mines = data_hub.workable_mines;
    if (workable_mines.length <= 0) {
        if (constants_1.DEBUG) {
            console.log('Error: No workable_mines');
        }
        return;
    }
    else if (workable_mines.length <= 1) {
        return;
    }
    workable_mines = workable_mines.sort(function (a, b) { return a.workers.length - b.workers.length; });
    var from_mine = workable_mines[workable_mines.length - 1];
    var to_mine = workable_mines[0];
    var _loop_1 = function () {
        var empty_hands = from_mine.workers.filter(function (m) { return (!m.carriedGoldAmount || m.carriedGoldAmount <= 0); });
        if (empty_hands.length <= 0) {
            empty_hands = from_mine.workers;
        }
        var with_air_distance = empty_hands.map(function (miner) {
            return {
                'miner': miner,
                'air_distance': Math.sqrt(Math.pow((to_mine.midpoint.x - miner.pos.x), 2) +
                    Math.pow((to_mine.midpoint.y - miner.pos.y), 2)),
            };
        }).sort(function (a, b) { return a.air_distance - b.air_distance; });
        var transfer_candidate;
        var shortest_distance = NaN;
        for (var i = 0; i < with_air_distance.length; i++) {
            var data = with_air_distance[i];
            if (isNaN(shortest_distance)) {
                var ground_distance = (0, ground_distance_1.SafeGroundDistance)(to_mine.midpoint, data.miner.pos);
                if (isNaN(ground_distance)) {
                    if (constants_1.DEBUG) {
                        console.log('Error: missing SafeGroundDistance for RedistributeMiners 1');
                    }
                    continue;
                }
                shortest_distance = ground_distance;
                transfer_candidate = data.miner;
            }
            else if (data.air_distance < shortest_distance) {
                var ground_distance = (0, ground_distance_1.SafeGroundDistance)(to_mine.midpoint, data.miner.pos);
                if (isNaN(ground_distance)) {
                    if (constants_1.DEBUG) {
                        console.log('Error: missing SafeGroundDistance for RedistributeMiners 2');
                    }
                    continue;
                }
                if (ground_distance < shortest_distance) {
                    shortest_distance = ground_distance;
                    transfer_candidate = data.miner;
                }
            }
        }
        if (!transfer_candidate) {
            if (constants_1.DEBUG) {
                console.log(from_mine);
                console.log(to_mine);
            }
            throw new Error('No transfer candidates');
        }
        (0, utils_1.AssignMiner)(transfer_candidate, to_mine);
        from_mine.workers = from_mine.workers.filter(function (w) { return w.id != transfer_candidate.id; });
        workable_mines = workable_mines.sort(function (a, b) { return a.workers.length - b.workers.length; });
        from_mine = workable_mines[workable_mines.length - 1];
        to_mine = workable_mines[0];
    };
    while (_ShouldTransfer(from_mine, to_mine)) {
        _loop_1();
    }
}
function _ShouldTransfer(from_mine, to_mine) {
    if (from_mine.gold_mine_id == to_mine.gold_mine_id) {
        return false;
    }
    var worker_diff = from_mine.workers.length - to_mine.workers.length;
    if (worker_diff <= 1) {
        return false;
    }
    if (from_mine.workers.length > constants_1.WORKERS_PER_CASTLE) {
        return true;
    }
    if (to_mine.workers.length >= constants_1.WORKERS_PER_CASTLE) {
        return false;
    }
    return true;
}


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SurveyProduction = SurveyProduction;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function SurveyProduction(_a) {
    var data_hub = _a.data_hub;
    for (var i = 0; i < data_hub.my_buildings.length; i++) {
        var my_building = data_hub.my_buildings[i];
        if (my_building.isUnderConstruction && my_building.type.supplyProvided) {
            data_hub.supply_under_construction += my_building.type.supplyProvided;
        }
        _SurveyMeleeVsRanged(my_building, data_hub);
        _SurveySupply(my_building, data_hub);
        _SurveySpending(my_building, data_hub);
    }
}
function _SurveyMeleeVsRanged(my_building, data_hub) {
    if (!my_building.queue) {
        return;
    }
    for (var i = 0; i < 5; i++) {
        var queued_unit = my_building.queue[i];
        if (!queued_unit) {
            continue;
        }
        if (queued_unit.id_string == 'soldier') {
            data_hub.count_melee++;
        }
        else if (queued_unit.id_string == 'archer') {
            data_hub.count_ranged++;
        }
        else if (queued_unit.id_string == 'wolf') {
            data_hub.count_melee++;
        }
        else if (queued_unit.id_string == 'snake') {
            data_hub.count_ranged++;
        }
        else if (queued_unit.id_string == 'worker') {
        }
        else if (queued_unit.isUpgrade) {
        }
        else if ('watchtower2' == queued_unit.id_string) {
        }
        else if (constants_1.DEBUG) {
            console.log('Error: Unhandled id_string: ' + queued_unit.id_string);
        }
    }
}
function _SurveySupply(my_building, data_hub) {
    var unit_supply = (function () {
        if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
            my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
            my_building.type.name == 'Snake Charmer' || my_building.type.name == 'Watchtower (detection)') {
            return 0;
        }
        else if (my_building.queue && my_building.queue[0]) {
            return my_building.queue[0].supply;
        }
        else if (my_building.type.name == 'Barracks') {
            return constants_1.ARCHER_SUPPLY;
        }
        else if (my_building.type.name == 'Wolves Den') {
            if ((0, utils_1.WolvesAreObsolete)()) {
                return 0;
            }
            else {
                return constants_1.WOLF_SUPPLY;
            }
        }
        else if (my_building.type.name == 'Castle') {
            if (data_hub.workers_needed > 0 && data_hub.worker_supply_reserved >= constants_1.WORKER_SUPPLY) {
                data_hub.worker_supply_reserved -= constants_1.WORKER_SUPPLY;
                return constants_1.WORKER_SUPPLY;
            }
            else {
                return 0;
            }
        }
        else {
            if (constants_1.DEBUG) {
                console.log('Error: Unhandled name for _SurveySupply: ' + my_building.type.name);
            }
            return 0;
        }
    })();
    if (unit_supply <= 0) {
        return;
    }
    data_hub.units_supply_producing += unit_supply;
    var seconds_left = (function () {
        if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
            my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
            my_building.type.name == 'Snake Charmer' || my_building.type.name == 'Watchtower (detection)') {
            return 0;
        }
        else if (my_building.queue && my_building.queue[0]) {
            if (my_building.ranger_bot.queue_finish_time) {
                return my_building.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
            }
            else {
                if (constants_1.DEBUG) {
                    console.log(my_building);
                    console.log('ERROR: Missing queue_finish_time for _SurveySupply');
                }
                return constants_1.WORKER_BUILD_TIME;
            }
        }
        else if (my_building.type.name == 'Barracks') {
            return constants_1.ARCHER_BUILD_TIME;
        }
        else if (my_building.type.name == 'Wolves Den') {
            if ((0, utils_1.WolvesAreObsolete)()) {
                return 0;
            }
            else {
                return constants_1.WOLF_BUILD_TIME;
            }
        }
        else if (my_building.type.name == 'Castle') {
            if (data_hub.workers_needed > 0) {
                return constants_1.WORKER_BUILD_TIME;
            }
            else {
                return 0;
            }
        }
        else {
            if (constants_1.DEBUG) {
                console.log('Error: Unhandled name for _SurveySupply: ' + my_building.type.name);
            }
            return 0;
        }
    })();
    if (seconds_left <= constants_1.HOUSE_BUILD_TIME) {
        data_hub.units_supply_producing += unit_supply;
    }
}
function _SurveySpending(my_building, data_hub) {
    if (_BuildOrderExceptionApplies(data_hub)) {
        return;
    }
    var unit_cost = (function () {
        if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
            my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
            my_building.type.name == 'Snake Charmer' || my_building.type.name == 'Watchtower (detection)') {
            return 0;
        }
        else if (my_building.queue && my_building.queue[0]) {
            return my_building.queue[0].cost;
        }
        else if (my_building.type.name == 'Barracks') {
            return constants_1.ARCHER_COST;
        }
        else if (my_building.type.name == 'Wolves Den') {
            if ((0, utils_1.WolvesAreObsolete)()) {
                return 0;
            }
            else {
                return constants_1.WOLF_COST;
            }
        }
        else if (my_building.type.name == 'Castle') {
            if (data_hub.workers_needed > 0) {
                return constants_1.WORKER_COST;
            }
            else {
                return 0;
            }
        }
        else {
            if (constants_1.DEBUG) {
                console.log('Error: Unhandled name for _SurveySupply: ' + my_building.type.name);
            }
            return 0;
        }
    })();
    if (unit_cost <= 0) {
        return;
    }
    var build_time = (function () {
        if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
            my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
            my_building.type.name == 'Snake Charmer' || my_building.type.name == 'Watchtower (detection)') {
            return 0;
        }
        else if (my_building.queue && my_building.queue[0]) {
            return my_building.queue[0].buildTime / constants_1.SPEED_FACTOR;
        }
        else if (my_building.type.name == 'Barracks') {
            return constants_1.ARCHER_BUILD_TIME;
        }
        else if (my_building.type.name == 'Wolves Den') {
            if ((0, utils_1.WolvesAreObsolete)()) {
                return 0;
            }
            else {
                return constants_1.WOLF_BUILD_TIME;
            }
        }
        else if (my_building.type.name == 'Castle') {
            if (data_hub.workers_needed > 0) {
                return constants_1.WORKER_BUILD_TIME;
            }
            else {
                return 0;
            }
        }
        else {
            if (constants_1.DEBUG) {
                console.log('Error: Unhandled name for _SurveySupply: ' + my_building.type.name);
            }
            return 0;
        }
    })();
    var cost_per_min = unit_cost * 60 / build_time;
    data_hub.gold_spend_per_min += cost_per_min;
}
function _BuildOrderExceptionApplies(data_hub) {
    if ((0, utils_1.WolvesAreObsolete)()) {
        return false;
    }
    else if (data_hub.active_mining_bases > 1) {
        return false;
    }
    else if (data_hub.viable_gold_mines.length < 1) {
        return false;
    }
    else if (!scope.player.buildings.house) {
        return false;
    }
    else if (2 != scope.player.buildings.house) {
        return false;
    }
    else if (!scope.player.buildings.wolvesden) {
        return false;
    }
    else if (2 != scope.player.buildings.wolvesden) {
        return false;
    }
    else if (scope.getMaxSupply() - scope.getCurrentSupply() > 1) {
        return false;
    }
    else {
        return true;
    }
}


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EstimateIncome = EstimateIncome;
var constants_1 = __webpack_require__(5);
function EstimateIncome(_a) {
    var data_hub = _a.data_hub;
    var active_mines = data_hub.active_mines;
    for (var i = 0; i < active_mines.length; i++) {
        var active_mine = active_mines[i];
        var worker_key = Math.min(active_mine.workers.length, 13);
        data_hub.gross_gold_per_min += constants_1.GOLD_PER_MIN[String(worker_key)];
    }
    var net_gold_per_min = data_hub.gross_gold_per_min - data_hub.gold_spend_per_min;
    data_hub.net_gold_per_sec = net_gold_per_min / 60;
}


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReserveGoldForBuilders = ReserveGoldForBuilders;
var constants_1 = __webpack_require__(5);
function ReserveGoldForBuilders(_a) {
    var data_hub = _a.data_hub;
    var builders = data_hub.builders;
    for (var i = 0; i < builders.length; i++) {
        var builder = builders[i];
        if (!builder.ranger_bot.target_building && builder.ranger_bot.order != builder.order.name) {
            if (builder.ranger_bot.reserve === undefined) {
                if (constants_1.DEBUG) {
                    console.log(builder);
                    console.log('Error: Missing reserve for ReserveGoldForBuilders');
                }
                continue;
            }
            data_hub.spendable_gold -= builder.ranger_bot.reserve;
        }
    }
    if (data_hub.NeedReplacementExpansion()) {
        data_hub.spendable_gold -= constants_1.CASTLE_COST;
    }
}


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BuildHouseIfNeeded = BuildHouseIfNeeded;
var constants_1 = __webpack_require__(5);
var build_1 = __webpack_require__(48);
var utils_1 = __webpack_require__(6);
function BuildHouseIfNeeded(_a) {
    var data_hub = _a.data_hub;
    if (scope.getMaxSupply() + data_hub.supply_under_construction >= scope.player.supplyCap) {
        return;
    }
    else if (_IntentionalSupplyBlockOnOneBase(data_hub)) {
        return;
    }
    var house_builders = data_hub.house_builders;
    var available_supply = _CalculateAvailableSupply(house_builders, data_hub);
    if (data_hub.units_supply_producing <= available_supply) {
        return;
    }
    if (constants_1.HOUSE_COST > data_hub.spendable_gold) {
        data_hub.spendable_gold -= constants_1.HOUSE_COST;
        return;
    }
    data_hub.spendable_gold -= constants_1.HOUSE_COST;
    (0, build_1.BuildHouse)({ data_hub: data_hub });
}
function _CalculateAvailableSupply(house_builders, data_hub) {
    var output = scope.getMaxSupply() - scope.getCurrentSupply() + data_hub.supply_under_construction;
    for (var i = 0; i < house_builders.length; i++) {
        var house_builder = house_builders[i];
        if (house_builder.order && house_builder.order.unitType && house_builder.order.unitType.supplyProvided) {
            output += house_builder.order.unitType.supplyProvided;
        }
    }
    return output;
}
function _IntentionalSupplyBlockOnOneBase(data_hub) {
    if ((0, utils_1.WolvesAreObsolete)()) {
        return false;
    }
    else if (data_hub.active_mining_bases > 1) {
        return false;
    }
    else if (data_hub.viable_gold_mines.length < 1) {
        return false;
    }
    else if (!scope.player.buildings.house) {
        return false;
    }
    else if (scope.player.buildings.house < 1) {
        return false;
    }
    else if (!scope.player.buildings.wolvesden) {
        return true;
    }
    else if (scope.getCurrentGameTimeInSec() < 110 && scope.player.buildings.wolvesden < 2) {
        return true;
    }
    else if (scope.player.buildings.house < 2) {
        return false;
    }
    else {
        return true;
    }
}


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BuildHouse = BuildHouse;
exports.BuildWolfDen = BuildWolfDen;
exports.BuildBarracks = BuildBarracks;
exports.BuildArmory = BuildArmory;
exports.BuildForge = BuildForge;
exports.BuildSnakeCharmer = BuildSnakeCharmer;
var construct_building_1 = __webpack_require__(49);
function BuildHouse(_a) {
    var data_hub = _a.data_hub;
    var traveling_house_builders = data_hub.traveling_house_builders;
    if (traveling_house_builders.length > 0) {
        return undefined;
    }
    var new_house_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'house',
        build_order: 'Build House',
        data_hub: data_hub,
    });
    if (new_house_builder) {
        traveling_house_builders.push(new_house_builder);
    }
}
function BuildWolfDen(_a) {
    var data_hub = _a.data_hub;
    var traveling_wolf_den_builders = data_hub.traveling_wolf_den_builders;
    if (traveling_wolf_den_builders.length > 0) {
        return undefined;
    }
    var new_wolf_den_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'wolvesden',
        build_order: 'Build Wolves Den',
        data_hub: data_hub,
    });
    if (new_wolf_den_builder) {
        traveling_wolf_den_builders.push(new_wolf_den_builder);
    }
}
function BuildBarracks(_a) {
    var data_hub = _a.data_hub;
    var traveling_barracks_builders = data_hub.traveling_barracks_builders;
    if (traveling_barracks_builders.length > 0) {
        return undefined;
    }
    var new_barracks_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'barracks',
        build_order: 'Build Barracks',
        data_hub: data_hub,
    });
    if (new_barracks_builder) {
        traveling_barracks_builders.push(new_barracks_builder);
    }
}
function BuildArmory(_a) {
    var data_hub = _a.data_hub;
    var traveling_armory_builders = data_hub.traveling_armory_builders;
    if (traveling_armory_builders.length > 0) {
        return undefined;
    }
    var new_armory_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'armory',
        build_order: 'Build Armory',
        data_hub: data_hub,
    });
    if (new_armory_builder) {
        traveling_armory_builders.push(new_armory_builder);
    }
}
function BuildForge(_a) {
    var data_hub = _a.data_hub;
    var traveling_forge_builders = data_hub.traveling_forge_builders;
    if (traveling_forge_builders.length > 0) {
        return undefined;
    }
    var new_forge_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'forge',
        build_order: 'Build Forge',
        data_hub: data_hub,
    });
    if (new_forge_builder) {
        traveling_forge_builders.push(new_forge_builder);
    }
}
function BuildSnakeCharmer(_a) {
    var data_hub = _a.data_hub;
    var traveling_snake_charmer_builders = data_hub.traveling_snake_charmer_builders;
    if (traveling_snake_charmer_builders.length > 0) {
        return undefined;
    }
    var new_snake_charmer_builder = (0, construct_building_1.ConstructBuilding)({
        building_type: 'snakecharmer',
        build_order: 'Build Snake Charmer',
        data_hub: data_hub,
    });
    if (new_snake_charmer_builder) {
        traveling_snake_charmer_builders.push(new_snake_charmer_builder);
    }
}


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConstructBuilding = ConstructBuilding;
var allocate_worker_1 = __webpack_require__(34);
var utils_1 = __webpack_require__(6);
var find_space_for_building_1 = __webpack_require__(50);
var constants_1 = __webpack_require__(5);
function ConstructBuilding(_a) {
    var building_type = _a.building_type, build_order = _a.build_order, data_hub = _a.data_hub;
    var by_workers = data_hub.active_mines
        .filter(function (mine) { return mine.workers.length > 0; })
        .sort(function (a, b) { return a.workers.length - b.workers.length; });
    var no_location = {};
    var target_location;
    var giver_castle;
    var new_builder;
    for (var i = 0; i < by_workers.length; i++) {
        var active_mine = by_workers[i];
        var gold_mine = active_mine.gold_mine;
        var active_castle = gold_mine.castle;
        target_location = (0, find_space_for_building_1.FindSpaceForBuilding)({
            active_castle: active_castle,
            building_type: building_type,
            data_hub: data_hub,
        });
        if (target_location) {
            giver_castle = active_castle;
            new_builder = (0, allocate_worker_1.AllocateWorkerFromActiveMine)(active_mine);
            break;
        }
        else {
            no_location[String(active_castle.id)] = true;
        }
    }
    if (!target_location) {
        for (var i = 0; i < data_hub.my_castles.length; i++) {
            var castle = data_hub.my_castles[i];
            if (no_location[String(castle.id)]) {
                continue;
            }
            target_location = (0, find_space_for_building_1.FindSpaceForBuilding)({
                active_castle: castle,
                building_type: building_type,
                data_hub: data_hub,
            });
            if (target_location) {
                giver_castle = castle;
                break;
            }
        }
    }
    if (!target_location) {
        if (constants_1.DEBUG) {
            console.log(building_type);
            console.log(data_hub.my_castles);
        }
        throw new Error('Cannot find target_location for ConstructBuilding');
    }
    if (!new_builder) {
        if (!giver_castle) {
            throw new Error('How? ConstructBuilding');
        }
        new_builder = (0, allocate_worker_1.AllocateWorkerFromActiveCastle)(giver_castle);
    }
    if (!new_builder) {
        new_builder = (0, allocate_worker_1.AllocateAvailableWorkerClosestToLocation)({
            map_location: target_location,
            active_mines: data_hub.active_mines,
            idle_workers: data_hub.idle_workers,
        });
    }
    if (!new_builder) {
        if (constants_1.DEBUG) {
            console.log('Error: No available builders for ConstructBuilding');
        }
        return undefined;
    }
    var building_cost = (0, utils_1.GetNumberFieldValue)({ piece_name: building_type, field_name: 'cost' });
    new_builder.ranger_bot = {
        'job': 'build',
        'building_type': building_type,
        'order': build_order,
        'exclude_worker_paths': true,
        'cost': building_cost,
        'reserve': building_cost,
        'target_location': target_location,
    };
    scope.order(build_order, [{ 'unit': new_builder }], target_location);
    return new_builder;
}


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._private = void 0;
exports.FindSpaceForBuilding = FindSpaceForBuilding;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
var buildable_1 = __webpack_require__(15);
function FindSpaceForBuilding(_a) {
    var active_castle = _a.active_castle, building_type = _a.building_type, data_hub = _a.data_hub;
    var width = (0, utils_1.GetNumberFieldValue)({ piece_name: building_type, field_name: 'sizeX' });
    var height = (0, utils_1.GetNumberFieldValue)({ piece_name: building_type, field_name: 'sizeY' });
    var local_map = _SeedLocalMap(active_castle, width, height);
    if (local_map.length <= 0) {
        return undefined;
    }
    var solutions = [];
    while (solutions.length <= 0) {
        var new_point = false;
        for (var _i = 0, _b = Object.entries(local_map); _i < _b.length; _i++) {
            var _c = _b[_i], raw_x = _c[0], local_data = _c[1];
            var x = Number(raw_x);
            if (isNaN(x)) {
                continue;
            }
            for (var _d = 0, _e = Object.entries(local_data); _d < _e.length; _d++) {
                var _f = _e[_d], raw_y = _f[0], unworked = _f[1];
                if (!unworked) {
                    continue;
                }
                var y = Number(raw_y);
                if (isNaN(y)) {
                    continue;
                }
                var adjacents = [{ 'x': x - 1, 'y': y },
                    { 'x': x + 1, 'y': y },
                    { 'x': x, 'y': y - 1 },
                    { 'x': x, 'y': y + 1 }];
                for (var i = 0; i < adjacents.length; i++) {
                    var new_x = adjacents[i].x;
                    var new_y = adjacents[i].y;
                    if (!scope.positionIsPathable(new_x, new_y)) {
                        continue;
                    }
                    if (local_map[new_x] === undefined) {
                        local_map[new_x] = [];
                        local_map[new_x][new_y] = true;
                        new_point = true;
                    }
                    else if (local_map[new_x][new_y] === undefined) {
                        local_map[new_x][new_y] = true;
                        new_point = true;
                    }
                }
                var are_buildable = (0, buildable_1.AreBuildable)({
                    x_min: x - constants_1.BUILDING_SPACE_BUFFER,
                    x_max: x + width + constants_1.BUILDING_SPACE_BUFFER - 1,
                    y_min: y - constants_1.BUILDING_SPACE_BUFFER,
                    y_max: y + height + constants_1.BUILDING_SPACE_BUFFER - 1,
                    exclude_worker_paths: true,
                    data_hub: data_hub,
                });
                if (are_buildable) {
                    solutions.push({ 'x': x, 'y': y });
                }
                local_map[x][y] = false;
            }
        }
        if (!new_point) {
            break;
        }
    }
    if (solutions.length <= 0) {
        return undefined;
    }
    var dx = (width - 1) / 2;
    var dy = (height - 1) / 2;
    var castle_center = active_castle.ranger_bot.center;
    var by_distance = solutions.map(function (solution) {
        var center_x = solution.x + dx;
        var center_y = solution.y + dy;
        var distance = Math.sqrt(Math.pow((castle_center.x - center_x), 2) + Math.pow((castle_center.y - center_y), 2));
        return {
            'x': solution.x,
            'y': solution.y,
            'distance': distance,
        };
    }).sort(function (a, b) { return a.distance - b.distance; });
    var closest = by_distance[0];
    return { 'x': closest.x, 'y': closest.y };
}
function _SeedLocalMap(active_castle, width, height) {
    var output = [];
    for (var dx = (1 - width - constants_1.BUILDING_SPACE_BUFFER); dx <= (constants_1.CASTLE_WIDTH + 1); dx++) {
        var x = active_castle.x + dx;
        if (output[x] === undefined) {
            output[x] = [];
        }
        for (var dy = (1 - height - constants_1.BUILDING_SPACE_BUFFER); dy <= (constants_1.CASTLE_HEIGHT + 1); dy++) {
            var y = active_castle.y + dy;
            output[x][y] = false;
        }
    }
    var upper_left = {
        'x': active_castle.x - width - constants_1.BUILDING_SPACE_BUFFER,
        'y': active_castle.y - height - constants_1.BUILDING_SPACE_BUFFER,
    };
    var z = scope.getHeightLevel(active_castle.x, active_castle.y);
    var perimeter = (0, utils_1.DrawRectangle)({
        corner: upper_left,
        width: constants_1.CASTLE_WIDTH + 2 * constants_1.BUILDING_SPACE_BUFFER + width + 1,
        height: constants_1.CASTLE_WIDTH + 2 * constants_1.BUILDING_SPACE_BUFFER + height + 1,
    }).filter(function (ml) {
        var new_z = scope.getHeightLevel(ml.x, ml.y);
        return new_z == z && scope.positionIsPathable(ml.x, ml.y);
    });
    for (var i = 0; i < perimeter.length; i++) {
        var location_1 = perimeter[i];
        if (output[location_1.x] === undefined) {
            output[location_1.x] = [];
        }
        output[location_1.x][location_1.y] = true;
    }
    return output;
}
exports._private = { _SeedLocalMap: _SeedLocalMap };


/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrainWorkersIfNeeded = TrainWorkersIfNeeded;
var constants_1 = __webpack_require__(5);
function TrainWorkersIfNeeded(_a) {
    var data_hub = _a.data_hub;
    _TrainWorkers(data_hub.active_castles, data_hub);
    _PreQueueWorkers(data_hub.active_castles, data_hub);
    _TrainWorkers(data_hub.my_castles, data_hub);
    _PreQueueWorkers(data_hub.my_castles, data_hub);
    for (var i = 0; i < data_hub.my_castles_under_construction.length; i++) {
        var constructing_castle = data_hub.my_castles_under_construction[i];
        var time_left = constructing_castle.buildTicksLeft / constants_1.SPEED_FACTOR;
        if (time_left <= constants_1.PRE_QUEUE_BUFFER) {
            data_hub.spendable_gold -= constants_1.WORKER_COST;
            data_hub.available_supply -= constants_1.WORKER_SUPPLY;
        }
    }
}
function _TrainWorkers(castles, data_hub) {
    for (var i = 0; i < castles.length; i++) {
        var castle = castles[i];
        if (data_hub.workers_needed <= 0) {
            return;
        }
        if (castle.isUnderConstruction) {
            continue;
        }
        if (castle.queue[0]) {
            continue;
        }
        _Train(castle, data_hub);
    }
}
function _Train(castle, data_hub) {
    if (data_hub.spendable_gold >= constants_1.WORKER_COST && data_hub.available_supply >= constants_1.WORKER_SUPPLY) {
        scope.order('Train Worker', [{ 'unit': castle }]);
        castle.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + constants_1.WORKER_BUILD_TIME;
        data_hub.workers_needed--;
    }
    data_hub.spendable_gold -= constants_1.WORKER_COST;
    data_hub.available_supply -= constants_1.WORKER_SUPPLY;
}
function _PreQueueWorkers(castles, data_hub) {
    if (scope.getCurrentSupply() >= scope.player.supplyCap - constants_1.NEAR_MAX_SUPPLY) {
        return;
    }
    for (var i = 0; i < castles.length; i++) {
        var castle = castles[i];
        if (data_hub.workers_needed <= 0) {
            return;
        }
        if (castle.isUnderConstruction) {
            continue;
        }
        if (castle.queue[0]) {
            _PreQueue(castle, data_hub);
        }
        else {
            _Train(castle, data_hub);
        }
    }
}
function _PreQueue(castle, data_hub) {
    if (!castle.ranger_bot.queue_finish_time) {
        castle.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
    }
    var time_left = castle.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
    if (time_left >= constants_1.PRE_QUEUE_BUFFER) {
        return;
    }
    if (data_hub.spendable_gold >= constants_1.WORKER_COST && data_hub.available_supply >= constants_1.WORKER_SUPPLY) {
        scope.order('Train Worker', [{ 'unit': castle }]);
        castle.ranger_bot.queue_finish_time += constants_1.WORKER_BUILD_TIME;
        data_hub.workers_needed--;
    }
    data_hub.spendable_gold -= constants_1.WORKER_COST;
    data_hub.available_supply -= constants_1.WORKER_SUPPLY;
}


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UseBarracks = UseBarracks;
var constants_1 = __webpack_require__(5);
var utils_1 = __webpack_require__(6);
function UseBarracks(_a) {
    var data_hub = _a.data_hub;
    for (var i = 0; i < data_hub.my_barracks.length; i++) {
        var barracks = data_hub.my_barracks[i];
        if (barracks.isUnderConstruction) {
            continue;
        }
        if (barracks.queue[0]) {
            continue;
        }
        var unit = _SelectBarracksUnit(data_hub);
        if (data_hub.spendable_gold >= unit.cost && data_hub.available_supply >= unit.supply) {
            scope.order(unit.order, [{ 'unit': barracks }]);
            barracks.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + unit.build_time;
        }
        data_hub.spendable_gold -= unit.cost;
        data_hub.available_supply -= unit.supply;
    }
    if (scope.getCurrentSupply() >= scope.player.supplyCap - constants_1.NEAR_MAX_SUPPLY) {
        return;
    }
    for (var i = 0; i < data_hub.my_barracks.length; i++) {
        var barracks = data_hub.my_barracks[i];
        if (barracks.isUnderConstruction) {
            continue;
        }
        if (!barracks.queue[0]) {
            continue;
        }
        if (barracks.queue[0] && barracks.queue[1]) {
            continue;
        }
        if (!barracks.ranger_bot.queue_finish_time) {
            barracks.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
        }
        var time_left = barracks.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
        if (time_left >= constants_1.PRE_QUEUE_BUFFER) {
            continue;
        }
        var unit = _SelectBarracksUnit(data_hub);
        if (data_hub.spendable_gold >= unit.cost && data_hub.available_supply >= unit.supply) {
            scope.order(unit.order, [{ 'unit': barracks }]);
            barracks.ranger_bot.queue_finish_time += unit.build_time;
        }
        data_hub.spendable_gold -= unit.cost;
        data_hub.available_supply -= unit.supply;
    }
    for (var i = 0; i < data_hub.my_barracks.length; i++) {
        var barracks = data_hub.my_barracks[i];
        if (!barracks.isUnderConstruction) {
            continue;
        }
        var time_left = barracks.buildTicksLeft / constants_1.SPEED_FACTOR;
        if (time_left > constants_1.PRE_QUEUE_BUFFER) {
            continue;
        }
        var unit = _SelectBarracksUnit(data_hub);
        data_hub.spendable_gold -= unit.cost;
        data_hub.available_supply -= unit.supply;
    }
}
var SOLDIER_SELECTION = {
    'order': 'Train Soldier',
    'cost': constants_1.SOLDIER_COST,
    'supply': constants_1.SOLDIER_SUPPLY,
    'build_time': constants_1.SOLDIER_BUILD_TIME,
};
var ARCHER_SELECTION = {
    'order': 'Train Archer',
    'cost': constants_1.ARCHER_COST,
    'supply': constants_1.ARCHER_SUPPLY,
    'build_time': constants_1.ARCHER_BUILD_TIME,
};
function _SelectBarracksUnit(data_hub) {
    if (_ShouldFavorArchers()) {
        data_hub.count_ranged++;
        return ARCHER_SELECTION;
    }
    if (data_hub.count_melee < 7) {
        data_hub.count_melee++;
        return SOLDIER_SELECTION;
    }
    var total = data_hub.count_melee + data_hub.count_ranged;
    var target_ratio = total / 50;
    var actual_ratio = data_hub.count_ranged / total;
    if (target_ratio > actual_ratio) {
        data_hub.count_ranged++;
        return ARCHER_SELECTION;
    }
    else {
        data_hub.count_melee++;
        return SOLDIER_SELECTION;
    }
}
function _ShouldFavorArchers() {
    if ((0, utils_1.WolvesAreObsolete)()) {
        return false;
    }
    else if (undefined === scope.player.buildings.snakecharmer || scope.player.buildings.snakecharmer < 1) {
        return true;
    }
    else if (undefined === scope.player.buildings.wolvesden) {
        return false;
    }
    else {
        return scope.player.buildings.barracks <= scope.player.buildings.wolvesden;
    }
}


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UseWolvesDen = UseWolvesDen;
var utils_1 = __webpack_require__(6);
var constants_1 = __webpack_require__(5);
function UseWolvesDen(_a) {
    var data_hub = _a.data_hub;
    if ((0, utils_1.WolvesAreObsolete)()) {
        return;
    }
    for (var i = 0; i < data_hub.my_wolf_dens.length; i++) {
        var wolf_den = data_hub.my_wolf_dens[i];
        if (wolf_den.isUnderConstruction) {
            continue;
        }
        if (wolf_den.queue[0]) {
            continue;
        }
        var unit_selection = _SelectWolfDenUnit(data_hub);
        var queued_unit = false;
        if (data_hub.spendable_gold >= unit_selection.cost && data_hub.available_supply >= unit_selection.supply) {
            scope.order(unit_selection.order, [{ 'unit': wolf_den }]);
            wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + unit_selection.build_time;
            queued_unit = true;
        }
        if (!_BuildOrderExceptionApplies(data_hub, queued_unit)) {
            data_hub.spendable_gold -= unit_selection.cost;
            data_hub.available_supply -= unit_selection.supply;
        }
    }
    if (scope.getCurrentSupply() >= scope.player.supplyCap - constants_1.NEAR_MAX_SUPPLY) {
        return;
    }
    for (var i = 0; i < data_hub.my_wolf_dens.length; i++) {
        var wolf_den = data_hub.my_wolf_dens[i];
        if (wolf_den.isUnderConstruction) {
            continue;
        }
        if (!wolf_den.queue[0]) {
            continue;
        }
        if (wolf_den.queue[0] && wolf_den.queue[1]) {
            continue;
        }
        if (!wolf_den.ranger_bot.queue_finish_time) {
            wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
        }
        var time_left = wolf_den.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
        if (time_left >= constants_1.PRE_QUEUE_BUFFER) {
            continue;
        }
        var unit_selection = _SelectWolfDenUnit(data_hub);
        var available_supply = (function () {
            if (_BuildOrderExceptionApplies(data_hub, false)) {
                return data_hub.available_supply - data_hub.units_supply_producing;
            }
            else {
                return data_hub.available_supply;
            }
        })();
        var queued_unit = false;
        if (data_hub.spendable_gold >= unit_selection.cost && available_supply >= unit_selection.supply) {
            scope.order(unit_selection.order, [{ 'unit': wolf_den }]);
            wolf_den.ranger_bot.queue_finish_time += unit_selection.build_time;
            queued_unit = true;
        }
        if (!_BuildOrderExceptionApplies(data_hub, queued_unit)) {
            data_hub.spendable_gold -= unit_selection.cost;
            data_hub.available_supply -= unit_selection.supply;
        }
    }
}
function _BuildOrderExceptionApplies(data_hub, queued_unit) {
    if (queued_unit) {
        return false;
    }
    else if ((0, utils_1.WolvesAreObsolete)()) {
        return false;
    }
    else if (data_hub.active_mining_bases > 1) {
        return false;
    }
    else if (data_hub.viable_gold_mines.length < 1) {
        return false;
    }
    else if (!scope.player.buildings.house) {
        return false;
    }
    else if (2 != scope.player.buildings.house) {
        return false;
    }
    else if (!scope.player.buildings.wolvesden) {
        return false;
    }
    else if (2 != scope.player.buildings.wolvesden) {
        return false;
    }
    else {
        return true;
    }
}
var WOLF_SELECTION = {
    'order': 'Train Wolf',
    'cost': constants_1.WOLF_COST,
    'supply': constants_1.WOLF_SUPPLY,
    'build_time': constants_1.WOLF_BUILD_TIME,
};
var SNAKE_SELECTION = {
    'order': 'Train Snake',
    'cost': constants_1.SNAKE_COST,
    'supply': constants_1.SNAKE_SUPPLY,
    'build_time': constants_1.SNAKE_BUILD_TIME,
};
function _SelectWolfDenUnit(data_hub) {
    if (!scope.player.buildings.snakecharmer || scope.player.buildings.snakecharmer < 1) {
        return WOLF_SELECTION;
    }
    if (data_hub.count_melee < 7) {
        data_hub.count_melee++;
        return WOLF_SELECTION;
    }
    var total = data_hub.count_melee + data_hub.count_ranged;
    var target_ratio = total / 50;
    var actual_ratio = data_hub.count_ranged / total;
    if (target_ratio > actual_ratio) {
        data_hub.count_ranged++;
        return SNAKE_SELECTION;
    }
    else {
        data_hub.count_melee++;
        return WOLF_SELECTION;
    }
}


/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ResearchUpgrades = ResearchUpgrades;
var constants_1 = __webpack_require__(5);
function ResearchUpgrades(_a) {
    var data_hub = _a.data_hub;
    _ResearchArcherRange(data_hub);
    if (data_hub.AttackUpgradeLevel() < constants_1.MAX_ATTACK_UPGRADE_LEVEL) {
        _ResearchForgeUpgrade({
            data_hub: data_hub,
            upgrade_order: 'Attack Upgrade',
            upgrade_cost: data_hub.AttackUpgradeCost(),
        });
    }
    if (data_hub.ArmorUpgradeLevel() < constants_1.MAX_ARMOR_UPGRADE_LEVEL) {
        _ResearchForgeUpgrade({
            data_hub: data_hub,
            upgrade_order: 'Armor Upgrade',
            upgrade_cost: data_hub.ArmorUpgradeCost(),
        });
    }
}
function _ResearchArcherRange(data_hub) {
    if (data_hub.my_armories.length <= 0) {
        return;
    }
    if (scope.player.upgrades.upgrange && scope.player.upgrades.upgrange >= 1) {
        return;
    }
    for (var i = 0; i < data_hub.my_armories.length; i++) {
        var armory = data_hub.my_armories[i];
        if (armory.isUnderConstruction) {
            continue;
        }
        for (var j = 0; j < 5; j++) {
            var order = armory.queue[j];
            if (!order) {
                continue;
            }
            if (order.name == 'Archer Range') {
                return;
            }
        }
    }
    var available_armories = data_hub.my_armories.filter(function (a) { return !a.isUnderConstruction && !a.queue[0]; });
    if (available_armories.length <= 0) {
        return;
    }
    if (data_hub.spendable_gold >= constants_1.ARCHER_RANGE_COST) {
        scope.order('Research Archer Range', [{ 'unit': available_armories[0] }]);
    }
    data_hub.spendable_gold -= constants_1.ARCHER_RANGE_COST;
}
function _ResearchForgeUpgrade(_a) {
    var data_hub = _a.data_hub, upgrade_order = _a.upgrade_order, upgrade_cost = _a.upgrade_cost;
    for (var i = 0; i < data_hub.my_forges.length; i++) {
        var forge = data_hub.my_forges[i];
        if (forge.queue[0]) {
            continue;
        }
        if (data_hub.spendable_gold >= upgrade_cost) {
            scope.order(upgrade_order, [{ 'unit': forge }]);
        }
        data_hub.spendable_gold -= upgrade_cost;
    }
}


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NextBuildOrderStep = NextBuildOrderStep;
var constants_1 = __webpack_require__(5);
var start_expansion_when_ready_1 = __webpack_require__(56);
var build_1 = __webpack_require__(48);
var build_towers_1 = __webpack_require__(58);
var utils_1 = __webpack_require__(6);
var upgrade_watchtowers_1 = __webpack_require__(59);
function NextBuildOrderStep(_a) {
    var data_hub = _a.data_hub;
    var already_reserved_castle_gold = false;
    var castle_builders = data_hub.castle_builders;
    var viable_gold_mines = data_hub.viable_gold_mines;
    if (data_hub.NeedReplacementExpansion()) {
        data_hub.spendable_gold += 2 * constants_1.CASTLE_COST;
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        data_hub.spendable_gold -= 3 * constants_1.CASTLE_COST;
        already_reserved_castle_gold = true;
    }
    if (data_hub.active_mining_bases < 1 && viable_gold_mines.length > 0) {
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        if (!already_reserved_castle_gold) {
            data_hub.spendable_gold -= constants_1.CASTLE_COST;
            already_reserved_castle_gold = true;
        }
    }
    if (!scope.player.buildings.house || scope.player.buildings.house <= 0) {
        if (_NeedFirstHouse(data_hub) && data_hub.spendable_gold >= constants_1.HOUSE_COST) {
            (0, build_1.BuildHouse)({ data_hub: data_hub });
        }
        return;
    }
    if ((0, build_towers_1.BuildTowers)({ data_hub: data_hub })) {
        return;
    }
    if ((0, upgrade_watchtowers_1.UpgradeWatchtowers)({ data_hub: data_hub })) {
        return;
    }
    if ((0, utils_1.WolvesAreObsolete)()) {
        if (data_hub.my_barracks.length < 1) {
            if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
                (0, build_1.BuildBarracks)({ data_hub: data_hub });
            }
            return;
        }
    }
    else {
        if (data_hub.my_wolf_dens.length < 2) {
            if (data_hub.spendable_gold >= constants_1.WOLF_DEN_COST) {
                (0, build_1.BuildWolfDen)({ data_hub: data_hub });
            }
            return;
        }
    }
    if (data_hub.active_mining_bases < 2 && viable_gold_mines.length > 0) {
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        if (!already_reserved_castle_gold) {
            data_hub.spendable_gold -= constants_1.CASTLE_COST;
            already_reserved_castle_gold = true;
        }
    }
    if (!(0, utils_1.WolvesAreObsolete)() && data_hub.my_snake_charmers.length < 1) {
        if (data_hub.spendable_gold >= constants_1.SNAKE_CHARMER_COST) {
            (0, build_1.BuildSnakeCharmer)({ data_hub: data_hub });
        }
        return;
    }
    if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
        scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers = true;
        (0, build_towers_1.BuildTowers)({ data_hub: data_hub });
        return;
    }
    var rax_on_2_base = (0, utils_1.WolvesAreObsolete)() ? 3 : 1;
    if (data_hub.my_barracks.length < rax_on_2_base) {
        if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
            (0, build_1.BuildBarracks)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.active_mining_bases < 3 && viable_gold_mines.length > 0) {
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        if (!already_reserved_castle_gold) {
            data_hub.spendable_gold -= constants_1.CASTLE_COST;
            already_reserved_castle_gold = true;
        }
    }
    var rax_on_3_base = (0, utils_1.WolvesAreObsolete)() ? 4 : 3;
    if (data_hub.my_barracks.length < rax_on_3_base) {
        if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
            (0, build_1.BuildBarracks)({ data_hub: data_hub });
        }
        return;
    }
    var count_forges_needed = _CalculateForgesNeeded(data_hub);
    if (data_hub.my_forges.length < Math.min(1, count_forges_needed)) {
        if (data_hub.spendable_gold >= constants_1.FORGE_COST) {
            (0, build_1.BuildForge)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.my_armories.length < 1 &&
        (undefined === scope.player.upgrades.upgrange || 0 == scope.player.upgrades.upgrange)) {
        if (data_hub.spendable_gold >= constants_1.ARMORY_COST) {
            (0, build_1.BuildArmory)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.active_mining_bases < 4 && viable_gold_mines.length > 0) {
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        if (!already_reserved_castle_gold) {
            data_hub.spendable_gold -= constants_1.CASTLE_COST;
            already_reserved_castle_gold = true;
        }
    }
    if (data_hub.my_barracks.length < 6) {
        if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
            (0, build_1.BuildBarracks)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.my_forges.length < Math.min(2, count_forges_needed)) {
        if (data_hub.spendable_gold >= constants_1.FORGE_COST) {
            (0, build_1.BuildForge)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.active_mining_bases < 5 && viable_gold_mines.length > 0) {
        if (castle_builders.length <= 0) {
            (0, start_expansion_when_ready_1.StartExpansionWhenReady)({ data_hub: data_hub });
        }
        if (!already_reserved_castle_gold) {
            data_hub.spendable_gold -= constants_1.CASTLE_COST;
            already_reserved_castle_gold = true;
        }
    }
    if (data_hub.my_barracks.length < 8) {
        if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
            (0, build_1.BuildBarracks)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.my_forges.length < count_forges_needed) {
        if (data_hub.spendable_gold >= constants_1.FORGE_COST) {
            (0, build_1.BuildForge)({ data_hub: data_hub });
        }
        return;
    }
    if (data_hub.my_barracks.length < constants_1.MAX_BARRACKS &&
        data_hub.my_barracks.every(function (b) { return b.isUnderConstruction || b.queue[0]; })) {
        if (data_hub.spendable_gold >= constants_1.BARRACKS_COST) {
            (0, build_1.BuildBarracks)({ data_hub: data_hub });
        }
        return;
    }
}
function _NeedFirstHouse(data_hub) {
    if (scope.getCurrentGameTimeInSec() < 40) {
        return false;
    }
    if (data_hub.my_houses.length > 0) {
        return false;
    }
    if (data_hub.house_builders && data_hub.house_builders.length > 0) {
        return false;
    }
    return true;
}
function _CalculateForgesNeeded(data_hub) {
    var forge_upgrades_needed = 10 - data_hub.AttackUpgradeLevel() - data_hub.ArmorUpgradeLevel();
    var idle_forges = 0;
    for (var i = 0; i < data_hub.my_forges.length; i++) {
        var forge = data_hub.my_forges[i];
        if (forge.isUnderConstruction) {
            continue;
        }
        if (forge.queue[0]) {
            continue;
        }
        idle_forges++;
    }
    return Math.min(forge_upgrades_needed - idle_forges, constants_1.MAX_FORGES);
}


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StartExpansionWhenReady = StartExpansionWhenReady;
var select_castle_placement_1 = __webpack_require__(57);
var allocate_worker_1 = __webpack_require__(34);
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
function StartExpansionWhenReady(_a) {
    var data_hub = _a.data_hub;
    var next_expansion = _SelectNextExpansion(data_hub);
    if (!next_expansion) {
        if (constants_1.DEBUG) {
            console.log(data_hub.map.expansions);
            console.log('ERROR: Missing next_expansion for StartExpansionWhenReady');
        }
        return;
    }
    var castle_placement = (0, select_castle_placement_1.SelectCastlePlacement)({ player_expansion: next_expansion });
    if (!castle_placement) {
        if (constants_1.DEBUG) {
            console.log(next_expansion);
            console.log('ERROR: Missing castle_placement for StartExpansionWhenReady');
        }
        return;
    }
    if (_NeedsTower(castle_placement, data_hub)) {
        if (data_hub.spendable_gold < data_hub.TowerCost()) {
            data_hub.spendable_gold -= data_hub.TowerCost();
            return;
        }
        data_hub.spendable_gold -= data_hub.TowerCost();
        _BuildTower(castle_placement, data_hub);
    }
    var closest_mine = (0, ground_distance_1.GetClosestActiveMineToLocation)(castle_placement.castle_location, data_hub.active_mines);
    if (!closest_mine) {
        if (constants_1.DEBUG) {
            console.log('ERROR: Missing closest_mine for StartExpansionWhenReady');
        }
        return;
    }
    var ground_distance = (0, ground_distance_1.SafeGroundDistance)(closest_mine.midpoint, castle_placement.castle_location);
    if (isNaN(ground_distance)) {
        if (constants_1.DEBUG) {
            console.log('ERROR: Missing ground_distance for StartExpansionWhenReady');
        }
        return;
    }
    var travel_time = Math.floor(ground_distance / constants_1.WORKER_SPEED);
    var travel_gold = travel_time * data_hub.net_gold_per_sec;
    if (data_hub.spendable_gold < constants_1.CASTLE_COST - travel_gold) {
        return;
    }
    var new_builder = (0, allocate_worker_1.AllocateWorkerFromActiveMine)(closest_mine);
    if (!new_builder) {
        if (constants_1.DEBUG) {
            console.log('ERROR: Missing new_builder for StartExpansionWhenReady');
        }
        return;
    }
    new_builder.ranger_bot = {
        'expansion': next_expansion,
        'placement': castle_placement,
        'job': 'build',
        'building_type': 'castle',
        'order': 'Build Castle',
        'exclude_worker_paths': false,
        'cost': constants_1.CASTLE_COST,
        'reserve': 0,
        'target_location': castle_placement.castle_location,
    };
    data_hub.castle_builders.push(new_builder);
    scope.order('Move', [{ 'unit': new_builder }], new_builder.ranger_bot.target_location);
}
function _SelectNextExpansion(data_hub) {
    return data_hub.map.expansions.filter(function (player_expansion) {
        var is_viable = false;
        for (var i = 0; i < player_expansion.castle_placements.length; i++) {
            var placement = player_expansion.castle_placements[i];
            for (var j = 0; j < placement.mines_data.length; j++) {
                var active_mine = placement.mines_data[j];
                if (!active_mine.gold_mine) {
                    if (constants_1.DEBUG) {
                        console.log(active_mine);
                    }
                    throw new Error('Missing gold_mine for _SelectNextExpansion');
                }
                var gold_mine = active_mine.gold_mine;
                if (gold_mine.castle) {
                    return false;
                }
                else if (gold_mine.gold > 0) {
                    is_viable = true;
                }
            }
        }
        return is_viable;
    }).sort(function (a, b) { return a.score - b.score; }).find(function () { return true; });
}
function _NeedsTower(castle_placement, data_hub) {
    if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
        return false;
    }
    else if (data_hub.traveling_tower_builders.length > 0) {
        return false;
    }
    for (var i = 0; i < castle_placement.mines_data.length; i++) {
        var active_mine = castle_placement.mines_data[i];
        if (!active_mine.gold_mine) {
            if (constants_1.DEBUG) {
                console.log(active_mine);
            }
            throw new Error('Missing gold_mine for _NeedsTower');
        }
        var gold_mine = active_mine.gold_mine;
        if (gold_mine.tower) {
            return false;
        }
    }
    return true;
}
function _BuildTower(castle_placement, data_hub) {
    var new_builder = (0, allocate_worker_1.AllocateAvailableWorkerClosestToLocation)({
        map_location: castle_placement.tower_location,
        active_mines: data_hub.active_mines,
        idle_workers: data_hub.idle_workers,
    });
    if (!new_builder) {
        if (constants_1.DEBUG) {
            console.log('ERROR: Missing new_builder for _BuildTower');
        }
        return;
    }
    new_builder.ranger_bot = {
        'active_mines': castle_placement.mines_data,
        'job': 'build',
        'building_type': 'watchtower',
        'order': 'Build Watchtower',
        'exclude_worker_paths': false,
        'cost': data_hub.TowerCost(),
        'reserve': data_hub.TowerCost(),
        'target_location': castle_placement.tower_location,
    };
    data_hub.traveling_tower_builders.push(new_builder);
    scope.order('Move', [{ 'unit': new_builder }], new_builder.ranger_bot.target_location);
}


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SelectCastlePlacement = SelectCastlePlacement;
var buildable_1 = __webpack_require__(15);
var constants_1 = __webpack_require__(5);
function SelectCastlePlacement(_a) {
    var player_expansion = _a.player_expansion;
    var prev_score = NaN;
    for (var i = 0; i < player_expansion.castle_placements.length; i++) {
        var placement = player_expansion.castle_placements[i];
        if (isNaN(prev_score)) {
            prev_score = placement.score;
        }
        else if (prev_score > placement.score) {
            if (constants_1.DEBUG) {
                console.log(player_expansion);
            }
            throw new Error('Disordered castle_placements for SelectCastlePlacement');
        }
        else {
            prev_score = placement.score;
        }
        var are_builiable = (0, buildable_1.AreBuildable)({
            x_min: placement.castle_location.x,
            x_max: placement.castle_location.x + constants_1.CASTLE_WIDTH - 1,
            y_min: placement.castle_location.y,
            y_max: placement.castle_location.y + constants_1.CASTLE_HEIGHT - 1,
            exclude_worker_paths: false,
        });
        if (are_builiable) {
            return placement;
        }
    }
    return undefined;
}


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BuildTowers = BuildTowers;
var allocate_worker_1 = __webpack_require__(34);
var constants_1 = __webpack_require__(5);
function BuildTowers(_a) {
    var data_hub = _a.data_hub;
    if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
        return false;
    }
    var without_towers = data_hub.my_castles.filter(function (c) { return !c.ranger_bot.tower && c.ranger_bot.mining_data; })
        .sort(function (a, b) { return b.id - a.id; });
    if (without_towers.length <= 0) {
        return false;
    }
    var traveling_tower_builders = data_hub.traveling_tower_builders;
    if (traveling_tower_builders.length > 0) {
        return false;
    }
    if (data_hub.spendable_gold < data_hub.TowerCost()) {
        return true;
    }
    var next_castle = without_towers[0];
    var mining_data = next_castle.ranger_bot.mining_data;
    var target_location = mining_data.tower_location;
    var new_builder = (0, allocate_worker_1.AllocateAvailableWorkerClosestToLocation)({
        map_location: target_location,
        active_mines: data_hub.active_mines,
        idle_workers: data_hub.idle_workers,
    });
    if (!new_builder) {
        if (constants_1.DEBUG) {
            console.log('Error: Missing new_builder for BuildTowers');
        }
        return true;
    }
    new_builder.ranger_bot = {
        'castle': next_castle,
        'active_mines': mining_data.mines_data,
        'job': 'build',
        'building_type': 'watchtower',
        'order': 'Build Watchtower',
        'exclude_worker_paths': false,
        'cost': data_hub.TowerCost(),
        'reserve': data_hub.TowerCost(),
        'target_location': target_location,
    };
    traveling_tower_builders.push(new_builder);
    return true;
}


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpgradeWatchtowers = UpgradeWatchtowers;
var constants_1 = __webpack_require__(5);
function UpgradeWatchtowers(_a) {
    var data_hub = _a.data_hub;
    if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
        return false;
    }
    if (0 == data_hub.my_watchtowers.length) {
        return false;
    }
    for (var i = 0; i < data_hub.my_watchtowers.length; i++) {
        var tower = data_hub.my_watchtowers[i];
        if (tower.isUnderConstruction) {
            continue;
        }
        if (tower.queue && tower.queue[0] && 'watchtower2' == tower.queue[0].id_string) {
            continue;
        }
        if (data_hub.spendable_gold < constants_1.WATCHTOWER_DETECTION_COST) {
            return true;
        }
        scope.order('Research Detection', [{ 'unit': tower }]);
        data_hub.spendable_gold -= constants_1.WATCHTOWER_DETECTION_COST;
    }
    return false;
}


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArmyBot = void 0;
var constants_1 = __webpack_require__(5);
var update_threats_1 = __webpack_require__(61);
var update_targets_1 = __webpack_require__(62);
var prioritize_targets_1 = __webpack_require__(63);
var form_squads_1 = __webpack_require__(64);
var conscript_workers_1 = __webpack_require__(65);
var identify_battles_1 = __webpack_require__(66);
var calculate_squad_strength_1 = __webpack_require__(67);
var evaluate_battle_1 = __webpack_require__(68);
var manage_squad_1 = __webpack_require__(69);
var manage_battle_status_1 = __webpack_require__(70);
var allocate_units_1 = __webpack_require__(71);
var command_idle_units_1 = __webpack_require__(75);
var unit_stats_1 = __webpack_require__(26);
var ArmyBot = (function () {
    function ArmyBot(_a) {
        var data_hub = _a.data_hub;
        this.data_hub = data_hub;
        this.army_hp = 0;
        this.army_dps = 0;
    }
    ArmyBot.prototype.Step = function () {
        this._ResetUnitOrders();
        this.data_hub.threats = (0, update_threats_1.UpdateThreats)({ data_hub: this.data_hub });
        this.data_hub.targets = (0, update_targets_1.UpdateTargets)({ data_hub: this.data_hub });
        (0, prioritize_targets_1.PrioritizeTargets)({ data_hub: this.data_hub });
        var squads = (0, form_squads_1.FormSquads)({ data_hub: this.data_hub });
        var conscripted_squads = (0, conscript_workers_1.ConscriptWorkers)({ data_hub: this.data_hub });
        squads = squads.concat(conscripted_squads);
        for (var i = 0; i < squads.length; i++) {
            var squad = squads[i];
            (0, calculate_squad_strength_1.CalculateSquadStrength)(squad);
        }
        var battles = (0, identify_battles_1.IdentifyBattles)({
            data_hub: this.data_hub,
            squads: squads,
        });
        for (var i = 0; i < battles.length; i++) {
            var battle = battles[i];
            this._ManageBattle(battle);
        }
        (0, manage_battle_status_1.ManageBattleStatus)({
            data_hub: this.data_hub,
            battles: battles,
            squads: squads,
        });
        (0, allocate_units_1.AllocateUnits)({
            data_hub: this.data_hub,
            battles: battles,
            army_strength: this.army_hp * this.army_dps,
        });
        (0, command_idle_units_1.CommandIdleUnits)(this.data_hub.my_fighting_units);
    };
    ArmyBot.prototype.Save = function () {
        var new_targets = [];
        for (var i = 0; i < this.data_hub.targets.length; i++) {
            var old_target = this.data_hub.targets[i];
            var new_target = {
                'location': old_target.location,
                'r': old_target.r,
                'threats': [],
                'units': old_target.units,
                'is_air': old_target.is_air,
                'is_invisible': old_target.is_invisible,
            };
            if (undefined !== old_target.ground_distance && !isNaN(old_target.ground_distance)) {
                new_target['ground_distance'] = old_target.ground_distance;
            }
            if (undefined !== old_target.active_castle) {
                new_target['active_castle'] = old_target.active_castle;
            }
            if (undefined !== old_target.base_priority && !isNaN(old_target.base_priority)) {
                new_target['base_priority'] = old_target.base_priority;
            }
            if (undefined !== old_target.attacking) {
                new_target['attacking'] = !!old_target.attacking;
            }
            new_targets.push(new_target);
        }
        scope.ranger_bot.team_caches[this.data_hub.team_cache_key].targets = new_targets;
    };
    ArmyBot.prototype._ResetUnitOrders = function () {
        for (var i = 0; i < this.data_hub.my_units.length; i++) {
            var my_unit = this.data_hub.my_units[i];
            var lwg_cache = my_unit.ranger_bot;
            delete lwg_cache['command'];
            delete lwg_cache['command_at'];
            if ('Worker' == my_unit.type.name) {
                continue;
            }
            else if ('Wolf' == my_unit.type.name || 'Snake' == my_unit.type.name ||
                'Archer' == my_unit.type.name || 'Soldier' == my_unit.type.name) {
                this.army_dps += (0, unit_stats_1.CalculateDps)(my_unit);
                var effective_hp = my_unit.hp * (0, unit_stats_1.ArmorFactor)(my_unit.type.armor);
                this.army_hp += effective_hp;
            }
            else if (constants_1.DEBUG) {
                console.log('Error: Unhandled unit type "' + my_unit.type.name + '" for _ResetUnitOrders');
            }
        }
    };
    ArmyBot.prototype._ManageBattle = function (battle) {
        var aggro_mode = this._ManageAggroMode();
        battle.command = (0, evaluate_battle_1.EvaluateBattle)(battle, aggro_mode);
        for (var i = 0; i < battle.squads.length; i++) {
            var squad = battle.squads[i];
            (0, manage_squad_1.ManageSquad)({
                data_hub: this.data_hub,
                battle: battle,
                squad: squad,
                aggro_mode: aggro_mode,
            });
        }
    };
    ArmyBot.prototype._ManageAggroMode = function () {
        if (scope.getMaxSupply() >= scope.player.supplyCap &&
            (scope.getCurrentSupply() - constants_1.AGGRO_START_GAP) >= scope.player.supplyCap) {
            scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode = true;
        }
        else if (!!scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode &&
            (scope.getCurrentSupply() - constants_1.AGGRO_STOP_GAP) >= scope.player.supplyCap) {
            scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode = false;
        }
        return !!scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode;
    };
    return ArmyBot;
}());
exports.ArmyBot = ArmyBot;


/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateThreats = UpdateThreats;
var constants_1 = __webpack_require__(5);
var unit_stats_1 = __webpack_require__(26);
var utils_1 = __webpack_require__(6);
function UpdateThreats(_a) {
    var data_hub = _a.data_hub;
    if (scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at &&
        scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at >= scope.getCurrentGameTimeInSec()) {
        return scope.ranger_bot.team_caches[data_hub.team_cache_key].threats;
    }
    if (undefined === scope.ranger_bot.team_caches[data_hub.team_cache_key].threats) {
        _SeedThreats(data_hub);
    }
    var threats = scope.ranger_bot.team_caches[data_hub.team_cache_key].threats;
    threats = _ScoutGoldMines(data_hub, threats);
    if (0 >= threats.buildings.length && 0 >= threats.units.length) {
        threats = _LookEverywhere(threats);
    }
    threats = _RollOverUnitThreats(data_hub, threats);
    threats = _QueryBuildingThreats(data_hub, threats);
    scope.ranger_bot.team_caches[data_hub.team_cache_key].threats = threats;
    scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at = scope.getCurrentGameTimeInSec();
    return threats;
}
function _SeedThreats(data_hub) {
    var new_threats = {
        'buildings': [],
        'units': [],
    };
    for (var i = 0; i < data_hub.teams.enemies.length; i++) {
        var enemy_id = data_hub.teams.enemies[i];
        var enemy_start = data_hub.teams.players[enemy_id].start_location;
        new_threats.units.push({
            'owner_id': enemy_id,
            'utid': 'seed-' + String(enemy_id),
            'name': 'Start',
            'type': 'castle',
            'location': enemy_start,
            'hp': 1,
            'armor': 0,
            'dps': 1,
            'range': 0,
            'is_air': false,
            'is_invisible': false,
            'cleared': false,
        });
    }
    scope.ranger_bot.team_caches[data_hub.team_cache_key].threats = new_threats;
}
function _ScoutGoldMines(data_hub, threats) {
    var dx = (constants_1.CASTLE_WIDTH - 1) / 2;
    var dy = (constants_1.CASTLE_HEIGHT - 1) / 2;
    for (var i = 0; i < data_hub.gold_mines.length; i++) {
        var gold_mine = data_hub.gold_mines[i];
        if (0 >= gold_mine.gold || gold_mine.castle || gold_mine.tower) {
            continue;
        }
        if (undefined === gold_mine.last_scouted_at) {
            gold_mine.last_scouted_at = scope.getCurrentGameTimeInSec();
            continue;
        }
        var time_since_scouted = scope.getCurrentGameTimeInSec() - gold_mine.last_scouted_at;
        if (time_since_scouted < constants_1.MINE_SCOUT_INTERVAL) {
            continue;
        }
        if (undefined === gold_mine.scouting_threats) {
            gold_mine.scouting_threats = [];
        }
        gold_mine.scouting_threats = gold_mine.scouting_threats.filter(function (t) { return !t.cleared; });
        if (0 < gold_mine.scouting_threats.length) {
            continue;
        }
        for (var _i = 0, _a = Object.entries(gold_mine.perimeter); _i < _a.length; _i++) {
            var _b = _a[_i], raw_x = _b[0], y_list = _b[1];
            var x = Number(raw_x);
            if (isNaN(x)) {
                continue;
            }
            for (var raw_y in y_list) {
                var y = Number(raw_y);
                if (isNaN(y)) {
                    continue;
                }
                var new_threat = {
                    'owner_id': -1,
                    'utid': 'scout_mine-' + String(gold_mine.id) + '-' + String(x + dx) + '-' + String(y + dy),
                    'name': 'Scout Mine',
                    'type': 'worker',
                    'location': { 'x': x + dx, 'y': y + dy },
                    'hp': 0,
                    'armor': 0,
                    'dps': 0,
                    'range': 0,
                    'is_air': false,
                    'is_invisible': false,
                    'cleared': false,
                };
                gold_mine.scouting_threats.push(new_threat);
                threats.units.push(new_threat);
            }
        }
        gold_mine.last_scouted_at = scope.getCurrentGameTimeInSec();
    }
    return threats;
}
function _LookEverywhere(threats) {
    var map_width = scope.getMapWidth();
    var map_height = scope.getMapHeight();
    for (var x = 0; x <= map_width; x++) {
        for (var y = 0; y <= map_height; y++) {
            if (!scope.positionIsPathable(x, y)) {
                continue;
            }
            if (scope.fieldIsRamp(x, y)) {
                continue;
            }
            threats.units.push({
                'owner_id': -1,
                'utid': 'hide_and_seek-' + String(x) + '-' + String(y),
                'name': 'Hide and Seek',
                'type': 'worker',
                'location': { 'x': x, 'y': y },
                'hp': 0,
                'armor': 0,
                'dps': 0,
                'range': 0,
                'is_air': false,
                'is_invisible': false,
                'cleared': false,
            });
        }
    }
    return threats;
}
function _RollOverUnitThreats(data_hub, threats) {
    var all_units = scope.getUnits().map(function (v) { return v.unit; });
    var new_unit_threats = [];
    var new_unit_ids = {};
    for (var i = 0; i < all_units.length; i++) {
        var unit = all_units[i];
        if (unit.owner.number == scope.getMyPlayerNumber()) {
            continue;
        }
        if (unit.owner.number != 0 && data_hub.teams.players[unit.owner.number].is_ally) {
            continue;
        }
        if (unit.owner.number == 0) {
            continue;
        }
        new_unit_threats.push({
            'owner_id': unit.owner.number,
            'utid': String(unit.id),
            'name': unit.type.name,
            'type': unit.type.id_string,
            'location': unit.pos,
            'hp': unit.hp,
            'armor': (0, unit_stats_1.CalculateArmor)(unit),
            'dps': (0, unit_stats_1.CalculateDps)(unit),
            'range': (0, unit_stats_1.CalculateRange)(unit),
            'is_air': (0, unit_stats_1.IsFlying)(unit),
            'is_invisible': (0, unit_stats_1.IsInvisible)(unit),
            'cleared': false,
        });
        new_unit_ids[String(unit.id)] = true;
    }
    for (var i = 0; i < threats.units.length; i++) {
        var old_threat = threats.units[i];
        if (new_unit_ids[old_threat.utid]) {
            old_threat.cleared = true;
            continue;
        }
        if (data_hub.LocationIsVisible(old_threat.location)) {
            old_threat.cleared = true;
            continue;
        }
        old_threat.hp = old_threat.hp *= constants_1.THREAT_DECAY;
        old_threat.dps = old_threat.dps *= constants_1.THREAT_DECAY;
        new_unit_threats.push(old_threat);
    }
    threats['units'] = new_unit_threats;
    return threats;
}
function _QueryBuildingThreats(data_hub, threats) {
    var all_buildings = scope.getBuildings().map(function (b) { return b.unit; });
    var new_building_threats = [];
    var _loop_1 = function (i) {
        var building = all_buildings[i];
        if (building.owner.number == scope.getMyPlayerNumber()) {
            return "continue";
        }
        if (building.owner.number == 0) {
            return "continue";
        }
        if (data_hub.teams.players[building.owner.number].is_ally) {
            return "continue";
        }
        var width = (0, utils_1.GetNumberFieldValue)({ piece_name: building.type.id_string, field_name: 'sizeX' });
        var height = (0, utils_1.GetNumberFieldValue)({ piece_name: building.type.id_string, field_name: 'sizeY' });
        var dx = (width - 1) / 2;
        var dy = (height - 1) / 2;
        var dps = (function () {
            if (building.isUnderConstruction) {
                return 0;
            }
            else {
                return (0, unit_stats_1.CalculateDps)(building);
            }
        })();
        new_building_threats.push({
            'owner_id': building.owner.number,
            'utid': String(building.id),
            'name': building.type.name,
            'type': building.type.id_string,
            'location': {
                'x': building.x + dx,
                'y': building.y + dy,
            },
            'hp': building.hp,
            'armor': (0, unit_stats_1.CalculateArmor)(building),
            'dps': dps,
            'range': (0, unit_stats_1.CalculateRange)(building),
            'is_air': false,
            'is_invisible': (0, unit_stats_1.IsInvisible)(building),
            'cleared': false,
        });
    };
    for (var i = 0; i < all_buildings.length; i++) {
        _loop_1(i);
    }
    threats['buildings'] = new_building_threats;
    return threats;
}


/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateTargets = UpdateTargets;
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
function UpdateTargets(_a) {
    var data_hub = _a.data_hub;
    if (scope.ranger_bot.team_caches[data_hub.team_cache_key].targets_last_updated_at &&
        scope.ranger_bot.team_caches[data_hub.team_cache_key].targets_last_updated_at >= scope.getCurrentGameTimeInSec()) {
        return scope.ranger_bot.team_caches[data_hub.team_cache_key].targets;
    }
    if (undefined === scope.ranger_bot.team_caches[data_hub.team_cache_key].targets) {
        scope.ranger_bot.team_caches[data_hub.team_cache_key].targets = [];
    }
    var cached_targets = scope.ranger_bot.team_caches[data_hub.team_cache_key].targets;
    var output = [];
    var unallocated_building_threats = [data_hub.threats.buildings.map(function (b) { return b; })];
    var unallocated_unit_threats = [data_hub.threats.units.map(function (b) { return b; })];
    for (var i = 0; i < cached_targets.length; i++) {
        var target = cached_targets[i];
        _AllocateTargets(target, unallocated_building_threats, unallocated_unit_threats);
        if (target.threats.length <= 0) {
            continue;
        }
        target.r = constants_1.BASE_TARGET_RADIUS * Math.cbrt(target.threats.length);
        output.push(target);
    }
    while (unallocated_building_threats[0].length > 0) {
        var building_threat = unallocated_building_threats[0].pop();
        var threat_location = {
            'x': building_threat.location.x,
            'y': building_threat.location.y,
        };
        var new_target = {
            'location': threat_location,
            'r': constants_1.BASE_TARGET_RADIUS,
            'threats': [building_threat],
            'units': [],
            'is_air': false,
            'is_invisible': building_threat.is_invisible,
        };
        _AllocateTargets(new_target, unallocated_building_threats, unallocated_unit_threats);
        output.push(new_target);
    }
    while (unallocated_unit_threats[0].length > 0) {
        var unit_threat = unallocated_unit_threats[0].pop();
        var threat_location = {
            'x': unit_threat.location.x,
            'y': unit_threat.location.y,
        };
        var new_target = {
            'location': threat_location,
            'r': constants_1.BASE_TARGET_RADIUS,
            'threats': [unit_threat],
            'units': [],
            'is_air': unit_threat.is_air,
            'is_invisible': unit_threat.is_invisible,
        };
        _AllocateTargets(new_target, unallocated_building_threats, unallocated_unit_threats);
        output.push(new_target);
    }
    return output;
}
function _AllocateTargets(target, unallocated_building_threats, unallocated_unit_threats) {
    var done = false;
    while (!done) {
        var buildings_done = (function () {
            if (target.is_air) {
                return true;
            }
            else {
                return _GlomThreats(target, unallocated_building_threats);
            }
        })();
        var units_done = _GlomThreats(target, unallocated_unit_threats);
        done = (buildings_done && units_done);
        var new_radius = constants_1.BASE_TARGET_RADIUS * Math.cbrt(target.threats.length);
        if (new_radius > target.r) {
            target.r = new_radius;
            done = false;
        }
        var total_x = 0;
        var total_y = 0;
        for (var i = 0; i < target.threats.length; i++) {
            total_x += target.threats[i].location.x;
            total_y += target.threats[i].location.y;
        }
        var new_x = total_x / target.threats.length;
        var new_y = total_y / target.threats.length;
        if (Math.abs(new_x - target.location.x) > constants_1.TARGET_RESET_THRESHOLD || Math.abs(new_y - target.location.y) > constants_1.TARGET_RESET_THRESHOLD) {
            target.location.x = new_x;
            target.location.y = new_y;
            delete target['ground_distance'];
            delete target['active_castle'];
            delete target['base_priority'];
        }
        else {
            var distance = Math.sqrt(Math.pow((new_x - target.location.x), 2) + Math.pow((new_y - target.location.y), 2));
            if (distance > constants_1.TARGET_RESET_THRESHOLD) {
                target.location.x = new_x;
                target.location.y = new_y;
                delete target['ground_distance'];
                delete target['active_castle'];
                delete target['base_priority'];
            }
        }
    }
}
function _GlomThreats(target, threats) {
    var new_threats = [];
    var done = true;
    while (threats[0].length > 0) {
        var threat = threats[0].pop();
        if (target.is_air != threat.is_air) {
            new_threats.push(threat);
            continue;
        }
        else if (target.is_invisible != threat.is_invisible) {
            new_threats.push(threat);
            continue;
        }
        var air_distance = Math.sqrt(Math.pow((target.location.x - threat.location.x), 2) + Math.pow((target.location.y - threat.location.y), 2));
        if (air_distance > target.r) {
            new_threats.push(threat);
            continue;
        }
        else if (threat.is_air) {
            target.threats.push(threat);
            done = false;
            continue;
        }
        var ground_distance = (0, ground_distance_1.SafeGroundDistance)(threat.location, target.location);
        if (isNaN(ground_distance)) {
            if (constants_1.DEBUG) {
                console.log('Error: missing SafeGroundDistance for _GlomThreats');
            }
            new_threats.push(threat);
            continue;
        }
        if (ground_distance > target.r) {
            new_threats.push(threat);
        }
        else {
            target.threats.push(threat);
            done = false;
        }
    }
    threats[0] = new_threats;
    return done;
}


/***/ }),
/* 63 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrioritizeTargets = PrioritizeTargets;
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
var unit_stats_1 = __webpack_require__(26);
function PrioritizeTargets(_a) {
    var data_hub = _a.data_hub;
    var _loop_1 = function (i) {
        var target = data_hub.targets[i];
        _CalculateTargetStrength(target);
        if (!target.ground_distance || !target.active_castle || !target.base_priority) {
            var ground_data = (0, ground_distance_1.GetClosestActiveCastleToLocationData)({
                map_location: target.location,
                active_castles: data_hub.active_castles,
                with_workers: false,
            });
            var ground_distance = ground_data.ground_distance;
            var active_castle = ground_data.active_castle;
            var data_is_valid = !isNaN(ground_distance) && !!active_castle;
            if (data_is_valid) {
                target.ground_distance = ground_distance;
                target.active_castle = active_castle;
                target.base_priority = ground_distance;
            }
            else {
                target.base_priority = Math.sqrt(Math.pow(scope.getMapWidth(), 2) + Math.pow(scope.getMapHeight(), 2));
            }
        }
        target.priority = target.base_priority;
        var air_distances = data_hub.my_buildings.map(function (b) {
            return Math.sqrt(Math.pow((target.location.x - b.x), 2) + Math.pow((target.location.y - b.y), 2));
        });
        target.air_distance = Math.min.apply(Math, air_distances);
        target.priority += (target.air_distance / 2);
    };
    for (var i = 0; i < data_hub.targets.length; i++) {
        _loop_1(i);
    }
}
function _CalculateTargetStrength(target) {
    var target_dps = 0;
    var target_hp = 0;
    for (var i = 0; i < target.threats.length; i++) {
        var threat = target.threats[i];
        var effective_hp = threat.hp * (0, unit_stats_1.ArmorFactor)(threat.armor);
        if (threat.type == 'worker') {
            target_dps += (threat.dps * constants_1.WORKER_DISRESPECT);
            target_hp += (effective_hp * constants_1.WORKER_DISRESPECT);
        }
        else if (threat.type == 'airship') {
            target_hp += effective_hp;
        }
        else if (threat.dps <= 0) {
        }
        else {
            target_dps += threat.dps;
            target_hp += effective_hp;
        }
    }
    target.dps = target_dps;
    target.hp = target_hp;
    target.strength = target.dps * target.hp;
}


/***/ }),
/* 64 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FormSquads = FormSquads;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
var unit_stats_1 = __webpack_require__(26);
function FormSquads(_a) {
    var data_hub = _a.data_hub;
    var output = [];
    var unallocated_units = [data_hub.my_fighting_units.map(function (u) { return u; })];
    while (unallocated_units[0].length > 0) {
        var unit = unallocated_units[0].pop();
        var location_1 = {
            'x': unit.pos.x,
            'y': unit.pos.y,
        };
        var new_squad = {
            'location': location_1,
            'r': constants_1.BASE_TARGET_RADIUS,
            'units': [unit],
            'is_air': (0, unit_stats_1.IsFlying)(unit),
        };
        _AddUnits(new_squad, unallocated_units);
        output.push(new_squad);
    }
    return output;
}
function _AddUnits(squad, unallocated_units) {
    var done = false;
    while (!done) {
        done = _GlomUnits(squad, unallocated_units);
        var new_radius = constants_1.BASE_TARGET_RADIUS * Math.cbrt(squad.units.length);
        if (new_radius > squad.r) {
            squad.r = new_radius;
            done = false;
        }
        var total_x = 0;
        var total_y = 0;
        for (var i = 0; i < squad.units.length; i++) {
            total_x += squad.units[i].pos.x;
            total_y += squad.units[i].pos.y;
        }
        var new_x = total_x / squad.units.length;
        var new_y = total_y / squad.units.length;
        if (Math.abs(new_x - squad.location.x) > constants_1.TARGET_RESET_THRESHOLD || Math.abs(new_y - squad.location.y) > constants_1.TARGET_RESET_THRESHOLD) {
            squad.location.x = new_x;
            squad.location.y = new_y;
        }
        else {
            var distance = Math.sqrt(Math.pow((new_x - squad.location.x), 2) + Math.pow((new_y - squad.location.y), 2));
            if (distance > constants_1.TARGET_RESET_THRESHOLD) {
                squad.location.x = new_x;
                squad.location.y = new_y;
            }
        }
    }
}
function _GlomUnits(squad, units) {
    var new_units = [];
    var done = true;
    while (units[0].length > 0) {
        var unit = units[0].pop();
        if ((0, unit_stats_1.IsFlying)(unit) != squad.is_air) {
            new_units.push(unit);
            continue;
        }
        var air_distance = Math.sqrt(Math.pow((squad.location.x - unit.pos.x), 2) + Math.pow((squad.location.y - unit.pos.y), 2));
        if (air_distance > squad.r) {
            new_units.push(unit);
            continue;
        }
        else if ((0, unit_stats_1.IsFlying)(unit)) {
            squad.units.push(unit);
            done = false;
            continue;
        }
        var ground_distance = (0, ground_distance_1.SafeGroundDistance)(unit.pos, squad.location);
        if (isNaN(ground_distance)) {
            if (constants_1.DEBUG) {
                console.log('Error: missing SafeGroundDistance for _GlomUnits');
            }
            new_units.push(unit);
            continue;
        }
        if (ground_distance > squad.r) {
            new_units.push(unit);
        }
        else {
            squad.units.push(unit);
            done = false;
        }
    }
    units[0] = new_units;
    return done;
}


/***/ }),
/* 65 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConscriptWorkers = ConscriptWorkers;
var constants_1 = __webpack_require__(5);
var unit_stats_1 = __webpack_require__(26);
var ground_distance_1 = __webpack_require__(11);
function ConscriptWorkers(_a) {
    var data_hub = _a.data_hub;
    var active_castles = data_hub.active_castles;
    var conscripted_squads = [];
    var _loop_1 = function (i) {
        var active_castle = active_castles[i];
        var target = data_hub.targets.filter(function (target) {
            if (!target.dps || target.dps <= 0) {
                return false;
            }
            if (!target.active_castle || !target.ground_distance) {
                return false;
            }
            if (target.is_air) {
                return false;
            }
            if (target.is_invisible) {
                return false;
            }
            return target.active_castle.id == active_castle.id;
        }).sort(function (a, b) {
            var gda = a.ground_distance;
            var gdb = b.ground_distance;
            return gda - gdb;
        }).find(function () { return true; });
        var mining_data = active_castle.ranger_bot.mining_data;
        if (!target) {
            _UnconscriptCastle(mining_data);
            return "continue";
        }
        var ground_distance = target.ground_distance;
        if ((mining_data.conscripted && ground_distance < constants_1.CALM_DOWN_DISTANCE) ||
            ground_distance < constants_1.CONSCRIPTION_DISTANCE) {
            var new_squad = _ConscriptCastle(mining_data, target);
            if (new_squad) {
                conscripted_squads.push(new_squad);
            }
        }
        else {
            _UnconscriptCastle(mining_data);
        }
    };
    for (var i = 0; i < active_castles.length; i++) {
        _loop_1(i);
    }
    return conscripted_squads;
}
function _ConscriptCastle(mining_data, target) {
    mining_data.conscripted = true;
    var conscripted_workers = [];
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        var active_mine = mining_data.mines_data[i];
        conscripted_workers = conscripted_workers.concat(active_mine.workers.filter(function (w) { return w.ranger_bot.conscripted; }));
    }
    var target_unit_ids = {};
    for (var i = 0; i < target.units.length; i++) {
        var unit = target.units[i];
        target_unit_ids[unit.id] = true;
    }
    for (var i = 0; i < conscripted_workers.length; i++) {
        var worker = conscripted_workers[i];
        if (target_unit_ids[worker.id]) {
            continue;
        }
        target.units.push(worker);
    }
    var units_hp = 0;
    var units_dps = 0;
    for (var i = 0; i < target.units.length; i++) {
        var unit = target.units[i];
        var ground_distance = (0, ground_distance_1.SafeGroundDistance)(unit.pos, target.location);
        var is_far = isNaN(ground_distance) || ground_distance > constants_1.CONSCRIPTION_DISTANCE;
        if (is_far) {
            continue;
        }
        units_dps += (0, unit_stats_1.CalculateDps)(unit);
        var effective_hp = unit.hp * (0, unit_stats_1.ArmorFactor)(unit.type.armor);
        units_hp += effective_hp;
    }
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        var active_mine = mining_data.mines_data[i];
        if (units_hp * units_dps > target.strength * constants_1.CONSCRIPTION_THREAT_RESPONSE) {
            break;
        }
        for (var j = 0; j < active_mine.workers.length; j++) {
            var worker = active_mine.workers[j];
            if (units_hp * units_dps > target.strength * constants_1.CONSCRIPTION_THREAT_RESPONSE) {
                break;
            }
            if (worker.ranger_bot.conscripted) {
                continue;
            }
            worker.ranger_bot.conscripted = true;
            conscripted_workers.push(worker);
            units_dps += (0, unit_stats_1.CalculateDps)(worker);
            var effective_hp = worker.hp * (0, unit_stats_1.ArmorFactor)(worker.type.armor);
            units_hp += effective_hp;
        }
    }
    var target_location = {
        'x': target.location.x,
        'y': target.location.y,
    };
    var total_x = 0;
    var total_y = 0;
    for (var i = 0; i < conscripted_workers.length; i++) {
        var worker = conscripted_workers[i];
        worker.ranger_bot.command = 'defend';
        worker.ranger_bot.command_at = target_location;
        total_x += worker.pos.x;
        total_y += worker.pos.y;
    }
    var squad_location = {
        'x': total_x / conscripted_workers.length,
        'y': total_y / conscripted_workers.length,
    };
    var new_squad = {
        'location': squad_location,
        'r': constants_1.BASE_TARGET_RADIUS * Math.cbrt(conscripted_workers.length),
        'units': conscripted_workers,
        'command': 'defend',
        'attack_at': target_location,
        'is_air': false,
    };
    return new_squad;
}
function _UnconscriptCastle(mining_data) {
    mining_data.conscripted = false;
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        var active_mine = mining_data.mines_data[i];
        for (var j = 0; j < active_mine.workers.length; j++) {
            var worker = active_mine.workers[j];
            worker.ranger_bot.conscripted = false;
        }
    }
}


/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IdentifyBattles = IdentifyBattles;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
function IdentifyBattles(_a) {
    var data_hub = _a.data_hub, squads = _a.squads;
    var unassigned_targets = [data_hub.targets.filter(function (t) { return t.hp > 0; })];
    var unassigned_squads = [squads.map(function (s) { return s; })];
    var output = [];
    while (unassigned_squads[0].length > 0) {
        var squad = unassigned_squads[0].pop();
        var battle = {
            'squads': [squad],
            'targets': [],
        };
        _GraphBattle(battle, unassigned_squads, unassigned_targets);
        output.push(battle);
    }
    output = output.filter(function (b) { return b.squads.length > 0 && b.targets.length > 0; });
    return output;
}
function _GraphBattle(battle, unassigned_squads, unassigned_targets) {
    while (true) {
        var new_targets = _GlomBattleTargets(battle.squads, unassigned_targets);
        if (new_targets.length <= 0) {
            return;
        }
        battle.targets = battle.targets.concat(new_targets);
        var new_squads = _GlomBattleSquads(battle.targets, unassigned_squads);
        if (new_squads.length <= 0) {
            return;
        }
        battle.squads = battle.squads.concat(new_squads);
    }
}
function _GlomBattleTargets(battle_squads, unassigned_targets) {
    var remaining_targets = [];
    var output = [];
    var _loop_1 = function (i) {
        var new_target = unassigned_targets[0][i];
        var is_close = battle_squads.some(function (squad) {
            var air_distance = Math.sqrt(Math.pow((squad.location.x - new_target.location.x), 2) + Math.pow((squad.location.y - new_target.location.y), 2));
            if (air_distance > constants_1.ATTACK_RADIUS) {
                return false;
            }
            if (new_target.is_air || squad.is_air) {
                return air_distance <= constants_1.ATTACK_RADIUS;
            }
            var ground_distance = (0, ground_distance_1.SafeGroundDistance)(squad.location, new_target.location);
            if (isNaN(ground_distance)) {
                return air_distance <= constants_1.ATTACK_RADIUS;
            }
            return ground_distance <= constants_1.ATTACK_RADIUS;
        });
        if (is_close) {
            output.push(new_target);
        }
        else {
            remaining_targets.push(new_target);
        }
    };
    for (var i = 0; i < unassigned_targets[0].length; i++) {
        _loop_1(i);
    }
    unassigned_targets[0] = remaining_targets;
    return output;
}
function _GlomBattleSquads(battle_targets, unassigned_squads) {
    var remaining_squads = [];
    var output = [];
    var _loop_2 = function (i) {
        var new_squad = unassigned_squads[0][i];
        var is_close = battle_targets.some(function (target) {
            var air_distance = Math.sqrt(Math.pow((target.location.x - new_squad.location.x), 2) + Math.pow((target.location.y - new_squad.location.y), 2));
            if (air_distance > constants_1.ATTACK_RADIUS) {
                return false;
            }
            if (new_squad.is_air || target.is_air) {
                return air_distance <= constants_1.ATTACK_RADIUS;
            }
            var ground_distance = (0, ground_distance_1.SafeGroundDistance)(target.location, new_squad.location);
            if (isNaN(ground_distance)) {
                return air_distance <= constants_1.ATTACK_RADIUS;
            }
            return ground_distance <= constants_1.ATTACK_RADIUS;
        });
        if (is_close) {
            output.push(new_squad);
        }
        else {
            remaining_squads.push(new_squad);
        }
    };
    for (var i = 0; i < unassigned_squads[0].length; i++) {
        _loop_2(i);
    }
    unassigned_squads[0] = remaining_squads;
    return output;
}


/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CalculateSquadStrength = CalculateSquadStrength;
var unit_stats_1 = __webpack_require__(26);
function CalculateSquadStrength(squad) {
    var squad_dps = 0;
    var squad_hp = 0;
    var attacking_numerator = 0;
    var attacking_denominator = 0;
    for (var i = 0; i < squad.units.length; i++) {
        var unit = squad.units[i];
        if (unit.ranger_bot.conscripted) {
            continue;
        }
        squad_dps += (0, unit_stats_1.CalculateDps)(unit);
        var effective_hp = unit.hp * (0, unit_stats_1.ArmorFactor)(unit.type.armor);
        squad_hp += effective_hp;
        attacking_denominator++;
        if (unit.ranger_bot.attacking) {
            attacking_numerator++;
        }
    }
    squad.dps = squad_dps;
    squad.hp = squad_hp;
    squad.strength = squad.dps * squad.hp;
    squad.attacking = (function () {
        if (attacking_denominator <= 0) {
            return false;
        }
        else {
            return Math.round(attacking_numerator / attacking_denominator) >= 1;
        }
    })();
}


/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EvaluateBattle = EvaluateBattle;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
function EvaluateBattle(battle, aggro_mode) {
    var friendly_dps = 0;
    var friendly_hp = 0;
    for (var i = 0; i < battle.squads.length; i++) {
        var squad = battle.squads[i];
        friendly_dps += squad.dps;
        friendly_hp += squad.hp;
    }
    battle.friendly_strength = friendly_hp * friendly_dps;
    var attacking_numerator = 0;
    var attacking_denominator = 0;
    var retreat_dps = 0;
    var retreat_hp = 0;
    var attack_dps = 0;
    var attack_hp = 0;
    var close_targets = [];
    var _loop_1 = function (i) {
        var target = battle.targets[i];
        var is_close = battle.squads.some(function (squad) {
            var air_distance = Math.sqrt(Math.pow((target.location.x - squad.location.x), 2) + Math.pow((target.location.y - squad.location.y), 2));
            if (air_distance > constants_1.RETREAT_RADIUS) {
                return false;
            }
            if (target.is_air || squad.is_air) {
                return air_distance <= constants_1.RETREAT_RADIUS;
            }
            var ground_distance = (0, ground_distance_1.SafeGroundDistance)(target.location, squad.location);
            if (isNaN(ground_distance)) {
                return air_distance <= constants_1.RETREAT_RADIUS;
            }
            return ground_distance <= constants_1.RETREAT_RADIUS;
        });
        if (is_close) {
            close_targets.push(target);
            attacking_denominator++;
            if (target.attacking) {
                attacking_numerator++;
            }
        }
        attack_dps += target.dps;
        attack_hp += target.hp;
        if (is_close) {
            retreat_dps += target.dps;
            retreat_hp += target.hp;
        }
    };
    for (var i = 0; i < battle.targets.length; i++) {
        _loop_1(i);
    }
    if (attacking_denominator <= 0) {
        battle.attacking = false;
    }
    else {
        battle.attacking = Math.round(attacking_numerator / attacking_denominator) >= 1;
    }
    battle.attack_strength = attack_dps * attack_hp;
    battle.retreat_strength = retreat_dps * retreat_hp;
    battle.attack_ratio = battle.friendly_strength / battle.attack_strength;
    battle.retreat_ratio = battle.friendly_strength / battle.retreat_strength;
    var defending = battle.targets.some(function (t) { return t.active_castle && t.active_castle.ranger_bot.mining_data.conscripted; });
    var attack_threshold = (function () {
        if (aggro_mode) {
            return constants_1.AGGRO_ATTACK_THRESHOLD;
        }
        else {
            return constants_1.ATTACK_THRESHOLD;
        }
    })();
    var retreat_threshold = (function () {
        if (aggro_mode) {
            return constants_1.AGGRO_RETREAT_THRESHOLD;
        }
        else {
            return constants_1.RETREAT_THRESHOLD;
        }
    })();
    var output = (function () {
        if (battle.attack_ratio > attack_threshold) {
            return 'fight';
        }
        else if (battle.retreat_ratio > retreat_threshold) {
            if (battle.attacking) {
                return 'fight';
            }
            else if (defending) {
                return 'defend';
            }
            else {
                return 'retreat';
            }
        }
        else {
            if (defending) {
                return 'defend';
            }
            else {
                return 'retreat';
            }
        }
    })();
    return output;
}


/***/ }),
/* 69 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageSquad = ManageSquad;
var constants_1 = __webpack_require__(5);
var ground_distance_1 = __webpack_require__(11);
function ManageSquad(_a) {
    var data_hub = _a.data_hub, battle = _a.battle, squad = _a.squad, aggro_mode = _a.aggro_mode;
    squad.command = battle.command;
    if (squad.command == 'fight' || squad.command == 'defend') {
        _CommandUnitsToAttack(squad, battle);
        return;
    }
    else if (squad.command != 'retreat') {
        if (constants_1.DEBUG) {
            console.log('Error: Unhandled squad command: ' + squad.command);
        }
        return;
    }
    var retreat_dps = 0;
    var retreat_hp = 0;
    var attack_dps = 0;
    var attack_hp = 0;
    var _loop_1 = function (i) {
        var target = battle.targets[i];
        var distance = (function () {
            var air_distance = Math.sqrt(Math.pow((target.location.x - squad.location.x), 2) + Math.pow((target.location.y - squad.location.y), 2));
            if (target.is_air || squad.is_air) {
                return air_distance;
            }
            var ground_distance = (0, ground_distance_1.SafeGroundDistance)(target.location, squad.location);
            if (isNaN(ground_distance)) {
                return air_distance;
            }
            return ground_distance;
        })();
        if (distance > constants_1.ATTACK_RADIUS) {
            return "continue";
        }
        attack_dps += target.dps;
        attack_hp += target.hp;
        if (distance < constants_1.RETREAT_RADIUS) {
            retreat_dps += target.dps;
            retreat_hp += target.hp;
        }
    };
    for (var i = 0; i < battle.targets.length; i++) {
        _loop_1(i);
    }
    squad.attack_strength = attack_dps * attack_hp;
    squad.retreat_strength = retreat_dps * retreat_hp;
    squad.attack_ratio = squad.strength / battle.attack_strength;
    squad.retreat_ratio = squad.strength / squad.retreat_strength;
    var attack_threshold = (function () {
        if (aggro_mode) {
            return constants_1.AGGRO_ATTACK_THRESHOLD;
        }
        else {
            return constants_1.ATTACK_THRESHOLD;
        }
    })();
    var retreat_threshold = (function () {
        if (aggro_mode) {
            return constants_1.AGGRO_RETREAT_THRESHOLD;
        }
        else {
            return constants_1.RETREAT_THRESHOLD;
        }
    })();
    squad.command = (function () {
        if (squad.attack_ratio > attack_threshold) {
            return 'fight';
        }
        else if (squad.retreat_ratio > retreat_threshold) {
            if (squad.attacking) {
                return 'fight';
            }
            else {
                return 'retreat';
            }
        }
        else {
            return 'retreat';
        }
    })();
    if (squad.command == 'fight') {
        _CommandUnitsToAttack(squad, battle);
    }
    else if (squad.command == 'retreat') {
        _CommandUnitsToRetreat(squad, data_hub);
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled squad command: ' + squad.command);
    }
}
function _CommandUnitsToAttack(squad, battle) {
    var shortest_distance = Infinity;
    var closest_target = undefined;
    for (var i = 0; i < battle.targets.length; i++) {
        var target = battle.targets[i];
        var new_distance = Math.sqrt(Math.pow((squad.location.x - target.location.x), 2) + Math.pow((squad.location.y - target.location.y), 2));
        if (new_distance < shortest_distance) {
            shortest_distance = new_distance;
            closest_target = target;
        }
    }
    squad.attack_at = {
        'x': closest_target.location.x,
        'y': closest_target.location.y,
    };
    for (var i = 0; i < squad.units.length; i++) {
        var unit = squad.units[i];
        unit.ranger_bot.command = squad.command;
        unit.ranger_bot.command_at = squad.attack_at;
    }
}
function _CommandUnitsToRetreat(squad, data_hub) {
    var active_castle = (0, ground_distance_1.GetClosestActiveCastleToLocation)({
        map_location: squad.location,
        active_castles: data_hub.active_castles,
        with_workers: false,
    });
    if (!active_castle) {
        if (constants_1.DEBUG) {
            console.log('Error: No active castles to retreat to in _CommandUnitsToRetreat');
        }
        return;
    }
    var mining_data = active_castle.ranger_bot.mining_data;
    var total_x = 0;
    var total_y = 0;
    for (var i = 0; i < mining_data.mines_data.length; i++) {
        var active_mine = mining_data.mines_data[i];
        total_x += active_mine.midpoint.x;
        total_y += active_mine.midpoint.y;
    }
    var retreat_point = {
        'x': total_x / mining_data.mines_data.length,
        'y': total_y / mining_data.mines_data.length,
    };
    squad.retreat_at = retreat_point;
    for (var i = 0; i < squad.units.length; i++) {
        var unit = squad.units[i];
        unit.ranger_bot.command = 'retreat';
        unit.ranger_bot.command_at = squad.retreat_at;
    }
}


/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageBattleStatus = ManageBattleStatus;
var constants_1 = __webpack_require__(5);
function ManageBattleStatus(_a) {
    var data_hub = _a.data_hub, battles = _a.battles, squads = _a.squads;
    for (var i = 0; i < data_hub.targets.length; i++) {
        var target = data_hub.targets[i];
        target.attacking = false;
    }
    var _loop_1 = function (i) {
        var battle = battles[i];
        var battle_is_attacking = (function () {
            if (battle.command == 'fight' || battle.command == 'defend') {
                return true;
            }
            else if (battle.command == 'retreat') {
                return false;
            }
            else {
                if (constants_1.DEBUG) {
                    console.log('Error: Unhandled battle command: ' + battle.command);
                }
                return false;
            }
        })();
        for (var j = 0; j < battle.targets.length; j++) {
            var target = battle.targets[j];
            target.attacking = battle_is_attacking;
        }
    };
    for (var i = 0; i < battles.length; i++) {
        _loop_1(i);
    }
    var _loop_2 = function (i) {
        var squad = squads[i];
        var squad_is_attacking = (function () {
            if (squad.command == 'fight' || squad.command == 'defend') {
                return true;
            }
            else if (squad.command == 'retreat') {
                return false;
            }
            else if (squad.command === undefined) {
                return false;
            }
            else {
                if (constants_1.DEBUG) {
                    console.log('Error: Unhandled squad command: ' + squad.command);
                }
                return false;
            }
        })();
        for (var j = 0; j < squad.units.length; j++) {
            var unit = squad.units[j];
            if (unit.ranger_bot.conscripted) {
                continue;
            }
            unit.ranger_bot.attacking = squad_is_attacking;
        }
    };
    for (var i = 0; i < squads.length; i++) {
        _loop_2(i);
    }
}


/***/ }),
/* 71 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AllocateUnits = AllocateUnits;
var assign_units_to_battle_1 = __webpack_require__(72);
var assign_units_to_targets_1 = __webpack_require__(74);
function AllocateUnits(_a) {
    var data_hub = _a.data_hub, battles = _a.battles, army_strength = _a.army_strength;
    data_hub.busy_units = _ExcludeBusyUnits(data_hub.targets, battles);
    _AllocateUnitsInBattle(battles);
    (0, assign_units_to_targets_1.AssignUnitsToTargets)({
        data_hub: data_hub,
        army_strength: army_strength,
    });
    _UpdateCommands(data_hub.targets);
}
function _ExcludeBusyUnits(targets, battles) {
    var busy_units = {};
    for (var i = 0; i < battles.length; i++) {
        var battle = battles[i];
        for (var j = 0; j < battle.squads.length; j++) {
            var squad = battle.squads[j];
            for (var k = 0; k < squad.units.length; k++) {
                var unit = squad.units[k];
                busy_units[unit.id] = true;
            }
        }
    }
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        target.units = target.units.filter(function (u) { return !busy_units[u.id]; });
        for (var j = 0; j < target.units.length; j++) {
            var unit = target.units[j];
            busy_units[unit.id] = true;
        }
    }
    return busy_units;
}
function _UpdateCommands(targets) {
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        for (var j = 0; j < target.units.length; j++) {
            var unit = target.units[j];
            if (undefined === unit.ranger_bot.command) {
                unit.ranger_bot.command = 'fight';
            }
            if ('fight' == unit.ranger_bot.command && undefined === unit.ranger_bot.command_at) {
                unit.ranger_bot.command_at = { 'x': target.location.x, 'y': target.location.y };
            }
        }
    }
}
function _AllocateUnitsInBattle(battles) {
    for (var i = 0; i < battles.length; i++) {
        var battle = battles[i];
        (0, assign_units_to_battle_1.AssignUnitsToBattle)(battle);
    }
}


/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssignUnitsToBattle = AssignUnitsToBattle;
var unit_assigner_1 = __webpack_require__(73);
var constants_1 = __webpack_require__(5);
function AssignUnitsToBattle(battle) {
    var all_units_in_battle = [];
    for (var i = 0; i < battle.squads.length; i++) {
        var squad = battle.squads[i];
        all_units_in_battle = all_units_in_battle.concat(squad.units);
    }
    var assigner = new unit_assigner_1.UnitAssigner(all_units_in_battle, true);
    assigner.Assign({
        targets_list: battle.targets,
        response_threshold: constants_1.MIN_THREAT_RESPONSE,
        dps_boost: 0,
        just_one: false,
    });
    assigner.Assign({
        targets_list: battle.targets,
        response_threshold: constants_1.MAX_THREAT_RESPONSE,
        dps_boost: 0,
        just_one: false,
    });
    assigner.Assign({
        targets_list: battle.targets,
        response_threshold: Infinity,
        dps_boost: Infinity,
        just_one: false,
    });
}


/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnitAssigner = void 0;
var unit_stats_1 = __webpack_require__(26);
var ground_distance_1 = __webpack_require__(11);
var constants_1 = __webpack_require__(5);
var UnitAssigner = (function () {
    function UnitAssigner(my_fighting_units, lazy) {
        this.my_fighting_units = my_fighting_units;
        this.lazy = lazy;
    }
    UnitAssigner.prototype.AddUnits = function (new_units) {
        this.my_fighting_units = this.my_fighting_units.concat(new_units);
    };
    UnitAssigner.prototype.Assign = function (_a) {
        var _this = this;
        var targets_list = _a.targets_list, response_threshold = _a.response_threshold, dps_boost = _a.dps_boost, just_one = _a.just_one;
        if (targets_list.length <= 0 && just_one) {
            return false;
        }
        else if (targets_list.length <= 0) {
            return true;
        }
        if (this.my_fighting_units.length <= 0) {
            return false;
        }
        var output = true;
        var _loop_1 = function (i) {
            var target = targets_list[i];
            if (just_one && target.units.length > 0) {
                return "continue";
            }
            var hp = 0;
            var dps = 0;
            for (var j = 0; j < target.units.length; j++) {
                var unit = target.units[j];
                if (unit.ranger_bot.conscripted) {
                    continue;
                }
                var effective_hp = unit.hp * (0, unit_stats_1.ArmorFactor)(unit.type.armor);
                hp += effective_hp;
                dps += (0, unit_stats_1.CalculateDps)(unit);
                dps += dps_boost;
            }
            if ((hp * dps) > (target.strength * response_threshold)) {
                return "continue";
            }
            if (this_1.my_fighting_units.length <= 0) {
                return { value: false };
            }
            var useful_units = (function () {
                if (target.is_air) {
                    return _this.my_fighting_units.filter(function (u) { return u.type.canAttackFlying; });
                }
                else {
                    return _this.my_fighting_units;
                }
            })();
            var with_data = useful_units.map(function (unit) {
                var air_distance = (function () {
                    if (_this.lazy) {
                        return 0;
                    }
                    else {
                        return Math.sqrt(Math.pow((target.location.x - unit.pos.x), 2) + Math.pow((target.location.y - unit.pos.y), 2));
                    }
                })();
                return {
                    'unit': unit,
                    'air_distance': air_distance,
                };
            });
            if (!this_1.lazy) {
                with_data = with_data.sort(function (a, b) { return a.air_distance - b.air_distance; });
            }
            var keep_looping = true;
            var _loop_2 = function () {
                if (with_data.length <= 0) {
                    return { value: false };
                }
                var closest = undefined;
                if (this_1.lazy) {
                    closest = with_data[0];
                }
                else {
                    var shortest_distance = NaN;
                    for (var j = 0; j < with_data.length; j++) {
                        var data = with_data[j];
                        var unit = data.unit;
                        if (isNaN(shortest_distance)) {
                            closest = data;
                            if (undefined === data.ground_distance) {
                                data['ground_distance'] = (0, ground_distance_1.SafeGroundDistance)(target.location, unit.pos);
                            }
                            if (isNaN(data.ground_distance)) {
                                if (constants_1.DEBUG) {
                                    console.log('ERROR: Missing SafeGroundDistance for AssignUnitsToTargets 1');
                                }
                                shortest_distance = data.air_distance;
                            }
                            else {
                                shortest_distance = data.ground_distance;
                            }
                        }
                        else if (data.air_distance >= shortest_distance) {
                        }
                        else {
                            if (undefined === data.ground_distance) {
                                data['ground_distance'] = (0, ground_distance_1.SafeGroundDistance)(target.location, unit.pos);
                            }
                            if (isNaN(data.ground_distance)) {
                                if (constants_1.DEBUG) {
                                    console.log('ERROR: Missing SafeGroundDistance for AssignUnitsToTargets 2');
                                }
                            }
                            else if (data.ground_distance < shortest_distance) {
                                closest = data;
                                shortest_distance = data.ground_distance;
                            }
                        }
                    }
                }
                if (!closest) {
                    output = false;
                    keep_looping = false;
                    return "continue";
                }
                var closest_unit = closest.unit;
                with_data = with_data.filter(function (d) { return d.unit.id != closest_unit.id; });
                this_1.my_fighting_units = this_1.my_fighting_units.filter(function (u) { return u.id != closest_unit.id; });
                target.units.push(closest_unit);
                if (just_one) {
                    keep_looping = false;
                    return "continue";
                }
                var effective_hp = closest_unit.hp * (0, unit_stats_1.ArmorFactor)(closest_unit.type.armor);
                hp += effective_hp;
                dps += (0, unit_stats_1.CalculateDps)(closest_unit);
            };
            while (keep_looping && (hp * dps) <= (target.strength * response_threshold)) {
                var state_2 = _loop_2();
                if (typeof state_2 === "object")
                    return state_2;
            }
        };
        var this_1 = this;
        for (var i = 0; i < targets_list.length; i++) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return output;
    };
    return UnitAssigner;
}());
exports.UnitAssigner = UnitAssigner;


/***/ }),
/* 74 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssignUnitsToTargets = AssignUnitsToTargets;
var unit_assigner_1 = __webpack_require__(73);
var constants_1 = __webpack_require__(5);
function AssignUnitsToTargets(_a) {
    var data_hub = _a.data_hub, army_strength = _a.army_strength;
    var fighting_units = data_hub.my_fighting_units.map(function (u) { return u; });
    var urgent_distance = data_hub.map.rush_distance / 3;
    var scout_targets = [];
    var passive_targets = [];
    var active_targets = [];
    var urgent_targets = [];
    var _loop_1 = function (i) {
        var target = data_hub.targets[i];
        if (target.dps > 0 && target.hp > 0) {
            var threat_distance = (function () {
                if (isNaN(target.ground_distance)) {
                    return target.air_distance;
                }
                else {
                    return target.ground_distance;
                }
            })();
            var danger_factor = 0 == army_strength ? 1 : Math.min(target.strength / army_strength, 1);
            var respond_distance = (1 + danger_factor) * urgent_distance;
            if (threat_distance < respond_distance) {
                urgent_targets.push(target);
            }
            else {
                active_targets.push(target);
            }
        }
        else if (target.hp > 0) {
            passive_targets.push(target);
        }
        else {
            scout_targets.push(target);
        }
    };
    for (var i = 0; i < data_hub.targets.length; i++) {
        _loop_1(i);
    }
    fighting_units = fighting_units.filter(function (u) { return !data_hub.busy_units[u.id]; });
    if (urgent_targets.length > 0) {
        urgent_targets = urgent_targets.sort(function (a, b) { return a.priority - b.priority; });
        fighting_units = _ReAssign({
            fighting_units: fighting_units,
            to_targets: urgent_targets,
            from_targets: [passive_targets, active_targets, scout_targets],
            max_response: true,
            just_one: false,
        });
    }
    if (active_targets.length > 0) {
        active_targets = active_targets.sort(function (a, b) { return a.priority - b.priority; });
        fighting_units = _ReAssign({
            fighting_units: fighting_units,
            to_targets: active_targets,
            from_targets: [passive_targets, scout_targets],
            max_response: false,
            just_one: true,
        });
    }
    if (scout_targets.length > 0) {
        scout_targets = scout_targets.sort(function (a, b) { return a.priority - b.priority; });
        fighting_units = _ReAssign({
            fighting_units: fighting_units,
            to_targets: scout_targets,
            from_targets: [passive_targets],
            max_response: false,
            just_one: true,
        });
    }
    if (active_targets.length > 0) {
        fighting_units = _ReAssign({
            fighting_units: fighting_units,
            to_targets: active_targets,
            from_targets: [passive_targets],
            max_response: true,
            just_one: false,
        });
    }
    if (passive_targets.length > 0) {
        passive_targets = passive_targets.sort(function (a, b) { return a.priority - b.priority; });
        fighting_units = _ReAssign({
            fighting_units: fighting_units,
            to_targets: passive_targets,
            from_targets: [],
            max_response: true,
            just_one: false,
        });
    }
    if (0 == fighting_units.length) {
        return;
    }
    var all_threats = urgent_targets.concat(active_targets).concat(passive_targets);
    all_threats = all_threats.sort(function (a, b) { return a.priority - b.priority; });
    var assigner = new unit_assigner_1.UnitAssigner(fighting_units, true);
    assigner.Assign({
        targets_list: all_threats,
        response_threshold: Infinity,
        dps_boost: Infinity,
        just_one: true,
    });
    assigner.Assign({
        targets_list: all_threats,
        response_threshold: Infinity,
        dps_boost: Infinity,
        just_one: false,
    });
}
function _ReAssign(_a) {
    var fighting_units = _a.fighting_units, to_targets = _a.to_targets, from_targets = _a.from_targets, max_response = _a.max_response, just_one = _a.just_one;
    var assigner = new unit_assigner_1.UnitAssigner(fighting_units, false);
    var satisfied = assigner.Assign({
        targets_list: to_targets,
        response_threshold: constants_1.MIN_THREAT_RESPONSE,
        dps_boost: 0,
        just_one: just_one,
    });
    while (!satisfied && from_targets.length > 0) {
        var other_targets = from_targets.shift();
        var more_units = _DeAssign(other_targets);
        assigner.AddUnits(more_units);
        satisfied = assigner.Assign({
            targets_list: to_targets,
            response_threshold: constants_1.MIN_THREAT_RESPONSE,
            dps_boost: 0,
            just_one: just_one,
        });
    }
    if (max_response) {
        satisfied = assigner.Assign({
            targets_list: to_targets,
            response_threshold: constants_1.MAX_THREAT_RESPONSE,
            dps_boost: 0,
            just_one: just_one,
        });
        while (!satisfied && from_targets.length > 0) {
            var other_targets = from_targets.shift();
            var more_units = _DeAssign(other_targets);
            assigner.AddUnits(more_units);
            satisfied = assigner.Assign({
                targets_list: to_targets,
                response_threshold: constants_1.MAX_THREAT_RESPONSE,
                dps_boost: 0,
                just_one: just_one,
            });
        }
    }
    return assigner.my_fighting_units;
}
function _DeAssign(targets) {
    var output = [];
    for (var i = 0; i < targets.length; i++) {
        var target = targets[i];
        output = output.concat(target.units);
        target.units = [];
    }
    return output;
}


/***/ }),
/* 75 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommandIdleUnits = CommandIdleUnits;
var constants_1 = __webpack_require__(5);
function CommandIdleUnits(my_fighting_units) {
    var mid_x = Math.floor(scope.getMapWidth() / 2);
    var mid_y = Math.floor(scope.getMapHeight() / 2);
    for (var i = 0; i < my_fighting_units.length; i++) {
        var fighting_unit = my_fighting_units[i];
        if (fighting_unit.ranger_bot.command && fighting_unit.ranger_bot.command_at) {
            continue;
        }
        if (fighting_unit.ranger_bot.command && !fighting_unit.ranger_bot.command_at) {
            if (constants_1.DEBUG) {
                console.log(fighting_unit);
                console.log('Error: Missing command_at for CommandIdleUnits');
                continue;
            }
        }
        if (!fighting_unit.ranger_bot.command && fighting_unit.ranger_bot.command_at) {
            if (constants_1.DEBUG) {
                console.log(fighting_unit);
                console.log('Error: Missing command for CommandIdleUnits');
                continue;
            }
        }
        var center_distance = Math.sqrt(Math.pow((fighting_unit.pos.x - mid_x), 2) + Math.pow((fighting_unit.pos.y - mid_y), 2));
        if (center_distance < 6) {
            continue;
        }
        fighting_unit.ranger_bot.command = 'fight';
        fighting_unit.ranger_bot.command_at = { 'x': mid_x, 'y': mid_y };
    }
}


/***/ }),
/* 76 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MicroUnits = MicroUnits;
var micro_combat_unit_1 = __webpack_require__(77);
var constants_1 = __webpack_require__(5);
var micro_worker_1 = __webpack_require__(78);
function MicroUnits(_a) {
    var data_hub = _a.data_hub;
    _RallyCastles(data_hub);
    for (var i = 0; i < data_hub.my_wolves.length; i++) {
        var wolf = data_hub.my_wolves[i];
        (0, micro_combat_unit_1.MicroCombatUnit)(wolf);
    }
    for (var i = 0; i < data_hub.my_snakes.length; i++) {
        var snake = data_hub.my_snakes[i];
        (0, micro_combat_unit_1.MicroCombatUnit)(snake);
    }
    for (var i = 0; i < data_hub.my_archers.length; i++) {
        var archer = data_hub.my_archers[i];
        (0, micro_combat_unit_1.MicroCombatUnit)(archer);
    }
    for (var i = 0; i < data_hub.my_soldiers.length; i++) {
        var soldier = data_hub.my_soldiers[i];
        (0, micro_combat_unit_1.MicroCombatUnit)(soldier);
    }
    for (var i = 0; i < data_hub.my_workers.length; i++) {
        var worker = data_hub.my_workers[i];
        (0, micro_worker_1.MicroWorker)(worker, data_hub);
    }
}
function _RallyCastles(data_hub) {
    var needy_mine = data_hub.workable_mines
        .sort(function (a, b) { return a.workers.length - b.workers.length; })
        .find(function () { return true; });
    if (needy_mine && needy_mine.workers.length >= constants_1.WORKERS_PER_CASTLE) {
        needy_mine = undefined;
    }
    var _loop_1 = function (i) {
        var castle = data_hub.my_castles[i];
        if (!castle.queue[0]) {
            return "continue";
        }
        var mining_data = castle.ranger_bot.mining_data;
        var least_workers = mining_data.mines_data.filter(function (active_mine) {
            if (!active_mine.gold_mine) {
                if (constants_1.DEBUG) {
                    console.log(active_mine);
                }
                throw new Error('Missing gold_mine for _RallyCastles');
            }
            return active_mine.gold_mine.gold > 0;
        }).sort(function (a, b) { return a.workers.length - b.workers.length; }).find(function () { return true; });
        var target = (function () {
            if (!needy_mine && !least_workers) {
                return castle.ranger_bot.center;
            }
            else if (!needy_mine) {
                return least_workers.gold_mine.center;
            }
            else if (!least_workers) {
                return needy_mine.gold_mine.center;
            }
            else if (needy_mine.workers.length >= least_workers.workers.length) {
                return least_workers.gold_mine.center;
            }
            var worker_diff = least_workers.workers.length - needy_mine.workers.length;
            if (worker_diff < 2) {
                return least_workers.gold_mine.center;
            }
            else {
                return needy_mine.gold_mine.center;
            }
        })();
        scope.order('Move', [{ 'unit': castle }], target);
    };
    for (var i = 0; i < data_hub.my_castles.length; i++) {
        _loop_1(i);
    }
}


/***/ }),
/* 77 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MicroCombatUnit = MicroCombatUnit;
var constants_1 = __webpack_require__(5);
function MicroCombatUnit(unit) {
    if (unit.ranger_bot.command == 'fight') {
        _LazyCombatOrder(unit, 'AMove');
    }
    else if (unit.ranger_bot.command == 'retreat') {
        _LazyCombatOrder(unit, 'Move');
    }
    else if (unit.ranger_bot.command == 'defend') {
        _LazyCombatOrder(unit, 'AMove');
    }
    else if (!unit.ranger_bot.command) {
        return;
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled unit command: ' + unit.ranger_bot.command);
    }
}
function _LazyCombatOrder(unit, order) {
    if (!unit.ranger_bot.command_at) {
        if (constants_1.DEBUG) {
            console.log(unit);
            console.log('Error: command_at is missing');
        }
        return;
    }
    if (unit.order.name != order) {
        scope.order(order, [{ 'unit': unit }], unit.ranger_bot.command_at);
        return;
    }
    if (!unit.target) {
        scope.order(order, [{ 'unit': unit }], unit.ranger_bot.command_at);
        return;
    }
    if (!unit.target.x || !unit.target.y) {
        if (constants_1.DEBUG) {
            console.log(unit);
        }
        throw new Error('Unexpected value for target in _LazyCombatOrder');
    }
    var distance = Math.sqrt(Math.pow((unit.target.x - unit.ranger_bot.command_at.x), 2) + Math.pow((unit.target.y - unit.ranger_bot.command_at.y), 2));
    if (distance <= constants_1.LAZY_ORDER_DISTANCE) {
        return;
    }
    scope.order(order, [{ 'unit': unit }], unit.ranger_bot.command_at);
}


/***/ }),
/* 78 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MicroWorker = MicroWorker;
var micro_combat_unit_1 = __webpack_require__(77);
var utils_1 = __webpack_require__(6);
var buildable_1 = __webpack_require__(15);
var select_castle_placement_1 = __webpack_require__(57);
var constants_1 = __webpack_require__(5);
function MicroWorker(worker, data_hub) {
    if (worker.ranger_bot.conscripted) {
        (0, micro_combat_unit_1.MicroCombatUnit)(worker);
    }
    else if (worker.ranger_bot.job == 'build') {
        _MicroBuilder(worker, data_hub);
    }
    else if (worker.ranger_bot.job == 'mine') {
        _MicroMiner(worker);
    }
    else if (worker.ranger_bot.job == 'repair') {
        _MicroRepairer(worker);
    }
    else if (!worker.ranger_bot.job) {
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled Worker Job: ' + worker.ranger_bot.job);
    }
}
function _MicroBuilder(builder, data_hub) {
    if (builder.order.name == 'Repair') {
        return;
    }
    else if (!_TargetLocationBuildable(builder, data_hub)) {
        if (builder.ranger_bot.order == 'Build Castle') {
            _FindNewCastleLocation(builder);
            return;
        }
        builder.ranger_bot = {};
        scope.order('Stop', [{ 'unit': builder }]);
        return;
    }
    else if (builder.order.name.slice(0, 6) == 'Build ') {
        return;
    }
    else if (builder.order.name == 'Stop' || builder.order.name == 'Mine') {
        if (!_TryToBuild(builder)) {
            scope.order('Move', [{ 'unit': builder }], builder.ranger_bot.target_location);
        }
    }
    else if (builder.order.name == 'Move') {
        _TryToBuild(builder);
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled Builder Order: ' + builder.order.name);
    }
}
function _TargetLocationBuildable(builder, data_hub) {
    if (!builder.ranger_bot.building_type || !builder.ranger_bot.target_location ||
        builder.ranger_bot.exclude_worker_paths === undefined) {
        if (constants_1.DEBUG) {
            console.log(builder);
        }
        throw new Error('Missing data for _TargetLocationBuildable');
    }
    var width = (0, utils_1.GetNumberFieldValue)({ piece_name: builder.ranger_bot.building_type, field_name: 'sizeX' });
    var height = (0, utils_1.GetNumberFieldValue)({ piece_name: builder.ranger_bot.building_type, field_name: 'sizeY' });
    return (0, buildable_1.AreBuildable)({
        x_min: builder.ranger_bot.target_location.x,
        x_max: builder.ranger_bot.target_location.x + width - 1,
        y_min: builder.ranger_bot.target_location.y,
        y_max: builder.ranger_bot.target_location.y + height - 1,
        exclude_worker_paths: builder.ranger_bot.exclude_worker_paths,
        data_hub: data_hub,
    });
}
function _TryToBuild(builder) {
    if (!builder.ranger_bot.cost || !builder.ranger_bot.order || !builder.ranger_bot.target_location) {
        if (constants_1.DEBUG) {
            console.log(builder);
        }
        throw new Error('Missing data for _TryToBuild');
    }
    if (builder.ranger_bot.target_building) {
        scope.order('Repair', [{ 'unit': builder }], builder.ranger_bot.target_building);
        return true;
    }
    else if (scope.getGold() >= builder.ranger_bot.cost) {
        scope.order(builder.ranger_bot.order, [{ 'unit': builder }], builder.ranger_bot.target_location);
        return true;
    }
    else {
        return false;
    }
}
function _FindNewCastleLocation(castle_builder) {
    if (!castle_builder.ranger_bot.expansion) {
        if (constants_1.DEBUG) {
            console.log(castle_builder);
        }
        throw new Error('Missing data for _FindNewCastleLocation');
    }
    var castle_placement = (0, select_castle_placement_1.SelectCastlePlacement)({
        player_expansion: castle_builder.ranger_bot.expansion,
    });
    if (!castle_placement) {
        if (constants_1.DEBUG) {
            console.log(castle_builder);
            console.log('Error: Missing castle_placement for _FindNewCastleLocation');
        }
        castle_builder.ranger_bot = {};
        scope.order('Stop', [{ 'unit': castle_builder }]);
        return;
    }
    castle_builder.ranger_bot.placement = castle_placement;
    castle_builder.ranger_bot.target_location = castle_placement.castle_location;
    if (!_TryToBuild(castle_builder)) {
        scope.order('Move', [{ 'unit': castle_builder }], castle_builder.ranger_bot.target_location);
    }
}
function _MicroMiner(miner) {
    if (!miner.ranger_bot.castle || !miner.ranger_bot.mine) {
        if (constants_1.DEBUG) {
            console.log(miner);
        }
        throw new Error('Missing data for _MicroMiner');
    }
    if (!miner.ranger_bot.castle.isAlive && miner.ranger_bot.castle.hp <= 0) {
        miner.ranger_bot = {};
        scope.order('Stop', [{ 'unit': miner }]);
    }
    else if (miner.ranger_bot.castle.isUnderConstruction &&
        miner.carriedGoldAmount && miner.carriedGoldAmount > 0) {
        scope.order('Move', [{ 'unit': miner }], miner.ranger_bot.castle);
    }
    else if (miner.order.name == 'Mine') {
        return;
    }
    else if (miner.order.name == 'Stop' || miner.order.name == 'Move' || miner.order.name == 'AMove') {
        var real_mine = _GetRealMine(miner.ranger_bot.mine);
        scope.order('Mine', [{ 'unit': miner }], { 'unit': { 'unit': real_mine } });
    }
    else if (miner.order.name == 'Repair') {
        var real_mine = _GetRealMine(miner.ranger_bot.mine);
        scope.order('Mine', [{ 'unit': miner }], { 'unit': { 'unit': real_mine } }, true);
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled Miner Order: ' + miner.order.name);
    }
}
function _GetRealMine(mine) {
    var raw_gold_mines = (0, utils_1.GetGoldMines)();
    for (var i = 0; i < raw_gold_mines.length; i++) {
        var real_gold_mine = raw_gold_mines[i];
        if (real_gold_mine.id == mine.id) {
            return real_gold_mine;
        }
    }
    if (constants_1.DEBUG) {
        console.log(mine);
        console.log(raw_gold_mines);
    }
    throw new Error('Missing real gold mine id ' + mine.id);
}
function _MicroRepairer(repairer) {
    if (!repairer.ranger_bot.target_building) {
        if (constants_1.DEBUG) {
            console.log(repairer);
        }
        throw new Error('ERROR: Missing target_building for _MicroRepairer');
    }
    if (repairer.order.name == 'Repair') {
        return;
    }
    else if (repairer.order.name == 'Move' || repairer.order.name == 'Stop' || repairer.order.name == 'AMove') {
        scope.order('Repair', [{ 'unit': repairer }], { 'unit': { 'unit': repairer.ranger_bot.target_building } });
    }
    else if (repairer.order.name == 'Mine') {
        scope.order('Repair', [{ 'unit': repairer }], { 'unit': { 'unit': repairer.ranger_bot.target_building } });
    }
    else if (constants_1.DEBUG) {
        console.log('Error: Unhandled Repairer Order: ' + repairer.order.name);
    }
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ranger_bot_1 = __webpack_require__(1);
try {
    if (scope.ranger_bot === undefined) {
        scope['ranger_bot'] = {
            'team_caches': {},
            'player_caches': {},
            'map_printed': false,
        };
    }
    if (scope.ranger_bot.player_caches === undefined) {
        throw new Error('someone messed with scope.ranger_bot');
    }
    var player_number = scope.getMyPlayerNumber();
    var player_cache_key = 'player_' + player_number;
    if (scope.ranger_bot.player_caches[player_cache_key] === undefined) {
        scope.ranger_bot.player_caches[player_cache_key] = {};
    }
    var team_number = scope.getTeamNumber(player_number);
    var team_cache_key = 'team_' + team_number;
    if (scope.ranger_bot.team_caches[team_cache_key] === undefined) {
        scope.ranger_bot.team_caches[team_cache_key] = {};
    }
    var ranger_bot = new ranger_bot_1.RangerBot({
        player_cache_key: player_cache_key,
        team_cache_key: team_cache_key,
    });
    ranger_bot.Step();
}
catch (err) {
    if (err instanceof Error) {
        console.log(err);
    }
}

})();

/******/ })()
;