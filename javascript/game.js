/* So, this was created in order to try and learn javascript.  You can probably tell.
   If you have any suggestions on how to improve this script, I'd love to hear from you.
   Contact me at: me@nelsonwright.co.uk
*/

// cookie and trim stuff thanks to Patrick Hunlock: http://www.hunlock.com/blogs/Ten_Javascript_Tools_Everyone_Should_Have
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
	return this.replace(/^\s+/g,"");
}
String.prototype.rtrim = function() {
	return this.replace(/\s+$/g,"");
}

function setCookie(name,value,expires, options) {
	if (options === undefined) options = {};

	if ( expires ) {
		var expires_date = new Date();
		expires_date.setDate(expires_date.getDate() + expires)
	}

	document.cookie = name+'=' + escape(value) +
	( ( expires ) ? ';expires='+expires_date.toGMTString() : '' ) +
	( ( options.path ) ? ';path=' + options.path : '' ) +
	( ( options.domain ) ? ';domain=' + options.domain : '' ) +
	( ( options.secure ) ? ';secure' : '' );
}

function getCookie(name) {
	var start = document.cookie.indexOf( name + "=" );
	var len = start + name.length + 1;

	if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) return null;
	if ( start == -1 ) return null;
	var end = document.cookie.indexOf( ';', len );

	if ( end == -1 ) end = document.cookie.length;
	return unescape( document.cookie.substring( len, end ) );
}

function deleteCookie(name, path, domain) {
	if (getCookie(name)) {
		document.cookie = name + '=' +
		( ( path ) ? ';path=' + path : '') +
		( ( domain ) ? ';domain=' + domain : '' ) +
		';expires=Thu, 01-Jan-1970 00:00:01 GMT';
	}
}

function cookiesAllowed() {
	setCookie('checkCookie', 'test', 1);

	if (getCookie('checkCookie')) {
		deleteCookie('checkCookie');
	 	return true;
	}
	return false;
}
// end of cookie functions

/*********************************
    do some initial game set up
**********************************/

// We're using Object.freeze as these values shouldn't change, i.e. it's an immutable object . . .
var gameSettings = Object.freeze({
	numMonsterTypes: 19, 	// how many types of monsters there are in the game
	attackRisk: 0.91,	   	// if the random number is higher than this (plus or minus modifiers), then you'll be attacked!
	numHeroDiceRolls: 3, 	// this equates to how many dice are rolled
	numMonsterDiceRolls: 3,
	numFoods: 44			// types of different foods that can be found
});

// these values apply to the game as a whole, and may change during the course of a game . . .
var gameState = {
	inProgress: false,			// has the game started?
	storyEvent: false,	     	// is a story event happening?
	questDisplayed: false,    	// are we currently showing the current quest objective?
	finalFight: false,        	// is the final battle happening?
	monsterIdx:	0,					// used to indicate the currently battled monster
	finalMonsterIndex: gameSettings.numMonsterTypes 	// the index number of the final monster.
};

var hero = {
	name: "You",
	image: new Image(),
	type: "man",
	movePoints: 20,
	maxMovePoints: 20,
	foraging: false,     // are you foraging at the moment?
	asleep: false,		   // indicates if you're sleeping
	moved: false,			// indicates if the hero has successfully moved on the map

	// attributes connected with fighting . . .
	fightOn : 'No',	   // indicates if a fight with a monster is: ongoing, just ended, or not on
	turnToFight: true,	// if it's the hero's turn to fight or the monster's
	health: 30,
	attack: 10,
	defence: 8,
	maxHealth: 30,
	maxAttack: 10,
	maxDefence: 8,
	experience: 0,
	level: 1,
	experiencePerLevel: 4
};

var monster = {};

var map = {
  // small map, i.e. the one your hero character moves around on
  small: {
    rows: 8,
    cols: 10, // size of the map you move around in
    posRowCell: 0,
    posColumnCell: 0,	// map-cordinates of the hero
	 oldPosRowCell: 0,
	 oldPosColumnCell: 0 // the previous co-ordinates
  },
  // big map, i.e the overview of the whole area
  big: {
    rows: 8,
    cols: 10, // size of the overall big scale map
    posRowCell: 0,
    posColumnCell: 0,	// big map-cordinates of the hero
	 bigOldposRowCell: 0,
	 bigOldPosColumnCell: 0, // the previous co-ordinates
    terrainAttributes: 6,	// number of attributes of the particular terrain
    numTerrainTypes: 6,    // how many different terrain types there are
    displayed: false,      // indicates if the big map is being displayed
    nextDestination: 0		// holds the next destination level,
    								// corresponds to terrain type, i.e. starts at zero,which = light grass
  }
};

// Courtesy of Douglas Crockford . . .
if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		var F = function (o) {}
		F.prototype = o;
		return new F();
	}
}

function Monster(monsterObj) {
	this.name = monsterObj.name;
	this.healthPoints = monsterObj.healthPoints;
	this.attackPoints = monsterObj.attackPoints;
	this.defencePoints = monsterObj.defencePoints;

	loadImageForType(this, monsterObj);
}

function Terrain(terrainObj) {
	this.code = terrainObj.code;
	this.name = terrainObj.name;
	this.densityFactor = terrainObj.densityFactor;
	this.extraMovementPts = terrainObj.extraMovementPts;

	loadImageForType(this, terrainObj);
}

function Food(foodObj) {
	this.name = foodObj.name;
	this.extraHealthPoints = foodObj.extraHealthPoints;

	loadImageForType(this, foodObj);
}

function Quest(questObj) {
	this.destination = {big: {}, small: {} };
	this.destination.big.row = questObj.big.row;
	this.destination.big.col = questObj.big.col;
}

function loadImageForType(currType, paramObject) {
	var isFood = false;

	// not entirely sure this is the best way, but what the hey . . .
	if (currType.constructor.name === 'Food') {
		isFood = true;
	}

	currType.imageName = deriveImageName(paramObject);
	currType.image = new Image();
	currType.image.src = makeImageSource(currType.imageName, isFood);
}

function makeImageSource(imageName, isFood) {
	if (isFood) {
		return './web_images/food/' + imageName + '.png';
	} else {
		return './web_images/' + imageName + '.png';
	}
}

// Used to hold terrain types on larger map . . .
var bigMapTerrainArray=new Array(map.big.rows);
for (i=0; i <map.big.rows; i++)
bigMapTerrainArray[i]=new Array(map.big.cols);

// Used to hold details of map features, for small map . . .
var mapDetailArray=new Array(map.small.rows);
for (i=0; i <map.small.rows; i++)
mapDetailArray[i]=new Array(map.small.cols);

// Used to hold details of terrain . . .
var terrainArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainArray[i]=new Array(map.big.terrainAttributes);

/* Used to hold terrain row/col pairs (locations) on the big map, indexed by terrain type, eg:
	0: 0,1;1,0;2,0;3,1;4,0;4,1;6,0;6,2;7,0 // light grass in row 1, col 2, row 1, col 3, etc
	1: 0,0;0,2;1,1;1,2;2,1;2,2;3,0;3,2;4,2;5,0;5,1;5,2;5,4;6,1;7,2
	 . . . etc . . . up to  . . .
	5: 0,9;1,9;2,7;2,8;2,9;3,9;4,9;7,9  //  mountains would be present on row 1, column 10, row 2, col 10, etc
	We need to save these locations, so we can pick randomly pick one as the destination for each quest
*/
var terrainLocationsArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainLocationsArray[i]=''; 	// set up terrainLocationsArray with blank as default

// Used to hold row/col destination pairs on big map and small map,
// indexed by terrain type.  Also used to hold character and map images
// that are displayed upon reaching a destination
var questArray=new Array(map.big.numTerrainTypes + 1);	 // last destination is random location for treasure
for (i=0; i <map.big.numTerrainTypes + 1; i++)
questArray[i] = new Array(map.big.numTerrainTypes + 1);

var monsterArray = new Array(gameSettings.numMonsterTypes + 1); // add 1 to have room for final boss battle monster

// set up monsterArray with monster objects
function loadMonsterInfo() {
	// name, imageName, healthPoints, attackPoints, defencePoints
	monsterArray[0]= new Monster({name: 'Turtle Rider', healthPoints: 12, attackPoints: 6, defencePoints: 4});
	monsterArray[1]= new Monster({name: 'Horned Devil', healthPoints: 13, attackPoints: 7, defencePoints: 5});
	monsterArray[2]= new Monster({name: 'Squirm', healthPoints: 9, attackPoints: 4, defencePoints: 4});
	monsterArray[3]= new Monster({name: 'Bleh', healthPoints: 16, attackPoints: 8, defencePoints: 5});
	monsterArray[4]= new Monster({name: 'Scream', healthPoints: 7, attackPoints: 6, defencePoints: 6});
	monsterArray[5]= new Monster({name: 'Warrior Ant', healthPoints: 10, attackPoints: 4, defencePoints: 7});
	monsterArray[6]= new Monster({name: 'Drop', healthPoints: 9, attackPoints: 4, defencePoints: 3});
	monsterArray[7]= new Monster({name: 'Ground Fish', healthPoints: 11, attackPoints: 6, defencePoints: 3});
	monsterArray[8]= new Monster({name: 'Snail', healthPoints: 8, attackPoints: 6, defencePoints: 6});
	monsterArray[9]= new Monster({name: 'Strawberry', healthPoints: 7, attackPoints: 5, defencePoints: 3});

   // level 2 monsters (allegedly, but is this used anywhere . . . ?) . . .
	monsterArray[10]= new Monster({name: 'Flame Spirit', healthPoints: 16, attackPoints: 9, defencePoints: 9});
	monsterArray[11]= new Monster({name: 'Bloat', healthPoints: 12, attackPoints: 7, defencePoints: 14});
	monsterArray[12]= new Monster({name: 'Star Man', healthPoints: 6, attackPoints: 10, defencePoints: 5});
	monsterArray[13]= new Monster({name: 'Ninja', healthPoints: 8, attackPoints: 10, defencePoints: 7});
	monsterArray[14]= new Monster({name: 'Assassin', healthPoints: 14, attackPoints: 11, defencePoints: 6});
	monsterArray[15]= new Monster({name: 'Lightning Fish', healthPoints: 15, attackPoints: 12, defencePoints: 7});
	monsterArray[16]= new Monster({name: 'Leosaur', healthPoints: 19, attackPoints: 15, defencePoints: 11});
	monsterArray[17]= new Monster({name: 'Leecho', healthPoints: 21, attackPoints: 4, defencePoints: 16});
	monsterArray[18]= new Monster({name: 'Crazed King', healthPoints: 18, attackPoints: 11, defencePoints: 16});

	// The final big boss-battle monster! . . .
	monsterArray[gameState.finalMonsterIndex]= new Monster({name: 'Hideously evil GREEN SKULL', imageName: 'green_skull', healthPoints: 32, attackPoints: 16, defencePoints: 12});
}

/*  Food attributes
1.  Name
2.  Image name
3.  Health points boost
*/

var foodArray = new Array(gameSettings.numFoods);

/*
	Terrain Attributes:
	1	Number Code
	2	Name
	3	Density Factor (relates to how many will appear on the small map)
	4	Additional movement points needed to traverse this terrain
	5	Image name
*/

function loadTerrain() {
	terrainArray[0] = new Terrain({code: 0, name: 'light grass', densityFactor: 0, extraMovementPts: 0});
	terrainArray[1] = new Terrain({code: 1, name: 'low scrub', densityFactor: 0.1, extraMovementPts: 1});
	terrainArray[2] = new Terrain({code: 2, name: 'woods', densityFactor: 0.15, extraMovementPts: 2});
	terrainArray[3] = new Terrain({code: 3, name: 'forest', densityFactor: 0.3, extraMovementPts: 2});
	terrainArray[4] = new Terrain({code: 4, name: 'hills', densityFactor: 0.35, extraMovementPts: 3});
	terrainArray[5] = new Terrain({code: 5, name: 'mountains', densityFactor: 0.4, extraMovementPts: 4});
}

/*
	Food Attributes:
	1	Name of food (word or phrase always starts with a consonant)
	2	Image name
	3	Health points gained from eating this food
*/

function loadFood() {
	foodArray[0] = new Food({name: 'squashy fig', imageName: 'fig', extraHealthPoints: 3});
	foodArray[1] = new Food({name: 'loaf of bread', imageName: 'bread_1', extraHealthPoints: 1});
	foodArray[2] = new Food({name: 'croissant', extraHealthPoints:  2});
	foodArray[3] = new Food({name: 'brown egg', extraHealthPoints: 3});
	foodArray[4] = new Food({name: 'cucumber',  extraHealthPoints: 1});
	foodArray[5] = new Food({name: 'glass of beer',  extraHealthPoints: 2});
	foodArray[6] = new Food({name: 'strawberry', extraHealthPoints: 2});
	foodArray[7] = new Food({name: 'husk of sweetcorn', imageName: 'sweetcorn', extraHealthPoints: 3});
	foodArray[8] = new Food({name: 'watermelon', extraHealthPoints: 3});
	foodArray[9] = new Food({name: 'ripe acorn', extraHealthPoints: 1});
	foodArray[10] = new Food({name: 'shiny aubergine', imageName: 'aubergine', extraHealthPoints: 3});
	foodArray[11] = new Food({name: 'half avacado', imageName: 'avacado', extraHealthPoints: 3});
	foodArray[12] = new Food({name: 'black olive', extraHealthPoints: 1});
	foodArray[13] = new Food({name: 'bunch of blueberries', imageName: 'blueberries', extraHealthPoints: 2});
	foodArray[14] = new Food({name: 'loaf of tasty bread', imageName: 'bread_2', extraHealthPoints: 5});
	foodArray[15] = new Food({name: 'yam',  extraHealthPoints: 4});
	foodArray[16] = new Food({name: 'couple of buns', imageName: 'buns', extraHealthPoints: 4});
	foodArray[17] = new Food({name: 'cabbage', extraHealthPoints: 3});
	foodArray[18] = new Food({name: 'fancy cake', imageName: 'cake', extraHealthPoints: 4});
	foodArray[19] = new Food({name: 'carrot',  extraHealthPoints: 3});
	foodArray[20] = new Food({name: 'stick of celery', imageName: 'celery', extraHealthPoints: 1});
	foodArray[21] = new Food({name: 'smelly wheel of cheese', imageName: 'cheese_1', extraHealthPoints: 5});
	foodArray[22] = new Food({name: 'wheel of cheese', imageName: 'cheese_2', extraHealthPoints: 5});
	foodArray[23] = new Food({name: 'small bunch of cherries', imageName: 'cherries', extraHealthPoints: 2});
	foodArray[24] = new Food({name: 'courgette', extraHealthPoints: 3});
	foodArray[25] = new Food({name: 'couple of pale eggs', imageName: 'eggs', extraHealthPoints: 5});
	foodArray[26] = new Food({name: 'clove of garlic', imageName: 'garlic', extraHealthPoints: 3});
	foodArray[27] = new Food({name: 'bunch of grapes', imageName: 'grapes', extraHealthPoints: 4});
	foodArray[28] = new Food({name: 'green chilli', extraHealthPoints: 2});
	foodArray[29] = new Food({name: 'green olive', extraHealthPoints: 2});
	foodArray[30] = new Food({name: 'green pepper', extraHealthPoints: 3});
	foodArray[32] = new Food({name: 'fresh orange pepper', imageName: 'orange_pepper', extraHealthPoints: 3});
	foodArray[31] = new Food({name: 'nice orange', imageName: 'orange', extraHealthPoints: 4});
	foodArray[33] = new Food({name: 'pak choi leaf', imageName: 'pak_choi', extraHealthPoints: 1});
	foodArray[34] = new Food({name: 'pear', extraHealthPoints: 3});
	foodArray[35] = new Food({name: 'load of peas in their pod', imageName: 'peas_in_pod', extraHealthPoints: 3});
	foodArray[36] = new Food({name: 'few peas in the pod', imageName: 'peas_in_pod2', extraHealthPoints: 2});
	foodArray[37] = new Food({name: 'plum', extraHealthPoints: 3});
	foodArray[38] = new Food({name: 'potato',  extraHealthPoints: 2});
	foodArray[39] = new Food({name: 'red chilli', extraHealthPoints: 2});
	foodArray[41] = new Food({name: 'yellow pepper', extraHealthPoints: 2});
	foodArray[40] = new Food({name: 'red pepper', extraHealthPoints: 3});
	foodArray[42] = new Food({name: 'tomato', extraHealthPoints: 2});
	foodArray[43] = new Food({name: 'veggie sausage', extraHealthPoints: 5});
}

function deriveImageName(objectWithImage) {
	var imageName;

	if (objectWithImage.hasOwnProperty('imageName')) {
		imageName = objectWithImage.imageName;
	} else {
		// if no specific image name given, use the object's "name" property,
		// replacing spaces with underscore, and making it all lowercase
		imageName = objectWithImage.name.replace(/ /g, "_").toLowerCase();
	}
	return imageName;
}

function getCookieValue(pairName, cookieString){
// returns the value for the name/value pair, for the given name
// if not found, returns null
	var returnValue = null;
	var cookieValuesArray = cookieString.split(';');

	for (i=0; i<cookieValuesArray.length; i++) {
		var nameValuePair = cookieValuesArray[i];
		var nameValuePairArray = nameValuePair.split('=');
		if (nameValuePairArray[0] === pairName) {
			returnValue = nameValuePairArray[1];
			break;
		}
	}
	return returnValue;
}

function extractValuesFromCookie() {
	var cookieValue = getCookie('jando');

	if (cookieValue !== null) {
		hero.name = getCookieValue('name', cookieValue || 'You');
		hero.health = parseInt(getCookieValue('health', cookieValue || 30));
		hero.attack = parseInt(getCookieValue('attack', cookieValue || 10));
		hero.defence = parseInt(getCookieValue('defence', cookieValue || 8));
		hero.type = getCookieValue('char', cookieValue || 'man');
		map.small.posRowCell = parseInt(getCookieValue('posRowCell', cookieValue) || 0);
		map.small.posColumnCell = parseInt(getCookieValue('posColumnCell', cookieValue) || 0);
		map.big.posRowCell = parseInt(getCookieValue('bigPosRowCell', cookieValue) || 0);
		map.big.posColumnCell = parseInt(getCookieValue('bigPosColumnCell', cookieValue) || 0);
		gameState.inProgress = (getCookieValue('gameInProgress', cookieValue) === "Y") ? true : false;
		hero.movePoints = parseInt(getCookieValue('movePoints', cookieValue) || 20);

		hero.maxHealth = parseInt(getCookieValue('maxHeroHealth', cookieValue || 30));
		hero.maxAttack = parseInt(getCookieValue('maxHeroAttack', cookieValue) || 10);
		hero.maxDefence = parseInt(getCookieValue('maxHeroDefence', cookieValue) || 8);
		hero.maxMovePoints = parseInt(getCookieValue('maxMovePoints', cookieValue) || 20);
		map.big.nextDestination = parseInt(getCookieValue('nextDestination', cookieValue) || 0);
		hero.experience = parseInt(getCookieValue('heroExperience', cookieValue) || 0);
		hero.level = parseInt(getCookieValue('heroLevel', cookieValue) || 1);
	}
}

function setupStatsHeroImage() {
	var statsHeroImage = document.getElementById('statsHeroImage');
	statsHeroImage.src = makeImageSource('hero_' + hero.type);
	statsHeroImage.title = hero.type + ' ' + hero.name;
}

function loadHeroImage() {
	hero.image.src = makeImageSource('hero_' + hero.type);
	hero.image.title = hero.type + ' ' + hero.name;
}

function startHeroPosition(stateOfGame) {
	if (!stateOfGame.inProgress) {
		map.big.posRowCell = Math.floor(Math.random() * map.big.rows); // random starting row on LHS
		map.big.posColumnCell = 0;
		map.small.posRowCell = Math.floor(Math.random() * map.small.rows); // random starting row of small map;
		map.small.posColumnCell = 0;  // on LHS
	}

	map.small.oldPosRowCell = map.small.posRowCell;
	map.small.oldPosColumnCell = map.small.posColumnCell;
	hero.bigOldposRowCell = map.big.posRowCell;
	hero.bigOldPosColumnCell = map.big.posColumnCell;
}

function loadHeroInfo(gameSettings, map) {
	extractValuesFromCookie();
	setupStatsHeroImage();
	loadHeroImage();
	startHeroPosition(gameSettings);

	gameState.inProgress = true; // not entirely sure if we need this
}

function saveHeroInfo() {
   var inProgress = (gameState.inProgress === true) ? "Y" : "N";
	var cookieValue  = "name=" + hero.name + ';'
									+ "health=" + hero.health + ';'
									+ "attack=" + hero.attack + ';'
									+ "defence=" + hero.defence + ';'
									+ "char=" + hero.type + ';'
									+ "posRowCell=" + map.small.posRowCell + ';'
									+ "posColumnCell=" + map.small.posColumnCell + ';'
									+ "bigPosRowCell=" + map.big.posRowCell + ';'
									+ "bigPosColumnCell=" + map.big.posColumnCell + ';'
									+ "gameInProgress=" + inProgress + ';'
									+ "movePoints=" + hero.movePoints + ';'
									+ "maxHeroHealth=" + hero.maxHealth + ';'
									+ "maxHeroAttack=" + hero.maxAttack + ';'
									+ "maxHeroDefence=" + hero.maxDefence + ';'
									+ "maxMovePoints=" + hero.maxMovePoints + ';'
									+ "nextDestination=" + map.big.nextDestination + ';'
									+ "heroExperience=" + hero.experience + ';'
									+ "heroLevel=" + hero.level
									;
	setCookie('jando', cookieValue, 365);  // cookie will expire in a year?  Seems to be 6 weeks now
}

/*
		Quest array
		0. This quest destination (big map row)
		1. This quest destination (big map column)
		2. This quest destination (small map row)
		3. This quest destination (small map column)
		4. Image name of character to display at start of this quest
		5. Text to display at start of this quest
		6. Image that will appear on the small map as the destination for this quest

*/

function getQuestData() {
	// this array assumes that the index is the same as the index used in the terrainArray,
	// i.e. index 0 = first position in the arraay = light grass, 1 = low scrub, etc
	var questData = {
		quest:
		[
			{	imageNameOfStartCharacter: 'blackbird',
				storyTextHtml: '<p>'
					+ 'You find yourself in a wide, open land with long grasses. '
					+ ' You see a crow perched on a branch, swaying slightly in the wind.'
					+ '  It starts to sing, it\'s liquid, burbling sound almost resembling speech in a foreign tongue . . .'
					+ '</p>'
					+ '<p>'
					+ 'Quite strange, that look in it\'s eye, as if it was trying to communicate.  Really rather odd.'
					+' You suddenly realise that it <strong>is</strong> saying something.  You listen harder.'
					+ '  It\'s hard to tell, but it almost sounds like, "Go to grasshopper, blue tent, light grass . . ." '
					+'</p>',
				destinationImageName: 'blue_tent'
			},
			{	imageNameOfStartCharacter: 'grasshopper',
				storyTextHtml: '<p>'
					+ 'You see a huge grasshopper seated on a throne made of woven grasses.  Incredibly, it starts to speak:'
					+'</p>'
					+ '<p>'
					+ '"Ah, do come in, my dear fellow, I\'ve been expecting you.  My friend the blackbird said you may pay me a visit.'
					+ ' Please don\'t be alarmed, I may be as big as a good-sized goat and live in a blue tent, but I will not harm you.'
					+ ' Would you mind closing the tent flap . . . ?  Thank you, there\'s a bit of a chill breeze from the east today."'
					+'</p>'
					+ '<p>'
					+ '"So, you seek a path through the hills, do you?  All in good time, but first you must traverse the woods, and a man can lose his way there. '
					+ ' I don\'t know the way myself, as it is dangerous even for a giant grasshopper. '
					+ ' There is a meditating skelton that lives on a watchtower somewhere in the scrub that can help you.'
					+ '  I don\'t know his exact wherabouts, I\'m afraid, but I\'ll tell my blackbird friends to let him know that you\'re coming."'
					+ '</p>',
				destinationImageName: 'watchtower'
			},
			{	imageNameOfStartCharacter: 'meditating_skeleton',
				storyTextHtml: '<p>'
					+ 'As you reach the top of the watchtower, a skeleton looks up: "Greetings my friend! You look tired from your journey.  Stay here and rest, I\'ve just finished my meditation for the day.'
					+'</p>'
					+ '<p>'
					+ 'The way through the hills is through the dark forests, but first you must find the black bear of the woods.'
					+ ' He doesn\'t like visitors especially, so be sure to be polite if you do see him.  A present of honey wouldn\'t do any harm either.'
					+ ' In fact, I\'ve got some here, take it along with my regards.'
					+'</p>'
					+ '<p>'
					+ 'Where in the woods?  I\'m not too sure about that, all I know is that he lives in a cave somewhere, I think he moves around according to the seasons.'
					+'</p>'
					+ '<p>'
					+ 'Stay here as long as you like, this watchtower gives you a bit of perspective on life.  Help yourself to herbal tea."'
					+'</p>',
				destinationImageName: 'cave'
			},
			{	imageNameOfStartCharacter: 'bear',
				storyTextHtml: '<p>'
					+ 'You cautiously enter cave.  You think you here a rustling sound from somewhere in the darkness at the back.'
					+ ' You decide to unwrap the honeycomb the skeleton gave you, and throw it forward.'
					+'</p>'
					+ '<p>'
					+ 'A deep voice rumbles, "Who are you, and why are you throwing this excellent honey around in my cave?  Speak, before I rip you to pieces!"'
					+'</p>'
					+ '<p>'
					+ 'Trembling, you politely explain why you are here, and that you seek a way through the hills.  The bear looks at you suspiciously, then sniffs the honey and sighs deeply.'
					+ ' "As you have brought such fine honey from my friend the skeleton, I will tell you.  Seek out my friend the boar who dwells in a tower in the forest.'
					+'</p>'
					+ '<p>'
					+ 'Now, if that\'s all, I have some honey to eat."'
					+'</p>',
				destinationImageName: 'tower'
			},
			{	imageNameOfStartCharacter: 'boar',
				storyTextHtml: '<p>'
					+ '"Hello!  I thought I heard someone knock on the tower door.  Sorry I took a while to answer, I was just upstairs finishing off an oil painting".'
					+ ' By now, this sort of thing doesn\'t come as a surprise.  You explain that you seek a path through the mountains to find the lost black magic feather of your people.'
					+'</p>'
					+'<p>'
					+ '"Hmm".  The boar ruminates, whilst washing his brushes under the tap. "You do know that\'s guarded, don\'t you?"  By a truly evil floating green skull?"'
					+' However, I see you are set on this foolishness.  Well, so be it.  I only know the feather is somewhere in the mountains."'
					+'</p>'
					+'<p>'
					+'The boar appears to decide something, and says, "But if you\'re going anyway, make sure you speak to the old eagle,'
					+'he normally roosts in a tree near the round castle tower".  Now, a spot of lunch?  I have some wonderful yellow courgettes".'
					+'  After eating, you thank the boar for the repast, and set off for the hills . . .'
					+'</p>',
				destinationImageName: 'round_castle_tower'
			},
			{	imageNameOfStartCharacter: 'eagle',
				storyTextHtml: '<p>'
					+ 'You find the tree near the tower, and look up to see the eagle staring right at you with it\'s beady eye.  It looks unimpressed.'
					+ '"What do you want around here?  Keep away, unless you want the green skull to scare you so much you\'ll run off a cliff edge in fright".'
					+'</p>'
					+'<p>'
					+ 'You explain that you\'re searching for the magic black feather, and will have it or die in the attempt.  Seeing that you\'re serious the old bird says, '
					+ '"Very well.  I have asked my friend the beetle, (who has been riding in your backpack), to mark it in your quest log. '
					+ 'Once there, you will find the green skull, and the  black feather.  Good luck, but I fear I will not see you again!"'
					+'</p>'
					+'<p>'
					+' And with that, the eagle flaps off the branch, and soars into the sky . . .'
					+'</p>',
				destinationImageName: 'black_feather'
			},
			{	imageNameOfStartCharacter: 'green_skull',
				storyTextHtml: '<p>'
					+'</p>',
				destinationImageName: 'black_feather'
			},
		]
	};

	return questData;
}

function populateQuestArray(terrainCode, terrainQuestData) {
	var thisTerrainCoords = new Array();
	var thisTerrainRowCol = new Array();

	// the locations are row,column pairs delimited by semicolons, eg 0,4;1,4;2,4; etc
	thisTerrainCoords = terrainLocationsArray[terrainCode].split(';');
	var arrayLength = thisTerrainCoords.length;

	// don't want to put the destination right in the same square as
	// where the hero starts . . .
	do {
		// randomly pick one of the pairs of co-ordinates . . .
		var destLocation = Math.floor(Math.random() * arrayLength);
		thisTerrainRowCol = thisTerrainCoords[destLocation].split(',');
		//assign large map row & column . . .
		questArray[terrainCode][0] = parseInt(thisTerrainRowCol[0]);
		questArray[terrainCode][1] = parseInt(thisTerrainRowCol[1]);
	}
	while (questArray[terrainCode][0] === map.big.posRowCell &&
			 questArray[terrainCode][1] === map.big.posColumnCell);

	// now set the small map row & col, don't allow it to be at the edge of the map
	questArray[terrainCode][2] = Math.floor(Math.random() * (map.small.rows - 2) + 1);
	questArray[terrainCode][3] = Math.floor(Math.random() * (map.small.cols -2) + 1);

	questArray[terrainCode][4] = terrainQuestData.imageNameOfStartCharacter;
	questArray[terrainCode][5] = terrainQuestData.storyTextHtml;
	questArray[terrainCode][6] = terrainQuestData.destinationImageName;
}

function setQuestLocations() {
	var questData = getQuestData();

	// Loop through the terrain locations array by terrain type, randomly pick
	// one of the locations for that terrain type, and assign it to the terrain destination array
	// This provides a destination for the quest related to that terrain type
	// Just pass in the data from questData that is needed for the quest for that terrain

	for (terrainCode=0; terrainCode <map.big.numTerrainTypes; terrainCode++) {
		populateQuestArray(terrainCode, questData.quest[terrainCode]);
	}
	// now do the same for the last location . . .
	questArray[map.big.numTerrainTypes][0] = Math.floor(Math.random() * map.big.rows);
	questArray[map.big.numTerrainTypes][1] = Math.floor(Math.random() * map.big.cols);
	questArray[map.big.numTerrainTypes][2] = Math.floor(Math.random() * map.small.rows);
	questArray[map.big.numTerrainTypes][3] = Math.floor(Math.random() * map.small.cols);
}

function decideTerrainType(column, numberOfTerrainTypes) {
	var randomFactor = Math.random() ;
	// the terrain type relates to the "code" attribute in the terrainArray
	var terrainType = Math.ceil(column/2);

	if (randomFactor < 0.25) {
		terrainType = terrainType - 1;
	} else if (randomFactor > 0.75) {
		terrainType = terrainType + 1	;
	}

	// ensure we stay within the limits of the Terrain codes, ie. 0..numberOfTerrainTypes - 1
	terrainType = Math.min(Math.max(0, terrainType), numberOfTerrainTypes - 1);
	return terrainType;
}

function createBigMap() {
	var terrainType;

	for (bigRow=0; bigRow < map.big.rows; bigRow++) {
		for (bigCol=0; bigCol < map.big.cols; bigCol++) {
			terrainType = decideTerrainType(bigCol, map.big.numTerrainTypes);
			bigMapTerrainArray[bigRow][bigCol] = terrainType;

			// need to record location of each terrain type in the locations array,
			// indexed by terrain type.  Then we use this to generate a quest destination for each terrain type
			if (terrainLocationsArray[terrainType].length > 0)
				terrainLocationsArray[terrainType] = terrainLocationsArray[terrainType] + ';' + bigRow + ',' + bigCol;
			else
				terrainLocationsArray[terrainType] = bigRow + ',' + bigCol;
		}
	}
	setQuestLocations();
}

function createSmallMapTerrain(bigRow, bigCol) {
	var terrainType = bigMapTerrainArray[bigRow][bigCol];

	for (row=0; row <map.small.rows; row++) {
		for (col=0; col <map.small.cols; col++) {
			if (Math.random() < terrainArray[terrainType].densityFactor) {
				mapDetailArray[row][col] = terrainType;
			} else {
				mapDetailArray[row][col] = 0;	// default to terrain type zero
			}
		}
	}
}

function getMapCell(mapTableDiv, row, col) {
	var mapRow;
	var mapCell;

	mapRow = mapTableDiv.getElementsByTagName("tr")[row];
	mapCell = mapRow.getElementsByTagName("td")[col];
	return mapCell;
}

function getCellImageTag(mapTableDiv, row, col) {
	smallMapCell = getMapCell(mapTableDiv, row, col);
	smallMapCell.innerHTML = '<img  />';
	return smallMapCell.firstChild;
}

function setMapCellColour(mapTableDiv, row, col, colour) {
	smallMapCell = getMapCell(mapTableDiv, row, col);
	smallMapCell.style.backgroundColor = colour;
}

function setTerrainCellSmallMap(mapTableDiv, row, col) {
	var terrType;
	var cellImageTag;

	terrType = mapDetailArray[row][col];
	cellImageTag = getCellImageTag(mapTableDiv, row, col);

	cellImageTag.src = terrainArray[terrType].image.src;
	cellImageTag.title = terrainArray[terrType].name;
	cellImageTag.alt = terrainArray[terrType].name;
	setMapCellColour(mapTableDiv, row, col, '#E6EFC2')
}

function showMovementArea() {
	var moveArea = document.getElementById('movementArea');
	moveArea.innerHTML = 'Use the arrow keys to move, or click on the direction arrows below'
			+ '<br />'
			+ '<br />'
			+ '<div style="font-family:courier,monospace">'
			+	'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
			+	'<img src="./web_images/arrow_up_big.png" title="up" onClick="clickedAnArrow(this)"'
			+	'onMouseOver="arrowImageMouseOver(this)" onMouseOut="arrowImageMouseOver(this)" />'
			+	'<br />'
			+	'<img src="./web_images/arrow_left_big.png" title="left" onClick="clickedAnArrow(this)"'
			+	'onMouseOver="arrowImageMouseOver(this)" onMouseOut="arrowImageMouseOver(this)" />'
			+	'&nbsp;<span id="mouseMoveHero" style="vertical-align:90%">&nbsp;</span>&nbsp;'
			+	'<img src="./web_images/arrow_right_big.png" title="right" onClick="clickedAnArrow(this)"'
			+	'onMouseOver="arrowImageMouseOver(this)" onMouseOut="arrowImageMouseOver(this)" />'
			+	'<br />'
			+	'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
			+	'<img src="./web_images/arrow_down_big.png" title="down" onClick="clickedAnArrow(this)"'
			+	'onMouseOver="arrowImageMouseOver(this)" onMouseOut="arrowImageMouseOver(this)" />'
		+'</div>';
	var mouseMoveHero = document.getElementById('mouseMoveHero');
	mouseMoveHero.innerHTML='<img src="./web_images/hero_' + hero.type + '_thumb.png" title="the hero" />';
}

function showQuestDestinationOnSmallMap(mapTableDiv, row, col) {
	var cellImageTag;

	cellImageTag = getCellImageTag(mapTableDiv, row, col);
	cellImageTag.src = makeImageSource(questArray[map.big.nextDestination][6]);
	cellImageTag.title = "the quest destination";
	cellImageTag.alt = "the quest destination";
}

function showSmallMap(bigRow, bigCol) {
	var mapTableDiv = document.getElementById('mapTableDiv');
	makeMapIfNotThere(mapTableDiv);
	showMovementArea();

	for (i=0; i <map.small.rows; i++) {
		for (k=0; k <map.small.cols; k++) {
			setTerrainCellSmallMap(mapTableDiv, i, k);
		}

		// check if this is a destination big map square . . .
		if (questArray[map.big.nextDestination][0] === bigRow &&
			 questArray[map.big.nextDestination][1] === bigCol) {
			showQuestDestinationOnSmallMap(mapTableDiv,
								  questArray[map.big.nextDestination][2],
								  questArray[map.big.nextDestination][3]);
		}
	}
}

function drawHero() {
	var mapTableDiv = document.getElementById('mapTableDiv');
	var mapCellImageTag = getCellImageTag(mapTableDiv, map.small.posRowCell, map.small.posColumnCell);

	mapCellImageTag.src = makeImageSource('hero_' + hero.type + '_thumb');
	mapCellImageTag.title = 'the hero';
	mapCellImageTag.alt = 'the hero';
	mapCellImageTag.id = 'theHeroImg'

	// should move this somewhere else at some point . . .
	map.small.oldPosRowCell = map.small.posRowCell;
	map.small.oldPosColumnCell = map.small.posColumnCell;
}

function isOffSmallMap(tableRow, tableCol) {
	return tableRow < 0 || tableRow > map.small.rows -1 ||
			 tableCol < 0 || tableCol > map.small.cols -1;
}

function isOffBigMap(tableRow, tableCol, bigTableRow, bigTableCol) {
	 var off_map_indicator = false;

	off_map_indicator =  (tableRow < 0 && bigTableRow === 0) || // off at the top
						(tableRow >  map.small.rows - 1 &&  bigTableRow === map.big.rows - 1) || // off the bottom
						(tableCol < 0 && bigTableCol === 0) || // off the left
						(tableCol >  map.small.cols - 1 &&  bigTableCol === map.big.cols - 1); // off the right

	return off_map_indicator;
}

function checkQuestDestinationReached(map) {
	if (questArray[map.big.nextDestination][0] === map.big.posRowCell &&
	    questArray[map.big.nextDestination][1] === map.big.posColumnCell &&
		 questArray[map.big.nextDestination][2] === map.small.posRowCell &&
	    questArray[map.big.nextDestination][3] === map.small.posColumnCell) {

		map.big.nextDestination = map.big.nextDestination + 1;
		gameState.storyEvent = true;

		// final quest destination
		if  (map.big.nextDestination == map.big.numTerrainTypes) {
			alert('Who dares take the black feather???!!!!');
			alert('Prepare yourself, for you will die!!!');
			hero.fightOn = 'Yes';
			gameState.finalFight = true;
			startAttack();
		} else {
			displayDestination(map.big.nextDestination);
		}
	}
};

function calculateNewHeroCoords(tableRow, tableCol) {
	var newHeroCoords = {
		smallRow: null,
		smallCol: null,
		bigRow: null,
		bigCol: null
	};

	if (tableRow < 0) {
		// have moved up to next square
		// map.big.posRowCell = map.big.posRowCell - 1;
		// map.small.posRowCell = map.small.rows - 1; // bottom of next map square
		newHeroCoords.bigRow = map.big.posRowCell - 1;
		newHeroCoords.smallRow = map.small.rows - 1; // bottom of next map square
	}

	if (tableRow > map.small.rows - 1) {
		// have moved down to next square
		// map.big.posRowCell = map.big.posRowCell + 1;
		// map.small.posRowCell = 0; // bottom of next map square
		newHeroCoords.bigRow = map.big.posRowCell + 1;
		newHeroCoords.smallRow = 0; // bottom of next map square
	}

	if (tableCol < 0) {
		// have moved left to next square
		// map.big.posColumnCell = map.big.posColumnCell - 1;
		// map.small.posColumnCell = map.small.cols - 1;		// right hand side of next map square
		newHeroCoords.bigCol = map.big.posColumnCell - 1;
		newHeroCoords.smallCol = map.small.cols - 1;
	}

	if (tableCol > map.small.cols - 1) {
		// have moved right to next square
		// map.big.posColumnCell = map.big.posColumnCell + 1;
		// map.small.posColumnCell = 0; // left hand side of next map square
		newHeroCoords.bigCol = map.big.posColumnCell + 1;
		newHeroCoords.smallCol = 0; // left hand side of next map square
	}

	return newHeroCoords;
}

// a function to return an alernative value if the first value is null
function nvl(value1, value2) {
	if (value1 === null) {
		return value2;
	}
	return value1;
}

// a shorter function name for "Math.max"
function max(value1, value2) {
	return Math.max(value1, value2);
}

function showNextSmallMapSquare(tableRow, tableCol) {
	var newHeroCoords = {
		smallRow: null,
		smallCol: null,
		bigRow: null,
		bigCol: null
	};

	newHeroCoords = calculateNewHeroCoords(tableRow, tableCol);
	map.big.posRowCell = nvl(newHeroCoords.bigRow, map.big.posRowCell);
	map.big.posColumnCell = nvl(newHeroCoords.bigCol, map.big.posColumnCell);
	map.small.posRowCell = nvl(newHeroCoords.smallRow, map.small.posRowCell);
	map.small.posColumnCell = nvl(newHeroCoords.smallCol, map.small.posColumnCell);

	createSmallMapTerrain(map.big.posRowCell, map.big.posColumnCell);
	showSmallMap(map.big.posRowCell, map.big.posColumnCell);
	drawHero();

	map.small.oldPosRowCell = map.small.posRowCell;
	map.small.oldPosColumnCell = map.small.posColumnCell;
};

function dontAllowMovement() {
	// don't allow movement off playing area
	map.small.posRowCell = map.small.oldPosRowCell;
	map.small.posColumnCell = map.small.oldPosColumnCell;
}

function highlightHeroSquare() {
	$("#heroMovePoints").effect("highlight",{color: "#A52A2A"});
	$("#theHeroImg").parent().effect("highlight",{color: "#A52A2A"});
	$("#sleepButt").effect("highlight",{"color": "#A52A2A", "background-color": "white"}).focus();
}

function moveOnSmallMap(tableRow, tableCol) {
	var terrType = mapDetailArray[tableRow][tableCol];
	var terrainMovementCost = 1 + terrainArray[terrType].extraMovementPts;

	if (hero.foraging) {
		terrainMovementCost = terrainMovementCost * 2;
	}

	if (updateMovePoints(terrainMovementCost)) {
		var mapTableDiv = document.getElementById('mapTableDiv');
		setTerrainCellSmallMap(mapTableDiv, map.small.oldPosRowCell, map.small.oldPosColumnCell);
		checkQuestDestinationReached(map);
	} else {
		dontAllowMovement();
		// highlight the fact that you've run out of movement points . . .
		highlightHeroSquare();
	}
}

function processMovement(tableRow, tableCol, bigTableRow, bigTableCol) {
	// see if the hero has moved off the current map into another map square, and
	// also block movement off the playing area
	hero.moved = false;
	gameState.storyEvent = false;

	if (isOffSmallMap(tableRow, tableCol)) {
		if (isOffBigMap(tableRow, tableCol, bigTableRow, bigTableCol))	{
			dontAllowMovement();
		} else {
			showNextSmallMapSquare(tableRow, tableCol);
		}
	} else {
		moveOnSmallMap(tableRow, tableCol);
   }
}

function showFightButts() {
	document.getElementById('fight').style.visibility="visible";
	document.getElementById('fightButts').style.visibility = "visible";
	document.getElementById('fightButt').style.visibility = "visible";
	document.getElementById('runAwayButt').style.visibility = "visible";
	document.getElementById('optButts').style.visibility = "hidden";
}

function hideFightButts() {
	document.getElementById('fightButts').style.visibility = "hidden";
	document.getElementById('fightButt').style.visibility = "hidden";
	document.getElementById('runAwayButt').style.visibility = "hidden";
}

function showOptButts() {
	document.getElementById('optButts').style.visibility = "visible";
}

function hideOptButts() {
	document.getElementById('optButts').style.visibility = "hidden";
}

function startNewGame() {
	var newGame = true;

	if (hero.health > 0) {
		newGame = confirm('Are you sure you would like to quit this game and start a new one?');
	}

	if (newGame === true ) {
		deleteCookie('jando');
		window.location="./index.html";
	}
}

function saveGame() {
	saveHeroInfo();
	alert('Game Saved');
}

function makeMapIfNotThere(mapTableDiv) {
   var tableExists = mapTableDiv.getElementsByTagName("table")[0];
	if (typeof tableExists == 'undefined') {
	    createTableMap(mapTableDiv);
	}
}

function showTerrainOnBigMap(mapTableDiv) {
	var cellImageTag;
	var terrType;

	for (row=0; row <map.small.rows; row++) {
		for (col=0; col <map.small.cols; col++) {
			terrType = bigMapTerrainArray[row][col];
			cellImageTag = getCellImageTag(mapTableDiv, row, col);
			cellImageTag.src = makeImageSource(terrainArray[terrType].imageName);
			cellImageTag.title = terrainArray[terrType].name;
		}
	}
}

function showBigMap() {
	var mapCell;
	var mapTableDiv = document.getElementById('mapTableDiv');

	makeMapIfNotThere(mapTableDiv);
	showTerrainOnBigMap(mapTableDiv);

	// highlight on the big map the square where the hero is . . .
	setMapCellColour(mapTableDiv, map.big.posRowCell, map.big.posColumnCell, 'yellow')
}

function showBigMapKey(moveArea) {
	moveArea.innerHTML='<h3>Map Key</h3>'
		+ '<div>';
	for (i=0; i <map.big.numTerrainTypes; i++) {
		moveArea.innerHTML = moveArea.innerHTML +
			terrainArray[i].name + '&nbsp;&nbsp;<img src = '
			+ makeImageSource(terrainArray[i].imageName)
			+'/><br /><br />';
	}
	moveArea.innerHTML = moveArea.innerHTML + '</div>';
}

function showMap(bigMapShown) {
	var moveArea = document.getElementById('movementArea');
	var questButt = document.getElementById('showQuestButt');

	if (bigMapShown) {
		showSmallMap(map.big.posRowCell, map.big.posColumnCell);
		drawHero();
		map.big.displayed = false;
		document.getElementById('showMapButt').innerHTML = 'Show Big <u>M</u>ap';
	} else {
		showBigMap();
		showBigMapKey(moveArea);
		map.big.displayed = true;
		document.getElementById('showMapButt').innerHTML = 'Show Small <u>M</u>ap';
	}

	// regardless of which map has been shown, we want to reset the questDisplayed status
	gameState.questDisplayed = false;
	questButt.innerHTML = 'Show <u>Q</u>uest';
}

function addRowClone(tblId,rowNum) {
  var tblBody = document.getElementById(tblId).tBodies[0];
  var newNode = tblBody.rows[rowNum].cloneNode(true);
  tblBody.appendChild(newNode);
}

function createTableMap(mapTable) {
	mapTable.innerHTML = '<table id="tableMap"><tbody>' +
	'<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
	'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
	'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
	'</tbody></table>';
	for (i=0; i <map.small.rows-1; i++) {
		addRowClone('tableMap',i);
	}
}

function showQuest(questShown, bigMapDisplayed){
	var mapTableDiv = document.getElementById('mapTableDiv');
	var questButt = document.getElementById('showQuestButt');
	var terrImage = new Image();
	var imageWords = new Array();
	var destImageWords;
	var charImageWords;

	destImageWords = questArray[map.big.nextDestination][6].replace(/_/g,' ');
	charImageWords = questArray[map.big.nextDestination + 1][4].replace(/_/g,' ');

	if (!questShown) {
		gameState.questDisplayed = true;
		var moveArea = document.getElementById('movementArea');
		var questString;

		moveArea.innerHTML = '&nbsp;';
		questString =	'<div style = "position:absolute;width:360px">'
			        +   '<h3>Your Quest</h3>';
		if (map.big.nextDestination == 5) {
			questString = questString +	'Go where the eagle told you, to meet your destiny . . .'
			+ '<p>'
			+ 'Go to row '
		   + parseInt(questArray[map.big.nextDestination][0] + 1)
			+ ', column '
				+	 parseInt(questArray[map.big.nextDestination][1] + 1)
			+ ' on your map.'
			+ '</p>'
		} else {
			questString = questString 	+ '<p>You need to find a '
			+ charImageWords
			+ ', who lives in a '
			+ destImageWords
			+ ' like this  '
			+ '<img src="./web_images/' + questArray[map.big.nextDestination][6] + '.png" />'
			+ ' '
			+ '. You can find the '
			+ destImageWords
			+' by looking at the big map, and searching all of the squares of type "'
			+ terrainArray[map.big.nextDestination].name
			+ '", which look like this: <img src = '
			+ makeImageSource(terrainArray[map.big.nextDestination].imageName) + '/>'
			+'</p>'
			+'One of these larger squares will have the '
			+ destImageWords
			+ ' contained within it.';
		}
    questString = questString + '</div>';
    mapTableDiv.innerHTML = questString;
    questButt.innerHTML = 'Hide <u>Q</u>uest';
	} else {
		mapTableDiv.removeChild(mapTableDiv.childNodes[0]);
		createTableMap(mapTableDiv);
		questButt.innerHTML = 'Show <u>Q</u>uest';
		bigMapDisplayed = !bigMapDisplayed;
		showMap(bigMapDisplayed);
	}
}

function updateMovePoints(movePointsToUse) {
	var canMove = false;
	document.getElementById('maxHeroMovePoints').innerHTML = hero.maxMovePoints;

	if (hero.movePoints - movePointsToUse >= 0) {
		canMove = true;
		hero.movePoints = hero.movePoints - movePointsToUse;
		document.getElementById('heroMovePoints').innerHTML = hero.movePoints;
		hero.moved = true;
	}
	return canMove;
}

function levelUpHero() {
	hero.maxHealth = hero.maxHealth + 1;
	hero.maxAttack = hero.maxAttack + 1;
	hero.maxDefence = hero.maxDefence + 1;
	hero.health = hero.maxHealth;
	hero.attack = hero.maxAttack;
	hero.defence = hero.maxDefence;
	hero.experience = 0;
	hero.level = hero.level + 1;
}

function updateHeroStats() {
	if (hero.experience >= hero.level * hero.experiencePerLevel) {
		levelUpHero();
  }
	document.getElementById('heroName').innerHTML = hero.name;
	document.getElementById('heroHealth').innerHTML= hero.health;
	document.getElementById('heroAttack').innerHTML=hero.attack;
	document.getElementById('heroDefence').innerHTML=hero.defence;
	document.getElementById('maxHeroHealth').innerHTML= hero.maxHealth;
	document.getElementById('maxHeroAttack').innerHTML=hero.maxAttack;
	document.getElementById('maxHeroDefence').innerHTML=hero.maxDefence;
	document.getElementById('heroExp').innerHTML=hero.experience;
	document.getElementById('heroLevel').innerHTML=hero.level;
	document.getElementById('heroLevelTarget').innerHTML=hero.level * hero.experiencePerLevel;

}

function popMonsterStatsDisplay() {
	var monsterDispEle = document.getElementById('monsterHealthDisplay');
	monsterDispEle.innerHTML = monster.health;
	monsterDispEle = document.getElementById('monsterAttackDisplay');
	monsterDispEle.innerHTML = monster.attack;
	monsterDispEle = document.getElementById('monsterDefenceDisplay');
	monsterDispEle.innerHTML = monster.monsterDefence;
}		// end of popMonsterStatsDisplay

function resetFightMonster() {
	// re-set the monster to original position . . .
	var monsterPicDiv = document.getElementById("theMonster");
	monsterPicDiv.style.paddingRight = 0 + "px";
}	// resetFightMonster()

function resetFightHero() {
	// retreat the hero . . .
	var heroPicSpan = document.getElementById("theHero");
	heroPicSpan.style.paddingLeft = 0 + "px";
}	// end of resetFightHero

function advanceFightHero() {
	var heroPicSpan = document.getElementById("theHero");
	heroPicSpan.style.paddingLeft = 100 + "px";
}	// end of advanceFightHero

function advanceFightMonster() {
	var monsterPicDiv = document.getElementById("theMonster");
	monsterPicDiv.style.paddingRight = 100 + "px";
}	// end of advanceFightMonster

function animateFightHero() {
	resetFightMonster();
	advanceFightHero();
}	// end of animateFightHero

function animateFightMonster() {
	resetFightHero();
	advanceFightMonster();
}

function highestDiceRoll(numberOfDiceRolls, fightPoints) {
	var highestDice = 0;

	for (i=0; i < numberOfDiceRolls; i++) {
		highestDice = Math.max(highestDice, Math.ceil(Math.random() * fightPoints));
	}
	return highestDice;
}

function getHeroDiceRoll(fightPoints) {
	// simulate the rolling of multiple dice for the hero's attack/defence fight points, take the highest value . . .
	return highestDiceRoll(gameSettings.numHeroDiceRolls, fightPoints);
}

function getMonsterDiceRoll(fightPoints) {
	// simulate the rolling of multiple dice for the monster attack/defence fight points, take the highest value . . .
	return highestDiceRoll(gameSettings.numMonsterDiceRolls, fightPoints);
}

function getHeroHitDisplay(heroHit) {
	var heroHitDisplay =  'You attack the ' + monsterArray[gameState.monsterIdx].name;

	if (heroHit == 0) {
		heroHitDisplay = heroHitDisplay + ' and <strong>miss</strong>';
	} else {
	if (monster.health <= 0) {
			heroHitDisplay = heroHitDisplay + ' and do <strong>' + heroHit + '</strong>' + ' damage,'
											+ ' and slay the creature.';
	} else {
			heroHitDisplay = heroHitDisplay + ' and do <strong>' + heroHit + '</strong>' + ' damage';
		}
	}
	return heroHitDisplay;
}

function adjustHeroExperience() {
	if (monster.health <= 0) {
		hero.experience = hero.experience + 1;
	}
}

function doHeroAttack() {
	var fightPara = document.getElementById('fightDamage');
	var monsterFightPara = document.getElementById('monsterFightDamage');
	var heroHit;
	var heroHitDisplay;

	// see if the hero managed to make a hit on the monster . . .
	heroHit = max(0, getHeroDiceRoll(hero.attack) - getMonsterDiceRoll(monsterArray[gameState.monsterIdx].defencePoints));
	monster.health = max(0, monster.health - heroHit);

	monsterFightPara.innerHTML = '&nbsp;';
	heroHitDisplay = getHeroHitDisplay(heroHit);
	adjustHeroExperience();

	hero.turnToFight = false;
	animateFightHero();
	fightPara.innerHTML = heroHitDisplay;
}

function sayHeroDead() {
	hideFightButts();
	hideOptButts();
	document.getElementById('saveGame').style.visibility = "hidden";
	document.getElementById('showMap').style.visibility = "hidden";
	document.getElementById('showQuestButt').style.visibility = "hidden";
	// do something else here a bit more dramatic possibly . . .
	// (to do with being dead)

	// ensure start new game button is visiblem and has the focus . . .
	document.getElementById('gameButts').style.visibility = "visible";
	document.getElementById('heroHealth').innerHTML= 0;
	document.getElementById('startNewGame').focus();
}

function doMonsterAttack(runningAway) {
	var monsterFightPara = document.getElementById('monsterFightDamage');
	var monsterHit;
	var monsterHitDisplay;

	// has the monster done any damage . . . ?
	if (runningAway) {
		monsterHit = Math.floor(getMonsterDiceRoll(monsterArray[gameState.monsterIdx].attackPoints) / 1.5 );
	} else {
		monsterHit = max(0, getMonsterDiceRoll(monsterArray[gameState.monsterIdx].attackPoints) - getHeroDiceRoll(hero.defence))
	}

	monsterHitDisplay = 'The ' + monsterArray[gameState.monsterIdx].name + ' attacks ';

	if (monsterHit == 0) {
		monsterHitDisplay = monsterHitDisplay + ' and <strong>misses</strong>';
	}
	else {
		monsterHitDisplay = monsterHitDisplay + ' and does <strong>' + monsterHit + '</strong>' + ' damage';
	}

	hero.health = hero.health - monsterHit;

	if (hero.health <= 0) {
		hero.health = 0;
		monsterHitDisplay = monsterHitDisplay + '.  You have been killed!';
	}

	monsterFightPara.innerHTML = monsterHitDisplay;
	animateFightMonster();

	if (hero.health <= 0) {
		gameState.inProgress = false;
		sayHeroDead();
	}

	hero.turnToFight = true; // do we need this . . . ????
}

function endFight() {
	var fightEle = document.getElementById('fight');
	fightEle.style.visibility="hidden";
	var fightPara = document.getElementById('fightDamage');
	fightPara.innerHTML = '&nbsp;';
	var monsterFightPara = document.getElementById('monsterFightDamage');
	monsterFightPara.innerHTML = '&nbsp;';
	resetFightMonster();
	resetFightHero();
	hideFightButts();
	showOptButts();
	hero.fightOn = 'No';
	hero.turnToFight = true;	// reset to give first hit next time.
}

function showContJournButt() {
	document.getElementById('fightButts').style.visibility="visible";
	document.getElementById('fightButt').style.visibility="hidden";
	document.getElementById('runAwayButt').style.visibility="hidden";
	document.getElementById('contJournButt').style.visibility="visible";
	$("#contJournButt").focus();
	hero.fightOn = 'JustEnded';
}

function tellEndStory() {
	alert('And Jando returned home and lived to be a ripe old age . . . THE END');
	alert(' . . . er, still need to work on the ending, sorry!!');
	sayHeroDead(); // the hero isn't, but it hides the buttons
}

function fightMonster() {
	var experienceAdded = monsterArray[gameState.monsterIdx].healthPoints;
	var newHeroExperience = hero.experience;

	if (hero.turnToFight === true) {
		doHeroAttack();
		if (monster.health <= 0  && gameState.finalFight) {
			tellEndStory();
		} else if (monster.health <= 0) {
			showContJournButt() ;
		}
	} else if (monster.health > 0) {
		doMonsterAttack(false); // we're not running away
	}
	updateHeroStats();
	popMonsterStatsDisplay();
}

function runAway() {
	var runningAway = true;
	doMonsterAttack(runningAway);
	updateHeroStats();
	// if you're not dead after trying to run away, show the "continue journey" button
	if (hero.health > 0)
		showContJournButt() ;
}

function continueJourney() {
	// first, hide the whole fight button area . . .
	var fightButtsArea = document.getElementById('fightButts');
	fightButtsArea.style.visibility="hidden";
	//  . . . then, re-set the (now hidden) "continue journey" button to be hidden, as we don't want it appearing at the start of the next fight . . .
	var continueButt = document.getElementById('contJournButt');
	continueButt.style.visibility="hidden";
	endFight();
}

function setHeroImage() {
	var fightHeroImg = document.getElementById('fightHeroImage');
	fightHeroImg.src = hero.image.src;
	fightHeroImg.title = hero.type + ' ' + hero.name;
}

function setDestinationHTML(nextDestination) {
	var returnHTML;
	returnHTML =
       	'<div id="theHero" style="float:left;">'
		+	'<img id = "destinationImage" style="float:right; padding-left:15px"/>'
		+ questArray[nextDestination][5]
		+ '</div>';
	return returnHTML;
}

function setDestinationImage(nextDestination) {
	var destImage = document.getElementById('destinationImage');
	destImage.src = './web_images/' + questArray[nextDestination][4] + '.png';
	destImage.title = 'a curious character';
}

function displayDestination(nextDestination){
	var actionSpace = document.getElementById('action');
	actionSpace.innerHTML = setDestinationHTML(nextDestination);
	setDestinationImage(nextDestination);
};

function setFightDivHTML(){
	var returnHTML;
	returnHTML =
	      '<div id="fight" style="visibility:hidden">'
		+ 'You are attacked by a <span id="monsterName" style="font-weight:bold">&nbsp;</span><br />'
		+ '<span id="fightDamage">&nbsp;</span><br />'
		+ '<span id="monsterFightDamage">&nbsp;</span><br />'
       +	'<div id="theHero" style="float:left">'
		+	'<img id = "fightHeroImage" />'
		+ '</div>'
		+ '<div  id="theMonsterAndStats" style="float:right;">'
		+ '<div  id="theMonster" style="float:left;">'
		+ '<img id="monsterImage" style="float:left;padding-left:20px;padding-right:20px;"/>'
		+ '<table id="monsterStatsDisplay">'
		+	'<tr>'
		+ '<td>'
		+	'Health'
		+	'</td>'
		+	'<td id="monsterHealthDisplay" style="text-align:right">'
		+	'&nbsp'
		+	'</td>'
		+	'</tr>'
		+	'<tr>'
		+	'<td>'
		+	'Attack'
		+	'</td>'
		+	'<td id="monsterAttackDisplay" style="text-align:right">'
		+	'&nbsp;'
		+	'</td>'
		+	'</tr>'
		+	'<tr>'
		+	'<td>'
		+	'Defence'
		+	'</td>'
		+	'<td id="monsterDefenceDisplay" style="text-align:right">'
		+	'&nbsp;'
		+	'</td>'
		+	'</tr>'
		+	'</table>'
		+ '</div> <!-- end of  theMonster DIV -->'
		+ '</div>  <!-- end of theMonsterAndStats DIV -->'
	   + '</div> <!-- end of fight DIV -->';
		return returnHTML;
}

function prepareFightDiv() {
	var actionSpace = document.getElementById('action');
	actionSpace.innerHTML = setFightDivHTML();
	setHeroImage();
}

function startAttack() {
	prepareFightDiv();
	gameState.monsterIdx = Math.floor(Math.random() * gameSettings.numMonsterTypes);

	if (gameState.finalFight) {
		gameState.monsterIdx = gameState.finalMonsterIndex;
	}
	var monsterName = monsterArray[gameState.monsterIdx].name;
	monster.health = monsterArray[gameState.monsterIdx].healthPoints;
	monster.attack = monsterArray[gameState.monsterIdx].attackPoints;
	monster.monsterDefence = monsterArray[gameState.monsterIdx].defencePoints;
	var monsterEle = document.getElementById('monsterName');
	monsterEle.innerHTML = monsterName;
	var monsterPic = document.getElementById('monsterImage');
	monsterPic.src = monsterArray[gameState.monsterIdx].image.src;
	monsterPic.title = monsterArray[gameState.monsterIdx].name;
	popMonsterStatsDisplay();
	showFightButts();
	hideOptButts();
}

function checkForAttack() {
	var attackModifier = 0;
	if (hero.foraging) {
		attackModifier = -0.05;
	}
	if (Math.random() > gameSettings.attackRisk + attackModifier) {
		hero.fightOn = 'Yes';
		startAttack();
	}
}

function processFoundFood(forageState, actionSpace){
	// "process" as in display the food and add health points . . .
	var foundPhrase;

	if (forageState) {
		foundPhrase = 'You find a ';
	}
	else {
		foundPhrase = 'You stumble upon a ';
	}

	var foodIdx = Math.floor(Math.random() * gameSettings.numFoods);
	actionSpace.innerHTML = '<p>' + foundPhrase + foodArray[foodIdx].name + '</p>'
												+ '<img id="foodImage" title="'
												+  foodArray[foodIdx].name
												+ '" style="float:left;"/>';

	var foodPic = document.getElementById('foodImage');
	foodPic.src = foodArray[foodIdx].image.src;
	foodPic.title = foodArray[foodIdx].name;
	hero.health = hero.health + foodArray[foodIdx].extraHealthPoints;
	if (hero.health > hero.maxHealth)
		hero.health = hero.maxHealth;
	updateHeroStats();
}

function checkForForage(forageState, posRowCell, posColumnCell) {
	var actionSpace = document.getElementById('action');
	var terrType = mapDetailArray[posRowCell][posColumnCell];
	var forageModifier = terrainArray[terrType].extraMovementPts;

	if (hero.foraging) {
		forageModifier = ((1/map.big.numTerrainTypes) / 2) * forageModifier ;
		if (Math.random() > 0.89 - forageModifier) // success!
			processFoundFood(forageState, actionSpace);
		else
			actionSpace.innerHTML = '<p>Haven\'t found anything . . .</p>';
	}
	else {
		if (Math.random() > 0.99)
			processFoundFood(forageState, actionSpace);
		else
			actionSpace.innerHTML = '&nbsp';
	}
}

function sleepHero() {
	alert('You sleep, perchance to dream . . .');
	hero.movePoints = hero.maxMovePoints;
	updateMovePoints(0);
}		// end of sleepHero

function setForageStatus(butt) {
	var buttState = butt.innerHTML;
	if (!hero.foraging) {
		hero.foraging = true;
		butt.innerHTML = 'Stop f<u>o</u>raging';
	} else {
		hero.foraging = false;
		butt.innerHTML = 'F<u>o</u>rage'	;
	}
}

function calcMovement(uniCode) {
	switch (uniCode) {
		case 37: // left arrow
			map.small.posColumnCell = map.small.posColumnCell -1;
			break;
		case 38: // up arrow
			map.small.posRowCell = map.small.posRowCell -1;
			break;
		case 39: // right arrow
			map.small.posColumnCell = map.small.posColumnCell + 1;
			break;
		case 40: // down arrow
			map.small.posRowCell = map.small.posRowCell + 1;
			break;
		default : null;
	}
}

function arrowImageMouseOver(arrowImage) {
	var arrowDirection = arrowImage.title	;

	// if not currently highlighted
	if (arrowImage.src.search('over') == -1) {
		// swap for highlighted arrow img . . .
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big_over.png';
	}	else {
		// replace with ordinary image
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big.png';
	}
}

function clickedAnArrow(arrowImage) {
	var unicode = 0;
	var arrowDirection = arrowImage.title;
	switch (arrowDirection) {
		case 'left' :	unicode = 37; 	break;
		case 'up'   :	unicode = 38;	break;
		case 'right':	unicode = 39;	break;
		case 'down' :	unicode = 40;	break;
	}
	processAction(unicode);
}

function processAction(actionCode) {
	// if there's no fight ongoing
	if (hero.fightOn === 'No' ) {
		 // if movement is requested . . .
		if (actionCode >= 37 && actionCode <= 40 && !map.big.displayed && !gameState.questDisplayed) {
			calcMovement(actionCode)
			processMovement(map.small.posRowCell,
			                map.small.posColumnCell,
			                map.big.posRowCell,
			                map.big.posColumnCell);
			drawHero();
			if (hero.moved && !gameState.storyEvent) {
				checkForAttack();
				if (hero.fightOn === 'No' ) {
					checkForForage(hero.foraging, map.small.posRowCell, map.small.posColumnCell);
				}
			}
		}

		if (actionCode == 77 /* letter "m" for (m)ap  */
			 && !gameState.questDisplayed)
			showMap(map.big.displayed);
		if (actionCode == 81 /* letter "q" for (q)uest log */
			 && !map.big.displayed)
			showQuest(gameState.questDisplayed, map.big.displayed);
		if (actionCode == 83) // letter "s" for (s)leep
			sleepHero();
		if (actionCode == 79) // letter "o" for f(o)rage
			setForageStatus(document.getElementById('forageButt'));
	}
	if (hero.fightOn === 'Yes' && hero.health > 0)	// fight is ongoing
	{
			if (actionCode == 70)	// letter "f" for (F)ight
				fightMonster();
			if (actionCode == 82)	// letter "r" for (R)un Away
			runAway();
	}
	if (hero.fightOn === 'JustEnded')  // The fight has just ended, so allow a (C)ontinue Journey
			if (actionCode == 67)	// letter "c" for (C)ontinue Journey
				continueJourney();
}

function pressed_a_key(e) {
	var unicode=e.keyCode? e.keyCode : e.charCode;
	/* if (e.altKey || e.ctrlKey || e.shiftKey)
 		 alert("you pressed one of the 'Alt', 'Ctrl', or 'Shift' keys"); */
	processAction(unicode);
}

function start_game() {
  loadMonsterInfo();
  loadHeroInfo(gameSettings, map);
  loadTerrain();
  loadFood();
  createBigMap();
  createSmallMapTerrain(map.big.posRowCell, map.big.posColumnCell);
  showSmallMap(map.big.posRowCell, map.big.posColumnCell);
  drawHero();
  updateHeroStats();
  updateMovePoints(0);
  document.getElementById('map_loading').style.display = "none";
  displayDestination(map.big.nextDestination);
  document.getElementById('mapTableDiv').focus();
}
