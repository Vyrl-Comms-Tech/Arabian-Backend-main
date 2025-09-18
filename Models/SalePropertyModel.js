// // models/SaleProperty.js
// const mongoose = require('mongoose');
// const PropertySchema = require('./PropertyModel');

// // Create a new schema for sale properties that inherits from PropertySchema
// const SalePropertySchema = new mongoose.Schema({}, { 
//   collection: 'saleproperties', // Use a different collection name
//   discriminatorKey: 'listingtype' // Helpful for polymorphic queries
// });

// // Add any sale-specific methods or statics here
// SalePropertySchema.statics.findByStatus = function(status) {
//   return this.find({
//     'general_listing_information.status': status
//   });
// };

// // Create and export the SaleProperty model
// const SaleProperty = mongoose.model('SaleProperty', PropertySchema);

// module.exports = SaleProperty;