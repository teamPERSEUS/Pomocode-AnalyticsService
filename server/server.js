require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { Plans, Intervals } = require('../database/database');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//CORS headers
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept'
	);
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', '*');
	next();
});

//retreive data from GitHub microserver
app.post('/api/plannerMicro', (req, res) => {
	console.log(req.body.data);
	Plans.create(req.body).catch(err => {
		console.log('Error with Planner Micro table:', err);
		res.status(500).send('Error in obtaining Plan Data');
		throw err;
	});
});
//retrieve data from VS Code microserver
app.post('/api/vsCodeMicro', (req, res) => {
	console.log(req.body.data);
	Intervals.bulkCreate(req.body.data, { individualHooks: true }).catch(err => {
		console.log('Error with VSCode Micro table:', err);
		res.status(500).send('Error in obtaining VSCode Data');
		throw err;
	});
});

app.post('/test', (req, res) => {
	let IntervalActivity = [{
		intervalNum: 1,
		user: 'https://github.com/teamPERSEUS/Pomocode',
		repoUrl: 4,
		idleTime: 0,
		issue: 'TBD',
		fileName:
			'/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/IntervalUpdates/IntervalList/Interval/IntervalView.jsx',
		state: 'Break',
		time: 3,
		wordCount: 3,
		git_id: 'MDU6SXNzdWUzNjkzMjIwMDc=',
	},
	{
		intervalNum: 1,
		user: 'https://github.com/teamPERSEUS/Pomocode',
		repoUrl: 4,
		idleTime: 0,
		issue: 'TBD',
		fileName:
			'/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/IntervalUpdates/IntervalList/Interval/IntervalView.jsx',
		state: 'Running',
		time: 7,
		wordCount: 13,
		git_id: 'MDU6SXNzdWUzNjkzMjIwMDc=',
	}];

	IntervalActivity.forEach((activity) => {
		Plans.findOrCreate({ where: { git_id: activity.git_id } })
			.spread((plan, created) => {
				activity['PlanId'] = plan.get('id');
				Intervals.create(activity);
			});
	});

	res.send('INTERVALS');
	// Plans.findOrCreate({ where: { git_id: obj.git_id } }).spread(
	// 	(plan, created) => {
	// 		obj['PlanId'] = plan.get('id');
	// 		Intervals.create(obj).then(res.send('INTERVALS'));
	// 	}
	// );
});

app.get('/api/intervalUpdates', (req, res) => {
	Intervals.findAll({
		include: [{ model: Plans }]
	}).then(data => {
		res.send(data);
	});
});

//Interval Updates Detail Component
app.get('/api/intervalDetails', (req, res) => {
	let { intervalNum, repoUrl, user } = req.query;
	Intervals.findAll({
		where: {
			intervalNum: intervalNum,
			repoUrl: repoUrl,
			user: user
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
		console.log(interval);
		res.send(interval);
	});
});

app.listen(process.env.PORT, () => {
	console.log(`App listening on port: ${process.env.PORT}`);
});
