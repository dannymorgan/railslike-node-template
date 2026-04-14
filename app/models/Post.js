'use strict'

const { DataTypes, Model } = require('sequelize')

module.exports = (sequelize) => {
  class Post extends Model {
    get excerpt() {
      return this.body.length > 150
        ? this.body.slice(0, 150) + '…'
        : this.body
    }
  }

  Post.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Title can't be blank" } }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: "Body can't be blank" } }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, { sequelize, modelName: 'Post' })

  return Post
}