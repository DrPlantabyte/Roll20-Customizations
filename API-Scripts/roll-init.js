// automatically rolls initiative for everyone on the turn-tracker, using Bar2 (the blue one) 
// as the initiative score for non-character tokens
initroll = {};
initroll.onChatMessage = function(msg){
	
	if(msg.type == "api" ){
		var msgText = msg.content.trim();
		if(msgText.lastIndexOf("!rollinit",0) === 0) {
			var turnorder = [];
			if(Campaign().get("turnorder") == ""){
				//NOTE: We check to make sure that the turnorder isn't just 
				// an empty string first. If it is treat it like an empty array.
				turnorder = []; 
			} else {
				turnorder = JSON.parse(Campaign().get("turnorder"));
			}
			//var empty = [];
			//Campaign().set("turnorder", JSON.stringify(empty));
			var n;
			for(n = 0; n < turnorder.length; n++){
				var initMod = 0;
				var tokenTurn = turnorder[n];
				var tokenID = turnorder[n].id;
				var tokenObj = getObj("graphic", tokenID);
				var tokenName = initroll.nameOfToken(tokenObj);
				if(tokenObj != null ){
					var rollResult = initroll.rollToken(tokenObj, tokenID);
					var d20Roll = rollResult[0];
					var initMod = rollResult[1];
					var total = parseInt(d20Roll,10) + parseInt(initMod,10);
					turnorder[n].pr = total
					initroll.showRoll(tokenObj, d20Roll, initMod, total);
				}
			}
			turnorder.sort(function(a, b) {
				var va = 0;
				var vb = 0;
				if(typeof a.pr === 'undefined' || a.pr == null || a.pr == ""){
					va = 0;
				} else {
					va = a.pr;
				}
				if(typeof b.pr === 'undefined' || b.pr == null || b.pr == ""){
					vb = 0;
				} else {
					vb = b.pr;
				}
				return vb - va;
			});
			Campaign().set("turnorder", JSON.stringify(turnorder));
		}
	}
}

/** gets the name of a token object */
initroll.nameOfToken = function(tokenObj){
	var tokenCharacterName = "Combatant"
	try{
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
	}catch(err){
		sendChat("error",""+err)
	}
	return tokenCharacterName
}
initroll.rollToken = function(tokenObj, tokenID){
	var anonymousRoll = true;
	var initMod = 0;
	if(tokenObj.get("represents") != "") {
		var c = getObj("character", tokenObj.get("represents"));
		if(c != null ){
			anonymousRoll = false;
			initMod = getAttrByName(c.get("_id"),"initiative" );
		}
	}
	if( anonymousRoll === true){
		// non-character token
		if(tokenObj.get("bar2_value") != ""){
			// using bar2 as init bonus
			try{
				initMod = parseInt(tokenObj.get("bar2_value"), 10);
			}catch(err){
				initMod = 0;
			}
		}
	}
	var d20Roll = randomInteger(20);
	return [d20Roll, initMod];
}
initroll.showRoll = function(tokenObj, d20Roll, bonus, total){
	var bonusTxt = "+"+bonus;
	if(bonus < 0) {
		bonusTxt = ""+bonus;
	}
	//sendChat(roller, "Initiative roll: 1d20+"+bonusTxt+" = ["+d20Roll+"]+"+bonusTxt+" = "+total);
	
	var htmlTemplate = "Rolling initiative<br><table border='0'><tr><td> <img src='${IMGURL}' style='display: block; max-width:64px; max-height:64px; width: auto; height: auto;'> </td><td> ${ROLLS} <br><b>Total:</b> ${TOTAL} </td></tr></table>"
	var rolls = "1d20"+bonusTxt+" = [<b>"+d20Roll+"</b>]"+bonusTxt
	var totalResult = total
	var name = initroll.nameOfToken(tokenObj)
	var imageURL
	if(tokenObj == null || tokenObj == ""){
		imageURL = "https://app.roll20.net/images/achievements/seemerollin.png"
	} else {
		imageURL = tokenObj.get("imgsrc")
	}
	sendChat(name, "/direct " + htmlTemplate.replace("${NAME}",name).replace("${IMGURL}",imageURL).replace("${ROLLS}",rolls).replace("${TOTAL}",totalResult));
}


on("ready", function() {
	on("chat:message", initroll.onChatMessage );
	//on("change:campaign:turnorder", initroll.onTurnOrderChange)
});
