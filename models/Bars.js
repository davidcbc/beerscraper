var mongoose = require('mongoose');

var BarSchema = new mongoose.Schema({
    name: String,
    link: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
});

mongoose.model('Bar', BarSchema);