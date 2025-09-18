// // models/RentProperty.js
// const mongoose = require('mongoose');
// const PropertySchema = require('./PropertyModel');

// // Create a new schema for rent properties that inherits from PropertySchema
// const CommercialPropertySchema = new mongoose.Schema({}, { 
//   collection: 'CommercialProperty', // Use a different collection name
//   discriminatorKey: 'listingtype' // Helpful for polymorphic queries
// });

// // Add any rent-specific methods or statics here
// CommercialPropertySchema.statics.findByNumberOfCheques = function(numberOfCheques) {
//   return this.find({
//     'custom_fields.pba_uaefields__number_of_cheques': numberOfCheques
//   });
// };

// // Create and export the RentProperty model
// const CommercialProperty = mongoose.model('CommercialProperty', PropertySchema);

// module.exports = CommercialProperty;