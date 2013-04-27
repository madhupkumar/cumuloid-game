/* **  TODO Animation. TODO: Package and sell: site-host, Phonegap for MobileApp  ** */


var cumuloidCardAppModule = angular.module('cumuloidCard',[]);


/* Uno Card Game and GameController*/ 

function GameController($scope, $timeout) {
	
	$scope.debug = false;
	$scope.tournament = {gameCount: 0};
	
	$scope.gameRuleMap = { isTrickBasedGame: false, 
			hasBidding: false, 
			hasPoints: true, 
			cardPointMap: { TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10, JACK: 5, KING: 5, QUEEN: 5, ACE: 1},
			specialCardMap: { suitSwitcher: 'JACK',   attacker: 'SEVEN', blocker: 'ACE', bonusWinner: 'JACK'},
			initialNumberOfCardsPerPlayer: 7
		};
	
	$scope.gamePlayers = [ new CardPlayer("S"), new CardPlayer("W"), new CardPlayer("N"), new CardPlayer("E")];
	$scope.gameViewProperties = { arrowTowardsPrevPlayer: { 1: '&darr;', 2: '&larr;', 3: '&uarr;', 0: '&rarr;' } };
	
	$scope.gamePlayers[0].isHuman = true;
			
	$scope.cardGame = new CardGame( $scope.gameRuleMap , $scope.gamePlayers);
	$scope.gameRound = {roundNumber: 0, playerIndex: 0, switchedSuit: null, canSwitchSuit: false, awaitingInput: false,
						blockerCardThrown: false, attackerCardThrown: false, nCardsToDraw : 0};
	
	// Styling TODO move to CSS
	$scope.gameAreaBkg = "../images/bkg_" + (1 + Math.floor( Math.random() * 14) ) + ".jpg"; 
	
	
	$scope.newGame = function(){
		// Divide the gameCount by number of available images and use the remainder
		$scope.gameAreaBkg = "../images/bkg_" + (1+($scope.tournament.gameCount % 15)) + ".jpg"; 
		
		if($scope.gameRuleMap.hasPoints){
			for(var i=0;i<$scope.gamePlayers.length;i++){
				$scope.gamePlayers[i].handPoints = 0;
				$scope.gamePlayers[i].handCards = [];
			}
		}
		$scope.cardGame = new CardGame( $scope.gameRuleMap , $scope.gamePlayers);
		$scope.gameRound = {roundNumber: 0, switchedSuit: null, canSwitchSuit: false, awaitingInput: false, nCardsToDraw : 0 };
		$scope.gameRound.playerIndex = $scope.tournament.gameCount % $scope.gamePlayers.length;
		
		$scope.handleGameEvent({name: 'deal'});
		if($scope.gamePlayers[$scope.gameRound.playerIndex].isHuman){
			$scope.gameRound.awaitingInput = true;
			$scope.highlightThrowableCards($scope.gamePlayers[$scope.gameRound.playerIndex]);
		}else{
			$scope.dehighlightCards($scope.gamePlayers[0]);
			$timeout ( $scope.computerPlay , 1000, true);
		}
	}
	
	$scope.refreshPlayerHandPoints = function(){
		if($scope.gameRuleMap.hasPoints){
			for(var i=0;i<$scope.gamePlayers.length;i++){
				$scope.gamePlayers[i].computeHandPoints($scope.gameRuleMap.cardPointMap);
			}
		}
	}
	
	$scope.handleGameEvent = function(gameEvent){
		
		if(gameEvent.name == 'deal'){
			if(!$scope.cardGame.gameRuleMap.hasBidding){
				$scope.cardGame.dealCardsToPlayers();
				$scope.refreshPlayerHandPoints();
			}
			if(!$scope.cardGame.isTrickBasedGame){
				var initialBasketCard = $scope.cardGame.deckOfCards.pop();
				initialBasketCard.styleClassPos = 'cardPosC';
				$scope.cardGame.basketOfCards.push(initialBasketCard);
			}
			$scope.tournament.gameCount++;	
			if($scope.tournament.gameCount === 1){
				// The very first game
				$scope.gameRound.awaitingInput = true;
				$scope.highlightThrowableCards($scope.gamePlayers[0]);
			}
			$scope.cardGame.gameStatus = 'gameOn';
			$scope.gameRound.roundNumber = 1;
		}
		else if(gameEvent.name == 'subDeckEmpty'){
			$scope.cardGame.deckOfCards = $scope.cardGame.basketOfCards.slice(0, $scope.cardGame.basketOfCards.length-1);
			$scope.cardGame.basketOfCards.splice(0, $scope.cardGame.basketOfCards.length-1);
			$scope.cardGame.cardDeckDefn.shuffleDeck($scope.cardGame.deckOfCards);
			for(var i=0; i<$scope.cardGame.deckOfCards.length; i++){
				$scope.cardGame.deckOfCards[i].styleClassPos = null;
			}
		}
		else if(gameEvent.name == 'computerPlay'){
			$timeout ( $scope.computerPlay , 1000, true);
		}
	}
	
	/* Handler for player's actions i.e. players raise game events. */
	$scope.raiseGameEvent = function(gameEvent){
		
		if(! gameEvent.player ){
			gameEvent.player = $scope.gamePlayers[0];
		}
	
		if(gameEvent.name == 'throw'){
			var thrownCard = gameEvent.card;
			if(! $scope.canThrowCard(thrownCard)){
				// Show bounce animation
				return;
			}
			
			// Play throw animation
			if(gameEvent.player === $scope.gamePlayers[0]){
				
			}
		
			var handCards = gameEvent.player.handCards;
			// TODO Move to player.returnCard or throwCard
			handCards.splice(handCards.indexOf(thrownCard), 1);
			$scope.refreshPlayerHandPoints();
			
			// Basket Card overlay positioning
			var playerIndex = $scope.gamePlayers.indexOf(gameEvent.player);
			//var centerPos = {top: 60, left: 100, offset: 35};
			if(playerIndex == 0 ) thrownCard.styleClassPos =  'cardPosS' ; 
			else if(playerIndex == 1 ) thrownCard.styleClassPos =  'cardPosW' ;
			else if(playerIndex == 2 ) thrownCard.styleClassPos =  'cardPosN' ;
			else if(playerIndex == 3 ) thrownCard.styleClassPos =  'cardPosE' ;
			
			$scope.cardGame.basketOfCards.push(thrownCard);
			
			if(handCards.length != 0){
				if(thrownCard.cardValue.name == $scope.gameRuleMap.specialCardMap.suitSwitcher){
					$scope.gameRound.canSwitchSuit = true;
					// Player must pick a suit. Mark all handCards as not throwable.
					for(var i=0;i<handCards.length;i++){ handCards[i].bgcolor = 'white';}
				}else if($scope.gameRound.switchedSuit != null){
					$scope.gameRound.switchedSuit = null;
				}
			}
			else{
				/*  No handCards: this  game has been won by the current player  */	
			
				$scope.cardGame.gameStatus = 'gameWon';
				$scope.gameRound.switchedSuit = null;
				$scope.refreshPlayerHandPoints();
				for(var i=0;i<$scope.gamePlayers.length;i++){
					var player = $scope.gamePlayers[i];
					if((player !== gameEvent.player) && (thrownCard.cardValue.name == $scope.gameRuleMap.specialCardMap.bonusWinner)){
						player.handPoints = 2 * player.handPoints;
					}
					player.totalPoints += player.handPoints;
					for(var j=0;j<player.handCards.length;j++){ player.handCards[j].bgcolor = 'white';}
				}
			}
		}
		else if(gameEvent.name == 'draw'){
			// Draw from subdeck, after replinishing the basket if deck goes empty
			$scope.gameRound.awaitingDraw = true;
			$timeout ( $scope.turnAwaitingDrawOff , 600, true);
			
			if($scope.cardGame.deckOfCards.length <= $scope.gameRound.nCardsToDraw){
				//Deck finished. Reshuffle basket and return to deck.
				$scope.handleGameEvent({name: 'subDeckEmpty'});
				if($scope.cardGame.deckOfCards.length == 0){
					// TODO More Graceful display
					$scope.gamePlayers[0].name = ('1, No Cards left to draw. Game is Drawn.');
					return;
				}
			}
			if($scope.gameRound.attackerCardThrown){
				// Drawing cards to duck attacker
				for(var i=0; i < $scope.gameRound.nCardsToDraw; i++){
					var drawnCard = $scope.cardGame.deckOfCards.pop();
					gameEvent.player.takeCard(drawnCard);
				}
			}else{
				// Usual draw due to no throwable card (or due to voluntary draw choosen to save a special card for later).
				var drawnCard = $scope.cardGame.deckOfCards.pop();
				gameEvent.player.takeCard(drawnCard);
			}
			$scope.refreshPlayerHandPoints();
		}
		else if(gameEvent.name == 'switch-suit'){
			$scope.gameRound.switchedSuit = gameEvent.suit;
			$scope.gameRound.canSwitchSuit = false;
		}
		else if(gameEvent.name == 'skip'){
			// Nothing to do, except showing that the player skipped
			$scope.gameRound.awaitingSkip = true;
			$timeout ( $scope.turnAwaitingSkipOff , 900, true);
		}
		else if(gameEvent.name == 'repick' && $scope.cardGame.gameRuleMap.canRepick){
			// Cannot repick in Uno.
			var pickedCard = $scope.cardGame.basketOfCards.pop();
			pickedCard.top=50; pickedCard.left=350;
			gameEvent.player.takeCard(pickedCard);
			$scope.refreshPlayerHandPoints();
		}
		
		/* GameEvent processed, now continue to next player. Also keep count of roundNumber */
		if(!$scope.gameRound.canSwitchSuit && $scope.cardGame.gameStatus != 'gameWon'){
			var isRoundFinished = (gameEvent.player.name == $scope.gamePlayers[$scope.gamePlayers.length-1].name);
			if (isRoundFinished) $scope.gameRound.roundNumber++;
			
			// Special cards handling
			$scope.gameRound.blockerCardThrown = gameEvent.name != 'skip' && (gameEvent.card !=null && gameEvent.card.cardValue.name == $scope.gameRuleMap.specialCardMap.blocker);
			$scope.gameRound.attackerCardThrown = gameEvent.name != 'draw' && (gameEvent.card !=null && gameEvent.card.cardValue.name == $scope.gameRuleMap.specialCardMap.attacker);
			if($scope.gameRound.attackerCardThrown) $scope.gameRound.nCardsToDraw += 2;
			else $scope.gameRound.nCardsToDraw = 0;   // nCardsToDraw set, next player would have to draw or join attack
			
			$scope.gameRound.playerIndex = $scope.cardGame.getNextPlayerIndex(gameEvent.player);
				
			if($scope.gamePlayers[$scope.gameRound.playerIndex].isHuman){
				//Enable actions
				$scope.gameRound.awaitingInput = true;
				$scope.highlightThrowableCards($scope.gamePlayers[$scope.gameRound.playerIndex]);
			}else{
				$scope.dehighlightCards($scope.gamePlayers[0]);
				$scope.gameRound.awaitingInput = false;
				$scope.handleGameEvent({name: 'computerPlay'});
			}
		}
	}
	
	$scope.dehighlightCards = function(player){
		for(var i=0;i<player.handCards.length;i++){
			var handCard = player.handCards[i];
			handCard.bgcolor = 'white';
		}
	}
	
	$scope.highlightThrowableCards = function(player){
		$scope.gameRound.hasSinglePossibleAction = true;
		for(var i=0;i<player.handCards.length;i++){
			var handCard = player.handCards[i];
			if($scope.canThrowCard(handCard)){
				handCard.bgcolor = 'yellow';
				$scope.gameRound.hasSinglePossibleAction = false;
			}
			else handCard.bgcolor = 'white';
		}
		
	}
	
	$scope.canThrowCard = function(handCard){
		
		// TODO Move Throw rules to gameRuleMap
		
		if($scope.gameRound.canSwitchSuit || $scope.cardGame.gameStatus == 'gameWon'){
			return false; // Waiting for switch-suit event only
		}
		
		if($scope.gameRound.attackerCardThrown){
			if(handCard.cardValue.name == $scope.gameRuleMap.specialCardMap.attacker){
				return true;
			}else{
				return false; // this handCard can not join attack
			}
		}
		else if($scope.gameRound.blockerCardThrown){
			if(handCard.cardValue.name == $scope.gameRuleMap.specialCardMap.blocker){
				return true;
			}else{
				return false; // this handCard can not unblock
			}
		}
		else if(handCard.cardValue.name == $scope.gameRuleMap.specialCardMap.suitSwitcher){
			// Can throw the suit switcher  if not blocked or challenged
			return true;
		}
		
		var latestCardInBasket = $scope.cardGame.basketOfCards[$scope.cardGame.basketOfCards.length - 1];

		if($scope.gameRound.switchedSuit == null){
			// The most usual case
		   if( handCard.cardSuit.name == latestCardInBasket.cardSuit.name
				|| handCard.cardValue.name == latestCardInBasket.cardValue.name){
				return true;
			}else{
				return false;
			}
		}else{
			// When someone switched the running suit
			if(handCard.cardSuit.name == $scope.gameRound.switchedSuit.name){
				return true;
			}else{
				return false;
			}
		}
		
		// default = cannot throw this handCard.
		return false;
	}
	
	$scope.computerPlay = function(){
		var computerPlayer = $scope.gamePlayers[$scope.gameRound.playerIndex];
		var handCardToThrow = $scope.suggestCardToThrow(computerPlayer);
		if(handCardToThrow != null){
			$scope.raiseGameEvent({name: 'throw', card: handCardToThrow, source: this, player: computerPlayer});
			if($scope.gameRound.canSwitchSuit){
				var suitToSwitch = $scope.suggestSuitToSwitch(computerPlayer);
				$scope.raiseGameEvent({name: 'switch-suit', suit: suitToSwitch, source: this, player: computerPlayer});
			}
		}else{
			// No card to throw. Skip (if possible) or Draw.
			if($scope.gameRound.blockerCardThrown) $scope.raiseGameEvent({name: 'skip', source: this, player: computerPlayer});
			else $scope.raiseGameEvent({name: 'draw', source: this, player: computerPlayer});
		}
	}
	
	$scope.suggestCardToThrow = function(player) {
		var throwableCards = [];
		for (var i=0; i<player.handCards.length; i++) {
			var handCard = player.handCards[i];
			if($scope.canThrowCard(handCard)){
				throwableCards[throwableCards.length] = handCard;
			}
		}
		if(throwableCards.length == 1){
			return throwableCards[0];
		}else if(throwableCards.length > 1){
			return $scope.suggestBestCardToThrow(player, throwableCards);
		}else{
			// No Cards to throw. Return null
			return null;
		}
	}
	
	$scope.suggestBestCardToThrow = function(player, cardOptions) {
	
		var bestCardOption = null;
		var cardToOptionValueMap = {};
		var cardSuitToCountMap = $scope.getCardSuitToCountMap(player);

		var maxCardOptionValue = -100000;

		for (var i=0; i<cardOptions.length; i++) {
			var cardOption = cardOptions[i];
			var cardOptionValue = 0;
			
			// Points make a card heavier
			var cardPoints = $scope.gameRuleMap.cardPointMap[cardOption.cardValue.name];
			cardOptionValue += cardPoints * 3;

			// A special card is lighter
			if (cardOption.cardValue.name == $scope.gameRuleMap.specialCardMap.suitSwitcher) {
				cardOptionValue -= 14;
			} else if (cardOption.cardValue.name == $scope.gameRuleMap.specialCardMap.attacker) {
				cardOptionValue -= 8;
			} else if (cardOption.cardValue.name == $scope.gameRuleMap.specialCardMap.blocker) {
				cardOptionValue -= 2;
			}
			
			// The lone card of a suit is lighter
			var nCardsOfSameSuit = cardSuitToCountMap[cardOption.cardSuit.name];
			if (nCardsOfSameSuit == 1) {
				cardOptionValue -= 4;
			} else if (nCardsOfSameSuit > 2) {
				cardOptionValue += (nCardsOfSameSuit * 5);
			}

			cardToOptionValueMap[cardOption.name] = cardOptionValue;
			
			if (cardOptionValue > maxCardOptionValue) {
				// This is the heaviest card so far
				maxCardOptionValue = cardOptionValue;
				bestCardOption = cardOption;
			}
		}
		return bestCardOption;
	}
	
	$scope.getCardSuitToCountMap = function(player) {
		var cardSuitToCountMap = {};

		for (var iSuit=0; iSuit<$scope.cardGame.cardDeckDefn.CARD_SUITS_COUNT; iSuit++) {
			var suit = $scope.cardGame.cardDeckDefn.CARD_SUITS[iSuit];
			cardSuitToCountMap[suit.name] = 0;
		}
		for (var i=0; i<player.handCards.length; i++) {
			var handCard = player.handCards[i];
			if (handCard.cardValue.name != $scope.gameRuleMap.specialCardMap.suitSwitcher) {
				var nCardsOfSuit = cardSuitToCountMap[handCard.cardSuit.name];
				cardSuitToCountMap[handCard.cardSuit.name] = (nCardsOfSuit + 1);
			}
		}

		return cardSuitToCountMap;
	}

	$scope.getCardSuitToPointsMap = function(player) {
		var cardSuitToPointsMap = {};

		for (var iSuit=0; iSuit<$scope.cardGame.cardDeckDefn.CARD_SUITS_COUNT; iSuit++) {
			var suit = $scope.cardGame.cardDeckDefn.CARD_SUITS[iSuit];
			cardSuitToPointsMap[suit.name] = 0;
		}
		for (var i=0; i<player.handCards.length; i++) {
			var handCard = player.handCards[i];
			if (handCard.cardValue.name != $scope.gameRuleMap.specialCardMap.suitSwitcher) {
				var nCardPointsOfSuit = cardSuitToPointsMap[handCard.cardSuit.name];
				cardSuitToPointsMap[handCard.cardSuit.name] = nCardPointsOfSuit
						+ $scope.gameRuleMap.cardPointMap[handCard.cardValue.name];
			}
		}

		return cardSuitToPointsMap;
	}

	$scope.suggestSuitToSwitch = function(player) {
		var cardSuitToPointMap = $scope.getCardSuitToPointsMap(player);
		var bestSuit = $scope.cardGame.cardDeckDefn.CARD_SUIT_SPADE;
		var maxCount = 0;
		for (var iSuit=0;iSuit<$scope.cardGame.cardDeckDefn.CARD_SUITS_COUNT; iSuit++) {
			var suit = $scope.cardGame.cardDeckDefn.CARD_SUITS[iSuit];
			var nCardPointsForSuit = cardSuitToPointMap[suit.name];
			if (nCardPointsForSuit > maxCount
					|| (nCardPointsForSuit == maxCount 
						&& suit.name != $scope.cardGame.basketOfCards[$scope.cardGame.basketOfCards.length-1].cardSuit.name)) {
				maxCount = nCardPointsForSuit;
				bestSuit = suit;
			}
		}
		return bestSuit;
	}
	
	$scope.turnAwaitingDrawOff = function(){
		$scope.gameRound.awaitingDraw = false;
	}
	$scope.turnAwaitingSkipOff = function(){
		$scope.gameRound.awaitingSkip = false;
	}
}


