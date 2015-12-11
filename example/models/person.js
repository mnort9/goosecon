var mongoose = require('mongoose');

var schema = new mongoose.Schema({ 
    name: String, 
    address: String,
    city: String,
    state: String  
});

module.exports = mongoose.model('Person', schema);