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

//Interval Updates Detail Component
app.get('/api/intervalDetails', (req, res) => {
	let { repoUrl, intervalNum, user } = req.query;
	Intervals.findAll({
		where: {
			intervalNum: 1,
			repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
			user: 'fredricklou523'
		}
	}).then(data => {
		var mostActive = {
				name: null,
				time: 0
			},
			mostIssue,
			idleCount = 0,
			idleBreak = 0,
			breakTotal = 0,
			idleRunning = 0,
			runningTotal = 0,
			wordCount = 0,
			columns = {
				fileName: null
			};

		data.forEach(item => {
			if (!columns[item.fileName]) {
				columns[item.fileName] = {
					'Running(Active)': 0,
					'Running(Idle)': 0,
					'Break(Active)': 0,
					'Break(Idle)': 0
				};
			}
			if (item.state === 'Running') {
				columns[item.fileName]['Running(Active)'] += item.time;
				columns[item.fileName]['Running(Idle)'] += item.idleTime;
				idleRunning += item.idleTime;
				runningTotal += item.time + item.idleTime;
			}
			if (item.state === 'Break') {
				columns[item.fileName]['Break(Active)'] += item.time;
				columns[item.fileName]['Break(Idle)'] += item.idleTime;
				idleBreak += item.idleTime;
				breakTotal += item.time + item.idleTime;
			}
			wordCount += item.wordCount;
		});

		var columnData = [
			Object.keys(columns),
			['Running(Active)'],
			['Running(Idle)'],
			['Break(Active)'],
			['Break(Idle)']
		];

		for (var file in columns) {
			let tempFile = 0;
			if (columns[file] != null) {
				if (columns[file]['Running(Active)'] !== undefined) {
					columnData[1].push(columns[file]['Running(Active)']);
				}
				if (columns[file]['Running(Idle)'] !== undefined) {
					columnData[2].push(columns[file]['Running(Idle)']);
				}
				if (columns[file]['Break(Active)'] !== undefined) {
					columnData[3].push(columns[file]['Break(Active)']);
				}
				if (columns[file]['Break(Idle)'] !== undefined) {
					columnData[4].push(columns[file]['Break(Idle)']);
				}
				tempFile +=
					columns[file]['Running(Active)'] + columns[file]['Break(Active)'];
			}

			if (tempFile > mostActive.time) {
				mostActive.time = tempFile;
				mostActive.name = file;
			}
		}

		function feedback() {
			let runningIdlePercent = (idleRunning / runningTotal) * 100;
			if (runningIdlePercent > 35) {
				return (
					"you've spent over " +
					runningIdlePercent.toFixed() +
					'% of your work time doing nothing, slacker'
				);
			}
			let breakIdlePercent = (idleBreak / breakTotal) * 100;
			if (breakIdlePercent < 90) {
				return (
					"Take a break! You've spent " +
					breakIdlePercent.toFixed() +
					'% of your break working!'
				);
			}
			return "Looks like you've spent your interval wisely, young padawan *insert yoda*";
		}

		var interval = {
			columns: columnData,
			groups: [
				['Running(Active)', 'Running(Idle)'],
				['Break(Active)', 'Break(Idle)']
			],
			reponame: data[0].repoName,
			wordCount: wordCount,
			idleTime: idleRunning + idleBreak,
			mostActive: mostActive.name,
			feedback: feedback()
		};
		res.send(interval);
	});
});

app.listen(process.env.PORT, () => {
	console.log(`App listening on port: ${process.env.PORT}`);
});
