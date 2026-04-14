'use strict'

const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class Category extends Model { }

  Category.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Name can't be blank" } }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: { msg: "Slug can't be blank" } }
    }
  }, { sequelize, modelName: 'Category' })

  return Category
}