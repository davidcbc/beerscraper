var mongoose = require('mongoose');

var BeerSchema = new mongoose.Schema({
    beermenusName: String,
    brewery: {type: String, default: ''},
    name: {type: String, default: ''},
    average: {type: Number, default: 0},
    rating: {type: Number, default: 0},
    haveHad: {type: Boolean, default: false}
});

mongoose.model('Beer', BeerSchema);