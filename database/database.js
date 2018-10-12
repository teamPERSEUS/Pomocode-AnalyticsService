const Sequelize = require('sequelize');
var db = new Sequelize('pomo_analysis', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

// NOTE: Create DB 'pomo_analysis' in mysql before running
db.authenticate()
  .then(() => {
    console.log('Connection has been established successfully')
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

/* DB --SCHEMA-- */
// vsdata table
const CodeAnalysis = db.define('vscode', {
  git_id: {
    type: Sequelize.INTEGER,
    foreignKey: true
  },
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: Sequelize.DATEONLY,
  user: Sequelize.STRING,
  repo: Sequelize.STRING,
  issue: Sequelize.STRING,
  fileName: Sequelize.STRING,
  intervalNum: Sequelize.INTEGER,
  state: Sequelize.STRING,
  time: Sequelize.INTEGER,
  wordCount: Sequelize.INTEGER,
});

// plandata table
const Plan = db.define('plandata', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  git_id: {
    type: Sequelize.STRING,
    unique: true,
  },
  username: Sequelize.STRING,
  reponame: Sequelize.STRING,
  number: Sequelize.INTEGER,
  title: Sequelize.STRING,
  body: Sequelize.TEXT("long"),
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

// create/connect to tables in the db
db.sync();

module.exports.CodeAnalysis = CodeAnalysis;
module.exports.Plan = Plan;
