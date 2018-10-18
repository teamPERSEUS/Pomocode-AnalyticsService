if (process.env.NODE_ENV !== 'production') require('dotenv').config();
const Sequelize = require('sequelize');

var db;
if (process.env.NODE_ENV !== 'production') {
  db = new Sequelize('analysis', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
  });
} else {
  db = new Sequelize(process.env.DATABASE_URL);
}

// NOTE: Create DB 'pomo_analysis' in mysql before running
db.authenticate()
  .then(() => {
    console.log('Connection has been established successfully');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

/* DB --SCHEMA-- */
// vsdata table
const Intervals = db.define('Intervals', {
  date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  user: Sequelize.STRING,
  repoUrl: Sequelize.STRING,
  issue: Sequelize.STRING,
  fileName: Sequelize.STRING,
  intervalNum: Sequelize.INTEGER,
  state: Sequelize.STRING,
  time: Sequelize.INTEGER,
  wordCount: Sequelize.INTEGER,
  idleTime: Sequelize.INTEGER
});

const UserIntervals = db.define('UserIntervals', {
  user: Sequelize.STRING,
  totalRunning: Sequelize.INTEGER,
  totalRunningIdle: Sequelize.INTEGER,
  totalBreak: Sequelize.INTEGER,
  totalBreakIdle: Sequelize.INTEGER,
  totalWordCount: Sequelize.INTEGER
});

const IntervalIssues = db.define('IntervalIssues', {
  totalActive: Sequelize.INTEGER,
  totalIdle: Sequelize.INTEGER,
  totalWordCount: Sequelize.INTEGER,
  previousTotalActive: { type: Sequelize.INTEGER, defaultValue: 0 },
  previousTotalIdle: { type: Sequelize.INTEGER, defaultValue: 0 },
  previousTotalWordCount: { type: Sequelize.INTEGER, defaultValue: 0 },
  totalIntervals: { type: Sequelize.INTEGER, defaultValue: 1 },
  user: Sequelize.STRING
});

// plandata table
const Plans = db.define('Plans', {
  git_id: {
    type: Sequelize.STRING
  },
  repo_url: Sequelize.STRING,
  organization: Sequelize.STRING,
  username: Sequelize.STRING,
  reponame: Sequelize.STRING,
  number: Sequelize.INTEGER,
  title: Sequelize.STRING,
  body: Sequelize.TEXT('long'),
  complete: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  planned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  estimate_start_date: Sequelize.DATEONLY,
  estimate_end_date: Sequelize.DATEONLY,
  estimate_time: Sequelize.FLOAT,
  time_remaining: Sequelize.FLOAT,
  startdate: Sequelize.DATEONLY,
  enddate: Sequelize.DATEONLY
});

Plans.hasMany(Intervals);
Intervals.belongsTo(Plans);

UserIntervals.hasMany(Intervals);
Intervals.belongsTo(UserIntervals);

IntervalIssues.hasMany(Intervals);
Intervals.belongsTo(IntervalIssues);

UserIntervals.hasMany(IntervalIssues);
IntervalIssues.belongsTo(UserIntervals);

Plans.hasMany(IntervalIssues);
IntervalIssues.belongsTo(Plans);

UserIntervals.sync();
Plans.sync();
IntervalIssues.sync();
Intervals.sync();

module.exports.db = db;
module.exports.Plans = Plans;
module.exports.Intervals = Intervals;
module.exports.UserIntervals = UserIntervals;
module.exports.IntervalIssues = IntervalIssues;
