// Questions
const questions = [
	// Q1
	{
		template: "What is the GAAP Sales True-Up for Model ID %ModelID in %Year?",
		calculateAnswer: function(model, year){
			// Get the column number for the data we need
			const descCol = getNumForColumn("Description");
			const valCol = getNumForColumn("Value");
			const yearCol = getNumForColumn("Year");
			const modelCol = getNumForColumn("Model ID");
			const recordCol = getNumForColumn("RecordID");
			const locCol = getNumForColumn("Onshore vs. Offshore");
			const versionCol = getNumForColumn("Version");

			// Values we need to match
			const descriptionMatch = "CTD US GAAP Sales True Up";
			const locMatch = "Total Model";
			const versionMatch = "Completed";
			const recordBadMatch = "3";


			// From the orders
			const result = masterData.orders
			// Keep the orders with correct description, location, version, model id, and year
			.filter(order => order[descCol] == descriptionMatch &&
							 order[locCol] == locMatch &&
							 order[recordCol] != recordBadMatch &&
							 order[versionCol] == versionMatch &&
							 order[modelCol] == model &&
							 order[yearCol] == year)
			// Sum the value
			.reduce((acc, order) => acc + +order[valCol],0);

			return [result];
		}
	},

	// Q2
	{
		template: "What is the sum of the Actual and Projected Billings for Model ID %ModelID in %Year?",
		calculateAnswer: function(id, year){
			// Get the column number for the data we need
			const descCol = getNumForColumn("Description");
			const valCol = getNumForColumn("Value");
			const yearCol = getNumForColumn("Year");
			const idCol = getNumForColumn("Model ID");
			const locCol = getNumForColumn("Onshore vs. Offshore");

			// Values we need to match
			const actualMatch = "Actuals Billing";
			const projectedMatch = "Projected billing";
			const locMatch = "Total Model";

			// From the orders
			const result = masterData.orders
			// Keep the orders with correct description, location, version, model id, and year
			.filter(order => (order[descCol] == actualMatch  || order[descCol] == projectedMatch) &&
							 order[locCol] == locMatch &&
							 order[idCol] == id &&
							 order[yearCol] == year)
			// Sum the value
			.reduce((acc, order) => acc + +order[valCol],0);

			return [result];
		}
	},

	// Q3
	{
		template: "What are the CM&percnt; at True and Transfer Cost, respectively for Model ID %ModelID in %Year?",
		calculateAnswer: function(id, year){
			// Get the column number for the data we need
			const descCol = getNumForColumn("Description");
			const valCol = getNumForColumn("Value");
			const yearCol = getNumForColumn("Year");
			const idCol = getNumForColumn("Model ID");
			const locCol = getNumForColumn("Onshore vs. Offshore");

			// Values we need to match
			const trueMatch = "CM% @ True Cost";
			const transferMatch = "CM% @ Transfer Cost";
			const locBadMatch = "Total Model";

			// Keep track of the sums and counts so we can get averages later
			const sumObject = {};
			sumObject[trueMatch] = {
				sum: 0,
				count: 0
			};
			sumObject[transferMatch] = {
				sum: 0,
				count: 0
			};


			// From the orders
			const result = masterData.orders
			// Keep the orders with correct description, location, version, model id, and year
			.filter(order => (order[descCol] == trueMatch  || order[descCol] == transferMatch) &&
							 order[locCol] != locBadMatch &&
							 order[idCol] == id &&
							 order[yearCol] == year)
			// Sum each of them
			.forEach(order => {
				// If there is a vlaue for this order
				if (order[valCol] != "0"){
					// Add it to the sum and increment the count for this description
					sumObject[order[descCol]].sum += +order[valCol];
					sumObject[order[descCol]].count++;
				}
			});

			// Calculate the averages (they are percentages, so multiply by 100 as well)
			const trueAvg = 100 * sumObject[trueMatch].sum / sumObject[trueMatch].count;
			const transferAvg = 100 * sumObject[transferMatch].sum / sumObject[transferMatch].count;

			// Return the averages
			return [trueAvg, transferAvg];
		}
	},

	// Q4
	{
		template: "Of the completed contracts, how many models have a %PosNeg Total Sales True-Up across all four years?",
		calculateAnswer: function(posneg){
			// Get the column number for the data we need
			const descCol = getNumForColumn("Description");
			const valCol = getNumForColumn("Value");
			const modelCol = getNumForColumn("Model ID");
			const locCol = getNumForColumn("Onshore vs. Offshore");
			const versionCol = getNumForColumn("Version");
			const tileCol = getNumForColumn("Tile_Num");

			// Values we need to match
			const descriptionMatch = "CTD US GAAP Sales True Up";
			const locMatch = "Total Model";
			const versionMatch = "Completed";
			const tileMatch = "1"

			// Later we can use this instead of an if statement
			const modifier = posneg == "positive" ? 1 : -1;

			// Store the true ups by model
			const trueUpSumByModel = {};

			// From the orders
			masterData.orders
			// Keep the ones that match description, are completed, are the total, and correct tile num
			.filter(order => order[descCol] == descriptionMatch &&
							 order[versionCol] == versionMatch &&
							 order[locCol] == locMatch && 
							 order[tileCol] == tileMatch)
			// For each order
			.forEach(order => {
				// Get data from order
				const model = order[modelCol];
				const value = +order[valCol];

				// if the model isn't registered
				if (!trueUpSumByModel.hasOwnProperty(model)){
					// register the model
					trueUpSumByModel[model] = 0;
				}
				// Add the value to it's sum
				trueUpSumByModel[model] += value;
			})

			// Keep track of how many match criteria
			let count = 0;
			for (model in trueUpSumByModel){
				count += modifier*trueUpSumByModel[model] > 0;
			}

			return [count];
		}
	},

	// Q5
	{
		template: "Which model ID has the %Placement largest overall impact (positive or negative) to revenue (Sales True-Up) in the %Region region in %Year",
		calculateAnswer: function(position, region, year){
			// Get the column number for the data we need
			const descCol = getNumForColumn("Description");
			const yearCol = getNumForColumn("Year");
			const valCol = getNumForColumn("Value");
			const regionCol = getNumForColumn("Region");
			const modelCol = getNumForColumn("Model ID");
			const locCol = getNumForColumn("Onshore vs. Offshore");
			const versionCol = getNumForColumn("Version");
			const tileCol = getNumForColumn("Tile_Num");

			// Values we need to match
			const descriptionMatch = "CTD US GAAP Sales True Up";
			const locMatch = "Total Model";
			const tileMatch = "1"

			// convert the position for ordinal to number
			// a.k.a. cut off the last two characters e.g. "st", "rd", "nd", and "th"
			position = +position.slice(0,-2);

			// Store the true ups by model
			const trueUpSumByModel = {};

			// From the orders
			masterData.orders
			// Keep the ones that match description, are completed, are the total, and correct tile num
			.filter(order => order[descCol] == descriptionMatch &&
							 order[yearCol] == year &&
							 order[locCol] == locMatch && 
							 order[tileCol] == tileMatch && 
							 order[regionCol] == region)
			// For each order
			.forEach(order => {
				// Get data from order
				const model = order[modelCol];
				const value = +order[valCol];

				// if the model isn't registered
				if (!trueUpSumByModel.hasOwnProperty(model)){
					// register the model
					trueUpSumByModel[model] = 0;
				}
				// Add the value to it's sum
				trueUpSumByModel[model] += value;
			});

			// Convert the data to a sortable format
			let orderedByImpact = [];
			for (model in trueUpSumByModel){
				orderedByImpact.push({
					"model": model,
					// We are checking for absolute impact
					"sum": Math.abs(trueUpSumByModel[model]), 
				});
			}

			// Sort the sums
			orderedByImpact = orderedByImpact.sort((a,b) => b.sum - a.sum)

			// Get the model in the correct position
			const result = orderedByImpact[position - 1].model;
			return [result];
		}
	},
];
