require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const Queries = require('../utils/queries');

//retreive data from GitHub microserver

//retrieve data from VS Code microserver