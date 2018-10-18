if (process.env.NODE_ENV !== 'production') require('dotenv').config();
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

app.get('/', (req, res) => {
  Plans.findAll().then(plans => {
    var planList = plans.map(plan => {
      return plan.get('git_id');
    });
    console.log(planList);
    res.send(planList);
  });
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
  // Last 3 Intervals
  // 	- all issues associated with each interval;
  const { userName } = req.query;

  UserIntervals.max('id', { where: { user: userName } }).then(maxId => {
    let intervals = [maxId, maxId - 1, maxId - 2];
    async function parse() {
      let dataArray = [];
      for (const interval of intervals) {
        await intervalIssues(interval);
      }
      async function intervalIssues(interval) {
        IntervalIssues.findAll({
          where: { UserIntervalId: interval },
          distinct: 'PlanId',
          attributes: [
            'totalActive',
            'totalIdle',
            'previousTotalActive',
            'previousTotalIdle'
          ],
          include: [
            {
              model: Plans,
              attributes: [
                'estimate_time',
                'title',
                'git_id',
                'repo_url',
                'reponame',
                'number'
              ]
            },
            { model: Intervals, attributes: ['intervalNum'] }
          ]
        }).then(data => {
          // res.send(data);
          var intervalObj = {};
          data.forEach(async issue => {
            async function objectBuilder() {
              // console.log(util.inspect(issue, false, null, true));
              if (!intervalObj.Plan) {
                intervalObj[issue.Plan.title] = {
                  columns: [
                    ['Plan', issue.Plan.estimate_time],
                    ['Time', issue.previousTotalActive],
                    [
                      'IntervalTime',
                      issue.totalActive - issue.previousTotalActive
                    ]
                  ],
                  groups: [['Time', 'IntervalTime']],
                  issueName: issue.Plan.title,
                  git_id: issue.Plan.git_id,
                  repo_url: issue.Plan.repo_url,
                  repoName: issue.Plan.reponame,
                  intervalNum: issue.Intervals[0].intervalNum,
                  number: issue.Plan.number
                };
              }
            }
            await objectBuilder();
          });
          dataArray.push(intervalObj);
          if (dataArray.length === 3) res.send(dataArray);
        });
      }
    }
    parse();
  });
});

app.post('/api/vsCodeMicro', (req, res) => {
  let data = req.body.data;

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
        totalActive: 0,
        totalIdle: 0,
        totalWordCount: 0,
        git_id: intervalItem.git_id,
        user: data[0].user
      };
    }

    IntervalIssuesObj[intervalItem.issue].totalActive +=
      intervalItem.time - intervalItem.idleTime;
    IntervalIssuesObj[intervalItem.issue].totalIdle += intervalItem.idleTime;
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
    .then(async UserIntervalData => {
      UserIntervalId = UserIntervalData.dataValues.id;
      for (var intIssue in IntervalIssuesObj) {
        console.log(intIssue);
        console.log('INTISSUE');
        await Plans.findOne({
          where: { git_id: IntervalIssuesObj[intIssue].git_id }
        }).then(async plansData => {
          console.log(plansData);
          console.log('PLANS DATA');
          if (plansData != null) {
            PlansIds[IntervalIssuesObj[intIssue].git_id] = plansData.get('id');
            IntervalIssuesObj[intIssue].PlanId = plansData.get('id');
          } else {
            PlansIds[IntervalIssuesObj[intIssue].git_id] = null;
            IntervalIssuesObj[intIssue].PlanId = null;
          }

          // console.log(
          // 	util.inspect(IntervalIssuesObj[intIssue], false, null, true)
          // );
          await IntervalIssues.findOne({
            where: { PlanId: IntervalIssuesObj[intIssue].PlanId },
            order: [['createdAt', 'DESC']],
            limit: 1
          }).then(async data => {
            if (data !== null) {
              IntervalIssuesObj[intIssue].previousTotalActive = data.get(
                'totalActive'
              );

              IntervalIssuesObj[intIssue].totalActive += data.get(
                'totalActive'
              );

              IntervalIssuesObj[intIssue].previousTotalIdle = data.get(
                'totalIdle'
              );
              IntervalIssuesObj[intIssue].totalIdle += data.get('totalIdle');
              IntervalIssuesObj[intIssue].previousTotalWordCount = data.get(
                'totalWordCount'
              );
              IntervalIssuesObj[intIssue].totalWordCount += data.get(
                'totalWordCount'
              );
              IntervalIssuesObj[intIssue].totalIntervals =
                data.get('totalIntervals') + 1;
            }
            IntervalIssuesObj[intIssue].UserIntervalId = UserIntervalId;
            console.log(util.inspect(IntervalIssuesObj, false, null, true));
            await IntervalIssues.create(IntervalIssuesObj[intIssue]).then(
              issue => {
                PlanIssueKeys[IntervalIssuesObj[intIssue].git_id] = issue.get(
                  'id'
                );
              }
            );
          });
        });
      }
    })
    .then(() => {
      data.forEach(activity => {
        activity.UserIntervalId = UserIntervalId;
        activity.PlanId = PlansIds[activity.git_id];
        // console.log(activity.PlanId + 'Activtity plan  ID');
        async function postIntervals() {
          activity.IntervalIssueId = PlanIssueKeys[activity.git_id];
          await Intervals.create(activity);
        }
        postIntervals();
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
