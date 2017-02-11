function getFoodData() {
	/*
		Food Attributes:
		1	Name of food (word or phrase always starts with a consonant)
		2	Image name (if that cannot be derived from the name above)
		3	Health points gained from eating this food
	*/
	var data = {
		items:
		[
			{name: 'squashy fig', imageName: 'fig', extraHealthPoints: 3},
			{name: 'loaf of bread', imageName: 'bread_1', extraHealthPoints: 1},
			{name: 'croissant', extraHealthPoints:  2},
			{name: 'brown egg', extraHealthPoints: 3},
			{name: 'cucumber',  extraHealthPoints: 1},
			{name: 'glass of beer',  extraHealthPoints: 2},
			{name: 'strawberry', extraHealthPoints: 2},
			{name: 'husk of sweetcorn', imageName: 'sweetcorn', extraHealthPoints: 3},
			{name: 'watermelon', extraHealthPoints: 3},
			{name: 'ripe acorn', imageName: 'acorn', extraHealthPoints: 1},
			{name: 'shiny aubergine', imageName: 'aubergine', extraHealthPoints: 3},
			{name: 'half avacado', imageName: 'avacado', extraHealthPoints: 3},
			{name: 'black olive', extraHealthPoints: 1},
			{name: 'bunch of blueberries', imageName: 'blueberries', extraHealthPoints: 2},
			{name: 'loaf of tasty bread', imageName: 'bread_2', extraHealthPoints: 5},
			{name: 'yam',  extraHealthPoints: 4},
			{name: 'couple of buns', imageName: 'buns', extraHealthPoints: 4},
			{name: 'cabbage', extraHealthPoints: 3},
			{name: 'carrot',  extraHealthPoints: 3},
			{name: 'stick of celery', imageName: 'celery', extraHealthPoints: 1},
			{name: 'smelly wheel of cheese', imageName: 'cheese_1', extraHealthPoints: 5},
			{name: 'wheel of cheese', imageName: 'cheese_2', extraHealthPoints: 5},
			{name: 'small bunch of cherries', imageName: 'cherries', extraHealthPoints: 2},
			{name: 'courgette', extraHealthPoints: 3},
			{name: 'couple of pale eggs', imageName: 'eggs', extraHealthPoints: 5},
			{name: 'clove of garlic', imageName: 'garlic', extraHealthPoints: 3},
			{name: 'bunch of grapes', imageName: 'grapes', extraHealthPoints: 4},
			{name: 'green chilli', extraHealthPoints: 2},
			{name: 'green olive', extraHealthPoints: 2},
			{name: 'green pepper', extraHealthPoints: 3},
			{name: 'fresh orange pepper', imageName: 'orange_pepper', extraHealthPoints: 3},
			{name: 'nice orange', imageName: 'orange', extraHealthPoints: 4},
			{name: 'pak choi leaf', imageName: 'pak_choi', extraHealthPoints: 1},
			{name: 'pear', extraHealthPoints: 3},
			{name: 'load of peas in their pod', imageName: 'peas_in_pod', extraHealthPoints: 3},
			{name: 'few peas in the pod', imageName: 'peas_in_pod2', extraHealthPoints: 2},
			{name: 'plum', extraHealthPoints: 3},
			{name: 'potato',  extraHealthPoints: 2},
			{name: 'red chilli', extraHealthPoints: 2},
			{name: 'yellow pepper', extraHealthPoints: 2},
			{name: 'red pepper', extraHealthPoints: 3},
			{name: 'tomato', extraHealthPoints: 2},
			{name: 'veggie sausage', extraHealthPoints: 5}
		]
	};
	return data;
}

function getNightImageData() {
      var data = {
         items:
         [
            {name: 'night_1'},
            {name: 'night_2'},
            {name: 'night_3'},
            {name: 'night_4'},
            {name: 'night_5'},
            {name: 'night_6'},
            {name: 'night_7'},
            {name: 'night_8'},
         ]
      };
      return data;
}

function getMonsterData() {
	// we can infer image name from name, making lowercase and converting spaces to underscores
	var data = {
		items:
		[
         // roughly try to order them in terms of easiest to hardesst . . .
         {name: 'Drop', healthPoints: 9, attackPoints: 5, defencePoints: 3},
         {name: 'Squirm', healthPoints: 9, attackPoints: 5, defencePoints: 4},
         {name: 'Strawberry', healthPoints: 7, attackPoints: 6, defencePoints: 3},
         {name: 'Scream', healthPoints: 7, attackPoints: 7, defencePoints: 6},
         {name: 'Snail', healthPoints: 8, attackPoints: 7, defencePoints: 6},

         {name: 'Warrior Ant', healthPoints: 10, attackPoints: 5, defencePoints: 7},
         {name: 'Ground Fish', healthPoints: 11, attackPoints: 7, defencePoints: 3},
			{name: 'Turtle Rider', healthPoints: 12, attackPoints: 7, defencePoints: 4},
         {name: 'Bloat', healthPoints: 12, attackPoints: 8, defencePoints: 14},

			{name: 'Horned Devil', healthPoints: 13, attackPoints: 8, defencePoints: 5},
			{name: 'Bleh', healthPoints: 16, attackPoints: 9, defencePoints: 5},
         {name: 'Leecho', healthPoints: 21, attackPoints: 5, defencePoints: 16},
			{name: 'Star Man', healthPoints: 6, attackPoints: 11, defencePoints: 5},

         {name: 'Ninja', healthPoints: 8, attackPoints: 11, defencePoints: 7},
			{name: 'Flame Spirit', healthPoints: 16, attackPoints: 10, defencePoints: 9},
			{name: 'Assassin', healthPoints: 14, attackPoints: 12, defencePoints: 6},
			{name: 'Lightning Fish', healthPoints: 15, attackPoints: 13, defencePoints: 7},

         {name: 'Crazed King', healthPoints: 18, attackPoints: 12, defencePoints: 16},
			{name: 'Leosaur', healthPoints: 19, attackPoints: 16, defencePoints: 11},

				// The final big boss-battle monster! . . . needs to be the last entry in this array
			{name: 'Hideously evil GREEN SKULL', imageName: 'green_skull', healthPoints: 32, attackPoints: 18, defencePoints: 14}
		]
	};
	return data;
}

function getTerrainData() {
/*
	Terrain Attributes:
	1	name: appears in the Quest Log
	3	densityFactor: relates to how many will appear on the small map
	4	extraMovementPts: additional movement points needed to traverse this terrain
*/
	var data = {
		items:
		[
			{name: 'light grass', densityFactor: 0, extraMovementPts: 0},
			{name: 'low scrub', densityFactor: 0.1, extraMovementPts: 1},
			{name: 'woods', densityFactor: 0.15, extraMovementPts: 2},
			{name: 'forest', densityFactor: 0.3, extraMovementPts: 2},
			{name: 'hills', densityFactor: 0.35, extraMovementPts: 3},
			{name: 'mountains', densityFactor: 0.4, extraMovementPts: 4}
		]
	};
	return data;
}

function getQuestData() {
	var questData = {
		quest:
		[
			{	imageNameOfStartCharacter: 'blackbird',
				storyTextHtml: '<p>' +
					'You find yourself in a wide, open land with long grasses. ' +
					' You see a crow perched on a branch, swaying slightly in the wind.' +
					'  It starts to bob it\'s head, it\'s croaks and caws almost resembling speech in a foreign tongue . . .' +
					'</p>' +
					'<p>' +
					'Quite strange, that look in it\'s eye, as if it was trying to communicate.  Really rather odd.' +
					' You suddenly realise that it <strong>is</strong> saying something.  You listen harder.' +
					'  It\'s hard to tell, but it almost sounds like, "Go to grasshopper, blue tent, light grass . . ." ' +
					'</p>',
				destinationImageName: 'blue_tent'
			},
			{	imageNameOfStartCharacter: 'grasshopper',
				storyTextHtml: '<p>' +
					'You see a huge grasshopper seated on a throne made of woven grasses.  Incredibly, it starts to speak:' +
					'</p>' +
					'<p>' +
					'"Ah, do come in, my dear fellow, I\'ve been expecting you.  My friend the crow said you may pay me a visit.' +
					'Please don\'t be alarmed, I may be as big as a good-sized goat and live in a blue tent, but I will not harm you.' +
					'Would you mind closing the tent flap . . . ?  Thank you, there\'s a bit of a chill breeze from the east today."' +
					'</p>' +
					'<p>' +
					'"So, you seek a path through the hills, do you?  All in good time, but first you must traverse the woods, and a body can lose their way there. ' +
					'I don\'t know the way myself, as it is dangerous even for a giant grasshopper. ' +
					'There is a meditating skelton that lives on a watchtower somewhere in the scrub that can help you.' +
					' I don\'t know his exact wherabouts, I\'m afraid, but I\'ll tell my blackbird friends to let him know that you\'re coming."' +
					'</p>',
				destinationImageName: 'watchtower'
			},
			{	imageNameOfStartCharacter: 'meditating_skeleton',
				storyTextHtml: '<p>' +
					'As you reach the top of the watchtower, a skeleton looks up: "Greetings my friend! You look tired from your journey.  Stay here and rest, I\'ve just finished my meditation for the day.' +
					'</p>' +
					'<p>' +
					'The way through the hills is through the dark forests, but first you must find the black bear of the woods.' +
					' He doesn\'t like visitors especially, so be sure to be polite if you do see him.  A present of honey wouldn\'t do any harm either.' +
					' In fact, I\'ve got some here, take it along with my regards.' +
					'</p>' +
					'<p>' +
					'Where in the woods?  I\'m not too sure about that, all I know is that he lives in a cave somewhere, I think he moves around according to the seasons.' +
					'</p>' +
					'<p>' +
					'Stay here as long as you like, this watchtower gives you a bit of perspective on life.  Help yourself to herbal tea."' +
					'</p>',
				destinationImageName: 'cave'
			},
			{	imageNameOfStartCharacter: 'bear',
				storyTextHtml: '<p>' +
					'You cautiously enter cave.  You think you here a rustling sound from somewhere in the darkness at the back.' +
					' You decide to unwrap the honeycomb the skeleton gave you, and throw it forward.' +
					'</p>' +
					'<p>' +
					'A deep voice rumbles, "Who are you, and why are you throwing this excellent honey around in my cave?  Speak, before I rip you to pieces!"' +
					'</p>' +
					'<p>' +
					'Trembling, you politely explain why you are here, and that you seek a way through the hills.  The bear looks at you suspiciously, then sniffs the honey and sighs deeply.' +
					' "As you have brought such fine honey from my friend the skeleton, I will tell you.  Seek out my friend the boar who dwells in a tower in the forest.' +
					'</p>' +
					'<p>' +
					'Now, if that\'s all, I have some honey to eat."' +
					'</p>',
				destinationImageName: 'tower'
			},
			{	imageNameOfStartCharacter: 'boar',
				storyTextHtml: '<p>' +
					'"Hello!  I thought I heard someone knock on the tower door.  Sorry I took a while to answer, I was just upstairs finishing off an oil painting".' +
					' By now, this sort of thing doesn\'t come as a surprise.  You explain that you seek a path through the mountains to find the lost black magic feather of your people.' +
					'</p>' +
					'<p>' +
					'"Hmm".  The boar ruminates, whilst washing his brushes under the tap. "You do know that\'s guarded, don\'t you?"  By a truly evil floating green skull?"' +
					' However, I see you are set on this foolishness.  Well, so be it.  I only know the feather is somewhere in the mountains."' +
					'</p>' +
					'<p>' +
					'The boar appears to decide something, and says, "But if you\'re going anyway, make sure you speak to the old eagle,' +
					'he normally roosts in a tree near the round castle tower".  Now, a spot of lunch?  I have some wonderful yellow courgettes".' +
					'  After eating, you thank the boar for the repast, and set off for the hills . . .' +
					'</p>',
				destinationImageName: 'round_castle_tower'
			},
			{	imageNameOfStartCharacter: 'eagle',
				storyTextHtml: '<p>' +
					'You find the tree near the tower, and look up to see the eagle staring right at you with it\'s beady eye.  It looks unimpressed.' +
					'"What do you want around here?  Keep away, unless you want the green skull to scare you so much you\'ll run off a cliff edge in fright".' +
					'</p>' +
					'<p>' +
					'You explain that you\'re searching for the magic black feather, and will have it or die in the attempt.  Seeing that you\'re serious the old bird says, ' +
					'"Very well.  I have asked my friend the beetle, (who has been riding in your backpack), to mark it in your quest log. ' +
					'Once there, you will find the green skull, and the  black feather.  Good luck, but I fear I will not see you again!"' +
					'</p>' +
					'<p>' +
					' And with that, the eagle flaps off the branch, and soars into the sky . . .' +
					'</p>',
				destinationImageName: 'black_feather'
			},
			{	imageNameOfStartCharacter: 'green_skull',
				storyTextHtml: '<p></p>',
				destinationImageName: 'black_feather'
			},
		]
	};

	return questData;
}
