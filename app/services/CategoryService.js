'use strict'

const { Category } = require('../models')

class CategoryService {
  static async list() {
    return Category.findAll({ order: [['name', 'ASC']] })
  }

  static async find(id) {
    const category = await Category.findByPk(id)
    if (!category) throw Object.assign(new Error('Category not found'), { status: 404 })
    return category
  }
}

module.exports = CategoryService