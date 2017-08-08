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
	new_turn.pr = "?"
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

// TODO: chat message when a player's turn comes up
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
				for(var n = 0; n < turnorder.length; n++){
					var tokenTurn = turnorder[n]
					if(typeof tokenTurn.custom === 'undefined') {
						continue
					}
					var actionList = getListOfActionsFromCustomString(tokenTurn.custom)
					if(actionList.length == 0){
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
						if(tokenObj.get("name") != ""){
							tokenCharacterName = tokenObj.get("name")
						} else if(tokenObj.get("represents") != "") {
							var c = getObj("character", tokenObj.get("represents"))
							if(c != null ){
								tokenCharacterName = c.get("name")
							}
						}
					}
					sendChat(tokenCharacterName, "/roll [Initiative: ] " + diceExpression, function(ops) {
// ops will be an ARRAY of command results.
var rollresult = ops[0];
// TODO: callback madness
					})
				}
				// TODO: roll the dice and re-arrange the turn list
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
					if(typeof tokenTurn.custom === 'undefined') {
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
						if(hasBonusAction === true){
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