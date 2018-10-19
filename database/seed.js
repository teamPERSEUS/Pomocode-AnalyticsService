const Axios = require('axios');

var run = {
  intervalNum: 1,
  user: 'fredricklou523',
  repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
  idleTime: 3,
  issue: 'VSCode Features',
  fileName:
    '/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/HistoricalTrends/HistoricalTrendsView.jsx',
  state: 'Running',
  time: 5,
  wordCount: 0,
  git_id: 'MDU6SXNzdWUzNjk0MTA5NzE='
};

var breakTime = {
  intervalNum: 1,
  user: 'fredricklou523',
  repoUrl: 'https://github.com/teamPERSEUS/Pomocode',
  idleTime: 0,
  issue: 'VSCode Features',
  fileName:
    '/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/HistoricalTrends/HistoricalTrendsView.jsx',
  state: 'Break',
  time: 0,
  wordCount: 0,
  git_id: 'MDU6SXNzdWUzNjk0MTA5NzE='
};

var files = [
  '/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/HistoricalTrends/HistoricalTrendsView.jsx',
  '/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/HistoricalTrends/App.jsx.jsx',
  '/Users/fredricklou/HackReactor/HR33/Thesis/Pomocode/src/presentational/HistoricalTrends/Charts.jsx'
];

var intervals = [];
//create a set of intervals for a day
for (var d = 5; d < 7; d++) {
  for (var i = 1; i < 3; i++) {
    var day = d < 10 ? '0' + d : d;
    var newDate = new Date(
      day + ' October 2018 14:4' + i + ' UTC'
    ).toISOString();
    let interval = [];
    run.time = Math.floor(Math.random() * 1000);
    run.idleTime = Math.floor(Math.random() * 180);
    breakTime.time = Math.floor(Math.random() * 180);
    breakTime.idleTime = Math.floor(Math.random() * 180);
    run.fileName = files[Math.floor(Math.random() * 3)];
    breakTime.fileName = files[Math.floor(Math.random() * 3)];
    run.wordCount = Math.floor(Math.random() * 180);
    breakTime.wordCount = Math.floor(Math.random() * 80);
    run.intervalNum = i;
    breakTime.intervalNum = i;
    run.date = newDate;
    breakTime.date = newDate;
    let newRun = Object.assign({}, run);
    let newBreak = Object.assign({}, breakTime);
    interval.push(newRun);
    interval.push(newBreak);
    intervals.push(interval);
  }
}

exports.seedDB = async function() {
  console.log(intervals);

  for (const interval of intervals) {
    await Axios.post(`http://localhost:4002/api/vsCodeMicro`, {
      data: interval
    })
      .then(() => res.send('SEEDED'))
      .catch(function(error) {
        console.log(error + 'error sending to Analytics server');
      });
  }
};
