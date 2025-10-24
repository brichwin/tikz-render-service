const express = require('express');
const cors = require('cors');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/render', express.json({ limit: '10kb' }));
app.use('/api/describe', express.json({ limit: '5mb' }));

// Default limit for other routes
app.use(express.json({ limit: '100kb' }));

app.use(rateLimiter);

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;