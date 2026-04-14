'use strict'

const { Sequelize } = require('sequelize')
const config = require('../../config/database')[process.env.NODE_ENV || 'development']

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

const Category = require('./Category')(sequelize)
const Post = require('./Post')(sequelize)

// Associations
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' })

module.exports = { sequelize, Category, Post }