/* This was created initially in order to try and learn and improve my JavaScript.
   If you have any suggestions on how to improve this script, I'd love to hear from you.
   Contact me at: me@nelsonwright.co.uk
*/

// cookie stuff thanks to Patrick Hunlock: http://www.hunlock.com/blogs/Ten_Javascript_Tools_Everyone_Should_Have

function setCookie(name, value, expires, options) {
	if (options === undefined) {
		options = {};
	}

	if (expires) {
		var expires_date = new Date();
		expires_date.setDate(expires_date.getDate() + expires);
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

	if ( ( !start ) && ( name !== document.cookie.substring( 0, name.length ) ) ) {
		return null;
	}
	if ( start === -1 ) {
		return null;
	}
	var end = document.cookie.indexOf( ';', len );

	if ( end === -1 ) {
		end = document.cookie.length;
	}
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
   } else {
      return false;
   }
}

// this is my own function, but based on Patrick's code . . .
function jandoCookieExists() {
   if (getCookie('jando')) {
      return true;
   } else {
      return false;
   }
}

/*********************************
    do some initial game set up
**********************************/

// We're using Object.freeze as these values shouldn't change, i.e. it's an immutable object . . .
var gameSettings = Object.freeze({
	attackRisk: 0.91,	   	// if the random number is higher than this (plus or minus modifiers), then you'll be attacked!
	numHeroDiceRolls: 3, 	// this equates to how many dice are rolled
	numMonsterDiceRolls: 3,
	foragingSuccessLevel: 0.89, // the random number generated (between 0 - 1) must be higher than this for food to be found when foraging
	foodFindLevel: 0.99, // the random number generated (between 0 - 1) must be higher than this for food to be found when NOT foraging
	hoursInNight: 8 // how many "hours" are in the night, i.e. possible points at which bad dreams can occur
});

// these are the unicode values for the keyboard keys when pressed
var key = Object.freeze({
	// arrow keys . . .
	up: 38,
	down: 40,
	left: 37,
	right: 39,
	isArrowKey: function(actionCode) {
		return actionCode >= 37 && actionCode <= 40;
	},
	isTopRowDigit: function(actionCode) {
		return actionCode >= 48 && actionCode <= 57;
	},
	isKeypadDigit: function(actionCode) {
		return actionCode >= 96 && actionCode <= 105;
	},
	isDigit: function(actionCode) {
		return this.isTopRowDigit(actionCode) || this.isKeypadDigit(actionCode);
	},
	map: 77, // letter "m" for (m)ap
	questLog: 81, // letter "q" for (q)uest log
	sleep: 83, // letter "s" for (s)leep
	forage: 79, // letter "o" for f(o)rage
	fight: 70, // letter "f" for (f)ight
	runAway: 82, // letter "r" for (r)un Away
	continueJourney: 67, // letter "c" for (c)ontinue Journey
	enter: 13	// the enter or return key
});

// these values apply to the game as a whole, and may change during the course of a game . . .
var gameState = {
	inProgress: false,			// has the game started? - prob don't need this now there's inStartMode
	storyEvent: false,	   	// is a story event happening?
	questDisplayed: false, 	// are we currently showing the current quest objective?
	finalFight: false,     	// is the final battle happening?
	monsterIdx:	0,					// used to indicate the currently battled monster
	inStartMode: true,      // to indicate when player is selcting their starting character
	sleepIntervalId: null,  // id for the sleep state, needed when stopping/clearing
	sumsIntervalId: null,		// id for the timer used when doing sums in the dream state
	timeForSums: 7					// how many seconds you have to complete a sum whilst in a dream
};

var hero = {
	// the values here are the defaults, but may be overwritten by other values . . .
	name: null,
	image: new Image(),
   sleepImage: new Image(),
	type: "human",
	movePoints: 20,
	maxMovePoints: 20,
	maxHealthGainedBySleep: 8,
   minHealthGainedBySleep: 2, // the minimum if you've not answered any sums, that is
	foraging: false,  // are you foraging at the moment?
	moved: false,			// indicates if the hero has successfully moved on the map
	asleep: false,		// indicates if you're sleeping
	doingSums: false,	// indicates if you're actually trying to answer a sum
	hoursSlept: 0,    // how long have you been asleep?

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
	experiencePerLevel: 4,
	badDreamThreshold: 0.8	// the closer to 1, the less likely you'll have bad dreams
};

var map = {
  // small map, i.e. the one your character moves around on
	small: {
		rows: 8,
		cols: 10, // size of the map you move around in
		posRowCell: 0,
		posColumnCell: 0,	// map-cordinates of your character
		oldPosRowCell: 0,
		oldPosColumnCell: 0, // the previous co-ordinates
		movementAreaHtml: null, // variable to hold the html for this div
      directionClassName: "",
      backgroundColour: "#E6EFC2",
      movedLeft: function() {
         var movedLeftOnSmallMap = this.posColumnCell < this.oldPosColumnCell &&
            map.big.posColumnCell === map.big.oldPosColumnCell;
         var movedLeftOffEdgeOfSmallMap = this.posColumnCell === this.cols -1 &&
            map.big.posColumnCell < map.big.oldPosColumnCell;
         return movedLeftOnSmallMap || movedLeftOffEdgeOfSmallMap;
      },
      movedRight: function() {
         var movedRightOnSmallMap = this.posColumnCell > this.oldPosColumnCell &&
            map.big.posColumnCell === map.big.oldPosColumnCell;
         var movedRightOffEdgeOfSmallMap = this.posColumnCell === 0 &&
            map.big.posColumnCell > map.big.oldPosColumnCell;
         return movedRightOnSmallMap || movedRightOffEdgeOfSmallMap;
      },
      storeDirectionClassName: function() {
         if (this.movedLeft()) {
            // if they've moved left, make the character face the other way
            this.directionClassName = "flipHorizontal";
         } else if (this.movedRight()) {
            this.directionClassName = "";
         }
      },
		drawHero: function() {
			var mapTableDiv = document.getElementById('mapTableDiv');
			var mapCellImageTag = getCellImageTag(mapTableDiv, map.getHeroPosition());

         this.storeDirectionClassName();
         mapCellImageTag.className = this.directionClassName;
			mapCellImageTag.src = makeImageSource('hero_' + hero.type + '_thumb');
			mapCellImageTag.title = hero.name;
			mapCellImageTag.alt = hero.name;
			mapCellImageTag.id = 'yourCharacterImage';

			// should move this somewhere else at some point . . .
			map.setPriorHeroPosition(map.getHeroPosition());
		}
   },
  // big map, i.e the overview of the whole area
  	big: {
		rows: 8,
		cols: 10, // size of the overall big scale map
		posRowCell: 0,
		posColumnCell: 0,	// big map-cordinates of the hero
		oldPosRowCell: 0,
		oldPosColumnCell: 0, // the previous co-ordinates
		terrainAttributes: 6,	// number of attributes of the particular terrain
		numTerrainTypes: 6,    // how many different terrain types there are - set by the length of the terrainTypes array
		displayed: false,      // indicates if the big map is being displayed
		nextDestination: 0		// holds the next destination level,
										// corresponds to terrain type, i.e. starts at zero,which = light grass
  },
  // an array of arrays containing the terrain details of each small map
   terrain: null,
   getTerrainType: function(row, column) {
      var position = this.getHeroPosition();
      var terrType = this.terrain[position.big.row][position.big.column][row][column];
      return terrType;
   },
   getTerrainTypeAtCharactersPosition: function() {
      var position = this.getHeroPosition();
      var terrType = this.terrain[position.big.row][position.big.column][position.small.row][position.small.column];
      return terrType;
   },
   getBigTerrainTypeForCharacter: function() {
      var position = this.getHeroPosition();
      var terrType = bigMapTerrainArray[position.big.row][position.big.column];
      return terrType;
   },
   getHeroPosition: function() {
      var heroPosition = {small:{row:null, column:null}, big:{row:null, column:null}};
      heroPosition.small.row = this.small.posRowCell;
      heroPosition.small.column = this.small.posColumnCell;
      heroPosition.big.row = this.big.posRowCell;
      heroPosition.big.column = this.big.posColumnCell;
      return heroPosition;
   },
   setHeroPosition: function(heroPosition) {
      this.small.posRowCell = heroPosition.small.row;
      this.small.posColumnCell = heroPosition.small.column;
      this.big.posRowCell = heroPosition.big.row;
      this.big.posColumnCell = heroPosition.big.column;
   },
   setPriorHeroPosition: function(heroPosition) {
      this.small.oldPosRowCell = heroPosition.small.row;
      this.small.oldPosColumnCell = heroPosition.small.column;
      this.big.oldPosRowCell = heroPosition.big.row;
      this.big.oldPosColumnCell = heroPosition.big.column;
   },
   resetHeroPositionToPrior: function() {
      this.small.posRowCell = this.small.oldPosRowCell;
      this.small.posColumnCell = this.small.oldPosColumnCell;
      this.big.posRowCell = this.big.oldPosRowCell;
      this.big.posColumnCell = this.big.oldPosColumnCell;
   }
};

var sleep = {
	questionsAsked: null,
	correctAnswers: null,
   narrativeText: null,
	calculation: {
		firstFactor: null,
		secondFactor: null,
		digitToGuess: null,
		timeAllowed: 7, // how many seconds you're allowed to answer
		answerIndex: null,
      timeToAnswerText: null,
      text: null,
      answerText: "",
      resultText: null,
		create: function() {
			this.firstFactor = Math.floor(Math.random() * 10 + 2);
			this.secondFactor = Math.floor(Math.random() * 10 + 2);
			this.answerIndex = 0;
			this.digitToGuess = this.calcDigitToGuess();
		},
		product: function() {
			return this.firstFactor * this.secondFactor;
		},
		createQuestionText: function () {
			return this.firstFactor + ' X ' + this.secondFactor + ' = ';
		},
		correctDigitGuessed: function(digitGuessed) {
			return digitGuessed === this.digitToGuess;
		},
		calcDigitToGuess: function () {
			return parseInt(this.product().toString()[this.answerIndex]);
		},
		updateDigitToGuess: function() {
			this.answerIndex++;
			this.digitToGuess = this.calcDigitToGuess();
		},
		gotItAllCorrect: function() {
			return this.answerIndex >= parseInt(this.product().toString().length);
		},
      wipeText: function() {
         this.timeToAnswerText = "";
         this.text = "";
         this.resultText = " ";
         this.answerText = "";
      }
	},

};

// this is the monster that is currently being fought
var monster = {};

// the array of possible mosters that can be fought
var monsterArray = [];

// the array of possible foods that can be found
var foodArray = [];

// Used to hold details of terrain . . .
var terrainArray= [];

/* Used to hold terrain row/col pairs (locations) on the big map, indexed by terrain type, eg:
	0: 0,1;1,0;2,0;3,1;4,0;4,1;6,0;6,2;7,0 // light grass in row 1, col 2, row 1, col 3, etc
	1: 0,0;0,2;1,1;1,2;2,1;2,2;3,0;3,2;4,2;5,0;5,1;5,2;5,4;6,1;7,2
	 . . . etc . . . up to  . . .
	5: 0,9;1,9;2,7;2,8;2,9;3,9;4,9;7,9  //  mountains would be present on row 1, column 10, row 2, col 10, etc
	We need to save these locations, so we can pick randomly pick one as the destination for each quest
*/
var terrainLocationsArray = [];

function getImageForItem(paramObject, isFood) {
	var theImage = new Image();

	theImage.imageName = deriveImageName(paramObject);
	theImage.src = makeImageSource(theImage.imageName, isFood);
	return theImage;
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
for (var i=0; i <map.big.rows; i++) {
	bigMapTerrainArray[i]=new Array(map.big.cols);
}

// Used to hold row/col destination pairs on big map and small map,
// indexed by terrain type.  Also used to hold character and map images
// that are displayed upon reaching a destination
var questArray = new Array(map.big.numTerrainTypes + 1);	 // last destination is random location for treasure
for (var i=0; i <map.big.numTerrainTypes + 1; i++) {
	questArray[i] = {};
}

function loadMonsters() {
	loadJsonIntoArray(getMonsterData(), monsterArray, false);
}

function loadTerrain() {
	loadJsonIntoArray(getTerrainData(), terrainArray, false);
	map.big.numTerrainTypes = terrainArray.length;

	for (var i=0; i <map.big.numTerrainTypes; i++) {
		terrainLocationsArray.push(''); 	// set up with blank as default
	}
}

function loadJsonIntoArray(jsonData, targetArray, isFood) {
	var currentItem;

	for (var i=0; i<jsonData.items.length; i++) {
		currentItem = jsonData.items[i];
		targetArray.push(currentItem);
		targetArray[i].image = getImageForItem(currentItem, isFood);
	}
}

function loadFood() {
	loadJsonIntoArray(getFoodData(), foodArray, true);
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

	for (var i=0; i<cookieValuesArray.length; i++) {
		var nameValuePair = cookieValuesArray[i];
		var nameValuePairArray = nameValuePair.split('=');
		if (nameValuePairArray[0] === pairName) {
			returnValue = nameValuePairArray[1];
			break;
		}
	}
	return returnValue;
}

function getIntValueFromCookie(key, cookieValue) {
	return parseInt(getCookieValue(key, cookieValue));
}

function extractHeroValuesFromCookie(cookieValue) {
	hero.name = getCookieValue('name', cookieValue);
	hero.health = getIntValueFromCookie('health', cookieValue);
	hero.attack = getIntValueFromCookie('attack', cookieValue);
	hero.defence = getIntValueFromCookie('defence', cookieValue);
	hero.type = getCookieValue('char', cookieValue);
	hero.maxHealth = getIntValueFromCookie('maxHeroHealth', cookieValue);
	hero.maxAttack = getIntValueFromCookie('maxHeroAttack', cookieValue);
	hero.maxDefence = getIntValueFromCookie('maxHeroDefence', cookieValue);
	hero.movePoints = getIntValueFromCookie('movePoints', cookieValue);
	hero.maxMovePoints = getIntValueFromCookie('maxMovePoints', cookieValue);
	hero.experience = getIntValueFromCookie('heroExperience', cookieValue);
	hero.level = getIntValueFromCookie('heroLevel', cookieValue);
}

function extractMapValuesFromCookie(cookieValue) {
	map.small.posRowCell = getIntValueFromCookie('posRowCell', cookieValue);
	map.small.posColumnCell = getIntValueFromCookie('posColumnCell', cookieValue);
	map.big.posRowCell = getIntValueFromCookie('bigPosRowCell', cookieValue);
	map.big.posColumnCell = getIntValueFromCookie('bigPosColumnCell', cookieValue);
	map.big.nextDestination = getIntValueFromCookie('nextDestination', cookieValue);
}

function extractValuesFromCookie() {
	var cookieValue = getCookie('jando');

	if (cookieValue !== null) {
		extractHeroValuesFromCookie(cookieValue);
		extractMapValuesFromCookie(cookieValue);
		gameState.inProgress = (getCookieValue('gameInProgress', cookieValue) === "Y") ? true : false;
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

   hero.sleepImage.src = makeImageSource('hero_' + hero.type + '_asleep');
	hero.sleepImage.title = hero.type + ' ' + hero.name + ' asleep';
}

function startHeroPosition() {
	if (!gameState.inProgress) {
		map.setHeroPosition({
			small: {
				row: Math.floor(Math.random() * map.small.rows), // random starting row
				column: 0
			},
			big: {
				row: Math.floor(Math.random() * map.big.rows), // random starting row on LHS on big map
				column: 0
			}
		});
	}

	map.setPriorHeroPosition(map.getHeroPosition());
}

function loadHeroInfo() {
	extractValuesFromCookie();
	renderHeroStatsBox();
	setupStatsHeroImage();
	loadHeroImage();
	startHeroPosition();

	gameState.inProgress = true;
}

function saveHeroInfo() {
   var inProgress = (gameState.inProgress === true) ? "Y" : "N";
	var cookieValue  =
	   "name=" + hero.name + ';' +
		"health=" + hero.health + ';' +
		"attack=" + hero.attack + ';' +
		"defence=" + hero.defence + ';' +
		"char=" + hero.type + ';' +
		"posRowCell=" + map.small.posRowCell + ';' +
		"posColumnCell=" + map.small.posColumnCell + ';' +
		"bigPosRowCell=" + map.big.posRowCell + ';' +
		"bigPosColumnCell=" + map.big.posColumnCell + ';' +
		"gameInProgress=" + inProgress + ';' +
		"movePoints=" + hero.movePoints + ';' +
		"maxHeroHealth=" + hero.maxHealth + ';' +
		"maxHeroAttack=" + hero.maxAttack + ';' +
		"maxHeroDefence=" + hero.maxDefence + ';' +
		"maxMovePoints=" + hero.maxMovePoints + ';' +
		"nextDestination=" + map.big.nextDestination + ';' +
		"heroExperience=" + hero.experience + ';' +
		"heroLevel=" + hero.level;
	setCookie('jando', cookieValue, 365);  // cookie will expire in a year
}

function populateQuestArray(terrainCode, terrainQuestData) {
	var thisTerrainCoords = [];
	var thisTerrainRowCol = [];

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
		questArray[terrainCode].bigRow = parseInt(thisTerrainRowCol[0]);
		questArray[terrainCode].bigCol = parseInt(thisTerrainRowCol[1]);
	}
	while (questArray[terrainCode].bigRow === map.big.posRowCell &&
			 questArray[terrainCode].bigCol === map.big.posColumnCell);

	// now set the small map row & col, don't allow it to be at the edge of the small map
	// as this can cause problems or be surprising when moving between small map tiles
	questArray[terrainCode].smallRow = Math.floor(Math.random() * (map.small.rows - 2) + 1);
	questArray[terrainCode].smallCol = Math.floor(Math.random() * (map.small.cols -2) + 1);

	questArray[terrainCode].imageNameOfStartCharacter = terrainQuestData.imageNameOfStartCharacter;
	questArray[terrainCode].storyTextHtml = terrainQuestData.storyTextHtml;
	questArray[terrainCode].destinationImageName = terrainQuestData.destinationImageName;
}

function setQuestLocations() {
	var questData = getQuestData();

	// Loop through the terrain locations array by terrain type, randomly pick
	// one of the locations for that terrain type, and assign it to the terrain destination array
	// This provides a destination for the quest related to that terrain type
	// Just pass in the data from questData that is needed for the quest for that terrain

	for (var terrainCode=0; terrainCode < map.big.numTerrainTypes; terrainCode++) {
		populateQuestArray(terrainCode, questData.quest[terrainCode]);
	}
	// now do the same for the last location . . .
	var final = map.big.numTerrainTypes;
	questArray[final].bigRow = Math.floor(Math.random() * map.big.rows);
	questArray[final].bigCol = Math.floor(Math.random() * map.big.cols);
	questArray[final].smallRow = Math.floor(Math.random() * map.small.rows);
	questArray[final].smallCol = Math.floor(Math.random() * map.small.cols);
	questArray[final].imageNameOfStartCharacter = questData.quest[final].imageNameOfStartCharacter;
	questArray[final].storyTextHtml = questData.quest[final].storyTextHtml;
	questArray[final].destinationImageName = questData.quest[final].destinationImageName;
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

	for (var bigRow=0; bigRow < map.big.rows; bigRow++) {
		for (var bigCol=0; bigCol < map.big.cols; bigCol++) {
			terrainType = decideTerrainType(bigCol, map.big.numTerrainTypes);
			bigMapTerrainArray[bigRow][bigCol] = terrainType;

			// need to record location of each terrain type in the locations array,
			// indexed by terrain type.  Then we use this to generate a quest destination for each terrain type
			if (terrainLocationsArray[terrainType].length > 0) {
				terrainLocationsArray[terrainType] = terrainLocationsArray[terrainType] + ';' + bigRow + ',' + bigCol;
			} else {
				terrainLocationsArray[terrainType] = bigRow + ',' + bigCol;
			}
		}
	}
	setQuestLocations();
}

function createSmallMapTerrain() {
   // this will hold all the details of the terrain in each small map,
   // in an array inside each "big map" cell
   var totalSmallMapTerrain=new Array(map.big.rows);
   for (var i=0; i <map.big.rows; i++) {
   	totalSmallMapTerrain[i]=new Array(map.big.cols);
   }

   for (var bigRow=0; bigRow < map.big.rows; bigRow++) {
		for (var bigCol=0; bigCol < map.big.cols; bigCol++) {

         var terrainType = bigMapTerrainArray[bigRow][bigCol];

         // initialise the (empty) terrain array on the small map . . .
         var smallMapTerrain = new Array(map.small.rows);

         for (var i=0; i <map.small.rows; i++) {
            smallMapTerrain[i]=new Array(map.small.cols);
         }

      	for (var row=0; row <map.small.rows; row++) {
      		for (var col=0; col <map.small.cols; col++) {
      			if (Math.random() < terrainArray[terrainType].densityFactor) {
      				smallMapTerrain[row][col] = terrainType;
      			} else {
      				smallMapTerrain[row][col] = 0;	// default to terrain type zero (light grass)
      			}
      		}
      	}
         totalSmallMapTerrain[bigRow][bigCol] = smallMapTerrain;
      }
   }
   map.terrain = totalSmallMapTerrain;
}

function getMapCell(mapTableDiv, row, column) {
	var mapRow = mapTableDiv.getElementsByTagName("tr")[row];
	var mapCell = mapRow.getElementsByTagName("td")[column];
	return mapCell;
}

function getBigMapCell(mapTableDiv, position) {
	return getMapCell(mapTableDiv, position.big.row, position.big.column);
}

function getSmallMapCell(mapTableDiv, position) {
	return getMapCell(mapTableDiv, position.small.row, position.small.column);
}

function getCellImageTag(mapTableDiv, position) {
	var smallMapCell = getSmallMapCell(mapTableDiv, position);
	smallMapCell.innerHTML = '<img  />';
	return smallMapCell.firstChild;
}

function setMapCellColour(mapTableDiv, position, colour) {
	var smallMapCell = getSmallMapCell(mapTableDiv, position);
	smallMapCell.style.backgroundColor = colour;
}

function setBigMapCellColour(mapTableDiv, position, colour) {
	var bigMapCell = getBigMapCell(mapTableDiv, position);
	bigMapCell.style.backgroundColor = colour;
}

function setTerrainCellSmallMap(mapTableDiv, row, column) {
   var cellPosition = {small:{row:row, column:column}, big:{row:null, column:null}};
   var terrType = map.getTerrainType(row, column);
   var cellImageTag = getCellImageTag(mapTableDiv, cellPosition);

	cellImageTag.src = terrainArray[terrType].image.src;
	cellImageTag.title = terrainArray[terrType].name;
	cellImageTag.alt = terrainArray[terrType].name;
	setMapCellColour(mapTableDiv, cellPosition, map.small.backgroundColour);
}

function showMovementArea() {
	var moveArea = document.getElementById('movementArea');
	moveArea.innerHTML = map.movementAreaHtml;
	var mouseMoveHero = document.getElementById('mouseMoveHero');
	mouseMoveHero.src = makeImageSource('hero_' + hero.type + '_thumb');
	mouseMoveHero.title = hero.name;
	mouseMoveHero.alt = hero.name;
}

function fadeMovementArea() {
	var moveArea = document.getElementsByClassName('mapAndMoveArrows');
	var arrowButtonImages = moveArea[0].getElementsByTagName('IMG');

	for (var i = 0; i < arrowButtonImages.length; i++) {
		arrowButtonImages[i].style.opacity = 0.4;
	}
}

function showQuestDestinationOnSmallMap(mapTableDiv, row, col) {
	var cellImageTag;
	var position = {small:{row:row, column:col}, big:{row:null, column:null}};

	cellImageTag = getCellImageTag(mapTableDiv, position);
	cellImageTag.src = makeImageSource(questArray[map.big.nextDestination].destinationImageName);
	cellImageTag.title = "the quest destination";
	cellImageTag.alt = "the quest destination";
}

function isQuestDestinationBigMapSquare(heroPosition) {
	return questArray[map.big.nextDestination].bigRow === heroPosition.big.row &&
	   	questArray[map.big.nextDestination].bigCol === heroPosition.big.column;
}

function showSmallMap() {
	var mapTableDiv = document.getElementById('mapTableDiv');
	createBlankMapIfNotPresent(mapTableDiv);
	showMovementArea();

	for (var row=0; row <map.small.rows; row++) {
		for (var col=0; col <map.small.cols; col++) {
			setTerrainCellSmallMap(mapTableDiv, row, col);
		}
	}

	if (isQuestDestinationBigMapSquare(map.getHeroPosition())) {
		showQuestDestinationOnSmallMap(mapTableDiv,
							  questArray[map.big.nextDestination].smallRow,
							  questArray[map.big.nextDestination].smallCol);
	}
}

function setHeroNameInTitleBar() {
	var template = $('#titleTemplate').html();
	Mustache.parse(template);   // optional, speeds up future uses
	var titleText = Mustache.render(template, {heroName: hero.name});
	$('#titleTemplate_target').html(titleText);
}

function isOffSmallMap(heroPosition) {
	return heroPosition.small.row < 0 || heroPosition.small.row > map.small.rows -1 ||
			 heroPosition.small.column < 0 || heroPosition.small.column > map.small.cols -1;
}

function isOffBigMap(heroPosition) {
	 var off_map_indicator = false;

	off_map_indicator =
		(heroPosition.small.row < 0 && heroPosition.big.row === 0) || // off the top
		(heroPosition.small.row >  map.small.rows - 1 &&  heroPosition.big.row === map.big.rows - 1) || // off the bottom
		(heroPosition.small.column < 0 && heroPosition.big.column === 0) || // off the left
		(heroPosition.small.column >  map.small.cols - 1 &&  heroPosition.big.column === map.big.cols - 1); // off the right

	return off_map_indicator;
}

function checkQuestDestinationReached(map) {
	if (questArray[map.big.nextDestination].bigRow === map.big.posRowCell &&
	    questArray[map.big.nextDestination].bigCol === map.big.posColumnCell &&
		 questArray[map.big.nextDestination].smallRow === map.small.posRowCell &&
	    questArray[map.big.nextDestination].smallCol === map.small.posColumnCell) {

		map.big.nextDestination = map.big.nextDestination + 1;
		gameState.storyEvent = true;

		// final quest destination
		if  (map.big.nextDestination === map.big.numTerrainTypes) {
			window.alert('Who dares take the black feather???!!!!');
			window.alert('Prepare yourself, for you will die!!!');
			hero.fightOn = 'Yes';
			gameState.finalFight = true;
			startAttack();
		} else {
			displayDestination(map.big.nextDestination);
		}
	}
}

function heroMovedUpToNextMapSquare(newHeroPosition) {
	return newHeroPosition.small.row < 0;
}

function heroMovedDownToNextMapSquare(newHeroPosition) {
	return newHeroPosition.small.row > map.small.rows - 1;
}

function heroMovedLeftToNextMapSquare(newHeroPosition) {
	return newHeroPosition.small.column < 0;
}

function heroMovedRightToNextMapSquare(newHeroPosition) {
	return newHeroPosition.small.column > map.small.cols - 1;
}

function calculateNewHeroPosition() {
	var newHeroPosition = map.getHeroPosition();

	if (heroMovedUpToNextMapSquare(newHeroPosition)) {
		newHeroPosition.big.row = newHeroPosition.big.row - 1;
		newHeroPosition.small.row = map.small.rows - 1; // bottom of next map square
	}

	if (heroMovedDownToNextMapSquare(newHeroPosition)) {
		newHeroPosition.big.row = map.big.posRowCell + 1;
		newHeroPosition.small.row = 0; // top of next map square
	}

	if (heroMovedLeftToNextMapSquare(newHeroPosition)) {
		newHeroPosition.big.column = newHeroPosition.big.column - 1; // right hand side of next map square
		newHeroPosition.small.column = map.small.cols - 1;
	}

	if (heroMovedRightToNextMapSquare(newHeroPosition)) {
		newHeroPosition.big.column = newHeroPosition.big.column + 1;
		newHeroPosition.small.column = 0; // left hand side of next map square
	}

	return newHeroPosition;
}

// a function to return an alernative value if the first value is null
function nvl(value1, value2) {
	if (typeof value1 === 'undefined' || value1 === null || value1 === "") {
		return value2;
	}
	return value1;
}

// a shorter function name for "Math.max"
function max(value1, value2) {
	return Math.max(value1, value2);
}

function showNextSmallMap(heroPosition) {
	var newHeroPosition = calculateNewHeroPosition();
	map.setHeroPosition(newHeroPosition);

	showSmallMap();
	map.small.drawHero();
	map.setPriorHeroPosition(heroPosition);
}

function dontAllowMovement() {
	// don't allow movement off playing area
	map.resetHeroPositionToPrior();
}

function highlightHeroSquare() {
	$("#heroMovePoints").effect("highlight",{color: "#A52A2A"});
	$("#yourCharacterImage").parent().effect("highlight",{color: "#A52A2A"});
	$("#sleepButt").effect("highlight",{"color": "#A52A2A", "background-color": "white"}).focus();
}

function moveOnSmallMap(heroPosition) {
	var terrType = map.getTerrainTypeAtCharactersPosition();
	var terrainMovementCost = 1 + terrainArray[terrType].extraMovementPts;

	terrainMovementCost = hero.foraging ? terrainMovementCost * 2 : terrainMovementCost;

	if (canMoveOnMap(terrainMovementCost)) {
		updateMovePoints(terrainMovementCost);
		var mapTableDiv = document.getElementById('mapTableDiv');
		setTerrainCellSmallMap(mapTableDiv, map.small.oldPosRowCell, map.small.oldPosColumnCell);
		checkQuestDestinationReached(map);
	} else {
		dontAllowMovement();
		// highlight the fact that you've run out of movement points . . .
      $('#action').html("<p>" +
         "You feel so tired that you cannot move, and need to sleep." +
         "</p>");
		highlightHeroSquare();
	}
}

function processMovement(heroPosition) {
	// see if the hero has moved off the current map into another map square, and
	// also block movement off the playing area
	hero.moved = false;
	gameState.storyEvent = false;

   if (isOffSmallMap(heroPosition)) {
      if (isOffBigMap(heroPosition)) {
         dontAllowMovement();
      } else {
         showNextSmallMap(heroPosition);
      }
   } else {
      moveOnSmallMap(heroPosition);
   }
}

function showFightButts() {
	document.getElementById('fight').style.visibility="visible";
	document.getElementById('fightButts').style.visibility = "visible";
	document.getElementById('runAwayButt').style.visibility = "visible";
	document.getElementById('optButts').style.visibility = "hidden";
	var fightButton = document.getElementById('fightButt');
	fightButton.style.visibility = "visible";
	fightButton.focus();
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
		newGame = window.confirm('Are you sure you would like to quit this game and start a new one?');
	}

	if (newGame === true ) {
		deleteCookie('jando');
		location.reload();
	}
}

function saveGame() {
   var permissionGiven = window.confirm("This will save the game in a cookie, is this OK?");

   if (permissionGiven) {
      saveHeroInfo();
      window.alert('Game Saved');
   }
}

function createBlankMapIfNotPresent(mapTableDiv) {
   var tableExists = mapTableDiv.getElementsByTagName("table")[0];
	if (typeof tableExists === 'undefined') {
	    createTableMap(mapTableDiv);
	}
}

function showTerrainOnBigMap(mapTableDiv) {
	var cellImageTag;
	var terrType;
	var position = {small:{row:null, column:null}, big:{row:null, column:null}};

	for (var row=0; row <map.small.rows; row++) {
		for (var col=0; col <map.small.cols; col++) {
			terrType = bigMapTerrainArray[row][col];
			position.small.row = row;
			position.small.column = col;
			cellImageTag = getCellImageTag(mapTableDiv, position);
			cellImageTag.src = terrainArray[terrType].image.src;
			cellImageTag.title = terrainArray[terrType].name;
		}
	}
}

function showBigMap() {
	var mapTableDiv = document.getElementById('mapTableDiv');

	createBlankMapIfNotPresent(mapTableDiv);
	showTerrainOnBigMap(mapTableDiv);

	// highlight on the big map the square where the hero is . . .
	setBigMapCellColour(mapTableDiv, map.getHeroPosition(), 'yellow');
}

function showBigMapKey(moveArea) {
	moveArea.innerHTML='<h4>Map Key</h4>' +
		'<div>';
	for (var i=0; i <terrainArray.length; i++) {
		moveArea.innerHTML = '<p>' +
			moveArea.innerHTML +
			terrainArray[i].name + '&nbsp;&nbsp;<img src = ' + terrainArray[i].image.src +
			' /></p>';
	}
	moveArea.innerHTML = moveArea.innerHTML + '</div>';
}

function showMap(bigMapShown) {
	var moveArea = document.getElementById('movementArea');
	var questButt = document.getElementById('showQuestButt');

	if (bigMapShown) {
		showSmallMap();
		map.small.drawHero();
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

function addRowClone(tblId, rowNum) {
  var tblBody = document.getElementById(tblId).tBodies[0];
  var newNode = tblBody.rows[rowNum].cloneNode(true);
  tblBody.appendChild(newNode);
}

function createTableMap(mapTable) {
	mapTable.innerHTML =
	'<table id="tableMap">' +
		'<tbody>' +
			'<tr>' +
				'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
				'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
				'<td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>' +
			'</tr>' +
		'</tbody>' +
	'</table>';
	for (i=0; i <map.small.rows - 1; i++) {
		addRowClone('tableMap',i);
	}
}

function lastQuestDestination() {
	return map.big.nextDestination === terrainArray.length - 1;
}

function createQuestString() {
	var destinationInWords = questArray[map.big.nextDestination].destinationImageName.replace(/_/g,' ');
	var characterToFindInWords = questArray[map.big.nextDestination + 1].imageNameOfStartCharacter.replace(/_/g,' ');
	var assembledQuestString = '<div class = "questLog">' +
				  		'<h3>Your Quest</h3>';

	if (lastQuestDestination()) {
		assembledQuestString = assembledQuestString +
		'Go where the eagle told you, to meet your destiny . . .' +
		'<p>' +
		'Go to row ' +
		parseInt(questArray[map.big.nextDestination].bigRow + 1) +
		', column ' +
		parseInt(questArray[map.big.nextDestination].bigCol + 1) +
		' on your map.' +
		'</p>';
	} else {
		assembledQuestString = assembledQuestString +
		'<p>You need to find a ' +
		characterToFindInWords +
		', who lives in a ' +
		destinationInWords +
		' like this:  ' +
		'<img src="./web_images/' + questArray[map.big.nextDestination].destinationImageName + '.png" />' +
		'</p><p>' +
		'You can find the ' +
		destinationInWords +
		' by looking at the big map, and searching all of the squares of type "' +
		terrainArray[map.big.nextDestination].name +
		'", which look like this: <img src = "' +
		terrainArray[map.big.nextDestination].image.src + '"/>' +
		'</p>' +
		'One of these larger squares will have the ' +
		destinationInWords +
		' contained within it.';
	}

	assembledQuestString = assembledQuestString + '</div>';
	return assembledQuestString;
}

function showQuest() {
	document.getElementById('showQuestButt').innerHTML = 'Hide <u>Q</u>uest';
	document.getElementById('movementArea').innerHTML = '&nbsp;';
	document.getElementById('mapTableDiv').innerHTML = createQuestString();

	gameState.questDisplayed = true;
}

function hideQuest(bigMapDisplayed) {
	var mapTableDiv = document.getElementById('mapTableDiv');
	var questButt = document.getElementById('showQuestButt');
	mapTableDiv.removeChild(mapTableDiv.childNodes[0]);
	createTableMap(mapTableDiv);
	questButt.innerHTML = 'Show <u>Q</u>uest';
	bigMapDisplayed = !bigMapDisplayed;
	showMap(bigMapDisplayed);
}

function toggleQuest(questShown, bigMapDisplayed) {
	if (questShown) {
		hideQuest(bigMapDisplayed);
	} else {
		showQuest();
	}
}

function canMoveOnMap(terrainMovementCost) {
	var movePointsToUse = nvl(terrainMovementCost, 0);
	var canMove = false;

	if (hero.movePoints - movePointsToUse >= 0) {
		canMove = true;
	}
	return canMove;
}

function updateMovePoints(terrainMovementCost) {
	var movePointsToUse = nvl(terrainMovementCost, 0);
	document.getElementById('maxHeroMovePoints').innerHTML = hero.maxMovePoints;

	hero.movePoints = hero.movePoints - movePointsToUse;
	document.getElementById('heroMovePoints').innerHTML = hero.movePoints;
	hero.moved = true;
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

function renderHeroStatsBox() {
	var template = $('#statsTemplate').html();
	Mustache.parse(template);   // optional, speeds up future uses
	var statsHtml = Mustache.render(template, {
		heroName: hero.name,
		heroLevel: hero.level,
		heroHealth: hero.health,
		heroAttack: hero.attack,
		heroDefence: hero.defence,
		maxHeroHealth: hero.maxHealth,
		maxHeroAttack: hero.maxAttack,
		maxHeroDefence: hero.maxDefence,
		heroMovePoints: hero.movePoints,
		maxHeroMovePoints: hero.maxMovePoints,
		heroLevelTarget: hero.level * hero.experiencePerLevel,
		heroExp: hero.experience
	});
	$('#statsTemplate_target').html(statsHtml);
}

function updateHeroStats() {
	if (hero.experience >= hero.level * hero.experiencePerLevel) {
		levelUpHero();
	}
	renderHeroStatsBox();
	setupStatsHeroImage();
}

function showMonsterStatsDisplay() {
	var monsterDispEle = document.getElementById('monsterHealthDisplay');
	monsterDispEle.innerHTML = monster.healthPoints;
	monsterDispEle = document.getElementById('monsterAttackDisplay');
	monsterDispEle.innerHTML = monster.attackPoints;
	monsterDispEle = document.getElementById('monsterDefenceDisplay');
	monsterDispEle.innerHTML = monster.defencePoints;
}

function resetFightMonster() {
	// re-set the monster to original position . . .
	var monsterPicDiv = document.getElementById("theMonster");
	monsterPicDiv.style.paddingRight = 0 + "px";
}

function resetFightHero() {
	// retreat the hero . . .
	var heroPicSpan = document.getElementById("theHero");
	heroPicSpan.style.paddingLeft = 0 + "px";
}

function advanceFightHero() {
	var heroPicSpan = document.getElementById("theHero");
	heroPicSpan.style.paddingLeft = 100 + "px";
}

function advanceFightMonster() {
	var monsterPicDiv = document.getElementById("theMonster");
	monsterPicDiv.style.paddingRight = 100 + "px";
}

function animateFightHero() {
	resetFightMonster();
	advanceFightHero();
}

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

	if (heroHit === 0) {
		heroHitDisplay = heroHitDisplay + ' and <strong>miss</strong>';
	} else {
	if (monster.healthPoints <= 0) {
			heroHitDisplay = heroHitDisplay +
			' and do <strong>' + heroHit + '</strong>' +
			' damage, and slay the creature.';
	} else {
			heroHitDisplay = heroHitDisplay + ' and do <strong>' + heroHit + '</strong>' + ' damage';
		}
	}
	return heroHitDisplay;
}

function adjustHeroExperience() {
	if (monster.healthPoints <= 0) {
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
	monster.healthPoints = max(0, monster.healthPoints - heroHit);

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

	// ensure start new game button is visible, and has the focus . . .
	document.getElementById('gameButts').style.visibility = "visible";
	document.getElementById('heroHealth').innerHTML = 0;
	document.getElementById('startNewGame').focus();
}

function calculateMonsterHitDisplay(monsterHit) {
	var monsterHitDisplay = 'The ' + monsterArray[gameState.monsterIdx].name + ' attacks ';

	if (monsterHit === 0) {
		monsterHitDisplay = monsterHitDisplay + ' and <strong>misses</strong>';
	}
	else {
		monsterHitDisplay = monsterHitDisplay + ' and does <strong>' + monsterHit + '</strong>' + ' damage';
	}

	if (hero.health <= 0) {
		monsterHitDisplay = monsterHitDisplay + '.  You have been killed!';
	}
	return monsterHitDisplay;
}

function doMonsterAttack(runningAway) {
	var monsterFightPara = document.getElementById('monsterFightDamage');
	var monsterHit;

	// has the monster done any damage . . . ?
	if (runningAway) {
		monsterHit = Math.floor(getMonsterDiceRoll(monsterArray[gameState.monsterIdx].attackPoints) / 1.5 );
	} else {
		monsterHit = max(0, getMonsterDiceRoll(monsterArray[gameState.monsterIdx].attackPoints) - getHeroDiceRoll(hero.defence));
	}

	hero.health = max(0, hero.health - monsterHit);
	monsterFightPara.innerHTML = calculateMonsterHitDisplay(monsterHit);
	animateFightMonster();

	if (hero.health <= 0) {
		gameState.inProgress = false;
		sayHeroDead();
	}

	hero.turnToFight = true;
}

function clearFightDisplay() {
	var fightEle = document.getElementById('fight');
	var fightPara = document.getElementById('fightDamage');
	var monsterFightPara = document.getElementById('monsterFightDamage');

	fightEle.style.visibility="hidden";
	fightPara.innerHTML = '&nbsp;';
	monsterFightPara.innerHTML = '&nbsp;';
}

function endFight() {
	clearFightDisplay();
	resetFightMonster();
	resetFightHero();
	hideFightButts();
	showOptButts();
	showMovementArea();
	hero.fightOn = 'No';
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
	window.alert('And Jando returned home and lived to be a ripe old age . . . THE END');
	window.alert(' . . . er, still need to work on the ending, sorry!!');
	sayHeroDead(); // the hero isn't, but it hides the buttons
}

function defeatedFinalMonster() {
	return monster.healthPoints <= 0  && gameState.finalFight;
}

function fightMonster() {

	if (hero.turnToFight === true) {
		doHeroAttack();
		if (defeatedFinalMonster()) {
			tellEndStory();
		} else if (monster.healthPoints <= 0) {
			showContJournButt();
		}
	} else if (monster.healthPoints > 0) {
		doMonsterAttack(false); // we're not running away
	}

	updateHeroStats();
	showMonsterStatsDisplay();
}

function runAway() {
	var runningAway = true;

	doMonsterAttack(runningAway);
	updateHeroStats();
	// if you're not dead after trying to run away, show the "continue journey" button
	if (hero.health > 0) {
		showContJournButt();
	}
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
      '<div id="theHero" style="float:left;">' +
		'<img id = "destinationImage" style="float:right; padding-left:15px"/>' +
		questArray[nextDestination].storyTextHtml +
		'</div>';
	return returnHTML;
}

function setDestinationImage(nextDestination) {
	var destImage = document.getElementById('destinationImage');
	destImage.src = './web_images/' + questArray[nextDestination].imageNameOfStartCharacter + '.png';
	destImage.title = 'a curious character';
}

function displayDestination(nextDestination){
	$('#action').html(setDestinationHTML(nextDestination));
	setDestinationImage(nextDestination);
}

function prepareFightDiv() {
	var template = $('#fightTemplate').html();
	Mustache.parse(template);   // optional, speeds up future uses

	var fightDivHtml = Mustache.render(template, {
			heroImageSrc: hero.image.src,
			heroImgTitle: hero.type + ' ' + hero.name,
			monsterName: monsterArray[gameState.monsterIdx].name,
			monsterImageSrc: monsterArray[gameState.monsterIdx].image.src,
			monsterImageTitle: monsterArray[gameState.monsterIdx].name,
			monsterHealth: monsterArray[gameState.monsterIdx].healthPoints,
			monsterAttack: monsterArray[gameState.monsterIdx].attackPoints,
			monsterDefence: monsterArray[gameState.monsterIdx].defencePoints
		});
	$('#action').html(fightDivHtml);
}

function calculateMonsterIndex() {
   // it's minus 2, as we don't want the last monster in the array, as that's special
   var numberOfMonsters = monsterArray.length - 2;
   var monstersPerTerrainType = numberOfMonsters / map.big.numTerrainTypes;
   var terrType = map.getBigTerrainTypeForCharacter();
   var lower = Math.floor(terrType * monstersPerTerrainType);
   var upper = Math.ceil(lower + monstersPerTerrainType);

   var indexWithFraction = lower + (Math.random() * (upper - lower));

   return Math.round(indexWithFraction);
}

function startAttack() {
	gameState.monsterIdx = calculateMonsterIndex();

	if (gameState.finalFight) {
		gameState.monsterIdx = monsterArray.length - 1;
	}
   hero.turnToFight = true;
	monster = Object.create(monsterArray[gameState.monsterIdx]);

	prepareFightDiv();
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
		fadeMovementArea();
		startAttack();
	}
}

function calculateFoundPhrase(forageState) {
	return forageState ? 'You find a ' : 'You stumble upon a ';
}

function processFoundFood(forageState) {
	// display the food found, and add health points . . .
	var foodIdx = Math.floor(Math.random() * foodArray.length);

	$('#action').html(
		'<p>' +
			calculateFoundPhrase(forageState) +
			foodArray[foodIdx].name +
		'</p>' +
		'<img id="foodImage" title="' +
		foodArray[foodIdx].name +
		'" style="float:left;"/>');

	var foodPic = document.getElementById('foodImage');
	foodPic.src = foodArray[foodIdx].image.src;
	foodPic.title = foodArray[foodIdx].name;
	hero.health = Math.min(hero.maxHealth, hero.health + foodArray[foodIdx].extraHealthPoints);
	updateHeroStats();
}

function foodSuccessfullyForaged(forageModifier) {
	return Math.random() > gameSettings.foragingSuccessLevel - forageModifier;
}

function foodStumbledUpon() {
	return Math.random() > gameSettings.foodFindLevel;
}

function checkIfFoodForaged(forageState, terrType) {
	// I can't quite remember how this works, but I think you're more likely to find food in
	// terrain that's harder to pass through . . .
	var forageModifier = terrainArray[terrType].extraMovementPts;
	forageModifier = ((1/map.big.numTerrainTypes) / 2) * forageModifier;

	if (foodSuccessfullyForaged(forageModifier)) {
		processFoundFood(forageState);
	} else {
		$('#action').html('<p>Haven\'t found anything . . .</p>');
	}
}

function checkIfFoodFound(forageState) {
   var terrType = map.getTerrainTypeAtCharactersPosition();
	$('#action').html('&nbsp');

	if (hero.foraging) {
		checkIfFoodForaged(forageState, terrType);
	}
	else if (foodStumbledUpon()) {
		processFoundFood(forageState);
	}
}

function processAttemptedSumAnswer(numberCode) {
	// the digits 0-9 on the top row of the keyboard are unicode values 48 - 57
	// the numeric keypad digits are unicode values 96 - 105
	var digitPressed;

	if (key.isTopRowDigit(numberCode)) {
		digitPressed = numberCode - 48;
	} else {
		digitPressed = numberCode - 96;
	}

	if (sleep.calculation.correctDigitGuessed(digitPressed)) {
		sleep.calculation.answerText = sleep.calculation.answerText === '?' ? digitPressed : sleep.calculation.answerText + digitPressed.toString();
		sleep.calculation.updateDigitToGuess();
      renderSleepingState();

		if (sleep.calculation.gotItAllCorrect()) {
			clearInterval(gameState.sumsIntervalId);
			sleep.calculation.resultText = "Got it right!";
			sleep.correctAnswers++;
         renderSleepingState();
         waitABitThenKeepSleeping();
		}
	} else {
		sleep.calculation.answerText = sleep.calculation.answerText === '?' ? digitPressed : sleep.calculation.answerText + digitPressed.toString();
		//oh dear, got it wrong . . .
		clearInterval(gameState.sumsIntervalId);
		sleep.calculation.resultText = "Wrong! Ha ha!";
      renderSleepingState();
      waitABitThenKeepSleeping();
	}
}

function wipeSumAndKeepOnSleeping() {
   sleep.calculation.wipeText();
   renderSleepingState();
	// sleep some more . . .
	keepOnSleeping();
}

function waitABitThenKeepSleeping() {
   hero.doingSums = false;
	setTimeout(wipeSumAndKeepOnSleeping, 1500);
}

function processSums() {
	gameState.timeForSums--;

	if (gameState.timeForSums > 0) {
      sleep.calculation.timeToAnswerText = "Time to answer: " + gameState.timeForSums;
	} else {
		clearInterval(gameState.sumsIntervalId);
		hero.doingSums = false;
		sleep.calculation.timeToAnswerText = "Too slow!";
		waitABitThenKeepSleeping();
	}
   renderSleepingState();
}

function sleepAtNight() {
   sleep.calculation.wipeText();

	if (Math.random() > hero.badDreamThreshold) {
		// we need the following as otherwise some other element may have focus, and we won't get keystrokes
		document.activeElement.blur();

		clearInterval(gameState.sleepIntervalId); // stop the "hourly" nightime clock
		hero.doingSums = true;
		sleep.questionsAsked++;

		sleep.calculation.create();
		sleep.calculation.text = sleep.calculation.createQuestionText();
      sleep.calculation.answerText = "?";
		gameState.timeForSums = sleep.calculation.timeAllowed;
		sleep.calculation.timeToAnswerText = "Time to answer: " + gameState.timeForSums;

		gameState.sumsIntervalId = setInterval(processSums, 1000);
	}

	sleep.narrativeText = sleep.narrativeText + ' .';
	hero.hoursSlept++;
   renderSleepingState();
}

function renderSleepingState() {
   var template = $('#sleepTemplate').html();
   Mustache.parse(template);   // optional, speeds up future uses
   var sleepHtml = Mustache.render(template, {
      narrativeText: sleep.narrativeText,
      timeToAnswerText: sleep.calculation.timeToAnswerText,
      calculationText: sleep.calculation.text,
      answerText: sleep.calculation.answerText,
      resultText: sleep.calculation.resultText,
      heroImageSrc: hero.sleepImage.src,
      heroImgTitle: hero.sleepImage.title
   });
   $('#action').html(sleepHtml);
   document.getElementById("sleepDiv").className = "sleep";
}

function awakeFromSlumber() {
	var extraHealth;

	clearInterval(gameState.sleepIntervalId);
	sleep.narrativeText = sleep.narrativeText + ' . . . you finally awake.';

   if (sleep.questionsAsked > 0) {
      // this can equate to zero if there's been no correct answers . . .
      extraHealth = Math.round(hero.maxHealthGainedBySleep * (sleep.correctAnswers / sleep.questionsAsked));
      // we'll want the words to change depending on how well or bad you did, but for now . . .
      sleep.narrativeText = sleep.narrativeText + ' You answered ' +
          sleep.correctAnswers + ' correctly, out of ' +
          sleep.questionsAsked + '. You gain ' +
      	 extraHealth + ' extra health as a result.';
   } else {
      // no questions have been asked, so give the minumum health boost . . .
         extraHealth = hero.minHealthGainedBySleep;
   }

	sleep.calculation.wipeText();
   renderSleepingState();

	hero.asleep = false;
	enableOptionButtons(true);

	hero.movePoints = hero.maxMovePoints;
	hero.health = Math.min(hero.maxHealth, hero.health + extraHealth);
	updateHeroStats();
	showMovementArea();
}

function stillAsleep() {
	return hero.hoursSlept < gameSettings.hoursInNight;
}

function processSleepState() {
	if (stillAsleep()) {
		sleepAtNight();
	} else {
		awakeFromSlumber();
	}
}

function keepOnSleeping() {
	hero.doingSums = false;
   gameState.sleepIntervalId = setInterval(processSleepState, 1000);
}

function sleepHero() {
	enableOptionButtons(false);
	fadeMovementArea();

	sleep.narrativeText = "You sleep, perchance to dream . . .";
   sleep.calculation.wipeText();
   renderSleepingState();

	hero.asleep = true;
	hero.hoursSlept = 0;
	sleep.questionsAsked = 0;
	sleep.correctAnswers = 0;
	keepOnSleeping();
}

function toggleForageStatus(butt) {
	if (hero.foraging) {
		hero.foraging = false;
		butt.innerHTML = 'F<u>o</u>rage'	;
	} else {
		hero.foraging = true;
		butt.innerHTML = 'Stop f<u>o</u>raging';
	}
}

function enableOptionButtons(state) {
	var optionButtons = document.getElementById('optButts').getElementsByTagName('button');
	for (var i = 0; i < optionButtons.length; i++) {
   	optionButtons[i].disabled = !state;
	}
}

function determineDirection(uniCode) {
	var heroPosition = map.getHeroPosition();

	switch (uniCode) {
		case key.left:
			heroPosition.small.column --;
			break;
		case key.up:
			heroPosition.small.row --;
			break;
		case key.right:
			heroPosition.small.column ++;
			break;
		case key.down:
			heroPosition.small.row ++;
			break;
		default:
			// shouldn't get here, so do nothing
			break;
	}

	map.setHeroPosition(heroPosition);
}

function arrowImageMouseOver(arrowImage) {
	var arrowDirection = arrowImage.title	;

	// if not currently highlighted
	if (arrowImage.src.search('over') === -1) {
		// swap for highlighted arrow img . . .
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big_over.png';
	}	else {
		// replace with ordinary image
		arrowImage.src = './web_images/arrow_' + arrowDirection + '_big.png';
	}
}

function showPlayingArea() {
	document.getElementById('chooseHero').className = 'gone';
	document.getElementById('characterInfo').className = 'gone';
	document.getElementById('mapAndMove').className = 'mapAndMove';
	document.getElementById('buttons').className = 'buttons';
	document.getElementById('playGameButtonDiv').className = 'gone';
	document.getElementById('action').style.visibility = 'visible';
	map.movementAreaHtml = document.getElementById('mapAndMove').innerHTML;
}

function characterIsNamed() {
   var theEnteredCharacterName = document.getElementById('textHeroName').value;
   theEnteredCharacterName = theEnteredCharacterName.trim();

   if (theEnteredCharacterName.length > 0) {
      return true;
   } else {
      return false;
   }
}

function startPlayingGame() {
   showPlayingArea();
   gameState.inStartMode = false;
   startGame();
}

function playGame() {
   if (jandoCookieExists()) {
         startPlayingGame();
   } else if (characterIsNamed()) {
   	setChosenHero();
   	startPlayingGame();
   } else {
      document.getElementById('textHeroName').value = "Jando";
   }
}

function setChosenHero(theImage) {
	var imageSelected = document.getElementById('statsHeroImageInfo');
   var theEnteredCharacterName = document.getElementById('textHeroName').value;
   theEnteredCharacterName = theEnteredCharacterName.trim();

	if (typeof theImage === 'undefined') {
		hero.image = imageSelected;
		hero.type = imageSelected.title;
		hero.name = theEnteredCharacterName;
	} else {
		imageSelected.src = theImage.src;
		imageSelected.title = theImage.title;
		hero.image = theImage;
		hero.type = theImage.title;
		hero.name = theEnteredCharacterName;
	}

	var heroNameInputBox = document.getElementById('textHeroName');
	heroNameInputBox.value = hero.name;

	heroNameInputBox.focus();
	heroNameInputBox.select();
}

function checkForSavedState(theImage) {
   if (jandoCookieExists()) {
      // just go straight to playing the game, no need to select character
      playGame();
   } else {
      setChosenHero(theImage);
   }
}

// this is called from the html . . .
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

function heroMovementAttempted(actionCode) {
	return key.isArrowKey(actionCode) && !map.big.displayed && !gameState.questDisplayed;
}

function checkForMovement(actionCode) {
	if (heroMovementAttempted(actionCode)) {
		determineDirection(actionCode);
		processMovement(map.getHeroPosition());
		map.small.drawHero();

		if (hero.moved && !gameState.storyEvent) {
			checkForAttack();
			if (hero.fightOn === 'No' ) {
				checkIfFoodFound(hero.foraging);
			}
		}
	}
}

function checkNonMovementActions(actionCode) {
	if (actionCode === key.map && !gameState.questDisplayed) {
		showMap(map.big.displayed);
	}

	if (actionCode === key.questLog && !map.big.displayed) {
		toggleQuest(gameState.questDisplayed, map.big.displayed);
	}

	if (actionCode === key.sleep) {
		sleepHero();
	}

	if (actionCode === key.forage) {
		toggleForageStatus(document.getElementById('forageButt'));
	}
}

function checkForFightOrRun(actionCode) {
	if (actionCode === key.fight) {
		fightMonster();
	}

	if (actionCode === key.runAway) {
		runAway();
	}
}

function processAction(actionCode) {
	if ((hero.fightOn === 'No') && !hero.asleep) {
		checkForMovement(actionCode);
		checkNonMovementActions(actionCode);
	}

	if (hero.fightOn === 'Yes' && hero.health > 0) {
		checkForFightOrRun(actionCode);
	}

	if (hero.fightOn === 'JustEnded' && actionCode === key.continueJourney) {
		continueJourney();
	}
}

function pressedAKey(e) {
	var unicode = e.keyCode? e.keyCode : e.charCode;
	/* if (e.altKey || e.ctrlKey || e.shiftKey) {
 		 alert("you pressed one of the 'Alt', 'Ctrl', or 'Shift' keys");
	 } */

   if (!gameState.inStartMode && !hero.asleep) {
		processAction(unicode);
	}

	if (gameState.inStartMode && unicode === key.enter) {
		playGame();
	}

	if (hero.doingSums && key.isDigit(unicode)) {
		processAttemptedSumAnswer(unicode);
	}
}

function loadInitialInfo() {
	loadTerrain();
	loadMonsters();
	loadHeroInfo();
	loadFood();
   setHeroNameInTitleBar();
}

function createMapsAndShowSmallMap() {
	createBigMap();
	createSmallMapTerrain();
	showSmallMap();
   map.small.drawHero();
}

function showInitialQuest() {
	displayDestination(map.big.nextDestination);
	document.getElementById('mapTableDiv').focus();
}

function showStartOfGame() {
   if (!jandoCookieExists()) {
      showInitialQuest();
   }
	enableOptionButtons(true);
}

function startGame() {
	loadInitialInfo();
	createMapsAndShowSmallMap();
	updateHeroStats();
	updateMovePoints();
	showStartOfGame();
}
