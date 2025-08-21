const mongoose = require('mongoose');
const PropertySchema = require('./PropertyModel');

// Create a new schema for rent properties that inherits from PropertySchema
const NonActivePropertySchema = new mongoose.Schema({}, { 
  collection: 'NonActiveProperties', // Use a different collection name
  discriminatorKey: 'listingtype' // Helpful for polymorphic queries
});

// Add any rent-specific methods or statics here
NonActivePropertySchema.statics.findByNumberOfCheques = function(numberOfCheques) {
  return this.find({
    'custom_fields.pba_uaefields__number_of_cheques': numberOfCheques
  });
};

// Create and export the RentProperty model
const NonActiveProperty = mongoose.model('NonActiveProperties', PropertySchema);

module.exports = NonActiveProperty;