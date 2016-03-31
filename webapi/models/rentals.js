var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var rentalSchema = new Schema({
    title     : String,
    owner      : String,
    date_posted      : Array,
    details     : String,
    images      : Array
});

var Rental = mongoose.model('rentals', rentalSchema);

module.exports = Rental;