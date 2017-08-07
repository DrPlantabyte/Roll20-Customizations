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
 Weapon Attack            !act-weapon       1d8
 Use Item/Misc. Action    !act-other       1d10
 Cast a Spell             !act-spell       1d12
 Bonus Action             !act-bonus       +1d4
 Reset dice pool          !act-undo         --
------------------------------------------------
 Roll dice pools          !act-roll
 Clear the tracker        !act-new

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