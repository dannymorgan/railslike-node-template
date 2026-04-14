# Railslike node template

The purpose of this repo is really just an excercise for myself to see how close
i could get to the famous Rails 15 minute blog demo. I didn't manage it, in
fact, this took me 31 minutes and is missing a LOT of what makes Rails good, but
it does have CRUD for blog posts, and i did add a categories association for
good measure.

Below, i will document the steps i used to set this up, and if you're interested
in this sort of set up, i'd recommend doing it yourself, as it's probably more
useful for you to understand what the moving parts are. That said, if you're
familiar with Rails (or things like Rails, like Laravel) you could probably pick
this up as is and run with it.

## Deps

The only things you need to get this set up are Node 20.x, npm 10.x (which
should come with node), and Postgres (probably 15/16 at least, i'm using 18.3).
There are package deps that i will cover as they come up.

## Steps

Start by scaffolding a project directory:

```
app/
  controllers/
  models/
  services/
  views/
config/
db/
  migrations/
  seeds/
public/
```

Then run `npm init` and follow the steps til you get a package.json file.

### Package deps

We need several packages installed in production:

1. express - Our web framework, covers http/routing/middleware. Essentially our
   Rails/Rack.
2. nunjucks - Our templating engine. Handles `extends` `block` `include`.. Our
   ERB.
3. sequelize - Our ORM. Gives us models, associations, validations, query
   interface. Our ActiveRecord.
4. pg - The postgres driver. Sequelize won't talk to postgres dirctly, it hands
   off to this. We don't use it, it just needs to be there.
5. pg-hstore - For serializing and deserializing JSON data to postgres hstore
   format. Again, we don't use it, but sequelize will when dealing with
   postgres.
6. express-async-errors - Patches express to catch errors thrown inside async
   functions and then pass them to our error handler. Without it all async
   promise rejections won't be passed to express' error handler, and failing
   requests will just hang.
7. method-override - For PATCH and DELETE requests we use a hidden `_method`
   form field. Same thing rails does under the hood - this just let's us support
   verbs that aren't GET and POST.

```bash
npm install express nunjucks sequelize pg pg-hstore express-async-errors method-override
```

We also need just a couple of dev dependencies alongside them:

1. nodemon - rails server picks up changes and hot reloads, node doesn't. This
   just adds that functionality.
2. sequelize-cli - The command line tool that gives us railslike commands
   (db:migrate db:seed migration:generate etc)

```bash
npm install --save-dev nodemon sequelize-cli
```

### Scripts

You don't actually need any of these, but Node convention is to add scripts from
dependencies into your package.json file and then run them all via your package
manager (in this case, npm).

In your package.json file, you'll see a "scripts" object. It's JSON, treat it
like a Hash, the key is the command you run, the value is the command it runs.

The first one we need to add is `"start"` that runs `"node server.js"`. This
means when we run `npm run start` from the terminal, npm actually runs
`node server.js` for us. This is the command we run in production.

Locally, we want to use nodemon instead of node directly, because nodemon gives
us our hot reload, so we add another script `"dev"` that runs
`"nodemon server.js"` instead. We run `npm run dev` and npm runs
`nodemon server.js`.

We also want to set scripts up for our sequelize-cli commands, mostly so the
syntax is familiar, but also because it means a) we can reference package.json
for a reminder and b) we're only ever really typing npm run where we would type
rails. Add a `"db:migrate"` that runs `"sequelize-cli db:migrate"`, a
`"db:migrate:undo"` that runs `"sequelize-cli db:migrate:undo"`, and a
`"db:seed"` that runs `"sequelize-cli db:seed:all"`.

The scripts object in package.json should now look like this:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "db:migrate": "sequelize-cli db:migrate",
  "db:migrate:undo": "sequelize-cli db:migrate:undo",
  "db:seed": "sequelize-cli db:seed:all"
}
```

### Setting up sequelize

Rails knows where to find `db/migrate` and `app/models` live by convention, but
Node (and therefore sequelize) aren't like that. We tell sequelize where to find
what it needs by making a file called `.sequelizerc` at the project root, which
looks like this:

```js
const path = require("path");

module.exports = {
  "config": path.resolve("config", "database.js"),
  "models-path": path.resolve("app", "models"),
  "seeders-path": path.resolve("db", "seeds"),
  "migrations-path": path.resolve("db", "migrations"),
};
```

### Database config

You probably saw in the sequelize setup we referenced a file at
`config/database.js` that doesn't exist yet. This is functionally equivalent to
a database.yml file, only our environments go in the same place.

We start by defining the object that the module exports (literally
`module.exports = {}`), and inside there we want one object for development, and
one object for production - each of which gets a username, password, database
(name), host, dialect (postgres), and logging strategy.

Mine is set up like this, yours might not be:

```js
module.exports = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "blog_development",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres",
    logging: console.log,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  },
};
```

After that's done, we want to actually generate our `blog_development` database.
In rails, we could use `rails db:create`, and here we can just use the CLI that
comes with postgres. If you called your database `blog_development` like i did,
then run `createdb blog_development`.

In some environments (fresh ubuntu for sure) Postgres will set up a system user
called `postgres` and by default that'll be the only user allowed to create
databases. If the command above gave you permissions errors, you're probably
here. You have two options, you can either run it as the postgres user:

```bash
sudo -u postgres createdb blog_development
```

Or, you can create a postgres role that matches your system username, which
might be more convenient if you plan to build multiple projects this way:

```bash
sudo -u postgres createuser --superuser ${whoami}
createdb blog_development
```

### Generating our migrations

A couple of things to talk about here, first why we didn't alias these
generators, and second why we generate them and fill them in (which might be
against a pattern you are used to in Rails).

We didn't add a script for the generators because they take a `--name` argument
that will always change. Notice that the ones we did add have fixed, repeatable
behaviour. Since `--name` is always different, there's nothing useful to
abstract here, npx just let's us run the CLI directly without it needing to be
in those scripts or globally installed, because the `npx` keyword finds it in
our `node_modules/.bin` and runs it from there. This might sound unintuitive,
but it's really the same reason we'd run `rails generate migration` instead of
wrapping it in a rake task.

As for why we generate and fill them in, my opinion is that the packages we'd
need to add for parity with the (very good, and underrated) rails generators
(like `sequelize-cli-generate-migration`) just aren't mature or widely adopted
enough, because that's not the way the node community likes to build. It takes
some getting used to, but remember that the comforts of Rails rely heavily on
the communities readiness to adopt convention. It's not hard to get used to, so
i leave it out.

There is an equivalent to the `rails g model` command in sequelize-cli, but i'm
going to be using a service object pattern in this repo, so i'm avoiding that
too. If you'd rather do that,
[here it is in the docs](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-model-and-migration).

That said, generating timestamped migration file is actually pretty easy, just
run:

```bash
npx sequelize-cli migration:generate --name create-categories
npx sequelize-cli migration:generate --name create-posts
```

It'll create two migration files for you, and it'll put them in db/migrations/
because that's what our .sequelizerc file tells it they belong.

The pattern should be familiar. We get a module.exports with an up and a down.
Down will typically just be `await queryInterface.dropTable('Categories')`, but
more advanced use cases are fine here too. If that's down, you can probably
guess that up is
`await queryInterface.createTable('Categories', { // columns })`. I'll put
examples of what i used in this template below, but i'd recommend the
[sequelize docs on the migration skeleton](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-model-and-migration)
if you actually want to know what's going on.

In the create-categories migration:

```js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Categories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Categories");
  },
};
```

And, in the create-posts migration:

```js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Posts", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "Categories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("Posts");
  },
};
```

Now, you can run the migration script, which for us is `npm run db:migrate`.
You'll see a lot more noise than you are used to with rails, but you're looking
for lines like `== 20260414175643-create-categories: migrated (0.015s)` to show
you that it's done, and if you want to confirm then you can run `\dt` from a
psql session, and you should see both your tables and a sequelize meta table.

### Seeds

Just like our migrations, sequelize cli also contains a generator for
timestamped seed files. Something to be aware of here is that seed order isn't
guaranteed by the generated timestamp when you run our seed command. In
practice, it usually does, but if you have seeds with dependencies (like we have
categories that must exist before posts), it's a good idea to be explicit. In
that case, either keep seeds in a single file, or name them with a manual prefix
to keep the order (like 00-seed-flat-posts.js 01-seed-categories.js,
02-seed-categorised-posts.js, etc.).

Also like migrations, we didn't make a script for generating seeds because the
name is flexible. We only need to run a seeder for categories, not posts, so
therefore the command we want to run is
`npx sequelize-cli seed:generate --name seed-categories`, which will give us our
timestamped seed file under our `db/seeds/` dir.

Our seed files also include an up and down method, and we use either bulkInsert
or bulkDelete respectively to add or remove seed data,
[as defined in the sequelize docs](https://sequelize.org/docs/v6/other-topics/migrations/#creating-the-first-seed).
Since our only categories are seeded categories, we can safely just delete them
all on seed down, (which we haven't added a script for, because it's uncommon).

That means our seed categories file looks like this:

```js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Categories", [
      {
        name: "General",
        slug: "general",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Technology",
        slug: "technology",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Philosophy",
        slug: "philosophy",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Poetry",
        slug: "poetry",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Categories", null, {});
  },
};
```

When we're ready to load our seeds into the database, we just run our seed
script with `npm run db:seed`.

### Models

It's worth saying here that you can stick a lot of logic in your model files
like most users of rails do, but over the past few years i've increasingly
embraced service objects for what i'd traditionally do in models. It works even
better in this node setup, because you might notice we don't have our
`schema.rb` file, and the model files are where a Node developer would expect to
find your schema.

Controversial, i know, but it fits what i do in rails, and fits a node project
better, so that's what i'm doing here. You do what you want. Either way, start
by making a `Category.js` and a `Post.js` file under `app/models`.

My category model looks like this:

```js
"use strict";

const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Category extends Model {}

  Category.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Name can't be blank" } },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { notEmpty: { msg: "Slug can't be blank" } },
    },
  }, { sequelize, modelName: "Category" });

  return Category;
};
```

And, my post model looks like this:

```js
"use strict";

const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
  class Post extends Model {
    get excerpt() {
      return this.body.length > 150 ? this.body.slice(0, 150) + "…" : this.body;
    }
  }

  Post.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: { msg: "Title can't be blank" } },
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: "Body can't be blank" } },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, { sequelize, modelName: "Post" });

  return Post;
};
```

That `excerpt` method could've just as easily gone into a post service we'll be
making later, but it's here so you can see what you'd need to do if you're
trying to stick closer to traditional rails conventions than i am.

I think this step marks our first major diversion from rails. Those model files
are currently useless, nothing is consuming them right now, we need to
"register" them, which we're going to do by creating an `index.js` file under
`app/models`.

In that file, we're going to grab our database config, and set up an instance of
`Sequelize` (our ORM, like ActiveRecord). Then, we're going to tell it what
Category and Post are, and since we can, we're going to centralize our
associations here. Finally, we'll export our Sequelize instance and both models.

That looks like this:

```js
"use strict";

const { Sequelize } = require("sequelize");
const config =
  require("../../config/database")[process.env.NODE_ENV || "development"];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const Category = require("./Category")(sequelize);
const Post = require("./Post")(sequelize);

// Associations
Post.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Post, { foreignKey: "categoryId", as: "posts" });

module.exports = { sequelize, Category, Post };
```

### Service objects

I love them, i overuse them, and you can't stop me. I'm making service objects
for all of our models, because our models are doing the job of a schema, and our
controllers are sacred. That means, if you are following me, you'll want a
`CategoryService.js` and a `PostService.js` in `app/services`.

Our categories are pre-defined in our seeds, so we only need to account for read
actions. In Node projects, the convention for our ActiveRecord `.all` is a
method named `.list()`, but `.find()` still works, so we just need a
`CategoryService` class with a static list and a static find method. Here's
mine:

```js
"use strict";

const { Category } = require("../models");

class CategoryService {
  static async list() {
    return Category.findAll({ order: [["name", "ASC"]] });
  }

  static async find(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      throw Object.assign(new Error("Category not found"), { status: 404 });
    }
    return category;
  }
}

module.exports = CategoryService;
```

Our posts, on the otherhand, are pure CRUD. That means they additionally require
an `create`, `update`, and `destroy` method, and we're going to add a method to
give us back any validation errors from Sequelize as well by just mapping them
to an array of their messages. Don't forget, we'll also need to include our
Category model here if we want category to be returned with our posts.

In practice, our post service looks like this:

```js
"use strict";

const { Post, Category } = require("../models");

class PostService {
  static async list() {
    return Post.findAll({
      include: [{ model: Category, as: "category" }],
      order: [["createdAt", "DESC"]],
    });
  }

  static async find(id) {
    const post = await Post.findByPk(id, {
      include: [{ model: Category, as: "category" }],
    });
    if (!post) {
      throw Object.assign(new Error("Post not found"), { status: 404 });
    }
    return post;
  }

  static async create(attrs) {
    return Post.create(attrs);
  }

  static async update(id, attrs) {
    const post = await this.find(id);
    return post.update(attrs);
  }

  static async destroy(id) {
    const post = await this.find(id);
    return post.destroy();
  }

  static validationErrors(err) {
    if (err.name !== "SequelizeValidationError") throw err;
    return err.errors.map((e) => e.message);
  }
}

module.exports = PostService;
```

Unlike our models, we don't need an index.js file under services because we'll
be grabbing the service we need directly when we need it.

### Routes

We'll put our routes file in `config/routes.js` because that's what we're used
to. Inside that file, we'll want to get express, use it to create a router, and
then grab a posts controller (that we'll build shortly after) to tell the router
which action each path routes to.

A potential gotcha here is that rails knows what the root path is, that's why
you can use `root` in your `config/routes.rb`. In this project, we just have to
remember to manually assign `GET '/'` to a controller action, or what i'm
actually going to do is just redirect it to `/posts`.

That, in my case, looks like this:

```js
"use strict";

const express = require("express");
const router = express.Router();
const postsController = require("../app/controllers/postsController");

router.get("/", (req, res) => res.redirect("/posts"));

router.get("/posts", postsController.index);
router.get("/posts/new", postsController.new);
router.post("/posts", postsController.create);
router.get("/posts/:id", postsController.show);
router.get("/posts/:id/edit", postsController.edit);
router.patch("/posts/:id", postsController.update);
router.delete("/posts/:id", postsController.destroy);

module.exports = router;
```

### Controllers

Controllers here perform the same function they are expected to perform in
rails, that is, take a request, and give it a useful response. We've already
extracted our business logic to services, so really all we're doing is consuming
the action, calling the service, and then rendering or redirecting.

Unlike rails, our controllers actions can't intuit which view might belong to
which action, so we'll need to define the view for all of them. This trips me up
plenty, so double check it if your routing isn't going anywhere useful.

Since all of our routes point to posts controller actions, we only need a posts
controller, however we do need to use both the post service and the category
service within it. Given that, create a `postsController.js` file under
`app/controllers`, and the first thing we want to do in it is require both
category and post services.

Next, we create an export for each action. Our first is `postsController.index`,
so therefore our first export follows the shape:

```js
exports.index = async (req, res) => {
  const posts = await PostService.list();
  res.render("posts/index.njk", { posts, title: "All Posts" });
};
```

Which is not all that dissimilar to what you'd expect to find in a rails
project. Our first major difference comes with error handling in the create
action. In rails we rescue, in node we `try` to do something, and we `catch` the
failure.

Generally speaking there are two scenarios in which you might want to catch an
error, those being either that you can do something with the error, or (much
more sparingly) that the action is best-effort and failures shouldn't bubble
anywhere else.

In practice, our posts controller looks like this:

```js
"use strict";

const PostService = require("../services/PostService");
const CategoryService = require("../services/CategoryService");

exports.index = async (req, res) => {
  const posts = await PostService.list();
  res.render("posts/index.njk", { posts, title: "All Posts" });
};

exports.new = async (req, res) => {
  const categories = await CategoryService.list();
  res.render("posts/new.njk", { categories, title: "New Post" });
};

exports.create = async (req, res) => {
  const { title, body, categoryId } = req.body;
  try {
    const post = await PostService.create({
      title,
      body,
      categoryId: categoryId || null,
    });
    res.redirect(`/posts/${post.id}`);
  } catch (err) {
    const errors = PostService.validationErrors(err);
    const categories = await CategoryService.list();
    res.status(422).render("posts/new.njk", {
      title: "New Post",
      errors,
      categories,
      values: { title, body, categoryId },
    });
  }
};

exports.show = async (req, res) => {
  const post = await PostService.find(req.params.id);
  res.render("posts/show.njk", { post, title: post.title });
};

exports.edit = async (req, res) => {
  const [post, categories] = await Promise.all([
    PostService.find(req.params.id),
    CategoryService.list(),
  ]);
  res.render("posts/edit.njk", {
    post,
    categories,
    title: `Editing: ${post.title}`,
  });
};

exports.update = async (req, res) => {
  const { title, body, categoryId } = req.body;
  try {
    const post = await PostService.update(req.params.id, {
      title,
      body,
      categoryId: categoryId || null,
    });
    res.redirect(`/posts/${post.id}`);
  } catch (err) {
    const errors = PostService.validationErrors(err);
    const categories = await CategoryService.list();
    const post = { id: req.params.id, title, body, categoryId };
    res.status(422).render("posts/edit.njk", {
      title: `Editing: ${title}`,
      errors,
      post,
      categories,
    });
  }
};

exports.destroy = async (req, res) => {
  await PostService.destroy(req.params.id);
  res.redirect("/posts");
};
```

We'll make those views soon.

### Filters

Helper methods are great in rails, and i don't think i'd want to go without
them, but i have had a hard time figuring out the best place to put them because
the helper pattern doesn't really seem to fit the way Nunjucks wants us to use
them, which is to register them explicitly with Nunjucks in the server before we
use them in tempalates.

Given that, where i settled was the `config` directory, and since nunjucks calls
them filters, i put them in `config/filters.js`.

Our views will need two helpers, one to tell it how to format a date, and one to
replace newlines with html `<br>`s. So, in `config/filters.js` just export a
date function that calls the native `toLocaleDateString` with a sensible config
on a given date value, and then export a `nl2br` function that replaces `\n`
with `<br>`.

The problem with a `nl2br` method that does just that, is that for it to work in
nunjucks we have to explicitly allow raw html with it's built in `safe` filter,
which is equivalent to rails' `html_safe`. If you've been around rails for some
time, you might know that this opens up a huge vulnerability for xss, and in
rails you'd solve that by calling `html_escape` first (or `h`). We'll have to do
that ourselves, so actually our `nl2br` filter will also need to replace `&`,
`<`, and `>` before we replace `\n`.

That makes our filters look like this:

```js
exports.date = function (value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

exports.nl2br = function (value) {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
};
```

Which we can easily call in views like this: `{{ post.body | nl2br | safe }}`

### Server

The only thing left to do before we start building out views is to set up our
server. In node, the convention is a `server.js` file at root, and that's what
we set up ages ago in our `package.json` scripts.

Inside that server file, we'll want to do several things:

- Bring in all of our server dependencies explicitly
- Create an instance of our app
- Set up a nunjucks view environment, and then set our view engine to njk
- Register our custom nunjucks filters
- Set up express middleware
- Point the app at our routes file
- Manage fatal errors
- Define our port
- Connect to the database
- Boot the app

All of that sounds like a lot, but one of the reasons i like this template is
that it's all pretty concise, all pretty easy to follow, and that means this
centralization stops being a burden and starts being an asset. The entirety of
our `server.js` file looks like this:

```js
"use strict";

const express = require("express");
const nunjucks = require("nunjucks");
const methodOverride = require("method-override");
require("express-async-errors");

const { sequelize } = require("./app/models");
const routes = require("./config/routes");
const filters = require("./config/filters");

const app = express();

const nunjucksEnv = nunjucks.configure("app/views", {
  autoescape: true,
  express: app,
  watch: true,
  noCache: process.env.NODE_ENV !== "production",
});

app.set("view engine", "njk");

nunjucksEnv.addFilter("date", filters.date);
nunjucksEnv.addFilter("nl2br", filters.nl2br);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use("/", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render("errors/500.njk", {
    title: "Error",
    message: err.message,
  });
});

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
  .then(() => {
    console.log("Postgres connected");
    app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
```

You can boot the app here with `npm run dev`. You'll crash if you try to hit a
route in the browser because we have no views, but you should see it connect to
postgres in the console and let you know if the app started running on your
defined port.

### Views

Nunjucks is an odd choice for a view engine, and if i wasn't trying to bridge a
rails and node gap i'd use something else, but `njk` is unbelievably similar to
`erb`, so much so that if you are looking to reduce cognitive load when
switching between rails and node projects, there is no better choice.

A quick primer on `njk`:

- `{{ }}` is your `<%= %>`
- `{% %}` is your `<% %>`
- Comments are `{# like this #}`
- Rails has implicit `<% content_for :layout %>`, nunjucks wants you to
  explicitly specify `{% extends "layouts/base.njk" %}`
- Named blocks exist. In erb `<% content_for :block %>...<% end %>` - in
  nunjucks `{% block name %}...{% endblock %}`
- That same named block syntax also replaces your `<% yield :block %>`.
  `posts/index.njk` extends `layouts/base.njk`, so where the layout file has
  it's `content` block, the index places it's own `content` block, no need to
  yield.
- Partials become includes. `<%= render 'partial' %>` becomes
  `{% include "partials/_partial.njk" %}` noting that the full inner path is
  there, because we can't rely on rails convention.
- Rails let's you pass locals to partials, nunjucks expects you to set locals
  and then render the partial afterwards. `<%= render 'partial', key: val %>` is
  `{% set key = val %}` and then `{% include "partials/_partial.njk" %}`.
- If uses a special `endif` tag, not `end`. i.e. `<% if x %>...<% end %>`
  becomes `{% if x %}...{% endif %}` - `{% else %}` works as is.
- There is no `<% unless x %>` but there is a `{% if not x %}`.
- JS for..in loops replace your .each, so `<% @posts.each do |post| %>` is
  `{% for post in posts %}`
- Nunjucks exposes a `loop` object automatically inside a loop, so no need for
  `each_with_index`, you can simply use `loop.index` in the loop (and
  `loop.first` + `loop.last`)

With all that in mind, my layout file should be pretty easy for a rails
developer to follow:

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} — Blog</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  {% include "partials/_nav.njk" %}
  <main class="container">
    {% if errors and errors.length %}
      {% include "partials/_errors.njk" %}
    {% endif %}
    {% block content %}{% endblock %}
  </main>
</body>
</html>
```

I won't paste all of the view code here because you can probably build them
yourself at this point, but you can grab it from the files if you want. If
you're going to build them, an exhaustive list of all the views in use here is:

- `app/views/layouts/base.njk`
- `app/views/partials/_nav.njk`
- `app/views/partials/_errors.njk`
- `app/views/partials/_post_card.njk`
- `app/views/partials/_category_select.njk`
- `app/views/errors/500.njk`
- `app/views/posts/index.njk`
- `app/views/posts/show.njk`
- `app/views/posts/edit.njk`

### CSS

I also won't include the CSS in the readme, because it's hardly universal, but
it is worth touching on because it's included in our base layout.

In our server, we said `app.use(express.static('public'))` which tells our app
that static files live in our public directory. In our base layout, we said
`<link rel="stylesheet" href="/css/app.css">` which points to a static CSS file.
Therefore, our app stylesheet belongs in `public/css/app.css`.

Anything you want to serve statically also belongs in public. That might be
additional css files, static js files, images (like logos, favicons), fonts,
etc. When referencing them in your views, you do not need to specify `/public`,
because the app already knows that's where static files live.

In a prod setup, say on a Hetzner box (i do), you might want to let nginx serve
static assets instead - in that case just add the locations to your nginx config
i.e:

```nginx
location /css/ { root /var/www/blog/public; }
location /js/  { root /var/www/blog/public; }
location /images/ { root /var/www/blog/public; }
```
