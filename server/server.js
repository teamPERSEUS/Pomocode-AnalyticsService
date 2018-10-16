require('dotenv').config();
const util = require('util');
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const {
	Plans,
	Intervals,
	UserIntervals,
	IntervalIssues
} = require('../database/database');

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
// app.post('/api/vsCodeMicro', (req, res) => {
// 	console.log(req.body.data);
// 	Intervals.bulkCreate(req.body.data, { individualHooks: true }).catch(err => {
// 		console.log('Error with VSCode Micro table:', err);
// 		res.status(500).send('Error in obtaining VSCode Data');
// 		throw err;
// 	});
// });

app.get('/api/intervalUpdates', (req, res) => {
	Intervals.max('intervalNum', { where: { user: 'fredricklou523' } }).then(
		max =>
			Intervals.findAll({
				where: { intervalNum: [max - 2, max - 1, max] }
			}).then(data => {
				let issuesArray = data
					.map(issue => {
						return issue.issue;
					})
					.filter((v, i, a) => a.indexOf(v) === i);
				res.send(issuesArray);
			})
	);
});

app.post('/api/vsCodeMicro', (req, res) => {
	let data = req.body.data;
	// console.log(data);
	//  [
	// 	{
	// 		git_id: 'MDU6SXNzdWUzNjkzMjE1MDY=',
	// 		id: 6,
	// 		date: '2018-10-14T05:55:52.000Z',
	// 		user: 'fredricklou523',
	// 		repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
	// 		issue: 'No Issue Selected',
	// 		fileName: 'Untitled-1',
	// 		intervalNum: 3,
	// 		state: 'Running',
	// 		time: 12,
	// 		wordCount: 10,
	// 		idleTime: 4,
	// 		repoName: 'FRED REPO',
	// 		createdAt: '2018-10-14T05:55:52.000Z',
	// 		updatedAt: '2018-10-14T05:55:52.000Z'
	// 	},
	// 	{
	// 		git_id: 'MDU6SXNzdWUzNjkzMjE1MXNzdWUzNjkzMjE1MDY=',
	// 		id: 7,
	// 		date: '2018-10-14T05:55:52.000Z',
	// 		user: 'fredricklou523',
	// 		repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
	// 		issue: 'TBD',
	// 		fileName: 'Untitled-1',
	// 		intervalNum: 3,
	// 		state: 'Break',
	// 		time: 3,
	// 		wordCount: 0,
	// 		idleTime: 4,
	// 		repoName: 'FRED REPO',
	// 		createdAt: '2018-10-14T05:55:52.000Z',
	// 		updatedAt: '2018-10-14T05:55:52.000Z'
	// 	},
	// 	{
	// 		git_id: 'MDU6SXNzdWUzNjkzMjE1MXNzdWUzNjkzMjE1MDY=',
	// 		id: 7,
	// 		date: '2018-10-14T05:55:52.000Z',
	// 		user: 'fredricklou523',
	// 		repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
	// 		issue: 'No Issue Selected',
	// 		fileName: 'LEASETAFILE',
	// 		intervalNum: 3,
	// 		state: 'Running',
	// 		time: 50,
	// 		wordCount: 0,
	// 		idleTime: 4,
	// 		repoName: 'FRED REPO',
	// 		createdAt: '2018-10-14T05:55:52.000Z',
	// 		updatedAt: '2018-10-14T05:55:52.000Z'
	// 	}
	// ];
	var UserIntervalObj = {
		user: data[0].user,
		totalRunning: 0,
		totalRunningIdle: 0,
		totalBreak: 0,
		totalBreakIdle: 0,
		totalWordCount: 0
	};

	var IntervalIssuesObj = {};
	// 	{
	// git_Id: PlansData ID
	// 	}
	var PlansIds = {};
	// 	{
	// git_Id: IntervalIssuesID
	// 	}

	var PlanIssueKeys = {};
	var UserIntervalId;

	data.forEach(intervalItem => {
		//IntervalIssuesObj - creating template for each interval item
		if (!IntervalIssuesObj[intervalItem.issue]) {
			IntervalIssuesObj[intervalItem.issue] = {
				TotalActive: 0,
				TotalIdle: 0,
				totalWordCount: 0,
				git_id: intervalItem.git_id
			};
		}

		// //IntervalIssuesObj GIT ID
		// if (!PlansIds[intervalItem.git_id]) {
		// 	PlansIds[intervalItem.git_id] = null;
		// }

		IntervalIssuesObj[intervalItem.issue].TotalActive +=
			intervalItem.time - intervalItem.idleTime;
		IntervalIssuesObj[intervalItem.issue].TotalIdle += intervalItem.idleTime;
		IntervalIssuesObj[intervalItem.issue].totalWordCount +=
			intervalItem.wordCount;

		//UserIntervalObje
		if (intervalItem.state === 'Running') {
			UserIntervalObj.totalRunning += intervalItem.time;
			UserIntervalObj.totalRunningIdle += intervalItem.idleTime;
		} else {
			UserIntervalObj.totalBreak += intervalItem.time;
			UserIntervalObj.totalBreakIdle += intervalItem.idleTime;
		}
		UserIntervalObj.totalWordCount += intervalItem.wordCount;
	});

	//First save UserIntervals
	UserIntervals.create(UserIntervalObj)
		.then(UserIntervalData => {
			UserIntervalId = UserIntervalData.dataValues.id;

			for (var intIssue in IntervalIssuesObj) {
				Plans.findOne({
					where: { git_id: IntervalIssuesObj[intIssue].git_id }
				}).then(plansData => {
					// console.log(
					// 	plansData + 'AWEFHWEFWAIHEFAWIHFAWEIOFHAIHFAW adfASF A'
					// );
					PlansIds[IntervalIssuesObj[intIssue].git_id] = plansData.get('id');

					console.log(util.inspect(PlansIds, false, null, true));
					console.log('YAELLOAEFSF');

					IntervalIssuesObj[intIssue].PlanId = plansData.get('id');
					IntervalIssues.create(IntervalIssuesObj).then(issue => {
						PlanIssueKeys[IntervalIssuesObj[intIssue].git_id] = issue.get('id');
					});
				});
			}
		})
		.then(() => {
			data.forEach(activity => {
				activity.UserIntervalId = UserIntervalId;

				activity.PlanId = PlansIds[activity.git_id];
				console.log('HERERERERE');
				// console.log(PlansIds['MDU6SXNzdWUzNjkzMjIwMDc='] + 'PLAN ID FIRST');
				// console.log(activity.git_id + 'PLANID ACTIVITY');
				// console.log(Object.keys(PlansIds) + ' OBJECT KEYS');
				activity.IntervalIssueId = PlanIssueKeys[activity.git_id];
				Intervals.create(activity);
			});
		})
		.then(res.send(PlansIds));

	// IntervalActivity.forEach(activity => {
	// 	Plans.findOne({ where: { git_id: activity.git_id } })
	// 		.then(data => {
	// 			if (data) {
	// 				activity['PlanId'] = data.get('id');
	// 			} else {
	// 				activity['PlanId'] = null;
	// 			}
	// 			Intervals.create(activity);
	// 		})
	// 		.then(res.send('Committed VScode Data!'));
	// });
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
