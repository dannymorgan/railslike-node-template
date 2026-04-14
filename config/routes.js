'use strict'

const express = require('express')
const router = express.Router()
const postsController = require('../app/controllers/postsController')

router.get('/', (req, res) => res.redirect('/posts'))

router.get('/posts', postsController.index)
router.get('/posts/new', postsController.new)
router.post('/posts', postsController.create)
router.get('/posts/:id', postsController.show)
router.get('/posts/:id/edit', postsController.edit)
router.patch('/posts/:id', postsController.update)
router.delete('/posts/:id', postsController.destroy)

module.exports = router