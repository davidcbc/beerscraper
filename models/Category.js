var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema({
    name: String,
    beers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beer' }]
});

mongoose.model('Category', CategorySchema);