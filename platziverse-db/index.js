/* A Simple IoT Platform - DB Module */
'use strict'

const setupDB = require('./lib/db')
const setupMetricModel = require('./models/metric')
const setupAgentModel = require('./models/agent')
const setupAgent = require('./lib/agent')
const setupMetric = require('./lib/metric')

const defaults = require('defaults')

module.exports = async function (config) {
  config = defaults(config, {
    dialect: 'sqlite',
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    },
    query: {
      raw: true
    }
  })
  const sequelize = setupDB(config)
  const AgentModel = setupAgentModel(config)
  const MetricModel = setupMetricModel(config)

  AgentModel.hasMany(MetricModel)
  MetricModel.belongsTo(AgentModel)

  await sequelize.authenticate()

  /* CAUTION : The property 'force' if set to true will overwrite
          the database if it already exists. */
  if (config.setup) {
    await sequelize.sync({ force: true })
  }
  const Agent = setupAgent(AgentModel)
  const Metric = setupMetric(MetricModel, AgentModel)

  return {
    Agent,
    Metric
  }
}
