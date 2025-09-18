// // models/RentProperty.js
// const mongoose = require('mongoose');
// const PropertySchema = require('./PropertyModel');

// // Create a new schema for rent properties that inherits from PropertySchema
// const RentPropertySchema = new mongoose.Schema({}, { 
//   collection: 'rentproperties', // Use a different collection name
//   discriminatorKey: 'listingtype' // Helpful for polymorphic queries
// });

// // Add any rent-specific methods or statics here
// RentPropertySchema.statics.findByNumberOfCheques = function(numberOfCheques) {
//   return this.find({
//     'custom_fields.pba_uaefields__number_of_cheques': numberOfCheques
//   });
// };

// // Create and export the RentProperty model
// const RentProperty = mongoose.model('RentProperty', PropertySchema);

// module.exports = RentProperty;