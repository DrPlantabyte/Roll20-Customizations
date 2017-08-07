// when the command !neworder is sent to the chat window, the Turn Tracker is sorted at random into a new order.

on("chat:message", function(msg) {
    var cmdName = "!neworder";
    var msgTxt = msg.content;

    // randomly sorts a supplied array
    var shuffle = function(array) {
        var currentIndex = array.length
          , temporaryValue
          , randomIndex
          ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
    
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }   
      return array;
    }
    
    var renumber = function(array){
        var size = array.length
        var index = 0
        while(index < size) {
            element = array[index]
            element.pr = index + 1
            index += 1
        }
    }

    // Check for our shuffle turn order command in the chat message.
    if(msg.type == "api" && msgTxt.indexOf(cmdName) !== -1) {
        
        var turnorder;
        if(Campaign().get("turnorder") == "") turnorder = []; //NOTE: We check to make sure that the turnorder isn't just an empty string first. If it is treat it like an empty array.
        else turnorder = JSON.parse(Campaign().get("turnorder"));
      
        // shuffle the turn order
        shuffle(turnorder);
        
        // set the initiative values to order in the list
        renumber(turnorder)
        
        // and pop it back on the turn tracker
        Campaign().set("turnorder", JSON.stringify(turnorder));
    }
})