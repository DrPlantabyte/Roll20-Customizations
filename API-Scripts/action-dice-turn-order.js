/*
==============================================================================
ACTION DICE INITIATIVE
An initiative system derived from Mike Mearls' "Greyhawl Initiative"

The point of "Greyhawl Initiative" was to make short combat encounters more 
dramatic (especially when the objectives are more complicated than "kill them" 
by removing the certainty of knowing the turn order at the time when the player 
declares their action.

"Action Dice Initiative" seeks to do the above, and also simplify and speed-up 
the pace of combat by designating that each category of action is represented 
by a unique die type. 

How Action Dice Initiative works:
At the start of a round, each combatant must pick what type of action they will 
take in the coming round, and then add the corresponding die to their 
initiative dice pool. Then after all actions are declared, everyone rolls their 
initiative dice pool and the initiative goes from lowest roll to highest. On a 
tie, the combatant with the higher Dexterity score goes first (determine 
randomly if they have the same score).

Action Type            Die Type
 Dash or Disengage        1d6
 Weapon Attack            1d8
 Use Item/Misc. Action   1d10
 Cast a Spell*           1d12
 Bonus Action            +1d4

* Only for spells with a casting time of 1 action. Bonus action and reaction 
spells are excluded from this category, but do not forget the "1 spell per 
turn" restriction on non-cantrip spells (See "Bonus Action" under "Casting a 
Spell" in Chapter 10 of the PHB).

On a combatant's turn, they can move up to their movement speed and use their 
action to perform the type of action that they declared at the start of the 
round. The combatant may choose not to perform the action, but cannot choose a 
different action. If the decalred action is no longer valid  (e.g. declaring a 
weapon attack but then not having any targets on their turn), then the 
combatant cannot take an action this turn. A combatant can only take a bonus 
action if they declared that they will take a bonus action at the start of the 
round, but they may perform a different bonus action than was originally 
intended (all bonus actions are the same type of action).

If a combatant has an ability to grant them an additional action (e.g. the 
Action Surge ability of the fighter), they can use that ability on their turn 
and immediately take that action with no restrictions (in other words, 
granted actions do not need to be declared ahead of time).

For NPCs that act as a group (e.g. a dozen goblins), the GM will choose an 
action for the collective and assign a single dice pool for that group. All 
members of that group will be restricted to the action which the GM declared 
for them.

IMPLEMENTATION
At the game table, give each player a little bowl to serve as their dice pool 
and make sure that you have a set of distintive dice to use as action dice 
(ideally, using a d6 with feet depicted on it, d8 with weapons, and d12 with 
runes or glitter or star-bursts). Each combat round will start with the GM 
updating the scene (e.g. "the evil wizard casts a glance at the lever"), then 
the GM goes around the table asking each player for their action(s), then 
everyone rolls their initiative dice pools, and then the GM starts counting up 
from 1 and resolves each combatant's turn when their number is called.

 Start of Round
 1. Describe changes to the scene
 2. GM secretly (or openly) declares their action dice
 3. Players declare their action dice out loud
 4. Everyone rolls
 5. Count-up the initiative until all turns are taken
 End of Round

On Roll20.net, this API script provides chat commands for doing the same as 
described above (the GM should setup macros for the players such that the 
choices appear as buttons on the bottom of the app screen). At the start of a 
round, the GM will use the !act-new command to clear the initiative tracker. 
Then everyone selects a token and uses the appropriate commands to add their 
declared actions (as plain text) to the initiative tracker. After they are 
all declared, the GM issues the !act-roll to automatically roll all the dice 
pools and re-order the initiative from lowest to highest.

Action Type              Chat Comand     Die Type
 Dash or Disengage        !act-run          1d6
 Weapon Attack            !act-attack       1d8
 Use Item/Misc. Action    !act-other       1d10
 Cast a Spell             !act-spell       1d12
 Bonus Action             !act-bonus       +1d4
 Reset/remove dice pool   !act-rm           --
------------------------------------------------
 Roll dice pools          !act-roll
 Clear the tracker        !act-new

For convenience, put the following macros on the bottom bar:
Macro Name             Macro Value      All Players?
 Turn: Dash/Disengage   !act-run          Yes
 Turn: Attack           !act-attack       Yes
 Turn: Use Item/Misc.   !act-other        Yes
 Turn: Cast a Spell     !act-spell        Yes
 Turn: + Bonus Action   !act-bonus        Yes
 Turn: Undo             !act-rm           Yes
 Turn: Roll initiative  !act-roll          No
 Turn: New round        !act-new           No

LARGE BATTLES
If there are 8 or more independant combatants (either because there are a 
large number of players or a large number of different NPC groups), then there 
will be so many tied initiative rolls that combat will get bogged down in 
breaking ties. Thus this method for initiative needs to be modified.

In a large battle, forego the declaration of actions. Instead, simply write 
each PC name and NPC group name on index cards (one name per card) and shuffle 
the cards at the start of each round. Then flip over and reveal the top card 
and resolve that character's or group's turn. Repeat until all turns have been 
taken. This will keep the turn order a mystery without having to spend time 
declaring actions (though you should put a time limit on how long it takes 
each person to decide what to do on their turn).


==============================================================================
*/

var actionDiceData = {
	run:{
		display:"Dash/Disengage",
		symbol:"\u21d6",
		letter:"R",
		dice:"1d6"
	},
	weapon:{
		display:"Attack",
		symbol:"\u2694",
		letter:"A",
		dice:"1d8"
	},
	other:{
		display:"Use Item/Other",
		symbol:"\u2615",
		letter:"O",
		dice:"1d10"
	},
	spell:{
		display:"Cast a Spell",
		symbol:"\u2606",
		letter:"M",
		dice:"1d12"
	},
	bonus:{
		display:"+ Bonus Action",
		symbol:"+",//"\u261d",
		letter:"B",
		dice:"1d4"
	}
}
/*
Turn-order object format:
{ 
	"id":"token ID", 
	"pr":"<number>:<symbols>", 
	"custom":"AB#number" 
}
"pr" will show just the symbols that the owner has declared until the 
initiative action dice have been rolls, at which point the initiative roll 
result will be prepixed onto "pr" sucjh that the format will be the roll 
result, a colon, and the action symbols

"custom" will hold the letters corresponding to the declared actions (one 
letter per action). After the initiative has been rolled, then the '#' 
symbol will be added and the roll result plus a random fraction will be added 
after the letters
*/

function debugPrint(some_text, msg_callback){
	sendChat(msg_callback.who, "log: "+some_text)
}
/** Parses the letters of a turn custom data variable and returns a list of 
objects representing declared turn actions */
function getListOfActionsFromCustomString(c_str){
	var actionList = new Array()
	for(var index = 0; index < c_str.length; index++){
		var substr = c_str.slice(index, index+1)
		if( substr == actionDiceData.run.letter ){
			actionList.push(actionDiceData.run)
		} else if( substr == actionDiceData.weapon.letter ){
			actionList.push(actionDiceData.weapon)
		} else if( substr == actionDiceData.other.letter ){
			actionList.push(actionDiceData.other)
		} else if( substr == actionDiceData.spell.letter ){
			actionList.push(actionDiceData.spell)
		} else if( substr == actionDiceData.bonus.letter ){
			actionList.push(actionDiceData.bonus)
		}
	}
	return actionList
}

function nameOfToken(tokenObj){
	var tokenCharacterName = "Combatant"
	if(tokenObj != null ){
		if(tokenObj.get("name") != ""){
			tokenCharacterName = tokenObj.get("name")
		} else if(tokenObj.get("represents") != "") {
			var c = getObj("character", tokenObj.get("represents"))
			if(c != null ){
				tokenCharacterName = c.get("name")
			}
		}
	}
	return tokenCharacterName
}
/** Returns the turn list without the token's turn entry */
function removeTokenTurn(token_id, turn_list){
	var turn_list2 = new Array()
	for(var i = 0; i < turn_list.length; i++){
		if(turn_list[i].id != token_id){
			turn_list2.push(turn_list[i])
		}
	}
	return turn_list2
}
/** Gets the turn corresponding from the provided list, or simply makes a 
new turn object if the list does not have a turn for that token */
function getTokenTurnFromList(token_id, turn_list){
	for(var i = 0; i < turn_list.length; i++){
		if(turn_list[i].id == token_id){
			return turn_list[i]
		}
	}
	var new_turn = {}
	new_turn.id = token_id
	new_turn.pr = ""
	new_turn.custom = ""
	return new_turn
}
function prependToList(item, list){
	var list2 = new Array()
	list2.push(item)
	for(var i = 0; i < list.length; i++){
		list2.push(list[i])
	}
	return list2
}
function symbolForDie(numSides){
	var diceSymbols = [".","|","\u25CE",
	"\u25B3","\u25B3", // d4
	"\u25A2","\u25A2", // d6
	"\u25CA","\u25CA", // d8
	"\u25C7","\u25C7", // d10
	"\u2B20","\u2B20", // d12
	"\u2B21","\u2B21","\u2B21","\u2B21","\u2B21","\u2B21","\u2B21","\u2B21", // d20
	"\u2B6E"// d?
	]
	if(numSides >= 0 && numSides < diceSymbols.length){
		return diceSymbols[numSides]
	} else {
		return diceSymbols[diceSymbols.length-1]
	}
}
function rollObjectToString(diceRollChatObject){
	var rolls = diceRollChatObject.rolls
	var textOutput1 = ""
	for(var k = 0; k < rolls.length; k++){
		if(rolls[k].type == "R"){
			var die = rolls[k]
			textOutput1 += die.dice
			textOutput1 += "d"
			textOutput1 += die.sides
			textOutput1 += "["
			for(var w = 0; w < die.results.length; w++){
				if(w != 0){textOutput2 += "+"}
				//textOutput1 += symbolForDie(die.sides)
				textOutput1 += die.results[w].v
			}
			textOutput1 += "]"
		} else if(rolls[k].type == "M"){
			var op = rolls[k].expr
			textOutput1 += op
		}
	}
	return textOutput1
}

function stringHash(s) {
	var hash = 0, i, charc;
	if (s.length == 0) return hash;
	for (i = 0, l = s.length; i < l; i++) {
		charc = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + charc;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

function setTokenInitiativeAndSort(tokenID, initValue){
	if(Campaign().get("turnorder") == ""){
		return
	}
	var turnorder = JSON.parse(Campaign().get("turnorder"));
	for(var i = 0; i < turnorder.length; i++){
		if(turnorder[i].id == tokenID){
			var tieBreakerValue = Math.random()
			turnorder[i].custom = turnorder[i].custom + "#" + initValue + tieBreakerValue
			turnorder[i].pr = initValue + ":" + turnorder[i].pr
			break;
		}
	}
	turnorder.sort(function(a, b) {
		var va = -1
		if(typeof a.custom === 'string' ){
			var ia = a.custom.lastIndexOf("#")
			if(ia >= 0){
				va = parseFloat(a.custom.slice(ia + 1))
			}
		}
		if( va === -1){
			va = 100 * stringHash(""+a.custom)
		}
		var vb = -1
		if(typeof b.custom === 'string' ){
			var ib = b.custom.lastIndexOf("#")
			if(ib >= 0){
				vb = parseFloat(b.custom.slice(ib + 1))
			}
		}
		if( vb === -1){
			vb = 100 * stringHash(""+b.custom)
		}
		return va - vb
	})
	Campaign().set("turnorder", JSON.stringify(turnorder))
}
function makeTurnMessage(turnObj){
	if(typeof turnObj.custom === "string"){
		var actionList = getListOfActionsFromCustomString(turnObj.custom)
		if(actionList.length == 0){
			return ""
		}
		var tmsg = ""
		for(var ad = 0; ad < actionList.length; ad++){
			if(ad > 0){
				tmsg = tmsg + ", "
			}
			tmsg += actionList[ad].symbol
			tmsg += " "
			tmsg += actionList[ad].display
		}
		return tmsg
	} else {
		return ""
	}
}

function showTurnMessage(turnObject){
	// TODO: clean-up appearance
	// TODO: Fix first turn being shown twice
	// TODO: make more robust with error handling
	var turnMessage = makeTurnMessage(turnObject)
	var tokenObj = getObj("graphic", turnObject.id)
	var name = nameOfToken(tokenObj)
	var imageURL = tokenObj.get("imgsrc")
	
	var fPart = "<div style='box-shadow: 3px 3px 2px #888888; font-family: Verdana; text-shadow: 2px 2px #000; text-align: center; vertical-align: middle; padding: 1px 1px; margin-top: 0.1em; border: 1px solid #000; border-radius: 8px 8px 8px 8px; color: #FFFFFF;"
	var tPic = fPart + "background-color:#666666;'>" + name + "'s Turn!</div>";
	var Pic = fPart + "background-color:#AAAAAA;'><img src='" + imageURL + "'><br>";
	sendChat('', "/direct " + tPic + Pic+"<b>Actions:</b> "+turnMessage+"</div>")
}

on("change:campaign:turnorder", function(){
	// NOTE: this event occurs AFTER the turn order has been adjusted by 
	// clicking the "next turn" button
	if(Campaign().get("turnorder") == ""){
		// empty turn order queue
		return 
	} else {
		var turnorder = JSON.parse(Campaign().get("turnorder"));
		var newTurn = turnorder[0]
		showTurnMessage(newTurn)
		turnorder.pop()
		Campaign().set("turnorder", JSON.stringify(turnorder))
	}
})
on("chat:message", function(msg) {
	if(msg.type == "api" ){
		var msgText = msg.content.trim();
		if(msgText.lastIndexOf("!act-",0) === 0) {
			debugPrint("Testing...", msg)
			debugPrint(actionDiceData.run.symbol+actionDiceData.weapon.symbol+actionDiceData.other.symbol+actionDiceData.spell.symbol+actionDiceData.bonus.symbol, msg)
			var currentPageID = Campaign().get('playerpageid')
			var turnorder;
			if(Campaign().get("turnorder") == ""){
				//NOTE: We check to make sure that the turnorder isn't just 
				// an empty string first. If it is treat it like an empty array.
				turnorder = []; 
			} else {
				turnorder = JSON.parse(Campaign().get("turnorder"));
			}
			/*
			Turn-order objects:
			{ "id":"letters-and-numbers", "pr":<number or string>, "custom":"", "_pageid":"more-letters-and-numbers" }
			_pageid will not alwyays be present
			*/
			if(msgText.lastIndexOf("!act-new",0) === 0) {
				// erase turn tracker for new round of initiative dice
				turnorder = []
				Campaign().set("turnorder", JSON.stringify(turnorder))
				return
			}
			if(msgText.lastIndexOf("!act-roll",0) === 0) {
				// async IO via callbacks has its down sides, like when 
				// you want to do something only after all issued callbacks
				// have completed and your library didn't anticipate/support
				// this kind of specificity, and you don't know how many 
				// callbacks you are going to generate until after you make 
				// the last one
				___async_done_count = 0
				___async_target_count = turnorder.length
				
				for(var n = 0; n < turnorder.length; n++){
					var tokenTurn = turnorder[n]
					if(typeof tokenTurn.custom === 'undefined') {
						___async_target_count--
						continue
					}
					var actionList = getListOfActionsFromCustomString(tokenTurn.custom)
					if(actionList.length == 0){
						___async_target_count--
						continue
					}
					var diceExpression = ""
					for(var d = 0; d < actionList.length; d++){
						if(d > 0){
							diceExpression = diceExpression + " + "
						}
						diceExpression = diceExpression + actionList[d].dice
					}
					// figure out who is making this roll
					var tokenCharacterName = "Combatant"
					var tokenID = tokenTurn.id
					var tokenObj = getObj("graphic", tokenID)
					if(tokenObj != null && tokenObj != ""){
						tokenCharacterName = nameOfToken(tokenObj)
					}
					
					var encapsulate = function(name, tid){
						// scope resolution conflict hackery
						sendChat(name, "/roll " + diceExpression, function(ops) {
___async_done_count += 1
// ops will be an ARRAY of command results.
var rollObject = JSON.parse(ops[0].content)
debugPrint("Roll result array: "+JSON.stringify(rollObject), msg)
var rollResult = rollObject.total
sendChat(name, "Initiative roll: " + rollObjectToString(rollObject) + " = " + rollResult)
setTokenInitiativeAndSort(tid, rollResult)
if(___async_done_count == ___async_target_count){
	// last shuffle of the turn order
	// show first turn message
	var turnorder = JSON.parse(Campaign().get("turnorder"));
	if(turnorder != "" && turnorder.length > 0){
		showTurnMessage(turnorder[0])
	}
}
						})
					};
					encapsulate(tokenCharacterName, tokenID); // JS doesn't make callbacks inside of loops easy to do
				}
				return
			}
			var tokenSelection = msg.selected
			if(typeof tokenSelection !== 'undefined') {
				for(var tokenIndex = 0; tokenIndex < tokenSelection.length; tokenIndex++){
					token = tokenSelection[tokenIndex]
					/*
					Token object:
					{ "_id":"letters-and-numbers", "_type":"graphic" }
					_id is the same string as the id in the turn order object
					*/
					tokenID = token._id
					debugPrint(JSON.stringify(token), msg)
					
					debugPrint("turn list:" + JSON.stringify(turnorder), msg)
					debugPrint("Page ID: " + currentPageID, msg)
					var tokenTurn = getTokenTurnFromList(tokenID, turnorder)
					turnorder = removeTokenTurn(tokenID, turnorder)
					if(typeof tokenTurn.custom === 'undefined' 
							|| typeof tokenTurn.custom === 'number') {
						tokenTurn.custom = ""
					}
					var hasBonusAction = false
					if(tokenTurn.custom.indexOf(actionDiceData.bonus.letter) >= 0) {
						hasBonusAction = true
					}
					// resolve command
					var addDicePoolAction = false
					if(msgText.lastIndexOf("!act-run",0) === 0) {
						tokenTurn.custom = actionDiceData.run.letter
						tokenTurn.pr = actionDiceData.run.symbol
						addDicePoolAction = true
					} else if(msgText.lastIndexOf("!act-attack",0) === 0) {
						tokenTurn.custom = actionDiceData.weapon.letter
						tokenTurn.pr = actionDiceData.weapon.symbol
						addDicePoolAction = true
					} else if(msgText.lastIndexOf("!act-other",0) === 0) {
						tokenTurn.custom = actionDiceData.other.letter
						tokenTurn.pr = actionDiceData.other.symbol
						addDicePoolAction = true
					} else if(msgText.lastIndexOf("!act-spell",0) === 0) {
						tokenTurn.custom = actionDiceData.spell.letter
						tokenTurn.pr = actionDiceData.spell.symbol
						addDicePoolAction = true
					} else if(msgText.lastIndexOf("!act-bonus",0) === 0) {
						hasBonusAction = true
						addDicePoolAction = true
					} else if(msgText.lastIndexOf("!act-rm",0) === 0) {
						Campaign().set("turnorder", JSON.stringify(turnorder))
					}
					// add token turn
					if(addDicePoolAction === true){
						if(hasBonusAction === true && tokenTurn.custom.indexOf(actionDiceData.bonus.letter) < 0){
							tokenTurn.custom = tokenTurn.custom + actionDiceData.bonus.letter
							tokenTurn.pr = tokenTurn.pr + actionDiceData.bonus.symbol
						}
						turnorder = prependToList(tokenTurn, turnorder)
						Campaign().set("turnorder", JSON.stringify(turnorder))
					}
				}
			}
		}
	}
})