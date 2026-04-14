'use strict'

const PostService = require('../services/PostService')
const CategoryService = require('../services/CategoryService')

exports.index = async (req, res) => {
  const posts = await PostService.list()
  res.render('posts/index.njk', { posts, title: 'All Posts' })
}

exports.new = async (req, res) => {
  const categories = await CategoryService.list()
  res.render('posts/new.njk', { categories, title: 'New Post' })
}

exports.create = async (req, res) => {
  const { title, body, categoryId } = req.body
  try {
    const post = await PostService.create({ title, body, categoryId: categoryId || null })
    res.redirect(`/posts/${post.id}`)
  } catch (err) {
    const errors = PostService.validationErrors(err)
    const categories = await CategoryService.list()
    res.status(422).render('posts/new.njk', {
      title: 'New Post', errors, categories,
      values: { title, body, categoryId }
    })
  }
}

exports.show = async (req, res) => {
  const post = await PostService.find(req.params.id)
  res.render('posts/show.njk', { post, title: post.title })
}

exports.edit = async (req, res) => {
  const [post, categories] = await Promise.all([
    PostService.find(req.params.id),
    CategoryService.list()
  ])
  res.render('posts/edit.njk', { post, categories, title: `Editing: ${post.title}` })
}

exports.update = async (req, res) => {
  const { title, body, categoryId } = req.body
  try {
    const post = await PostService.update(req.params.id, {
      title, body, categoryId: categoryId || null
    })
    res.redirect(`/posts/${post.id}`)
  } catch (err) {
    const errors = PostService.validationErrors(err)
    const categories = await CategoryService.list()
    const post = { id: req.params.id, title, body, categoryId }
    res.status(422).render('posts/edit.njk', {
      title: `Editing: ${title}`, errors, post, categories
    })
  }
}

exports.destroy = async (req, res) => {
  await PostService.destroy(req.params.id)
  res.redirect('/posts')
}