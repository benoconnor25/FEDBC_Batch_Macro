
/**** Start Global Variabls ****/
const masterData = {};

// Questions are loaded via external JS file

// Parameter options
const parameters = {};
/**** End Global Variabls ****/



/**** Start DOM Variabls ****/
// Gamemode Selector
const select_gamemode = document.getElementById("gamemode");
const div_gamemodeDescription = document.getElementById("gamemodeDescription");

// Start/Next buttons
const div_buttonHolder = document.getElementById("buttonHolder");
const btn_start = document.getElementById("start");
const span_loading = document.getElementById("loading");

// QnA display
const div_QnAHolder = document.getElementById("QnAHolder");
const div_question = document.getElementById("question");
const div_answers = document.getElementById("answers");
const div_a1Holder = document.getElementById("a1Holder")
const inp_a1 = document.getElementById("a1");
const div_a2Holder = document.getElementById("a2Holder")
const inp_a2 = document.getElementById("a2");
const btn_skip = document.getElementById("skip");
const btn_submit = document.getElementById("submit");
const div_result = document.getElementById("result");
const div_correct = document.getElementById("correct");
const div_incorrect = document.getElementById("incorrect");

// Score display
const div_roundTime = document.getElementById("roundTime");
const div_gameTime = document.getElementById("gameTime");
const div_roundsCompleted = document.getElementById("roundsCompleted");
const div_avgTimePerRound = document.getElementById("avgTimePerRound");
/**** End DOM Variabls ****/



/**** Start Helper Functions ****/

// Helpful query functions
$ = (q, el) => (el || document).querySelector(q);
$a = (q, el) => Array.from((el || document).querySelectorAll(q));

// Returns a number as a string and adds a leading zero if needed
function leadingZero(num){
	return (num < 10 ? "0" : "") + num;
}

// Convert a number of seconds to a time string
function secToTime(num){
	// Make sure num is rounded

	// How many seconds in the minute
	const s = leadingZero(num % 60);

	// Subtract the seconds
	num -= s;
	// Convert to minutes
	num /= 60;
	// How many minutes in this hour
	const m = leadingZero(num % 60);

	// subtract the minutes
	num -= m;
	// Convert to hours
	num /= 60;
	// How many hours
	const h = leadingZero(num);

	return `${h}:${m}:${s}`;
}

// Rounds a number to the number of decimal places
function round(num, places){
	const mod = Math.pow(10, places);
	return (~~(num*mod))/(mod);
}

// Turns a number into a money format without any cents
function toMoney(num){
	// Turn into string with no decimals
	let str = num.toFixed(0);

	// If it has a thousands place
	if (str.length > 3){
		// add the comma
		str = str.substring(0, str.length - 3) + "," + str.slice(str.length - 3);
	}

	// If it has a millions place
	if (str.length > 7){
		// add the comma
		str = str.substring(0, str.length - 7) + "," + str.slice(str.length - 7);
	}

	// If it has a billions place
	if (str.length > 11){
		// add the comma
		str = str.substring(0, str.length - 11) + "," + str.slice(str.length - 11);
	}

	return str;
}
/**** End Helper Functions ****/



/**** Start Importing Data ****/
// Get the parameters data
fetch("parameters.csv")
// Make sure we found the file
.then(resp => {
	// IF the response didn't find anything
	if (!resp.ok){
		throw new Error("Couldn't load and parse parameters file");
	}
	// otherwise, get the text
	return resp.text();
})
// Split into rows
.then(csv => csv.split("\n"))
// Split the rows into columns
.then(rows => {
	return rows
	// Split each row at the commas that are followed by letters, new lines, or ends of string
	.map(row => row.split(/,(?=\S|\n|$)/));
})
// Turn the rows into the paremeters data
.then(rows => {
	// Get the first row (tags)
	let tags = rows.shift()
	// Make sure each one is clean
	.map(tag => tag.trim());

	// Get the second row (tag type)
	let types = rows.shift()
	// Make sure each one is clean
	.map(type => type.trim());

	// Add each tag to the parameters
	tags.forEach((tag, i) => {
		// create the object with a type and array for data
		parameters[tag] = {
			type: types[i],
			options: []
		};
	})

	// Transfer data to parameters object
	// For each row
	rows.forEach(row => {
		// for each column
		row.forEach((column, i) => {
			// find the tag for this column
			let tag = tags[i];
			// Clean up the column if it has quotes
			column = (column[0]=="\"") ? column.slice(1, column.length-2) : column;
			// Add the data if it exists
			if (column !== ""){
				parameters[tag].options.push(column);
			}
		});
	});
})
.then( () => {
	// Done importing the parameter data
})
// Now get the master data
.then(() => fetch("data.csv"))
// Make sure we found the file
.then(resp => {
	// IF the response didn't find anything
	if (!resp.ok){
		throw new Error("Couldn't find data.csv file");
	}
	// otherwise, get the text
	return resp.text();
})
// Split into rows
.then(csv => csv.split("\n"))
// Split the rows into columns
.then(rows => {
	return rows
	// Split each row at the commas
	.map(row => row.split(/,(?=\S|\n|$)/));
})
// Turn the rows into the master data
.then(rows => {
	// Use the first line as the column names
	masterData.columnNames = rows.shift()
	
	// Clean up each data point
	// For each row
	rows.forEach((row, rowIndex) => {
		// for each column
		row.forEach((column, colIndex) => {
			// If it has quotes
			if (column[0]=="\"") {
				// Clean it up
				rows[rowIndex][colIndex] = column.slice(1, column.length-1);
			}
		});
	});

	// Use the rest of the rows as the data
	masterData.orders = rows
	// remove any rows that are "empty"
	.filter(row => row.length != 1)
})
.then(() => {
	// Show that data is done loading
	btn_start.disabled = false;
	span_loading.classList.add("hidden");

})
.catch(err => {
	span_loading.innerHTML = err.message;
	span_loading.classList.add("error");
})
/**** End Importing Data ****/



/**** Start Business Logic ****/
function getNumForColumn(name){
	const result =  masterData.columnNames.reduce((res, e, i) => e == name ? i : res, "error");
	if (result === "error"){
		throw new Error(`Could not find column with name: ${name}`);
	}
	return result;
}


// Make it so I can use regex while finding the index of a match
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

// returns whether or not the first parameter is greater that the second
function paramGT(p1, p2){
	// If params are numbers (not not-a-number)
	if (!isNaN(+p1)){
		return +p1 > +p2;
	}

	// if params are dates (month is not not-a-number)
	if (!isNaN((new Date(p1)).getMonth())) {
		return new Date(p1) > new Date(p2);
	}

	// if params are months
	const months = ",january,february,march,april,may,june,july,august,september,october,november,december,";
	if (months.indexOf(`,${p1.toLowerCase()},`) != -1){
		return months.indexOf(p1.toLowerCase()) > months.indexOf(p2.toLowerCase());
	}

	// If params aren't ordinal, just return false
	return false;
}

function getNewQuestion(){
	// select question
	let qi = ~~(questions.length * Math.random());
	//qi = 4;
	const q = questions[qi];

	let filled = "";
	// If template is a function
	if (typeof q.template === "function"){
		filled = q.template();
	} else {
		// Otherwise, the template is just a string
		filled += q.template;
	}

	let tags = [];
	let parameters = [];
	let start = -1;

	// Find all of the tags
	while ((start = filled.indexOf("%", start + 1)) !== -1){
		// find the end of the parameter (after the start)
		const end = filled.regexIndexOf(/\W/, start + 1);
		// Get the tag from the filled string
		const tag = filled.slice(start + 1, end);
		tags.push(tag);
		// Get a value for that parameter
		const parameter = getRandomParameterValue(tag);
		parameters.push(parameter);
	}

	// make sure that any duplicate tags are in ascending order and no duplicates
	// For each tag
	tags.forEach((tag1, i) => {
		// Keep track of values for this tag
		tagValues = {};
		tagValues[parameters[i]] = true;

		// Compare against every other tag
		tags.forEach((tag2, j) => {
			// If this tag is in front of this one and the same type
			if (j > i && tag1 == tag2){
				// If the first param is Greater Than the second
				if (paramGT(parameters[i], parameters[j])){
					// Swap the values
					const temp = parameters[i];
					parameters[i] = parameters[j];
					parameters[j] = temp;
				}

				// While the second param already exists
				while (tagValues.hasOwnProperty(parameters[j])){
					// Get a new second param value
					parameters[j] = getRandomParameterValue(tag2);
				}

				// register second tag value
				tagValues[parameters[j]] = true;
			}
		})
	});

	// Add the params to the string
	// For each tag
	tags.forEach((tag, i) => {
		// Alter/clean the text if needed
		let text = parameters[i];

		// Find it in the string and replace it with the parameter
		filled = filled.replace(`%${tag}`, `<b>${text}</b>`);
	})

	return {
		question: filled,
		answer: q.calculateAnswer(...parameters)
	};
}


// Returns a value from the parameters set of options or within its range
function getRandomParameterValue(tag){
	// Make sure tag exists
	if (!parameters.hasOwnProperty(tag)){
		throw new Error(`Parameter tag does not exist: ${tag}`);
	}

	// Make variables for inside the switch statement
	let lower, upper, num;

	// Decide what to do based on the tag type
	switch (parameters[tag].type){
		// If the tag is a discrete set of options
		case "discrete":
			// return a random option (make sure it doesn't have any extra white space before or after)
			return parameters[tag].options[~~(parameters[tag].options.length*Math.random())].trim();

		// If the tag is a range
		case "range":
			// Find upper and lower bounds ('+' operator converts to number)
			lower = +parameters[tag].options[0];
			upper = +parameters[tag].options[1];
			// Pick a number in the range and round down to the nearest integer
			return ~~(lower + (upper - lower + 1)*Math.random());
		
		// If the tag is a number but needs to be presented ordinally
		case "ordinal":
			// Get the number
			num = parameters[tag].options[~~(parameters[tag].options.length*Math.random())];
			let ordinal = "";

			// Set the ordinal suffix acording to final digit
			switch (num.slice(-1)){
				case "1":
					ordinal = "st";
					break;
				case "2":
					ordinal = "nd";
					break;
				case "3":
					ordinal = "rd";
					break;
				default:
					ordinal = "th";
					break;
			}

			// Special cases for 11, 12, and 13
			switch (num){
				case "11":
				case "12":
				case "13":
				ordinal = "th";
			}

			return num + ordinal;

		// If the tag is a money range type
		case "money range":
			lower = +parameters[tag].options[0];
			upper = +parameters[tag].options[1];
			// Pick a number in the range and round down to the nearest integer
			num = ~~(lower + (upper - lower)*Math.random());
			// convert to looking like money 1,234,567 (no cents)
			return toMoney(num);

		// Some other type
		default:
			throw new Error(`Tag type not known: ${parameters[tag].type}`);
			break;
	}
}
/**** End Business Logic ****/



/**** Start Game Variables ****/
// Keep track of scores in one place
const scores = {
	gameStartTime: 0,
	roundStartTime: 0,
	roundTime: 0,
	gameTime: 0,
	roundsCompleted: 0
}

let currentQuestion = null;

// Set some options for our current game state
const stateOptions = {
	beforeGame: 0,
	inGame: 1,
	gameOver: 2
}
let gameState = stateOptions.beforeGame;

// Have 3 different game modes
const gamemodes = {
	casual: "casual",
	rounds: "rounds",
	countdown: "countdown"
}
gamemode = "casual";

const gamemodeDescriptions = {};
gamemodeDescriptions[gamemodes.casual] = "Keep answering questions forever and see your average time per round.";
gamemodeDescriptions[gamemodes.rounds] = "See how fast you can correctly answer 10 questions.";
gamemodeDescriptions[gamemodes.countdown] = "See how many questions you can correctly answer in one minute.";

const gamemodeSetup = {};

const countdownTimeLimit = 60; // s
const roundLimit = 10; // rounds

// Functions to check if the game is over based on the gamemode
let gameOverChecks = {};

// Functions to display the score based on gamemode
let displayScores = {};

// Remaining Skips: -1 means no limit
let remainingSkips = -1;

// Keep track of game tick interval
let gameTickInterval = 0;
const gameTickDur = 100; // ms

/**** End Game Variables ****/



/**** Start DOM Events ****/
select_gamemode.onchange = function(){
	// Quick make sure gamemode exists
	if (!gamemodes.hasOwnProperty(select_gamemode.value)){
		throw new Error(`Gamemode does not exist: ${select_gamemode.value}`);
	}

	// Update gamemode and description
	gamemode = gamemodes[select_gamemode.value];
	div_gamemodeDescription.innerText = gamemodeDescriptions[gamemode]

	// Show or hide average time depending on if casual or not
	if (gamemode == gamemodes.casual){
		$a(".avgTimePerRound").forEach(el => el.classList.remove("hidden"))
	} else {
		$a(".avgTimePerRound").forEach(el => el.classList.add("hidden"))
	}

};
// Update the gamemode display
select_gamemode.onchange();

// Start the game
btn_start.onclick = function(){

	// Hide the start button
	div_buttonHolder.classList.add("hidden");

	// unhide the next button (it's disabled by default, don't worry)
	div_QnAHolder.classList.remove("hidden");

	startGame();
}

// Check the answer
btn_submit.onclick = checkAnswer;

// Skip this question
btn_skip.onclick = skipQuestion;

// Handle pressing enter on an input
$a("#answers input")
.forEach(inp => {
	inp.onkeypress = e => {
		// If user pressed enter
		if (e.keyCode == 13){
			checkAnswer();
		}
	};
});
/**** End DOM Events ****/



/**** Start Game Logic ****/

// Set the setup for each gamemode
// Casual games don't end
gamemodeSetup[gamemodes.casual] = function(){
	remainingSkips = -1;
}
// Rounds limit of 5 skips
gamemodeSetup[gamemodes.rounds] = function(){
	remainingSkips = 5;
}
// Countdown has no skips
gamemodeSetup[gamemodes.countdown] = function(){
	remainingSkips = 0;
}


// Set the game over checks
// Casual games don't end
gameOverChecks[gamemodes.casual] = function(){
	return false;
}
// Rounds ends after 10 rounds
gameOverChecks[gamemodes.rounds] = function(){
	return scores.roundsCompleted >= roundLimit;
}
// Countdown ends after time limit
gameOverChecks[gamemodes.countdown] = function(){
	return scores.gameTime >= countdownTimeLimit; // seconds
}


// Set the score displays
// Casual shows everything
displayScores[gamemodes.casual] = function(){
	div_roundTime.innerText = secToTime(scores.roundTime);
	div_gameTime.innerText = secToTime(scores.gameTime);
	div_roundsCompleted.innerText = scores.roundsCompleted;

	// Get average time per round
	const avgTime = round(scores.gameTime / scores.roundsCompleted, 2);
	div_avgTimePerRound.innerText = secToTime(avgTime);
}
// Rounds end after 10 rounds
displayScores[gamemodes.rounds] = function(){
	div_roundTime.innerText = secToTime(scores.roundTime);
	div_gameTime.innerText = secToTime(scores.gameTime);
	div_roundsCompleted.innerText = scores.roundsCompleted;
}
// Countdown end after 3 minutes (180 seconds)
displayScores[gamemodes.countdown] = function(){
	div_roundTime.innerText = secToTime(scores.roundTime);
	div_gameTime.innerText = secToTime(countdownTimeLimit - scores.gameTime);
	div_roundsCompleted.innerText = scores.roundsCompleted;
}



function startGame(){
	// If we are already playing
	if (gameState == stateOptions.inGame){
		// Don't do anything
		return;
	}

	// reset the scores
	scores.roundTime = 0;
	scores.roundsCompleted = 0;
	scores.gameTime = 0;

	// Disable the ability to change the gamemode
	select_gamemode.disabled = true;

	// Set up based on gamemode
	gamemodeSetup[gamemode]();

	// Get the current time
	const now = Date.now();;
	scores.gameStartTime = now;
	scores.roundStartTime = now;

	// Update the display based on gamemode
	displayScores[gamemode]();

	// Make sure the skip button is up to date
	updateSkipsButton();

	// Get the next question
	showNextQuestion();	

	// Start checking game score and updating everything a bunch
	startGameTick();
}

function showNextQuestion(){
	// Get a question
	currentQuestion = getNewQuestion();

	// Display the question
	div_question.innerHTML = currentQuestion.question;

	// Display the number of answer inputs we need
	if (currentQuestion.answer.length == 1){
		div_a2Holder.classList.add("hidden");
	} else {
		div_a2Holder.classList.remove("hidden");
	}

	// Clear out the input values;
	inp_a1.value = "";
	inp_a2.value = "";

	// Focus the first input
	inp_a1.focus();

	// Reset round time
	const now = Date.now();;
	scores.roundStartTime = now;
}

function updateScores(){
	// Get the current time
	const now = Date.now();

	// update the times (ms -> s)
	scores.roundTime = ~~((now - scores.roundStartTime)/1000);
	scores.gameTime = ~~((now - scores.gameStartTime)/1000);

	// Update the display
	displayScores[gamemode]();
}

function updateSkipsButton(){
	// If infinite skips
	if (remainingSkips == -1){
		btn_skip.innerHTML = "Skip Question";
		return;
	} else if (remainingSkips == 0){
		// No more skips left
		btn_skip.disabled = true;
	}

	// No skips or countable skips remaining, but not infinite skips
	btn_skip.innerHTML = `Skip Question (${remainingSkips})`;
}

function skipQuestion(){
	// If we have skips left, or we have unlimited (=-1)
	if (remainingSkips != 0){
		// Reduce the number of skips if not -1, otherwise it stays -1
		remainingSkips -= remainingSkips != -1;

		// Show the next question
		showNextQuestion();

		// Update the skip button
		updateSkipsButton();
	}
	// No skips for you
}

function checkAnswer(){
	// Get values, clean them
	const vals = [];
	vals.push(inp_a1.value.trim());
	vals.push(inp_a2.value.trim());

	// Compare against the answer for the question
	let allCorrect = true;
	currentQuestion.answer
	.forEach((a, i) => {
		// If the answer is a number, but isn't "0"
		if (!isNaN(+a) && +a != 0){
			// If they aren't within a dollar (because rounding)
			if (Math.abs(a - +vals[i]) > 1){
				// Answer is wrong
				allCorrect = false;
			}
		}
		// If user's answer is "0" or "none"
		else if (("" + a).toLowerCase() === "none" || ("" + a).toLowerCase() === "0"){
			// If their answer isn't either of those
			if (vals[i].toLowerCase() !== "0" && vals[i].toLowerCase() !== "none"){
				allCorrect = false;
			}
		}
		// If user's answer is different to actual or is empty
		else if (("" + a).toLowerCase() !== vals[i].toLowerCase()){
			// Answer is wrong
			allCorrect = false;
		}
	})

	// If nothing is wrong
	// User got the question correct
	if (allCorrect){
		// Tell the user they got the answer correct
		showCorrect();
		// Increment how many rounds have been completed
		scores.roundsCompleted++;
		// Move on to the next question
		showNextQuestion();
	} else {
		// User got the question wrong
		// Tell the user they got the answer wrong
		showIncorrect();
	}
}

function startGameTick(){
	gameTickInterval = setInterval(gameTick, gameTickDur);
}

function gameTick(){
	// Update the scoreboard
	updateScores();

	// If the game is over
	if (gameOverChecks[gamemode]()){
		endGame();
	}
}

function stopGameTick(){
	clearInterval(gameTickInterval);
}

function showCorrect(){
	div_correct.classList.remove("hidden");
	div_incorrect.classList.add("hidden");
}

function showIncorrect(){
	div_correct.classList.add("hidden");
	div_incorrect.classList.remove("hidden");
}

function showGameOver(){
	// Hide the QnA section
	div_QnAHolder.classList.add("hidden");

	// Unhide the start button
	div_buttonHolder.classList.remove("hidden");

	// Undisable the gamemode selector
	select_gamemode.disabled = false;

}

function endGame(){
	// Stop ticking
	stopGameTick();
	// Show that the game is over
	showGameOver();
}
/**** End Game Logic ****/