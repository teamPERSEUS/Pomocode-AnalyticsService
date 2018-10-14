require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { Plan, Intervals } = require('../database/database');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//retreive data from GitHub microserver
app.post('/api/plannerMicro', (req, res) => {
	console.log(req.body.data);
	Plan.create(req.body).catch(err => {
		console.log('Error with Planner Micro table:', err);
		res.status(500).send('Error in obtaining Plan Data');
		throw err;
	});
});
//retrieve data from VS Code microserver
app.post('/api/vsCodeMicro', (req, res) => {
	console.log(req.body);
	Intervals.bulkCreate(req.body.data).catch(err => {
		console.log('Error with VSCode Micro table:', err);
		res.status(500).send('Error in obtaining VSCode Data');
		throw err;
	});
});

//send analytics data to Interval Updates
app.get('/api/docs', (req, res) => {
	console.log();
});

app.listen(process.env.PORT, () => {
	console.log(`App listening on port: ${process.env.PORT}`);
});
