
/** CardSuit, CardValue, Card, CardDeck, CardPlayer and CardGame (function = class and constructor) definitions */

function CardSuit(name, color, symbol, unicodeChar){
	this.name = name;
	this.color = color;
	this.bgcolor = 'white';
	this.symbol = symbol;
	this.unicodeChar = unicodeChar;
}
CardSuit.prototype.toString = function(){
	return this.symbol;
}
CardSuit.prototype.equals = function(cardSuit){
	return cardSuit == null ? false : cardSuit.symbol.equals(this.symbol);
}

function CardValue(name, symbol){
	this.name = name;
	this.symbol = symbol;
}
CardValue.prototype.toString = function(){
	return this.symbol;
}

CardValue.prototype.equals = function(cardValue){
	return cardValue == null ? false : cardValue.symbol.equals(this.symbol);
}
	
function Card(cardSuit, cardValue){
	this.cardSuit = cardSuit;
	this.cardValue = cardValue;
	this.symbol = this.cardSuit.symbol + this.cardValue.symbol;
	this.fullString = this.cardValue.name + " of " + this.cardSuit.name;
	this.guiString = this.cardSuit.unicodeChar + "" + this.cardValue.symbol;
	
	this.styleClassPos = 'cardPos'; // Card Positioning in game board display
}
Card.prototype.toString = function(){
	return this.symbol;
}
Card.prototype.equals = function(card){
	return card == null ? false : card.tinyString.equals(this.tinyString);
}


/* Singleton CardDeck defines suits, values and cards and holds cards instances */

function CardDeck(){

    this.SUIT_NAMES = ["Spades","Hearts","Diamonds","Clubs" ];
	this.SUIT_COLORS = ["black","red","orange","blue" ];
	this.SUIT_UNICODE_CHARS = ["\u2660","\u2661","\u2662","\u2663" ];
	this.SUIT_HTML_ENTITIES = ["&spades;","&hearts;","&diams;","&clubs;"];
	this.SUIT_SYMBOLS = this.SUIT_HTML_ENTITIES ; //["\\/","o","<>","+" ];
	
	this.CARD_VALUE_NAMES = ["ACE", "KING", "QUEEN", "JACK", "TEN", "NINE", "EIGHT", "SEVEN", "SIX", "FIVE", "FOUR", "THREE", "TWO"];
	this.CARD_VALUE_SYMBOLS = ["A","K","Q","J", "10", "9" , "8" , "7", "6", "5", "4", "3", "2"];
	
	this.CARD_SUIT_SPADE = new CardSuit(this.SUIT_NAMES[0], this.SUIT_COLORS[0], this.SUIT_SYMBOLS[0], this.SUIT_UNICODE_CHARS[0]);
	this.CARD_SUIT_HEART = new CardSuit(this.SUIT_NAMES[1], this.SUIT_COLORS[1], this.SUIT_SYMBOLS[1], this.SUIT_UNICODE_CHARS[1]);
	this.CARD_SUIT_DIAMOND  = new CardSuit(this.SUIT_NAMES[2], this.SUIT_COLORS[2], this.SUIT_SYMBOLS[2], this.SUIT_UNICODE_CHARS[2]);
	this.CARD_SUIT_CLUB  = new CardSuit(this.SUIT_NAMES[3], this.SUIT_COLORS[3], this.SUIT_SYMBOLS[3], this.SUIT_UNICODE_CHARS[3]);
	
	this.CARD_SUITS = [ this.CARD_SUIT_SPADE, this.CARD_SUIT_HEART, this.CARD_SUIT_DIAMOND, this.CARD_SUIT_CLUB ];
	
	this.CARD_SUITS_COUNT = this.CARD_SUITS.length;
	this.CARD_VALUES_COUNT = this.CARD_VALUE_NAMES.length;
	this.CARDS_TOTAL_COUNT =  this.CARD_SUITS_COUNT * this.CARD_VALUES_COUNT;
	
	this.deck = [];
}
CardDeck.prototype.createDeck = function(shouldNotShuffle){

	var cardSymbolToIsAddedMap = new Object(); // Map
	
	do {
		for (var iSuit=0; iSuit<this.CARD_SUITS_COUNT; iSuit++) {
			var suit = this.CARD_SUITS[iSuit];
			
			for (var iValue=0; iValue<this.CARD_VALUES_COUNT; iValue++) {
				var cardSymbol = suit.symbol + this.CARD_VALUE_SYMBOLS[iValue];
				var shouldAddThisCard = cardSymbolToIsAddedMap[cardSymbol] !== true; // Safety check to avoid duplicate cards
				if(shouldAddThisCard){
					var card = new Card(suit, new CardValue(this.CARD_VALUE_NAMES[iValue],this.CARD_VALUE_SYMBOLS[iValue]));
					this.deck[this.deck.length] = card;
					cardSymbolToIsAddedMap[cardSymbol] = true;
				}
			}
		}
	}
	while( this.deck.length < this.CARDS_TOTAL_COUNT );
	
	// Assert that the deck is correct
	if (this.deck.length != this.CARDS_TOTAL_COUNT) alert('ERROR CardDeck.createDeck: deck.length != this.CARDS_TOTAL_COUNT');
	if(true !== shouldNotShuffle) this.shuffleDeck(this.deck);
	return this.deck;
}
CardDeck.prototype.buyDeck = function(){
	return this.createDeck(true /* shouldNotShuffle */ );  
}
CardDeck.prototype.shuffleDeck = function(cardSubDeck) {
	if( !cardSubDeck ) cardSubDeck = this.deck;
	var cardSubDeckLength = cardSubDeck.length;
	if(cardSubDeckLength <=1 ) return; // just one card in deck nothing to shuffle
	
	/* Knuth Shuffle Algorithm */
	var i = cardSubDeckLength;
	var j, temp;
	while ( --i )
	{
		j = Math.floor( Math.random() * (i - 1) );
		temp = cardSubDeck[i];
		cardSubDeck[i] = cardSubDeck[j];
		cardSubDeck[j] = temp;
	}
	
	// Assert
	if(cardSubDeckLength != cardSubDeck.length) alert("Error CardDeck.shuffleDeck is dropping cards when shuffling!");
}


function CardPlayer(name) {
	this.name = name;
	this.totalPoints = 0;	
	
	this.handCards = [];
	this.handPoints = 0;
}
CardPlayer.prototype.computeHandPoints = function(cardPointMap){
	this.handPoints = 0;
	for(var i=0; i<this.handCards.length; i++) {
		this.handPoints += cardPointMap[this.handCards[i].cardValue.name];
	}
	return this.handPoints;
}
CardPlayer.prototype.takeCard = function(card){
	this.handCards[this.handCards.length] = card;
	this.handCards.sort();
}
CardPlayer.prototype.toString = function(){
	var handCardSymbols = "";
	for(var i=0; i<this.handCards.length; i++) handCardSymbols += (this.handCards[i].symbol + " ");
	return "Player: " + this.name + " has " + handCardSymbols;
}

function CardGame(gameRuleMap, gamePlayers) {
	this.gameRuleMap = gameRuleMap; //isTrickBasedGame, hasBidding, hasTrumpSuit, hasPoints, cardPointMap, play rules etc
	
	this.numberOfPlayers = gamePlayers.length;
	this.initialNumberOfCardsPerPlayer = gameRuleMap.initialNumberOfCardsPerPlayer;
	this.players = [];
	
	// Create the card pre-shuffled deck
	this.cardDeckDefn = new CardDeck();
	this.deckOfCards = this.cardDeckDefn.createDeck();
	// Create the basket into which the players throw cards
	this.basketOfCards = [];

	if (this.deckOfCards.length >= this.initialNumberOfCardsPerPlayer * this.numberOfPlayers) {
		for (var i = 0; i < this.numberOfPlayers; i++) {
			this.players[this.players.length] = gamePlayers[i];
		}
		this.gameStatus = 'started';
	}else{
		alert("ERROR: CardGame cannot deal "+this.initialNumberOfCardsPerPlayer+" cards to "
			+this.numberOfPlayers+" players from total "+this.deckOfCards.length+" cards!" );
	}
}
CardGame.prototype.dealCardsToPlayers = function() {
	for (var iPlayer = 0; iPlayer < this.numberOfPlayers; iPlayer++) {
		var cardPlayer = this.players[iPlayer];
		for (var j = 1; j <= this.initialNumberOfCardsPerPlayer; j++) {
			var card = this.pickCardFromDeck();
			cardPlayer.takeCard(card);
		}
	}
}
CardGame.prototype.getNextPlayerIndex = function(currentPlayer) {
	if(currentPlayer == this.players[this.players.length-1]){
		return 0;
	}
	for (var iPlayer = 0; iPlayer < this.numberOfPlayers; iPlayer++) {
		if(currentPlayer == this.players[iPlayer]){
			return iPlayer+1;
		}
	}
}
CardGame.prototype.pickCardFromDeck = function()  {

	var pickedCard = this.deckOfCards.pop();
	// Return the picked card
	return pickedCard;
}
CardGame.prototype.getGameStatusText = function() {
	var gameStatusStr = (" " + (''+this.deckOfCards).replace(/,/g ," ") );
	return (gameStatusStr);
}


