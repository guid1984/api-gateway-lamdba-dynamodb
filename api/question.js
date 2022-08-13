const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");

module.exports.handler = async (event) => {
	let question;

	if (event.body !== null && typeof event.body !== "undefined") {
		try {
			const json = JSON.parse(event.body);
			question = json.question;
		} catch (err) {
			console.log("JSON Parsing Error");
			console.log(err);
		}
	} else {
		question = event.question !== null ? event.question : "";
	}

	if (question === "") {
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: true,
				message: "Question required",
			}),
		};
	}

	const questionKey = uuidv4();

	try {
		let params = {
			TableName: "questions",
			Item: { id: questionKey.toString(), question },
		};

		await docClient.put(params).promise();

		params = {
			TableName: "questions",
		};

		const { Items: questions } = await docClient.scan(params).promise();

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: false,
				questionKey,
				questions,
			}),
		};
	} catch (err) {
		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: true,
				message: err,
			}),
		};
	}
};

module.exports.delete = async (event) => {
	let id;
	if (event.body !== null && typeof event.body !== "undefined") {
		try {
			const json = JSON.parse(event.body);
			id = json.id;
		} catch (err) {
			console.log("JSON Parsing Error");
			console.log(err);
		}
	} else {
		id = event.id !== null ? event.id : "";
	}

	try {
		console.log("Delete " + id);
		await ddb
			.deleteItem({
				Key: { id: { S: id } },
				TableName: "questions",
			})
			.promise();

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: false,
				id,
			}),
		};
	} catch (err) {
		return {
			statusCode: 500,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				error: true,
				message: err,
			}),
		};
	}
};
