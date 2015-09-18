var mongoose = require('mongoose');

var BeerSchema = new mongoose.Schema({
    brewery: String,
    name: String,
    average: {type: Number, default: 0},
    rating: {type: Number, default: 0}
});

mongoose.model('Beer', BeerSchema);