'use strict'

const { Post, Category } = require('../models')

class PostService {
  static async list() {
    return Post.findAll({
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']]
    })
  }

  static async find(id) {
    const post = await Post.findByPk(id, {
      include: [{ model: Category, as: 'category' }]
    })
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
    return post
  }

  static async create(attrs) {
    return Post.create(attrs)
  }

  static async update(id, attrs) {
    const post = await this.find(id)
    return post.update(attrs)
  }

  static async destroy(id) {
    const post = await this.find(id)
    return post.destroy()
  }

  static validationErrors(err) {
    if (err.name !== 'SequelizeValidationError') throw err
    return err.errors.map(e => e.message)
  }
}

module.exports = PostService