require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { Plan, CodeAnalysis } = require('../database/database');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//retreive data from GitHub microserver
app.post('/gitHubMicro', (req, res) => {
  console.log(request.body)
});
//retrieve data from VS Code microserver


//send analytics data to Interval Updates


app.listen(process.env.PORT, () => {
  console.log(`App listening on port: ${process.env.PORT}`);
});
