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
	if (options===undefined) {
	  options = {};
	}

	if ( expires ) {
		var expires_date = new Date();
		expires_date.setDate(expires_date.getDate() + expires)
	}

	document.cookie = name+'='+escape( value ) +
	( ( expires ) ? ';expires='+expires_date.toGMTString() : '' ) +
	( ( options.path ) ? ';path=' + options.path : '' ) +
	( ( options.domain ) ? ';domain=' + options.domain : '' ) +
	( ( options.secure ) ? ';secure' : '' );
}

function getCookie( name ) {
	var start = document.cookie.indexOf( name + "=" );
	var len = start + name.length + 1;

	if ( ( !start ) && ( name != document.cookie.substring( 0, name.length ) ) ) {
	 return null;
	}

	if ( start == -1 ) {
	  return null;
	}
	var end = document.cookie.indexOf( ';', len );

	if ( end == -1 ) {
	  end = document.cookie.length;
	}
	return unescape( document.cookie.substring( len, end ) );
}

function deleteCookie( name, path, domain ) {
	if ( getCookie( name ) ) {
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

var hero = {
	name: "bozo",
	image: new Image(),
	type: "man",
	movePoints: 0,
	maxMovePoints: 0,
	foraging : false,       // are you foraging at the moment?
	asleep : false,		    // indicates if you're sleeping

	// attributes connected with fighting . . .
	fightOn : 'No',	        // indicates if a fight with a monster is ongoing
	turnToFight: true,
	health: 0,
	attack: 0,
	defence: 0,
	maxHealth: 0,
	maxAttack: 0,
	maxDefence: 0,
	experience: 0,
	level: 0,
	numDiceRolls: 3, // this equates to how many dice are rolled
	experiencePerLevel: 4
};

// monster stats for fighting . . .
var monster = {
	health:0,
	attack:0,
	defence:0,
	numDiceRolls:3
}

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

// game_state object
var game_state = {
  gameInProgress : null,
  attackRisk : 0.91	    // if the random number is higher than this (plus or minus modifiers), then you'll be attacked!
};

var nextDestination = 0;		// holds the next destination level,
// corresponds to terrain type, i.e. starts at zero,which = light grass

var heroMoved;
var storyEvent = 'No';	        // is a story event happening?
var questDisplayed = false;    // are we currently showing the current quest objective?
var finalFight = false;        // is the final battle happening?

var numMonsters = 19;        	// how many monsters there are
var numMonsterAttributes = 5;	// number of monster attributes

var finalMonsterIdx = numMonsters; // the index number of the final monster.

/*  	Monster Attributes:
1	Name
2	Image name
3	Health
4	Attack
5	Defence

Terrain Attributes:
1	Number Code
2	Name
3	Density Factor
4	Additional movement points needed to traverse this terrain
5	Image name
*/

var numFoods = 44;	// types of different foods that can be found
var numFoodAttributes = 3;

/*
*** end of global variables
*/


var bigMapArray=new Array(map.big.rows);
for (i=0; i <map.big.rows; i++)
bigMapArray[i]=new Array(map.big.cols); // Used to hold terrain types on larger map

var mapDetailArray=new Array(map.small.rows);
for (i=0; i <map.small.rows; i++)
mapDetailArray[i]=new Array(map.small.cols); 	// set up mapDetailArray with rows & cols.
// Used to hold details of map features, for small map

var terrainArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainArray[i]=new Array(map.big.terrainAttributes); 	// set up terrainArray
// Used to hold details of terrain

// used to pre-load terrain images . . .
var terrainImageArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainImageArray[i]=new Image(); // set up terrain array

var terrainLocArray=new Array(map.big.numTerrainTypes);
for (i=0; i <map.big.numTerrainTypes; i++)
terrainLocArray[i]=''; 	// set up terrainLocArray
// Used to hold row/col locations on big map, indexed by terrain type

var terrainDestinationArray=new Array(map.big.numTerrainTypes + 1);	 // last destination is random location for treasure
for (i=0; i <map.big.numTerrainTypes + 1; i++)
terrainDestinationArray[i] = new Array(7); 	// set up Array
// Used to hold row/col destination pairs on big map and small map,
// indexed by terrain type.  Also used to hold character and map images
// that are displayed upon reaching a destination

var monsterArray=new Array(numMonsters + 1); // add 1 to have room for final boss battle monster
for (i=0; i <numMonsters +1; i++)
monsterArray[i]=new Array(numMonsterAttributes); // set up monsterArray

// used to pre-load monster images . . .
var monsterImageArray=new Array(numMonsters);
for (i=0; i <numMonsters + 1; i++)
monsterImageArray[i]=new Image(); // set up monsterArray

var monsterIdx;	// used to index the monster array

/*  Food attributes
1.  Name
2.  Image name
3.  Health points boost
*/

var foodArray=new Array(numFoods);
for (i=0; i <numFoods; i++)
foodArray[i]=new Array(numFoodAttributes); // set up foodArray

// used to pre-load food images . . .
var foodImageArray=new Array(numFoods);
for (i=0; i <numFoods; i++)
foodImageArray[i]=new Image(); // set up foodArray
var foodIdx;

function setTerrainImageSource() {
  // pre-load the images into an array . . .
  for (i=0; i <map.big.numTerrainTypes; i++) {
    var imgSrc = './web_images/' + terrainArray[i][4] + '.png';
    terrainImageArray[i].src = imgSrc; 		// set up terrainImageArray
  }
}		// end of setTerrainImageSource

function loadTerrain(){
  terrainArray[0][0] = 0;	// terrain code
  terrainArray[0][1] = 'light grass';	// terrain name
  terrainArray[0][2] = 0;	// density factor
  terrainArray[0][3] = 0;	// additional movement points needed
  terrainArray[0][4] = 'grass';	// image name

  terrainArray[1][0] = 1;	// terrain code
  terrainArray[1][1] = 'low scrub';	// terrain name
  terrainArray[1][2] = 0.1;	// density factor
  terrainArray[1][3] = 1;	// additional movement points needed
  terrainArray[1][4] = 'scrub';	// image name

  terrainArray[2][0] = 2;	// terrain code
  terrainArray[2][1] = 'woods';	// terrain name
  terrainArray[2][2] = 0.15;	// density factor
  terrainArray[2][3] = 2;	// additional movement points needed
  terrainArray[2][4] = 'tree2';	// image name

  terrainArray[3][0] = 3;	// terrain code
  terrainArray[3][1] = 'forest';	// terrain name
  terrainArray[3][2] = 0.3;	// density factor
  terrainArray[3][3] = 2;	// additional movement points needed
  terrainArray[3][4] = 'forest';	// image name

  terrainArray[4][0] = 4;	// terrain code
  terrainArray[4][1] = 'hills';	// terrain name
  terrainArray[4][2] = 0.35;	// density factor
  terrainArray[4][3] = 3;	// additional movement points needed
  terrainArray[4][4] = 'hills';	// image name

  terrainArray[5][0] = 5;	// terrain code
  terrainArray[5][1] = 'mountains';	// terrain name
  terrainArray[5][2] = 0.4;	// density factor
  terrainArray[5][3] = 4;	// additional movement points needed
  terrainArray[5][4] = 'mountains';	// image name

  setTerrainImageSource();

}	// end of loadTerrain

function setMonsterImageSource() {
  // pre-load the images into an array . . .
  for (i=0; i <numMonsters + 1; i++) {
    var imgSrc = './web_images/' + monsterArray[i][1] + '.png';
    monsterImageArray[i].src = imgSrc; 		// set up monsterImageArray
  }
}

function loadMonsterInfo(){
  monsterArray[0][0] = 'Turtle Rider';		// monster name
  monsterArray[0][1] = 'turtle_rider_1';		// image name
  monsterArray[0][2] = 12;							// Health
  monsterArray[0][3] = 6;							// Attack
  monsterArray[0][4] = 4;							// Defence

  monsterArray[1][0] = 'Horned Devil';		// monster name
  monsterArray[1][1] = 'horned_devil_1';		// image name
  monsterArray[1][2] = 13;							// Health
  monsterArray[1][3] = 7;							// Attack
  monsterArray[1][4] = 5;							// Defence

  monsterArray[2][0] = 'Squirm';				// monster name
  monsterArray[2][1] = 'squirm_1';			// image name
  monsterArray[2][2] = 9;					// Health
  monsterArray[2][3] = 4;					// Attack
  monsterArray[2][4] = 4;					// Defence

  monsterArray[3][0] = 'Bleh';				// monster name
  monsterArray[3][1] = 'bleh_1';				// image name
  monsterArray[3][2] = 16;					// Health
  monsterArray[3][3] = 8;					// Attack
  monsterArray[3][4] = 5;					// Defence

  monsterArray[4][0] = 'Scream';			// monster name
  monsterArray[4][1] = 'scream_1';		// image name
  monsterArray[4][2] = 7;				// Health
  monsterArray[4][3] = 6;				// Attack
  monsterArray[4][4] = 6;				// Defence

  monsterArray[5][0] = 'Warrior Ant';		// monster name
  monsterArray[5][1] = 'ant_warrior_1';		// image name
  monsterArray[5][2] = 10;				// Health
  monsterArray[5][3] = 4;				// Attack
  monsterArray[5][4] = 7;				// Defence

  monsterArray[6][0] = 'Drop';			// monster name
  monsterArray[6][1] = 'drop_1';			// image name
  monsterArray[6][2] = 9;				// Health
  monsterArray[6][3] = 4;				// Attack
  monsterArray[6][4] = 3;				// Defence

  monsterArray[7][0] = 'Ground Fish';			// monster name
  monsterArray[7][1] = 'ground_fish_1';			// image name
  monsterArray[7][2] = 11;				// Health
  monsterArray[7][3] = 6;				// Attack
  monsterArray[7][4] = 3;				// Defence

  monsterArray[8][0] = 'Snail';			// monster name
  monsterArray[8][1] = 'snail_1';			// image name
  monsterArray[8][2] = 8;				// Health
  monsterArray[8][3] = 6;				// Attack
  monsterArray[8][4] = 6;				// Defence

  monsterArray[9][0] = 'Strawberry';			// monster name
  monsterArray[9][1] = 'strawb_1';			// image name
  monsterArray[9][2] = 7;				// Health
  monsterArray[9][3] = 5;				// Attack
  monsterArray[9][4] = 3;				// Defence

  // level 2 monsters . . .
  monsterArray[10][0] = 'Flame Spirit';			// monster name
  monsterArray[10][1] = 'flame_spirit_2';			// image name
  monsterArray[10][2] = 16;				// Health
  monsterArray[10][3] = 9;				// Attack
  monsterArray[10][4] = 9;				// Defence

  monsterArray[11][0] = 'Bloat';			// monster name
  monsterArray[11][1] = 'bloat_2';			// image name
  monsterArray[11][2] = 12;				// Health
  monsterArray[11][3] = 7;				// Attack
  monsterArray[11][4] = 14;				// Defence

  monsterArray[12][0] = 'Star Man';			// monster name
  monsterArray[12][1] = 'starman';			// image name
  monsterArray[12][2] = 6;				// Health
  monsterArray[12][3] = 10;				// Attack
  monsterArray[12][4] = 5;				// Defence

  monsterArray[13][0] = 'Ninja';			// monster name
  monsterArray[13][1] = 'ninja';			// image name
  monsterArray[13][2] = 8;				// Health
  monsterArray[13][3] = 10;				// Attack
  monsterArray[13][4] = 7;				// Defence

  monsterArray[14][0] = 'Assassin';			// monster name
  monsterArray[14][1] = 'assassin';			// image name
  monsterArray[14][2] = 14;				// Health
  monsterArray[14][3] = 11;				// Attack
  monsterArray[14][4] = 6;				// Defence

  monsterArray[15][0] = 'Lightning Fish';			// monster name
  monsterArray[15][1] = 'lightning_fish_1';			// image name
  monsterArray[15][2] = 15;				// Health
  monsterArray[15][3] = 12;				// Attack
  monsterArray[15][4] = 7;				// Defence

  monsterArray[16][0] = 'Leosaur';			// monster name
  monsterArray[16][1] = 'leosaur_1';			// image name
  monsterArray[16][2] = 19;				// Health
  monsterArray[16][3] = 15;				// Attack
  monsterArray[16][4] = 11;				// Defence

  monsterArray[17][0] = 'Leecho';			// monster name
  monsterArray[17][1] = 'leecho_1';			// image name
  monsterArray[17][2] = 21;				// Health
  monsterArray[17][3] = 4;				// Attack
  monsterArray[17][4] = 16;				// Defence

  monsterArray[18][0] = 'Crazed King';			// monster name
  monsterArray[18][1] = 'crazed_king_1';			// image name
  monsterArray[18][2] = 18;				// Health
  monsterArray[18][3] = 11;				// Attack
  monsterArray[18][4] = 16;				// Defence

  // The final big boss-battle monster!
  monsterArray[finalMonsterIdx][0] = 'hideously evil GREEN SKULL';	// monster name
  monsterArray[finalMonsterIdx][1] = 'green_skull';			// image name
  monsterArray[finalMonsterIdx][2] = 32;				// Health
  monsterArray[finalMonsterIdx][3] = 16;				// Attack
  monsterArray[finalMonsterIdx][4] = 12;				// Defence

  setMonsterImageSource() ;

  setMonsterImageSource() ;
}	// end of loadMonsterInfo

function setFoodImageSource() {
  // pre-load the images into an array . . .
  for (i=0; i <numFoods; i++) {
    var imgSrc = './web_images/food/' + foodArray[i][1] + '.png';
    foodImageArray[i].src = imgSrc; 	// set up foodImageArray
  }
}

function loadFood(){
  foodArray[0][0] = 'squashy fig';		// food name
  foodArray[0][1] = 'fig';				// name of png file
  foodArray[0][2] = 3;					// health points gained

  foodArray[1][0] = 'loaf of bread';
  foodArray[1][1] = 'bread_1';
  foodArray[1][2] = 5;

  foodArray[2][0] = 'croissant';
  foodArray[2][1] = 'croissant';
  foodArray[2][2] = 2;

  foodArray[3][0] = 'brown egg';
  foodArray[3][1] = 'brown_egg';
  foodArray[3][2] = 3;

  foodArray[4][0] = 'cucumber';
  foodArray[4][1] = 'cucumber';
  foodArray[4][2] = 1;

  foodArray[5][0] = 'glass of beer';
  foodArray[5][1] = 'glass_of_beer';
  foodArray[5][2] = 2;

  foodArray[6][0] = 'strawberry';
  foodArray[6][1] = 'strawberry';
  foodArray[6][2] = 2;

  foodArray[7][0] = 'husk of sweetcorn';
  foodArray[7][1] = 'sweetcorn';
  foodArray[7][2] = 3;

  foodArray[8][0] = 'watermelon';
  foodArray[8][1] = 'watermelon';
  foodArray[8][2] = 3;

  foodArray[9][0] = 'ripe acorn';
  foodArray[9][1] = 'acorn';
  foodArray[9][2] = 1;

  foodArray[10][0] = 'shiny aubergine';
  foodArray[10][1] = 'aubergine';
  foodArray[10][2] = 3;

  foodArray[11][0] = 'half avacado';
  foodArray[11][1] = 'avacado';
  foodArray[11][2] = 2;

  foodArray[12][0] = 'black olive';
  foodArray[12][1] = 'black_olive';
  foodArray[12][2] = 1;

  foodArray[13][0] = 'bunch of blueberries';
  foodArray[13][1] = 'blueberries';
  foodArray[13][2] = 2;

  foodArray[14][0] = 'loaf of tasty bread';
  foodArray[14][1] = 'bread_2';
  foodArray[14][2] = 5;

  foodArray[15][0] = 'yam';
  foodArray[15][1] = 'yam';
  foodArray[15][2] = 4;

  foodArray[16][0] = 'couple of buns';
  foodArray[16][1] = 'buns';
  foodArray[16][2] = 4;

  foodArray[17][0] = 'cabbage';
  foodArray[17][1] = 'cabbage';
  foodArray[17][2] = 3;

  foodArray[18][0] = 'fancy cake';
  foodArray[18][1] = 'cake';
  foodArray[18][2] = 4;

  foodArray[19][0] = 'carrot';
  foodArray[19][1] = 'carrot';
  foodArray[19][2] = 3;

  foodArray[20][0] = 'stick of celery';
  foodArray[20][1] = 'celery';
  foodArray[20][2] = 1;

  foodArray[21][0] = 'smelly wheel of cheese';
  foodArray[21][1] = 'cheese_1';
  foodArray[21][2] = 5;

  foodArray[22][0] = 'wheel of cheese';
  foodArray[22][1] = 'cheese_2';
  foodArray[22][2] = 5;

  foodArray[23][0] = 'small bunch of cherries';
  foodArray[23][1] = 'cherries';
  foodArray[23][2] = 2;

  foodArray[24][0] = 'courgette';
  foodArray[24][1] = 'courgette';
  foodArray[24][2] = 3;

  foodArray[25][0] = 'couple of pale eggs';
  foodArray[25][1] = 'eggs';
  foodArray[25][2] = 5;

  foodArray[26][0] = 'clove of garlc';
  foodArray[26][1] = 'garlic';
  foodArray[26][2] = 3;

  foodArray[27][0] = 'bunch of grapes';
  foodArray[27][1] = 'grapes';
  foodArray[27][2] = 4;

  foodArray[28][0] = 'green chilli';
  foodArray[28][1] = 'green_chilli';
  foodArray[28][2] = 2;

  foodArray[29][0] = 'green olive';
  foodArray[29][1] = 'green_olive';
  foodArray[29][2] = 2;

  foodArray[30][0] = 'green pepper';
  foodArray[30][1] = 'green_pepper';
  foodArray[30][2] = 3;

  foodArray[31][0] = 'nice orange';
  foodArray[31][1] = 'orange';
  foodArray[31][2] = 4;

  foodArray[32][0] = 'fresh orange pepper';
  foodArray[32][1] = 'orange_pepper';
  foodArray[32][2] = 3;

  foodArray[33][0] = 'pak choi leaf';
  foodArray[33][1] = 'pak_choi';
  foodArray[33][2] = 1;

  foodArray[34][0] = 'pear';
  foodArray[34][1] = 'pear';
  foodArray[34][2] = 3;

  foodArray[35][0] = 'load of peas in their pod';
  foodArray[35][1] = 'peas_in_pod';
  foodArray[35][2] = 3;

  foodArray[36][0] = 'few peas in the pod';
  foodArray[36][1] = 'peas_in_pod2';
  foodArray[36][2] = 2;

  foodArray[37][0] = 'plum';
  foodArray[37][1] = 'plum';
  foodArray[37][2] = 3;

  foodArray[38][0] = 'potato';
  foodArray[38][1] = 'potato';
  foodArray[38][2] = 2;

  foodArray[39][0] = 'red chilli';
  foodArray[39][1] = 'red_chilli';
  foodArray[39][2] = 2;

  foodArray[40][0] = 'red pepper';
  foodArray[40][1] = 'red_pepper';
  foodArray[40][2] = 3;

  foodArray[41][0] = 'yellow pepper';
  foodArray[41][1] = 'yellow_pepper';
  foodArray[41][2] = 2;

  foodArray[42][0] = 'tomato';
  foodArray[42][1] = 'tomato';
  foodArray[42][2] = 2;

  foodArray[43][0] = 'veggie sausage';
  foodArray[43][1] = 'veggie_sausage';
  foodArray[43][2] = 5;

  setFoodImageSource();		// pre-load food images

}	// end of loadFood

function getCookieValue(pairName, cookieString){
// returns the value for the name/value pair, for the given name
// if not found, returns null
	var returnValue = null;
	var cookieValuesArray = cookieString.split(';');
	for (i=0; i<cookieValuesArray.length; i++) {
		var nameValuePair = cookieValuesArray[i];
		var nameValuePairArray = nameValuePair.split('=');
		if (nameValuePairArray[0] == pairName)
			returnValue = nameValuePairArray[1];
	}
	return returnValue;
}	// end of getCookieValue

function startHeroPosition(gameState){

	if (!gameState.gameInProgress)
	{
		map.big.posRowCell = Math.floor(Math.random() * map.big.rows); // random starting row on LHS
		map.big.posColumnCell = 0;
		map.small.posRowCell = Math.floor(Math.random() * map.small.rows); // random starting row of small map;
		map.small.posColumnCell = 0;  // on LHS
	}
	map.small.oldPosRowCell = map.small.posRowCell;
	map.small.oldPosColumnCell = map.small.posColumnCell;
	hero.bigOldposRowCell = map.big.posRowCell;
	hero.bigOldPosColumnCell = map.big.posColumnCell;
}	// end of startHeroPosition

function loadHeroImage() {
	hero.image.src = './web_images/hero_' + hero.type + '.png';
	hero.image.title = hero.type + ' ' + hero.name;
}

function loadHeroInfo(game_state, map){
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
	game_state.gameInProgress = (getCookieValue('gameInProgress', cookieValue) == "Y") ? true : false;
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
	statsHeroImage.src = './web_images/hero_' + hero.type + '.png';
	statsHeroImage.title = hero.type + ' ' + hero.name;

	startHeroPosition(game_state);
	if (!game_state.gameInProgress)
		game_state.gameInProgress = true;
}

function saveHeroInfo(){
    var gameInProgress = (game_state.gameInProgress == true) ? "Y" : "N";
	var cookieValue  = "name=" + hero.name + ';'
									+ "health=" + hero.health + ';'
									+ "attack=" + hero.attack + ';'
									+ "defence=" + hero.defence + ';'
									+ "char=" + hero.type + ';'
									+ "posRowCell=" + map.small.posRowCell + ';'
									+ "posColumnCell=" + map.small.posColumnCell + ';'
									+ "bigPosRowCell=" + map.big.posRowCell + ';'
									+ "bigPosColumnCell=" + map.big.posColumnCell + ';'
									+ "gameInProgress=" + gameInProgress + ';'
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
	var terrainFreq =  terrainArray[terrType][2];

	for (i=0; i <map.small.rows; i++)
		for (k=0; k <map.small.cols; k++)
			if (Math.random() < terrainFreq )
				mapDetailArray[i][k] = terrType; 	// terrain type
			else
				mapDetailArray[i][k] = 0;	// default to terrain type zero
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
	terrEle.src = terrainImageArray[terrType].src;
	terrEle.title = terrainArray[terrType][1];
	mapTableCell.style.backgroundColor ='#E6EFC2';
}

function showMovementArea()
{
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

function showSpecialMapFeature(mapTable, row, col)
// shows any special map features on the small map
{
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

function checkDestReached(map)
{
	if (terrainDestinationArray[map.big.nextDestination][0] == map.big.posRowCell &&
	  terrainDestinationArray[map.big.nextDestination][1] == map.big.posColumnCell &&
		terrainDestinationArray[map.big.nextDestination][2] == map.small.posRowCell &&
	  terrainDestinationArray[map.big.nextDestination][3] == map.small.posColumnCell)
	{
		map.big.nextDestination = map.big.nextDestination + 1;
		storyEvent = 'Yes';
		if  (map.big.nextDestination == map.big.numTerrainTypes)  // final destination
		{
			alert('Who dares take the black feather???!!!!');
			alert('Prepare yourself, for you will die!!!');
			hero.fightOn = 'Yes';
			finalFight=true;
			startAttack();
		}
		else
		{
			displayDestination(map.big.nextDestination);
		}
	}
}

function processMovement(tableRow, tableCol, bigTableRow, bigTableCol) {
	// see if the hero has moved off the current map into another map square, and
	// also block movement off the playing area
	heroMoved = 'No';
	storyEvent = 'No';
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
	    //alert('posRowCell is: ' + posRowCell + '& posColumnCell is: ' + posColumnCell);
          // still on this map square . . . .
          var terrType = mapDetailArray[tableRow][tableCol];
          var terrainMovementCost = 1 + terrainArray[terrType][3];
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
		for (k=0; k <map.small.cols; k++)
		{
			var terrType = bigMapArray[i][k];
			mapRow = mapTableDiv.getElementsByTagName("tr")[i];
			mapCell = mapRow.getElementsByTagName("td")[k];
			mapCell.innerHTML='<img  />';
			terrEle = mapCell.firstChild;
			terrEle.src = terrainImageArray[terrType].src;
			terrEle.title = terrainArray[terrType][1];
		}
		// show where on the big map the hero is . . .
		mapRow = mapTableDiv.getElementsByTagName("tr")[map.big.posRowCell];
		mapCell = mapRow.getElementsByTagName("td")[map.big.posColumnCell];
		mapCell.style.backgroundColor = 'yellow';
}

function showBigMapKey(moveArea){
	moveArea.innerHTML='<h3>Map Key</h3>'
		+ '<div>';
	for (i=0; i <map.big.numTerrainTypes; i++)
	{
		moveArea.innerHTML = moveArea.innerHTML +
			terrainArray[i][1] + '&nbsp;&nbsp;<img src = '
			+ '"./web_images/' + terrainArray[i][4] + '.png"'
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
	questDisplayed = false;
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
		questDisplayed = true;
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
			+ terrainArray[map.big.nextDestination][1]
			+ '", which look like this: <img src = '
			+ '"./web_images/' + terrainArray[map.big.nextDestination][4] + '.png" />'
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
		heroMoved = 'Yes';
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
	for (i=0; i <hero.numDiceRolls; i++)
	{
		tempHeroRoll = Math.ceil(Math.random() * hero.attack);
		if (tempHeroRoll > heroAttackRoll)
			heroAttackRoll = tempHeroRoll;
	}

	// simulate the rolling of three dice for the monster defence, take the highest value . . .
	for (i=0; i <monster.numDiceRolls; i++)
	{
		tempMonsterRoll = Math.ceil(Math.random() * monsterArray[monsterIdx][4]);
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
	var heroHitDisplay =  'You attack the ' + monsterArray[monsterIdx][0];
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
	for (i=0; i <monster.numDiceRolls; i++) {
		tempMonsterRoll = Math.ceil(Math.random() * monsterArray[monsterIdx][3]);
		if (tempMonsterRoll > monsterAttackRoll)
			monsterAttackRoll = tempMonsterRoll;
	}

	// simulate the rolling of three dice for the hero's defence, take the highest value . . .
	for (i=0; i <hero.numDiceRolls; i++) {
		tempHeroRoll = Math.ceil(Math.random() * heroDefence);
		if (tempHeroRoll > heroDefenceRoll)
			heroDefenceRoll = tempHeroRoll;
	}

	// has the monster done any damage . . . ?
	monsterHit = monsterAttackRoll - heroDefenceRoll;
	if (monsterHit < 0) {
		monsterHit = 0;	// hero defence roll is larger, so no damage done
	}
	var monsterHitDisplay = 'The ' + monsterArray[monsterIdx][0] + ' attacks ';
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
	var experienceAdded = monsterArray[monsterIdx][3];
	var newHeroExperience = hero.experience;
	if (hero.turnToFight === true)
	{
		doHeroAttack();
		if (monster.health <= 0  && finalFight)
			tellEndStory();
		else if (monster.health <= 0)
			showContJournButt() ;
	}
	else if (monster.health > 0)
		doMonsterAttack(hero.defence);
	updateHeroStats();
	popMonsterStatsDisplay();
} // end of fightMonster

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
	monsterIdx = Math.floor(Math.random() * numMonsters);
	if (finalFight)
		monsterIdx = finalMonsterIdx;
	var monsterName = monsterArray[monsterIdx][0];
	monster.health = monsterArray[monsterIdx][2];
	monster.attack = monsterArray[monsterIdx][3];
	monster.monsterDefence = monsterArray[monsterIdx][4];
	var monsterEle = document.getElementById('monsterName');
	monsterEle.innerHTML = monsterName;
	var monsterPic = document.getElementById('monsterImage');
	monsterPic.src = monsterImageArray[monsterIdx].src;
	monsterPic.title = monsterArray[monsterIdx][0];
	popMonsterStatsDisplay();
	showFightButts();
	hideOptButts();
} // end of startAttack

function checkForAttack() {
	var attackModifier = 0;
	if (hero.foraging)
		attackModifier = -0.05;
	if (Math.random() > game_state.attackRisk + attackModifier) {
		hero.fightOn = 'Yes';
		startAttack();
	}
} // end of checkForAttack()

function processFoundFood(forageState, actionSpace){
// "process" as in display the food and add health points . . .
	var foundPhrase;
	if (forageState == 'On')
		foundPhrase = 'You find a ';
	else
		foundPhrase = 'You stumble upon a ';

	foodIdx = Math.floor(Math.random() * numFoods);
	actionSpace.innerHTML = '<p>' + foundPhrase + foodArray[foodIdx][0] + '</p>'
												+ '<img id="foodImage" title="the thing you found" style="float:left;"/>';

	var foodPic = document.getElementById('foodImage');
	foodPic.src = foodImageArray[foodIdx].src;
	foodPic.title = foodArray[foodIdx][0];
	hero.health = hero.health + foodArray[foodIdx][2];
	if (hero.health > hero.maxHealth)
		hero.health = hero.maxHealth;
	updateHeroStats();
}	// end of processFoundFood

function checkForForage(forageState, posRowCell, posColumnCell) {
	var actionSpace = document.getElementById('action');
	var terrType = mapDetailArray[posRowCell][posColumnCell];
	//alert ('terrType = ' + terrType);
	var forageModifier = terrainArray[terrType][3];

	if (hero.foraging)		// if actively foraging
	{
		forageModifier = ((1/map.big.numTerrainTypes) / 2) * forageModifier ;
		if (Math.random() > 0.89 - forageModifier) // success!
			processFoundFood(forageState, actionSpace);
		else
			actionSpace.innerHTML = '<p>Haven\'t found anything . . .</p>';
	}
	else
	{
		if (Math.random() > 0.99)
			processFoundFood(forageState, actionSpace);
		else
			actionSpace.	innerHTML = '&nbsp';
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
	var arrowDirection = arrowImage.title	;
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
		if (actionCode >= 37 && actionCode <= 40
			&& !map.big.displayed
		    && !questDisplayed)
		{
			calcMovement(actionCode)
			processMovement(map.small.posRowCell,
			                map.small.posColumnCell,
			                map.big.posRowCell,
			                map.big.posColumnCell);
			drawHero();
			if (heroMoved == 'Yes')
			{
				if (storyEvent == 'No')
				{
				checkForAttack();
				if (hero.fightOn === 'No' )
					checkForForage(hero.foraging, map.small.posRowCell, map.small.posColumnCell);
				}
			}
		}
		if (actionCode == 77 /* letter "m" for (m)ap  */
			 && !questDisplayed)
			showMap(map.big.displayed);
		if (actionCode == 81 /* letter "q" for (q)uest log */
			 && !map.big.displayed)
			showQuest(questDisplayed, map.big.displayed);
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
  loadHeroInfo(game_state, map);
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
