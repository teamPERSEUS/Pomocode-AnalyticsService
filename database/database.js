const Sequelize = require('sequelize');
var db = new Sequelize('analysis', 'root', '', {
	host: 'localhost',
	dialect: 'mysql'
});

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

Plans.sync();
Intervals.sync();

module.exports.db = db;
module.exports.Intervals = Intervals;
module.exports.Plans = Plans;
