```
1. createdb blog_development
2a. npx sequelize-cli migration:generate --name create-categories
2b. npx sequelize-cli migration:generate --name create-posts
3. npx sequelize-cli seed:generate --name seed-categories
4. npm run db:seed
```