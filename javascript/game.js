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
	numFoodTypes: 44			// types of different foods that can be found
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
	name: "bozo",
	image: new Image(),
	type: "man",
	movePoints: 0,
	maxMovePoints: 0,
	foraging: false,     // are you foraging at the moment?
	asleep: false,		   // indicates if you're sleeping
	moved: false,			// indicates if the hero has successfully moved on the map

	// attributes connected with fighting . . .
	fightOn : 'No',	   // indicates if a fight with a monster is: ongoing, just ended, or not on
	turnToFight: true,	// if it's the hero's turn to fight or the monster's
	health: 0,
	attack: 0,
	defence: 0,
	maxHealth: 0,
	maxAttack: 0,
	maxDefence: 0,
	experience: 0,
	level: 0,
	experiencePerLevel: 4
};

var monster = {};

var map = {
  // small map, i.e. the one your hero character moves around on
  small : {
    rows : 8,
    cols : 10, // size of the map you move around in
    posRowCell : null,
    posColumnCell : null,	// map-cordinates of the hero
	 oldPosRowCell:0,
	 oldPosColumnCell:0 // the previous co-ordinates
  },
  // big map, i.e the overview of the whole area
  big : {
    rows : 8,
    cols : 10, // size of the overall big scale map
    posRowCell : null,
    posColumnCell : null,	// big map-cordinates of the hero
	 bigOldposRowCell:0,
	 bigOldPosColumnCell:0, // the previous co-ordinates
    terrainAttributes : 6,	// number of attributes of the particular terrain
    numTerrainTypes : 6,    // how many different terrain types there are
    displayed : false,      // indicates if the big map is being displayed
    nextDestination : 0		// holds the next destination level,
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

	if (monsterObj.hasOwnProperty('imageName')) {
		this.imageName = monsterObj.imageName;
	} else {
		this.imageName = this.name;
	}

	this.image = new Image();
	this.image.src = makeImageSource(this.imageName);
}

function TerrainType(terrainObj) {
	this.code = terrainObj.code;
	this.name = terrainObj.name;
	this.densityFactor = terrainObj.densityFactor;
	this.extraMovementPts = terrainObj.extraMovementPts;

	if (terrainObj.hasOwnProperty('imageName')) {
		this.imageName = terrainObj.imageName;
	} else {
		this.imageName = this.name;
	}

	this.image = new Image();
	this.image.src = makeImageSource(this.imageName);
}

function foodType(name, imageName, extraHealthPoints) {
	this.name = name;
	this.imageName = imageName;
	this.extraHealthPoints = extraHealthPoints;

	this.image = new Image();
	var isFood = true;
	this.image.src = makeImageSource(imageName, isFood);
}

function makeImageSource(imageName, isFood) {
	if (isFood) {
		return './web_images/food/' + imageName + '.png';
	} else {
		return './web_images/' + imageName + '.png';
	}
}

// Used to hold terrain types on larger map . . .
var bigMapArray=new Array(map.big.rows);
for (i=0; i <map.big.rows; i++)
bigMapArray[i]=new Array(map.big.cols);

// Used to hold details of map features, for small map . . .
var mapDetailArray=new Array(map.small.rows);
for (i=0; i <map.small.rows; i++)
mapDetailArray[i]=new Array(map.small.cols);

// Used to hold details of terrain . . .
var terrainArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainArray[i]=new Array(map.big.terrainAttributes);

// Used to hold row/col locations on big map, indexed by terrain type
var terrainLocArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainLocArray[i]=''; 	// set up terrainLocArray

// Used to hold row/col destination pairs on big map and small map,
// indexed by terrain type.  Also used to hold character and map images
// that are displayed upon reaching a destination
var terrainDestinationArray=new Array(map.big.numTerrainTypes + 1);	 // last destination is random location for treasure
for (i=0; i <map.big.numTerrainTypes + 1; i++)
terrainDestinationArray[i] = new Array(7); 	// set up Array

/*
	Monster Attributes:
	1	Name
	2	Image name (assumed suffix of .png)
	3	Health
	4	Attack
	5	Defence
*/

var monsterArray = new Array(gameSettings.numMonsterTypes + 1); // add 1 to have room for final boss battle monster

// set up monsterArray with monster objects
function loadMonsterInfo() {
	// name, imageName, healthPoints, attackPoints, defencePoints
	monsterArray[0]= new Monster({name: 'Turtle Rider', imageName: 'turtle_rider', healthPoints: 12, attackPoints: 6, defencePoints: 4});
	monsterArray[1]= new Monster({name: 'Horned Devil', imageName: 'horned_devil', healthPoints: 13, attackPoints: 7, defencePoints: 5});
	monsterArray[2]= new Monster({name: 'Squirm', imageName: 'squirm', healthPoints: 9, attackPoints: 4, defencePoints: 4});
	monsterArray[3]= new Monster({name: 'Bleh', imageName: 'bleh', healthPoints: 16, attackPoints: 8, defencePoints: 5});
	monsterArray[4]= new Monster({name: 'Scream', imageName: 'scream', healthPoints: 7, attackPoints: 6, defencePoints: 6});
	monsterArray[5]= new Monster({name: 'Warrior Ant', imageName: 'ant_warrior', healthPoints: 10, attackPoints: 4, defencePoints: 7});
	monsterArray[6]= new Monster({name: 'Drop', imageName: 'drop', healthPoints: 9, attackPoints: 4, defencePoints: 3});
	monsterArray[7]= new Monster({name: 'Ground Fish', imageName: 'ground_fish', healthPoints: 11, attackPoints: 6, defencePoints: 3});
	monsterArray[8]= new Monster({name: 'Snail', imageName: 'snail', healthPoints: 8, attackPoints: 6, defencePoints: 6});
	monsterArray[9]= new Monster({name: 'Strawberry', imageName: 'strawberry', healthPoints: 7, attackPoints: 5, defencePoints: 3});

   // level 2 monsters (allegedly, but is this used anywhere . . . ?) . . .
	monsterArray[10]= new Monster({name: 'Flame Spirit', imageName: 'flame_spirit', healthPoints: 16, attackPoints: 9, defencePoints: 9});
	monsterArray[11]= new Monster({name: 'Bloat', imageName: 'bloat', healthPoints: 12, attackPoints: 7, defencePoints: 14});
	monsterArray[12]= new Monster({name: 'Star Man', imageName: 'starman', healthPoints: 6, attackPoints: 10, defencePoints: 5});
	monsterArray[13]= new Monster({name: 'Ninja', imageName: 'ninja', healthPoints: 8, attackPoints: 10, defencePoints: 7});
	monsterArray[14]= new Monster({name: 'Assassin', imageName: 'assassin', healthPoints: 14, attackPoints: 11, defencePoints: 6});
	monsterArray[15]= new Monster({name: 'Lightning Fish', imageName: 'lightning_fish', healthPoints: 15, attackPoints: 12, defencePoints: 7});
	monsterArray[16]= new Monster({name: 'Leosaur', imageName: 'leosaur', healthPoints: 19, attackPoints: 15, defencePoints: 11});
	monsterArray[17]= new Monster({name: 'Leecho', imageName: 'leecho', healthPoints: 21, attackPoints: 4, defencePoints: 16});
	monsterArray[18]= new Monster({name: 'Crazed King', imageName: 'crazed_king', healthPoints: 18, attackPoints: 11, defencePoints: 16});

	// The final big boss-battle monster! . . .
	monsterArray[gameState.finalMonsterIndex]= new Monster({name: 'Hideously evil GREEN SKULL', imageName: 'green_skull', healthPoints: 32, attackPoints: 16, defencePoints: 12});
}

/*  Food attributes
1.  Name
2.  Image name
3.  Health points boost
*/

var foodArray = new Array(gameSettings.numFoodTypes);

/*
	Terrain Attributes:
	1	Number Code
	2	Name
	3	Density Factor (relates to how many will appear on the small map)
	4	Additional movement points needed to traverse this terrain
	5	Image name
*/

function loadTerrain() {
	terrainArray[0] = new TerrainType({code: 0, name: 'light grass', densityFactor: 0, extraMovementPts: 0, imageName: 'grass'});
	terrainArray[1] = new TerrainType({code: 1, name: 'low scrub', densityFactor: 0.1, extraMovementPts: 1, imageName: 'scrub'});
	terrainArray[2] = new TerrainType({code: 2, name: 'woods', densityFactor: 0.15, extraMovementPts: 2});
	terrainArray[3] = new TerrainType({code: 3, name: 'forest', densityFactor: 0.3, extraMovementPts: 2});
	terrainArray[4] = new TerrainType({code: 4, name: 'hills', densityFactor: 0.35, extraMovementPts: 3});
	terrainArray[5] = new TerrainType({code: 5, name: 'mountains', densityFactor: 0.4, extraMovementPts: 4});
}	// end of loadTerrain

/*
	Food Attributes:
	1	Name of food (word or phrase always starts with a consonant)
	2	Image name
	3	Health points gained from eating this food
*/

function loadFood() {
	foodArray[0] = new foodType('squashy fig', 'fig', 3);
	foodArray[1] = new foodType('loaf of bread', 'bread_1', 1);
	foodArray[2] = new foodType('croissant', 'croissant', 2);
	foodArray[3] = new foodType('brown egg', 'brown egg', 3);
	foodArray[4] = new foodType('cucumber', 'cucumber', 1);
	foodArray[5] = new foodType('glass of beer', 'glass_of_beer', 2);
	foodArray[6] = new foodType('strawberry', 'strawberry', 2);
	foodArray[7] = new foodType('husk of sweetcorn', 'sweetcorn', 3);
	foodArray[8] = new foodType('watermelon', 'watermelon', 3);
	foodArray[9] = new foodType('ripe acorn', 'ripe acorn', 1);
	foodArray[10] = new foodType('shiny aubergine', 'aubergine', 3);
	foodArray[11] = new foodType('half avacado', 'avacado', 3);
	foodArray[12] = new foodType('black olive', 'black_olive', 1);
	foodArray[13] = new foodType('bunch of blueberries', 'blueberries', 2);
	foodArray[14] = new foodType('loaf of tasty bread', 'bread_2', 5);
	foodArray[15] = new foodType('yam', 'yam', 4);
	foodArray[16] = new foodType('couple of buns', 'buns', 4);
	foodArray[17] = new foodType('cabbage', 'cabbage', 3);
	foodArray[18] = new foodType('fancy cake', 'cake', 4);
	foodArray[19] = new foodType('carrot', 'carrot', 3);
	foodArray[20] = new foodType('stick of celery', 'celery', 1);
	foodArray[21] = new foodType('smelly wheel of cheese', 'cheese_1', 5);
	foodArray[22] = new foodType('wheel of cheese', 'cheese_2', 5);
	foodArray[23] = new foodType('small bunch of cherries', 'cherries', 2);
	foodArray[24] = new foodType('courgette', 'courgette', 3);
	foodArray[25] = new foodType('couple of pale eggs', 'eggs', 5);
	foodArray[26] = new foodType('clove of garlic', 'garlic', 3);
	foodArray[27] = new foodType('bunch of grapes', 'grapes', 4);
	foodArray[28] = new foodType('green chilli', 'green_chilli', 2);
	foodArray[29] = new foodType('green olive', 'green_olive', 2);
	foodArray[30] = new foodType('green pepper', 'green_pepper', 3);
	foodArray[31] = new foodType('nice orange', 'orange', 4);
	foodArray[32] = new foodType('fresh orange pepper', 'orange_pepper', 3);
	foodArray[33] = new foodType('pak choi leaf', 'pak_choi', 1);
	foodArray[34] = new foodType('pear', 'pear', 3);
	foodArray[35] = new foodType('load of peas in their pod', 'peas_in_pod', 3);
	foodArray[36] = new foodType('few peas in the pod', 'peas_in_pod2', 2);
	foodArray[37] = new foodType('plum', 'plum', 3);
	foodArray[38] = new foodType('potato', 'potato', 2);
	foodArray[39] = new foodType('red chilli', 'red_chilli', 2);
	foodArray[40] = new foodType('red pepper', 'red_pepper', 3);
	foodArray[41] = new foodType('yellow pepper', 'yellow_pepper', 2);
	foodArray[42] = new foodType('tomato', 'tomato', 2);
	foodArray[43] = new foodType('veggie sausage', 'veggie_sausage', 5);
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

function startHeroPosition(stateOfGame){
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

function loadHeroImage() {
	hero.image.src = makeImageSource('hero_' + hero.type);
	hero.image.title = hero.type + ' ' + hero.name;
}

function loadHeroInfo(gameSettings, map) {
	var cookieValue = getCookie('jando');
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

	loadHeroImage();
	var statsHeroImage = document.getElementById('statsHeroImage');
	statsHeroImage.src = makeImageSource('hero_' + hero.type);
	statsHeroImage.title = hero.type + ' ' + hero.name;

	startHeroPosition(gameSettings);
	if (!gameState.inProgress)
		gameState.inProgress = true;
}

function saveHeroInfo(){
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
	setCookie('jando', cookieValue, 365);  // cookie will expire in a year
	//alert('map.big.posRowCell is: ' + map.big.posRowCell + ', and map.big.posColumnCell is: ' + map.big.posColumnCell);
}

function loadTerrainTargetInfo()
{
	terrainDestinationArray[0][4] = 'blackbird';	// png image name of "start" character
	terrainDestinationArray[0][5] =	'<p>'
		+ 'You find yourself in a wide, open land with long grasses. '
		+ ' You see a crow perched on a branch, swaying slightly in the wind.'
		+ '  It starts to sing, it\'s liquid, burbling sound almost resembling speech in a foreign tongue . . .'
		+ '</p>'
		+ '<p>'
		+ 'Quite strange, that look in it\'s eye, as if it was trying to communicate.  Really rather odd.'
		+' You suddenly realise that it <strong>is</strong> saying something.  You listen harder.'
		+ '  It\'s hard to tell, but it almost sounds like, "Go to grasshopper, blue tent, light grass . . ." '
		+'</p>'			;
	terrainDestinationArray[0][6] =	'blue_tent';	// destination image that will appear on the small map
																							// in this terrain type

	terrainDestinationArray[1][4] = 'grasshopper';	// image name of character
	terrainDestinationArray[1][5] =	'<p>'
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
		+ '</p>';
	terrainDestinationArray[1][6] =	'watchtower';	// destination image

	terrainDestinationArray[2][4] = 'meditating_skeleton';	// image name of character
	terrainDestinationArray[2][5] =	'<p>'
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
		+'</p>';
	terrainDestinationArray[2][6] =	'cave';	// destination image

	terrainDestinationArray[3][4] = 'bear';	// image name of character
	terrainDestinationArray[3][5] =	'<p>'
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
		+'</p>';
	terrainDestinationArray[3][6] =	'tower';	// destination image

	terrainDestinationArray[4][4] = 'boar';	// image name of character
	terrainDestinationArray[4][5] =	'<p>'
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
		+'</p>';
	terrainDestinationArray[4][6] =	'round_castle_tower';	// destination image

	terrainDestinationArray[5][4] = 'eagle';	// image name of character
	terrainDestinationArray[5][5] =	'<p>'
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
		+'</p>'	;
	terrainDestinationArray[5][6] =	'black_feather';	// destination image

	terrainDestinationArray[6][4] = 'green_skull';	// image name of character
	terrainDestinationArray[6][5] =	'<p>'
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
		+'</p>'	;
	terrainDestinationArray[6][6] =	'black_feather';	// destination image

}

function setTerrainTargetLocations(){
	var thisTerrainCoords = new Array();
	var thisTerrainRowCol = new Array();

	// loop through the array by terrain type, randomly pick
	// one of the locations, and assign it to the terrain destination array
	for (i=0; i <map.big.numTerrainTypes; i++)
	{
		thisTerrainCoords = terrainLocArray[i].split(';');
		var arrayLength = thisTerrainCoords.length;

		// don't want to put the destination right in the same square as
		// where the hero starts . . .
		do
		{
			var destLocation = Math.floor(Math.random() * arrayLength);
			var thisTerrainRowCol = thisTerrainCoords[destLocation].split(',');
			//assign large map row & col . . .
			terrainDestinationArray[i][0] = parseInt(thisTerrainRowCol[0]);
			terrainDestinationArray[i][1] = parseInt(thisTerrainRowCol[1]);
		}
		while (terrainDestinationArray[i][0] == map.big.posRowCell &&
					  terrainDestinationArray[i][1] == map.big.posColumnCell) ;

		// now set the small map row & col . . .
		terrainDestinationArray[i][2] = Math.floor(Math.random() * map.small.rows);
		terrainDestinationArray[i][3] = Math.floor(Math.random() * map.small.cols);
	}
	// now do the same for the last location . . .
	terrainDestinationArray[map.big.numTerrainTypes][0] = Math.floor(Math.random() * map.big.rows);
	terrainDestinationArray[map.big.numTerrainTypes][1] = Math.floor(Math.random() * map.big.cols);
	terrainDestinationArray[map.big.numTerrainTypes][2] = Math.floor(Math.random() * map.small.rows);
	terrainDestinationArray[map.big.numTerrainTypes][3] = Math.floor(Math.random() * map.small.cols);

	loadTerrainTargetInfo();
}

function createBigMap() {
	for (bigRow=0; bigRow < map.big.rows; bigRow++)
		for (bigCol=0; bigCol < map.big.cols; bigCol++)	// for big map
		{
			// decide terrain type for this (large) map square . . .
			var randomFactor = Math.random() ;
			var terrType = Math.ceil(bigCol/2);
			if (randomFactor < 0.25)
				terrType = terrType - 1;
			else if  ( randomFactor > 0.75)
				terrType = terrType + 1	;
			if (terrType < 0)
				terrType = 0;
			if (terrType > map.big.numTerrainTypes -1)
				terrType = map.big.numTerrainTypes-1;

			bigMapArray[bigRow][bigCol] = terrType;

			// need to record location of each terrain type in the location array,
			// indexed by terrain type.  Then we can have a target location for each terrain type
			if (terrainLocArray[terrType].length > 0)
				terrainLocArray[terrType] = terrainLocArray[terrType] + ';' + bigRow + ',' + bigCol;
			else
				terrainLocArray[terrType] = bigRow + ',' + bigCol;
		}
		setTerrainTargetLocations();
}	// end of createBigMap

function createMap(bigRow, bigCol) {
	var terrType = bigMapArray[bigRow][bigCol];
	var terrainFreq =  terrainArray[terrType].densityFactor;

	for (i=0; i <map.small.rows; i++) {
		for (k=0; k <map.small.cols; k++) {
			if (Math.random() < terrainFreq ) {
				mapDetailArray[i][k] = terrType; 	// terrain type
			} else {
				mapDetailArray[i][k] = 0;	// default to terrain type zero
			}
		}
	}
}	// end of createMap

function setTerrainCellSmallMap(mapTableDiv, row, col)
{
    var terrType;
	var terrEle;
      var mapTableRow;
      var mapTableCell;

	mapTableRow = mapTableDiv.getElementsByTagName("tr")[row];
	mapTableCell = mapTableRow.getElementsByTagName("td")[col];
	terrType = mapDetailArray[row][col];
	mapTableCell.innerHTML = '<img  />';
	terrEle = mapTableCell.firstChild;
	terrEle.src = terrainArray[terrType].image.src;
	terrEle.title = terrainArray[terrType].name;
	terrEle.alt = terrainArray[terrType].name;
	mapTableCell.style.backgroundColor ='#E6EFC2';
}

function showMovementArea() {
	var moveArea = document.getElementById('movementArea');
	moveArea.innerHTML =
		'Use the arrow keys to move, or click on the direction arrows below'
	+'<br />'
	+'<br />'
		+'<div style="font-family:courier,monospace">'
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

// shows any special map features on the small map
function showSpecialMapFeature(mapTable, row, col) {
	var mapRow;
	var mapCell;
	mapRow = mapTable.getElementsByTagName("tr")[row];
	mapCell = mapRow.getElementsByTagName("td")[col];
	mapCell.innerHTML ='<img title="the destination" src="./web_images/'
	+ terrainDestinationArray[map.big.nextDestination][6]
	+ '.png"/>';
}

function showSmallMap(bigRow, bigCol) {
	var mapTableDiv = document.getElementById('mapTableDiv');
	makeMapIfNotThere(mapTableDiv);
	showMovementArea();
	for (i=0; i <map.small.rows; i++)
		for (k=0; k <map.small.cols; k++)
		{
			setTerrainCellSmallMap(mapTableDiv, i, k);
		}
		// check if this is a destination big map square . . .
		if (terrainDestinationArray[map.big.nextDestination][0] == bigRow &&
			  terrainDestinationArray[map.big.nextDestination][1] == bigCol)
		{
			showSpecialMapFeature(mapTableDiv,
								  terrainDestinationArray[map.big.nextDestination][2],
								  terrainDestinationArray[map.big.nextDestination][3]);
		}
}	// end of drawMapDetail

function drawHero() {
	var mapTableDiv = document.getElementById('mapTableDiv');
	var mapRow = mapTableDiv.getElementsByTagName("tr")[map.small.oldPosRowCell];
	var mapCell = mapRow.getElementsByTagName("td")[map.small.oldPosColumnCell];
	map.small.oldPosRowCell = map.small.posRowCell;
	map.small.oldPosColumnCell = map.small.posColumnCell;

	var mapRow = mapTableDiv.getElementsByTagName("tr")[map.small.posRowCell];
	var mapCell = mapRow.getElementsByTagName("td")[map.small.posColumnCell];
	mapCell.innerHTML='<img src="./web_images/hero_' + hero.type + '_thumb.png" title="the hero" id="theHeroImg" />';
} // end of draw_map

function offMap(tableRow, tableCol) {
	var off_map_ind = false;
	if ((tableRow < 0 || tableRow > map.small.rows -1)
    ||  (tableCol < 0 || tableCol > map.small.cols -1))
		 off_map_ind = true;
	return off_map_ind;
} // end of off_map

function offBigMap(tableRow, tableCol, bigTableRow, bigTableCol) {
	var off_map_ind = false;
	if (tableRow < 0 &&bigTableRow == 0)
		off_map_ind = true;
	else if (tableRow >  map.small.rows -1 &&  bigTableRow == map.big.rows-1)
		off_map_ind = true;
	else if (tableCol < 0 && bigTableCol == 0)
		off_map_ind = true;
	else if (tableCol >  map.small.cols -1 &&  bigTableCol == map.big.cols-1)
		off_map_ind = true;
	return off_map_ind;
} // end of off_map

function checkDestReached(map) {
	if (terrainDestinationArray[map.big.nextDestination][0] == map.big.posRowCell &&
	    terrainDestinationArray[map.big.nextDestination][1] == map.big.posColumnCell &&
		 terrainDestinationArray[map.big.nextDestination][2] == map.small.posRowCell &&
	    terrainDestinationArray[map.big.nextDestination][3] == map.small.posColumnCell) {
		map.big.nextDestination = map.big.nextDestination + 1;
		gameState.storyEvent = true;

		// final destination
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
}

function processMovement(tableRow, tableCol, bigTableRow, bigTableCol) {
	// see if the hero has moved off the current map into another map square, and
	// also block movement off the playing area
	hero.moved = false;
	gameState.storyEvent = false;
	if ( offMap(tableRow, tableCol,tableRow, tableCol)) {
		if  ( offBigMap(tableRow, tableCol, bigTableRow, bigTableCol))	// don't allow to move off playing area
		{
			map.small.posRowCell = map.small.oldPosRowCell;
			map.small.posColumnCell = map.small.oldPosColumnCell;
		}
		else	// swap to next map square . . .
		{
			if (tableRow < 0) // have moved up to next square
			{
				map.big.posRowCell = map.big.posRowCell -1;
				map.small.posRowCell = map.small.rows -1; // bottom of next map square
			}
			if (tableRow > map.small.rows -1) // have moved down to next square
			{
				map.big.posRowCell = map.big.posRowCell +1;
				map.small.posRowCell = 0; // bottom of next map square
			}
			if (tableCol < 0) // have moved left to next square
			{
				map.big.posColumnCell = map.big.posColumnCell -1;
					map.small.posColumnCell = map.small.cols -1;		// right hand side of next map square
			}
			if (tableCol > map.small.cols -1) // have moved right to next square
			{
				map.big.posColumnCell= map.big.posColumnCell +1;
				map.small.posColumnCell = 0; // left hand side of next map square
			}
			createMap(map.big.posRowCell, map.big.posColumnCell);
			showSmallMap(map.big.posRowCell, map.big.posColumnCel);
			map.small.oldPosRowCell = map.small.posRowCell;
			map.small.oldPosColumnCell = map.small.posColumnCell;
			drawHero();
		}
	} else {
          // still on this map square . . . .
          var terrType = mapDetailArray[tableRow][tableCol];
          var terrainMovementCost = 1 + terrainArray[terrType].extraMovementPts;
          if (hero.foraging)
              terrainMovementCost = terrainMovementCost * 2;
          if (updateMovePoints(terrainMovementCost))	{
              var mapTableDiv = document.getElementById('mapTableDiv');
              setTerrainCellSmallMap(mapTableDiv, map.small.oldPosRowCell, map.small.oldPosColumnCell);
              //check for reaching destination
              checkDestReached(map);
          } else	{
              map.small.posRowCell = map.small.oldPosRowCell;
              map.small.posColumnCell = map.small.oldPosColumnCell;
              // highlight the fact that you've run out of movement points . . .
              $("#heroMovePoints").effect("highlight",{color: "#A52A2A"});
              $("#theHeroImg").parent().effect("highlight",{color: "#A52A2A"});
              $("#sleepButt").effect("highlight",{"color": "#A52A2A", "background-color": "white"}).focus();
          }
      }
} // end of processMovement

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

function showOptButts(){
	document.getElementById('optButts').style.visibility = "visible";
}

function hideOptButts(){
	document.getElementById('optButts').style.visibility = "hidden";
}

function startNewGame(){
	var newGame = true;
	if (hero.health > 0)
		newGame = confirm('Are you sure you would like to quit this game and start a new one?');
	if (newGame === true ) {
		deleteCookie('jando');
		window.location="./index.html";
	}
}	// startNewGame

function saveGame(){
	saveHeroInfo();
	alert('Game Saved');
}

function makeMapIfNotThere(mapTableDiv) {
   var tableExists = mapTableDiv.getElementsByTagName("table")[0];
	if (typeof tableExists == 'undefined') {
	    createTableMap(mapTableDiv);
	}
}

function showBigMap(){
	var mapTableDiv = document.getElementById('mapTableDiv');
	var mapRow;
	var mapCell;
	var terrEle;
	makeMapIfNotThere(mapTableDiv);

	for (i=0; i <map.small.rows; i++)
		for (k=0; k <map.small.cols; k++) {
			var terrType = bigMapArray[i][k];
			mapRow = mapTableDiv.getElementsByTagName("tr")[i];
			mapCell = mapRow.getElementsByTagName("td")[k];
			mapCell.innerHTML='<img  />';
			terrEle = mapCell.firstChild;
			terrEle.src = makeImageSource(terrainArray[terrType].imageName);
			terrEle.title = terrainArray[terrType].name;
		}
		// show where on the big map the hero is . . .
		mapRow = mapTableDiv.getElementsByTagName("tr")[map.big.posRowCell];
		mapCell = mapRow.getElementsByTagName("td")[map.big.posColumnCell];
		mapCell.style.backgroundColor = 'yellow';
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

function showMap(bigMapShown){
	var moveArea = document.getElementById('movementArea');
	var questButt = document.getElementById('showQuestButt');
	if (bigMapShown)
	{
		showSmallMap(map.big.posRowCell,map.big.posColumnCell);
		drawHero();
		map.big.displayed = false;
		document.getElementById('showMapButt').innerHTML = 'Show Big <u>M</u>ap';
	} else	{
		showBigMap();
		showBigMapKey(moveArea);
		map.big.displayed = true;
		document.getElementById('showMapButt').innerHTML = 'Show Small <u>M</u>ap';
	}
	// regardless of which map has been shown, we want to reset the questDisplayed status
	gameState.questDisplayed = false;
	questButt.innerHTML = 'Show <u>Q</u>uest';
}

function addRowClone(tblId,rowNum)
{
  var tblBody = document.getElementById(tblId).tBodies[0];
  var newNode = tblBody.rows[rowNum].cloneNode(true);
  tblBody.appendChild(newNode);
}

function createTableMap(mapTable){
	mapTable.innerHTML = '<table id="tableMap"><tbody>' +
	'<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
	'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
	'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>' +
	'</tbody></table>';
	for (i=0; i <map.small.rows-1; i++)
	{
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

	destImageWords = terrainDestinationArray[map.big.nextDestination][6].replace(/_/g,' ');
	charImageWords = terrainDestinationArray[map.big.nextDestination + 1][4].replace(/_/g,' ');

	if (!questShown) {
		gameState.questDisplayed = true;
		var moveArea = document.getElementById('movementArea');
		var questString;

		moveArea.innerHTML = '&nbsp;';
		questString =	'<div style = "position:absolute;width:360px">'
			        +   '<h3>Quest Log</h3>';
		if (map.big.nextDestination == 5) {
			questString = questString +	'Go where the eagle told you, to meet your destiny . . .'
			+ '<p>'
			+ 'Go to row '
		   + parseInt(terrainDestinationArray[map.big.nextDestination][0] + 1)
			+ ', column '
				+	 parseInt(terrainDestinationArray[map.big.nextDestination][1] + 1)
			+ ' on your map.'
			+ '</p>'
		} else {
			questString = questString 	+ '<p>You need to find a '
			+ charImageWords
			+ ', who lives in a '
			+ destImageWords
			+ ' like this  '
			+ '<img src="./web_images/' + terrainDestinationArray[map.big.nextDestination][6] + '.png" />'
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
	}
	else {
		mapTableDiv.removeChild(mapTableDiv.childNodes[0]);
		createTableMap(mapTableDiv);
		questButt.innerHTML = 'Show <u>Q</u>uest';
		bigMapDisplayed = !bigMapDisplayed;
		showMap(bigMapDisplayed);
	}
}

function updateMovePoints(movePointsToUse){
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

function levelUpHero(){
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

function popMonsterStatsDisplay(){
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
}	// end of animateFightMonster

function doHeroAttack() {
	var thisHeroAttackRoll;
	var thisMonsterAttackRoll;
	var fightPara = document.getElementById('fightDamage');
	var monsterFightPara = document.getElementById('monsterFightDamage');
	var tempHeroRoll;
	var tempMonsterRoll;
	var heroAttackRoll = 0;
	var monsterDefenceRoll = 0;
	var heroHit;

	// simulate the rolling of three dice for the hero's attack, take the highest value . . .
	for (i=0; i <gameSettings.numHeroDiceRolls; i++)
	{
		tempHeroRoll = Math.ceil(Math.random() * hero.attack);
		if (tempHeroRoll > heroAttackRoll)
			heroAttackRoll = tempHeroRoll;
	}

	// simulate the rolling of three dice for the monster defence, take the highest value . . .
	for (i=0; i <gameSettings.numMonsterDiceRolls; i++)
	{
		tempMonsterRoll = Math.ceil(Math.random() * monsterArray[gameState.monsterIdx].attackPoints);
		if (tempMonsterRoll > monsterDefenceRoll)
			monsterDefenceRoll = tempMonsterRoll;
	}

	// see if the hero has managed to make a hit . . .
	heroHit = heroAttackRoll - monsterDefenceRoll;

	monsterFightPara.innerHTML = '&nbsp;';
	if (heroHit < 0) {
    heroHit = 0;	// monster defence roll is larger, so no damage done
  }
	monster.health = monster.health - heroHit;
	var heroHitDisplay =  'You attack the ' + monsterArray[gameState.monsterIdx].name;
	if (heroHit == 0) {
		heroHitDisplay = heroHitDisplay + ' and <strong>miss</strong>';
		}
		else if (monster.health <= 0)  {
				monster.health = 0;
				heroHitDisplay = heroHitDisplay + ' and do <strong>' + heroHit + '</strong>' + ' damage,'
												+ ' and slay the creature.';
				hero.experience	= hero.experience + 1;
			}
			else {
				heroHitDisplay = heroHitDisplay + ' and do <strong>' + heroHit + '</strong>' + ' damage';
			}
	hero.turnToFight = false;
	animateFightHero();
	fightPara.innerHTML = heroHitDisplay;
}	// end of doHeroAttack

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

function doMonsterAttack(heroDefence) {
	var monsterFightPara = document.getElementById('monsterFightDamage');
	var tempHeroRoll;
	var tempMonsterRoll;
	var heroDefenceRoll = 0;
	var monsterAttackRoll = 0;
	var monsterHit;

	// simulate the rolling of three dice for the monster attack, take the highest value . . .
	for (i=0; i <gameSettings.numMonsterDiceRolls; i++) {
		tempMonsterRoll = Math.ceil(Math.random() * monsterArray[gameState.monsterIdx].healthPoints);
		if (tempMonsterRoll > monsterAttackRoll)
			monsterAttackRoll = tempMonsterRoll;
	}

	// simulate the rolling of three dice for the hero's defence, take the highest value . . .
	for (i=0; i <gameSettings.numHeroDiceRolls; i++) {
		tempHeroRoll = Math.ceil(Math.random() * heroDefence);
		if (tempHeroRoll > heroDefenceRoll)
			heroDefenceRoll = tempHeroRoll;
	}

	// has the monster done any damage . . . ?
	monsterHit = monsterAttackRoll - heroDefenceRoll;
	if (monsterHit < 0) {
		monsterHit = 0;	// hero defence roll is larger, so no damage done
	}
	var monsterHitDisplay = 'The ' + monsterArray[gameState.monsterIdx].name + ' attacks ';
	if (monsterHit == 0) {
		monsterHitDisplay = monsterHitDisplay + ' and <strong>misses</strong>';
	}
	else
		monsterHitDisplay = monsterHitDisplay + ' and does <strong>' + monsterHit + '</strong>' + ' damage';
	hero.health = hero.health - monsterHit;
	if (hero.health <= 0) {
		hero.health = 0;
		monsterHitDisplay = monsterHitDisplay + '.  You have been killed!';
	}
	monsterFightPara.innerHTML = monsterHitDisplay;
	animateFightMonster();
	if (hero.health <= 0) {
		sayHeroDead();
	}

	hero.turnToFight = true; // do we need this . . . ????
}	// end of monsterAttack

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
}	//

function showContJournButt() {
	document.getElementById('fightButts').style.visibility="visible";
	document.getElementById('fightButt').style.visibility="hidden";
	document.getElementById('runAwayButt').style.visibility="hidden";
	document.getElementById('contJournButt').style.visibility="visible";
	$("#contJournButt").focus();
	hero.fightOn = 'JustEnded';
}	// end of showContJournButt

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
		doMonsterAttack(hero.defence);
	}
	updateHeroStats();
	popMonsterStatsDisplay();
}

function runAway() {
	doMonsterAttack(hero.defence/2);
	updateHeroStats();
	// if you're not dead after trying to run away, show the "continue journey" button
	if (hero.health > 0)
		showContJournButt() ;
} // end of runAway

function continueJourney() {
	// first, hide the whole fight button area . . .
	var fightButtsArea = document.getElementById('fightButts');
	fightButtsArea.style.visibility="hidden";
	//  . . . then, re-set the (now hidden) "continue journey" button to be hidden, as we don't want it appearing at the start of the next fight . . .
	var continueButt = document.getElementById('contJournButt');
	continueButt.style.visibility="hidden";
	endFight();
}	// end of continueJourney

function setHeroImage() {
	var fightHeroImg = document.getElementById('fightHeroImage');
	fightHeroImg.src = hero.image.src;
	fightHeroImg.title = hero.type + ' ' + hero.name;
}

function setDestinationHTML(nextDestination){
	var returnHTML;
	returnHTML =
       	'<div id="theHero" style="float:left;">'
		+	'<img id = "destinationImage" style="float:right; padding-left:15px"/>'
		+ terrainDestinationArray[nextDestination][5]
		+ '</div>';
	return returnHTML;
}

	function setDestinationImage(nextDestination) {
	var destImage = document.getElementById('destinationImage');
	destImage.src = './web_images/' + terrainDestinationArray[nextDestination][4] + '.png';
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
	if (hero.foraging)
		attackModifier = -0.05;
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

	var foodIdx = Math.floor(Math.random() * gameSettings.numFoodTypes);
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
} // end of checkForForage()

function sleepHero() {
	alert('You sleep, perchance to dream . . .');
	hero.movePoints = hero.maxMovePoints;
	updateMovePoints(0);
}		// end of sleepHero

function setForageStatus(butt) {
	var buttState = butt.innerHTML;
	if (!hero.foraging)
	{
		hero.foraging = true;
		butt.innerHTML = 'Stop f<u>o</u>raging';
	}
	else
	{
		hero.foraging = false;
		butt.innerHTML = 'F<u>o</u>rage'	;
	}
}		// end of setForageStatus

function calcMovement(uniCode)
{
	//alert(uniCode);
	switch (uniCode)
		{
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
}	// end of calcMovement

function arrowImageMouseOver(arrowImage)
{
	var arrowDirection = arrowImage.title	;
	if (arrowImage.src.search('over') == -1)	// if not currently highlighted
		// swap for highlighted arrow img . . .
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big_over.png';
	else
		// replace with ordinary image
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big.png';
}

function clickedAnArrow(arrowImage)
{
	var unicode = 0;
	var arrowDirection = arrowImage.title;
	switch (arrowDirection)
	{
		case 'left' :	unicode = 37; 	break;
		case 'up'   :	unicode = 38;	break;
		case 'right':	unicode = 39;	break;
		case 'down' :	unicode = 40;	break;
	}
	processAction(unicode);
}	//	end of clickedAnArrow

function processAction(actionCode) {
	if (hero.fightOn === 'No' )			// if there's no fight ongoing
	{
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
} // end of processAction

function pressed_a_key(e) {
	var unicode=e.keyCode? e.keyCode : e.charCode;
	/* if (e.altKey || e.ctrlKey || e.shiftKey)
 		 alert("you pressed one of the 'Alt', 'Ctrl', or 'Shift' keys"); */
	processAction(unicode);
} // end of pressed_a_key

function start_game() {
  loadMonsterInfo();
  loadHeroInfo(gameSettings, map);
  loadTerrain();
  loadFood();
  createBigMap();
  createMap(map.big.posRowCell, map.big.posColumnCell);
  showSmallMap(map.big.posRowCell, map.big.posColumnCell);
  drawHero();
  updateHeroStats();
  updateMovePoints(0);
  document.getElementById('map_loading').style.display = "none";
  displayDestination(map.big.nextDestination);
  document.getElementById('mapTableDiv').focus();
}	// end of start_game
