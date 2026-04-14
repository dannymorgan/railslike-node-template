module.exports = {
  development: {
    username: process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME     || 'blog_development',
    host:     process.env.DB_HOST     || '127.0.0.1',
    dialect:  'postgres',
    logging:  console.log
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    dialect:  'postgres',
    logging:  false
  }
}