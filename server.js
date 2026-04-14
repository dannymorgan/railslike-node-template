'use strict'

const express = require('express')
const nunjucks = require('nunjucks')
const methodOverride = require('method-override')
require('express-async-errors')

const { sequelize } = require('./app/models')
const routes = require('./config/routes')
const filters = require('./config/filters')

const app = express()

const nunjucksEnv = nunjucks.configure('app/views', {
  autoescape: true,
  express: app,
  watch: true,
  noCache: process.env.NODE_ENV !== 'production'
})

app.set('view engine', 'njk')

nunjucksEnv.addFilter('date', filters.date)
nunjucksEnv.addFilter('nl2br', filters.nl2br)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use('/', routes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).render('errors/500.njk', {
    title: 'Error', message: err.message
  })
})

const PORT = process.env.PORT || 3000

sequelize.authenticate()
  .then(() => {
    console.log('Postgres connected')
    app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Database connection error:', err)
    process.exit(1)
  })