var mongoose = require('mongoose');
var Person = require('./models/person');

mongoose.connect('mongodb://localhost/goosecon-example');

Person.create({
    name: 'Kim Kardashian',
    address: '1 Bayshore Blvd',
    city: 'Tampa',
    state: 'FL'
}, function(err) {
    if (err) throw err;
    process.exit();
});

