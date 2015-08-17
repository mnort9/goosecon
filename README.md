# goosecon

goosecon is a Mongoose REPL Console that auto-loads mongoose models and additional app-specific modules (services/helpers).

### Installation

Install globally:
```sh
$ npm install -g goosecon
```

### Usage

Run `goosecon` in your app directory:

```sh
$ cd app-directory
$ goosecon
```

Perform a mongoose query with any of your models

```sh
$ Person.findOne({name: 'Matt'}).populate('pets')
```

### Options

The only required option is the MongoDB url:

```sh
$ goosecon --mongo-db 'mongodb://localhost/db-name'
```

By default, goosecon will search through working directory for a `models` directory and attempt to load any mongoose models.

You can also specify a `models` directory:

```sh
$ goosecon --models-dir './path/to/models'
```

### .gooseconrc

As an alernative to the command line options, you can create a `.gooseconrc` configuration file and place it in your app directory.

```json
{
    "mongoDb": "mongodb://localhost/db-name",
    "models": "./path/to/models",
    "mongoose": "./node_modules/mongoose",
    "modules": [
        "./path/to/services",
        "./path/to/helpers"
    ]
}
```

Other modules/services/helpers can be loaded with the `modules` option.

### Note: Fix query stalling error

If your mongoose queries seem to stall out, you may need to tell goosecon to use your app's mongoose package

```sh
$ goosecon --mongoose-dir './node_modules/mongoose'
```