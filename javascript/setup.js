function setUpGame() {
      console.log("Function : setup");

      // arg, globals, eek!
      // global.start_game = start_game;
      // global.loadMonsterInfo = loadMonsterInfo;
      // global.loadHeroInfo = loadHeroInfo;
      // global.monsterArray = monsterArray;
      // global.loadHeroInfo = loadHeroInfo;
      global.setUpGame = setUpGame;
      global.monsterArray = monsterArray;

      // do some initial game set up

      // game_state object
      var game_state = {
        gameInProgress : null,
        foraging : false,       // are you foraging at the moment?
        fightOn : 'No',	        // indicates if a fight with a monster is ongoing
        asleep : 'No',		    // indicates if you're sleeping
        attackRisk : 0.91	    // if the random number is higher than this (plus or minus modifiers), then you'll be attacked!
      };

      //map object
      var map = {
        // small map, i.e. the one your hero character moves around on
        small : {
          rows : 8,
          cols : 10, // size of the map you move around in
          posRowCell : null,
          posColumnCell : null	// map-cordinates of the hero
        },
        // big map, i.e the overview of the whole area
        big : {
          rows : 8,
          cols : 10, // size of the overall big scale map
          posRowCell : null,
          posColumnCell : null,	// big map-cordinates of the hero
          terrainAttributes : 6,	// number of attributes of the particular terrain
          numTerrainTypes : 6,    // how many different terrain types there are
          displayed : false,      // indicates if the big map is being displayed
          nextDestination : 0		// holds the next destination level,
          // corresponds to terrain type, i.e. starts at zero,which = light grass
        }
      };
      global.map = map;


      // big map
      var terrainAttributes = 6;	// number of attributes of the particular terrain
      var numTerrainTypes = 6;	// how many different terrain types there are

      var nextDestination = 0;		// holds the next destination level,
      // corresponds to terrain type, i.e. starts at zero,which = light grass

      var heroMoved;
      var storyEvent = 'No';	        // is a story event happening?
      global.questDisplayed = false;    // are we currently showing the current quest objective?
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

      var bigMapArray=new Array(map.big.rows);
      for (i=0; i <map.big.rows; i++)
      bigMapArray[i]=new Array(map.big.cols); // Used to hold terrain types on larger map

      var mapDetailArray=new Array(map.small.rows);
      for (i=0; i <map.small.rows; i++)
      mapDetailArray[i]=new Array(map.small.cols); 	// set up mapDetailArray with rows & cols.
      // Used to hold details of map features, for small map

      var terrainArray=new Array(numTerrainTypes);
      for (i=0; i <numTerrainTypes; i++)
      terrainArray[i]=new Array(terrainAttributes); 	// set up terrainArray
      // Used to hold details of terrain

      // used to pre-load terrain images . . .
      var terrainImageArray=new Array(numTerrainTypes);
      for (i=0; i <numTerrainTypes; i++)
      terrainImageArray[i]=new Image(); // set up terrain array

      var terrainLocArray=new Array(numTerrainTypes);
      for (i=0; i <numTerrainTypes; i++)
      terrainLocArray[i]=''; 	// set up terrainLocArray
      // Used to hold row/col locations on big map, indexed by terrain type

      var terrainDestinationArray=new Array(numTerrainTypes + 1);	 // last destination is random location for treasure
      for (i=0; i <numTerrainTypes + 1; i++)
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

      // hero
      var hero = {
        name: "bozo",
        image: new Image(),
        type: "man",
        turn: true,
        movePoints: 0,

        // attributes connected with fighting . . .
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

      // hero stats
      var maxMovePoints;

      var oldposRowCell;
      var oldPosColumnCell;
      var bigOldposRowCell;
      var bigOldPosColumnCell;

      // monster stats
      var monsterHealth;
      var monsterAttack;
      var monsterDefence;
      var numMonsterDiceRolls = 3;

      /*
      *** end of global variables
      */

      // cookie and trim stuff thanks to Patrick Hunlock: http://www.hunlock.com/blogs/Ten_Javascript_Tools_Everyone_Should_Have

      function setCookie(name,value,expires, options) {
        if (options===undefined) { options = {}; }
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
        if ( start == -1 ) return null;
        var end = document.cookie.indexOf( ';', len );
        if ( end == -1 ) end = document.cookie.length;
        return unescape( document.cookie.substring( len, end ) );
      }

      function deleteCookie( name, path, domain ) {
        if ( getCookie( name ) ) document.cookie = name + '=' +
        ( ( path ) ? ';path=' + path : '') +
        ( ( domain ) ? ';domain=' + domain : '' ) +
        ';expires=Thu, 01-Jan-1970 00:00:01 GMT';
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

      function setTerrainImageSource() {
        // pre-load the images into an array . . .
        for (i=0; i <numTerrainTypes; i++) {
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

};
