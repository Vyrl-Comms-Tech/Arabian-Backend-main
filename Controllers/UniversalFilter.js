const Property = require("../Models/PropertyModel");

// const UniversalSpecializedFilter = async (req, res) => {
//   try {
//     // 1. PRIMARY FILTERS: Get listing type and property type
//     const listingType =
//       req.query.listingType ||
//       req.query.listing_type ||
//       req.query.type ||
//       "Sale";
//     const propertyType =
//       req.query.propertyType || req.query.property_type || "all";

//     // 2. SELECT APPROPRIATE MODEL BASED ON LISTING TYPE
//     let PropertyModel = Property; // Default to main Property model

//     // 3. SECONDARY FILTERS: Get location and other attributes
//     const location = req.query.address || req.query.searchLocation || "";
//     const minPrice =
//       req.query.minPrice &&
//       req.query.minPrice !== "" &&
//       req.query.minPrice !== "any"
//         ? req.query.minPrice
//         : "0";
//     const maxPrice =
//       req.query.maxPrice &&
//       req.query.maxPrice !== "" &&
//       req.query.maxPrice !== "any"
//         ? req.query.maxPrice
//         : "10000000";
//     const bedrooms =
//       req.query.bedrooms &&
//       req.query.bedrooms !== "" &&
//       req.query.bedrooms !== "any"
//         ? req.query.bedrooms
//         : "all";
//     const bathrooms =
//       req.query.bathrooms &&
//       req.query.bathrooms !== "" &&
//       req.query.bathrooms !== "any"
//         ? req.query.bathrooms
//         : "all";
//     const furnishing =
//       req.query.furnishing && req.query.furnishing !== ""
//         ? req.query.furnishing
//         : "all";
//     const minSize =
//       req.query.minSize &&
//       req.query.minSize !== "" &&
//       req.query.minSize !== "any"
//         ? req.query.minSize
//         : "0";
//     const maxSize =
//       req.query.maxSize &&
//       req.query.maxSize !== "" &&
//       req.query.maxSize !== "any"
//         ? req.query.maxSize
//         : "";
//     const amenities =
//       req.query.amenities && req.query.amenities !== ""
//         ? req.query.amenities
//         : "all";

//     console.log("All Filters:", {
//       listingType,
//       propertyType,
//       location,
//       minPrice,
//       maxPrice,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       minSize,
//       maxSize,
//       amenities,
//     });

//     // 4. PAGINATION
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     // 5. BUILD FILTER QUERY
//     const filterQuery = {};

//     // 5.1 LISTING TYPE FILTER (Only apply if using main Property model)
//     if (
//       PropertyModel === Property &&
//       listingType &&
//       listingType.toLowerCase() !== "all"
//     ) {
//       // Map common variations to standard values
//       const listingTypeMap = {
//         sale: "Sale",
//         rent: "Rent",
//         Offplan: "Offplan",
//         Commercial: "Commercial",
//       };

//       const normalizedListingType =
//         listingTypeMap[listingType.toLowerCase()] || listingType;

//       if (listingType.includes(",")) {
//         const listingTypes = listingType
//           .split(",")
//           .map(
//             (type) => listingTypeMap[type.trim().toLowerCase()] || type.trim()
//           );
//         filterQuery["listing_type"] = { $in: listingTypes };
//       } else {
//         filterQuery["listing_type"] = normalizedListingType;
//       }
//       console.log("Applied listing_type filter:", filterQuery["listing_type"]);
//     }

//     // 5.2 PROPERTY TYPE FILTER (Primary Filter)
//     if (propertyType && propertyType.toLowerCase() !== "all") {
//       // Map common variations to standard values
//       const propertyTypeMap = {
//         villa: "villa",
//         apartment: "apartment",
//         penthouse: "penthouse",
//         townhouse: "townhouse",
//         duplex: "duplex",
//         studio: "apartment", // Studios are usually apartments
//         flat: "apartment",
//       };

//       if (propertyType.includes(",")) {
//         const propertyTypes = propertyType.split(",").map((type) => {
//           const trimmedType = type.trim().toLowerCase();
//           return propertyTypeMap[trimmedType] || trimmedType;
//         });
//         filterQuery["property_type"] = { $in: propertyTypes };
//       } else {
//         const normalizedPropertyType =
//           propertyTypeMap[propertyType.toLowerCase()] ||
//           propertyType.toLowerCase();
//         filterQuery["property_type"] = normalizedPropertyType;
//       }
//       console.log(
//         "Applied property_type filter:",
//         filterQuery["property_type"]
//       );
//     }

//     // 5.3 LOCATION/ADDRESS FILTER
//     if (location && location.trim() !== "") {
//       const searchTerm = location.trim();
//       console.log("Adding location filter for:", searchTerm);
//       filterQuery["custom_fields.pba__addresstext_pb"] = {
//         $regex: searchTerm,
//         $options: "i",
//       };
//     }

//     // 5.4 PRICE RANGE FILTER
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       filterQuery["general_listing_information.listingprice"] = {};
//       if (minPrice !== "0") {
//         const minPriceNum = parseInt(minPrice);
//         if (!isNaN(minPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$gte"] =
//             minPriceNum;
//         }
//       }
//       if (maxPrice !== "10000000") {
//         const maxPriceNum = parseInt(maxPrice);
//         if (!isNaN(maxPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$lte"] =
//             maxPriceNum;
//         }
//       }
//     }

//     // 5.5 BEDROOMS FILTER
//     if (bedrooms && bedrooms.toLowerCase() !== "all") {
//       if (bedrooms.toLowerCase() === "studio" || bedrooms === "0") {
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: ["0", "Studio", "studio"],
//         };
//       } else if (bedrooms.toString().endsWith("+")) {
//         const minBedrooms = parseInt(bedrooms.replace("+", ""));
//         if (!isNaN(minBedrooms)) {
//           filterQuery["general_listing_information.bedrooms"] = {
//             $gte: minBedrooms.toString(),
//           };
//         }
//       } else if (bedrooms.includes(",")) {
//         const bedroomOptions = bedrooms.split(",").map((bed) => bed.trim());
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: bedroomOptions,
//         };
//       } else {
//         filterQuery["general_listing_information.bedrooms"] =
//           bedrooms.toString();
//       }
//     }

//     // 5.6 BATHROOMS FILTER
//     if (bathrooms && bathrooms.toLowerCase() !== "all") {
//       if (bathrooms.toString().endsWith("+")) {
//         const minBathrooms = parseInt(bathrooms.replace("+", ""));
//         if (!isNaN(minBathrooms)) {
//           filterQuery["general_listing_information.fullbathrooms"] = {
//             $gte: minBathrooms.toString(),
//           };
//         }
//       } else if (bathrooms.includes(",")) {
//         const bathroomOptions = bathrooms.split(",").map((bath) => bath.trim());
//         filterQuery["general_listing_information.fullbathrooms"] = {
//           $in: bathroomOptions,
//         };
//       } else {
//         filterQuery["general_listing_information.fullbathrooms"] =
//           bathrooms.toString();
//       }
//     }

//     // 5.7 FURNISHING FILTER
//     if (furnishing && furnishing.toLowerCase() !== "all") {
//       const furnishingMapValues = {
//         furnished: "Yes",
//         unfurnished: "No",
//         partial: "Partial",
//         yes: "Yes",
//         no: "No",
//       };

//       if (furnishing.includes(",")) {
//         const furnishingOptions = furnishing
//           .split(",")
//           .map(
//             (furn) =>
//               furnishingMapValues[furn.trim().toLowerCase()] || furn.trim()
//           );
//         filterQuery["custom_fields.furnished"] = { $in: furnishingOptions };
//       } else {
//         const furnishingValue =
//           furnishingMapValues[furnishing.toLowerCase()] || furnishing;
//         filterQuery["custom_fields.furnished"] = furnishingValue;
//       }
//     }

//     // 5.8 SIZE RANGE FILTER
//     if (minSize !== "0" || maxSize !== "100000") {
//       console.log(
//         "Applying size filter - MinSize:",
//         minSize,
//         "MaxSize:",
//         maxSize
//       );

//       const sizeConditions = [];

//       const numericCondition = {};
//       if (minSize !== "0") {
//         const minSizeNum = parseInt(minSize);
//         if (!isNaN(minSizeNum)) {
//           numericCondition["$gte"] = minSizeNum;
//         }
//       }
//       if (maxSize !== "100000") {
//         const maxSizeNum = parseInt(maxSize);
//         if (!isNaN(maxSizeNum)) {
//           numericCondition["$lte"] = maxSizeNum;
//         }
//       }

//       const exprConditions = [];
//       if (minSize !== "0") {
//         const minSizeNum = parseInt(minSize);
//         if (!isNaN(minSizeNum)) {
//           exprConditions.push({
//             $gte: [
//               {
//                 $toDouble: {
//                   $ifNull: ["$general_listing_information.totalarea", "0"],
//                 },
//               },
//               minSizeNum,
//             ],
//           });
//         }
//       }
//       if (maxSize !== "100000") {
//         const maxSizeNum = parseInt(maxSize);
//         if (!isNaN(maxSizeNum)) {
//           exprConditions.push({
//             $lte: [
//               {
//                 $toDouble: {
//                   $ifNull: ["$general_listing_information.totalarea", "0"],
//                 },
//               },
//               maxSizeNum,
//             ],
//           });
//         }
//       }

//       if (Object.keys(numericCondition).length > 0) {
//         sizeConditions.push({
//           "general_listing_information.totalarea": numericCondition,
//         });
//       }

//       if (exprConditions.length > 0) {
//         sizeConditions.push({ $expr: { $and: exprConditions } });
//       }

//       if (sizeConditions.length > 0) {
//         filterQuery["$and"] = filterQuery["$and"] || [];
//         filterQuery["$and"].push({ $or: sizeConditions });
//       }
//     }

//     // 5.9 AMENITIES FILTER
//     if (
//       amenities &&
//       amenities.toLowerCase() !== "all" &&
//       amenities.trim() !== ""
//     ) {
//       const requestedAmenities = amenities
//         .split(",")
//         .map((amenity) => amenity.trim())
//         .filter((amenity) => amenity !== "");
//       if (requestedAmenities.length > 0) {
//         filterQuery["custom_fields.private_amenities"] = {
//           $all: requestedAmenities.map((amenity) => new RegExp(amenity, "i")),
//         };
//       }
//     }

//     console.log("Final Filter Query:", JSON.stringify(filterQuery, null, 2));

//     // 6. EXECUTE QUERY
//     const skip = (page - 1) * limit;

//     // Get total count
//     let totalCount = 0;
//     try {
//       totalCount = await PropertyModel.countDocuments(filterQuery);
//       console.log(
//         `Found ${totalCount} matching documents using ${
//           PropertyModel.modelName || PropertyModel.collection?.name
//         }`
//       );
//     } catch (countError) {
//       console.error("Error counting documents:", countError);
//       console.error(
//         "PropertyModel:",
//         PropertyModel.modelName || PropertyModel.collection?.name || "Unknown"
//       );
//       console.error("FilterQuery:", JSON.stringify(filterQuery, null, 2));
//       throw new Error(`Failed to count documents: ${countError.message}`);
//     }

//     const totalPages = Math.ceil(totalCount / limit);

//     // If no results found
//     if (totalCount === 0) {
//       return res.status(200).json({
//         success: true,
//         message: `No properties found matching the filter criteria`,
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalCount: 0,
//           perPage: limit,
//           hasNextPage: false,
//           hasPrevPage: page > 1,
//         },
//         count: 0,
//         data: [],
//         filters: {
//           listingType,
//           propertyType,
//           location,
//           appliedFilters: filterQuery,
//         },
//         debug: {
//           modelUsed:
//             PropertyModel.modelName ||
//             PropertyModel.collection?.name ||
//             "Unknown",
//           filterQuery: filterQuery,
//         },
//       });
//     }

//     // Execute the query with pagination
//     let properties = [];
//     try {
//       properties = await PropertyModel.find(filterQuery)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean();
//     } catch (findError) {
//       console.error("Error finding properties:", findError);
//       console.error(
//         "PropertyModel:",
//         PropertyModel.modelName || PropertyModel.collection?.name || "Unknown"
//       );
//       console.error("FilterQuery:", JSON.stringify(filterQuery, null, 2));
//       throw new Error(`Failed to find properties: ${findError.message}`);
//     }

//     console.log(`Found ${properties.length} properties for page ${page}`);

//     // 7. CREATE RESPONSE WITH APPLIED FILTERS SUMMARY
//     const activeFilters = [];

//     if (listingType && listingType.toLowerCase() !== "all") {
//       activeFilters.push(`listing type: ${listingType}`);
//     }
//     if (propertyType && propertyType.toLowerCase() !== "all") {
//       activeFilters.push(`property type: ${propertyType}`);
//     }
//     if (location && location.trim() !== "") {
//       activeFilters.push(`location: ${location.trim()}`);
//     }
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       activeFilters.push(
//         `price range: ${minPrice === "0" ? "min" : minPrice} - ${
//           maxPrice === "10000000" ? "max" : maxPrice
//         } AED`
//       );
//     }
//     if (bedrooms && bedrooms.toLowerCase() !== "all") {
//       activeFilters.push(`bedrooms: ${bedrooms}`);
//     }
//     if (bathrooms && bathrooms.toLowerCase() !== "all") {
//       activeFilters.push(`bathrooms: ${bathrooms}`);
//     }
//     if (furnishing && furnishing.toLowerCase() !== "all") {
//       activeFilters.push(`furnishing: ${furnishing}`);
//     }
//     if (minSize !== "0" || maxSize !== "100000") {
//       activeFilters.push(`size range: ${minSize} - ${maxSize} sqft`);
//     }
//     if (
//       amenities &&
//       amenities.toLowerCase() !== "all" &&
//       amenities.trim() !== ""
//     ) {
//       activeFilters.push(`amenities: ${amenities}`);
//     }

//     const summaryText =
//       activeFilters.length > 0
//         ? `Properties filtered by ${activeFilters.join(", ")}`
//         : `All properties`;

//     return res.status(200).json({
//       success: true,
//       message: summaryText,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalCount: totalCount,
//         perPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//       searchTerm: location?.trim() || "",
//       count: properties.length,
//       data: properties,
//       filters: {
//         applied: {
//           listingType,
//           propertyType,
//           location,
//           priceRange: `${minPrice} - ${maxPrice}`,
//           bedrooms,
//           bathrooms,
//           furnishing,
//           sizeRange: `${minSize} - ${maxSize}`,
//           amenities,
//         },
//         activeFiltersCount: activeFilters.length,
//         query: filterQuery,
//       },
//       debug: {
//         modelUsed:
//           PropertyModel.modelName ||
//           PropertyModel.collection?.name ||
//           "Unknown",
//         filterQuery: filterQuery,
//       },
//     });
//   } catch (error) {
//     console.error("Error in UniversalSpecializedFilter:", error);
//     console.error("Stack trace:", error.stack);
//     res.status(500).json({
//       success: false,
//       message: "Failed to filter properties",
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// };

// const enhancedSpecializedFilter = async (req, res) => {
//   try {
//     // FIXED: Get and normalize the offering type parameter with better fallback
//     const rawOfferingType =
//       req.query.offeringType || req.query.type || req.query.propertyCollection;
//     console.log("Raw Offering Type from query:", rawOfferingType);

//     // If no offering type provided, determine from route or default to Sale
//     let defaultType = "Sale";
//     if (req.path && req.path.includes("rent")) {
//       defaultType = "Rent";
//     } else if (req.path && req.path.includes("commercial")) {
//       defaultType = "Commercial";
//     } else if (req.path && req.path.includes("offplan" || "all")) {
//       defaultType = "OffPlan";
//     }
//     // console.log(defaultType)

//     const finalRawType = rawOfferingType || defaultType;
//     const offeringType = normalizeOfferingType(finalRawType);

//     console.log("Raw Offering Type from frontend:", finalRawType);
//     console.log("Normalized Offering Type for backend:", offeringType);

//     // Determine which model to use based on normalized offering type
//     const PropertyModel = getPropertyModelByOfferingType(offeringType);

//     if (!PropertyModel) {
//       throw new Error(
//         `No property model found for offering type: ${offeringType}`
//       );
//     }

//     console.log(`Using ${PropertyModel.modelName} collection for filtering`);
//     console.log(`Final Offering Type parameter: ${offeringType}`);

//     // Get location parameter for address filtering
//     const location = req.query.address || req.query.searchLocation;
//     // console.log("Location parameter:", location);

//     // FIXED: Get all filter parameters with proper defaults and validation
//     const minPrice =
//       req.query.minPrice &&
//       req.query.minPrice !== "" &&
//       req.query.minPrice !== "any"
//         ? req.query.minPrice
//         : "0";
//     const maxPrice =
//       req.query.maxPrice &&
//       req.query.maxPrice !== "" &&
//       req.query.maxPrice !== "any"
//         ? req.query.maxPrice
//         : "10000000";
//     const propertyType =
//       req.query.propertyType && req.query.propertyType !== ""
//         ? req.query.propertyType
//         : "all";
//     const bedrooms =
//       req.query.bedrooms &&
//       req.query.bedrooms !== "" &&
//       req.query.bedrooms !== "any"
//         ? req.query.bedrooms
//         : "all";
//     const bathrooms =
//       req.query.bathrooms &&
//       req.query.bathrooms !== "" &&
//       req.query.bathrooms !== "any"
//         ? req.query.bathrooms
//         : "all";
//     const furnishing =
//       req.query.furnishing && req.query.furnishing !== ""
//         ? req.query.furnishing
//         : "all";
//     const minSize =
//       req.query.minSize &&
//       req.query.minSize !== "" &&
//       req.query.minSize !== "any"
//         ? req.query.minSize
//         : "0";
//     const maxSize =
//       req.query.maxSize &&
//       req.query.maxSize !== "" &&
//       req.query.maxSize !== "any"
//         ? req.query.maxSize
//         : "100000";
//     const amenities =
//       req.query.amenities && req.query.amenities !== ""
//         ? req.query.amenities
//         : "all";

//     console.log("Filters:", {
//       offeringType,
//       minPrice,
//       maxPrice,
//       propertyType,
//       bedrooms,
//       bathrooms,
//       furnishing,
//       minSize,
//       maxSize,
//       amenities,
//       location,
//     });

//     // Get pagination parameters
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     // Build the filter query
//     const filterQuery = {};

//     // Add location/address filter if provided
//     if (location && location.trim() !== "") {
//       const searchTerm = location.trim();
//       console.log("Adding location filter for:", searchTerm);
//       filterQuery["custom_fields.pba__addresstext_pb"] = {
//         $regex: searchTerm,
//         $options: "i",
//       };
//     }

//     // 1. FIXED: Add price range filter with proper numeric conversion
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       filterQuery["general_listing_information.listingprice"] = {};
//       if (minPrice !== "0") {
//         const minPriceNum = parseInt(minPrice);
//         if (!isNaN(minPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$gte"] =
//             minPriceNum;
//         }
//       }
//       if (maxPrice !== "10000000") {
//         const maxPriceNum = parseInt(maxPrice);
//         if (!isNaN(maxPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$lte"] =
//             maxPriceNum;
//         }
//       }
//     }

//     // 2. Add property type filter if provided and not 'all'
//     if (
//       propertyType &&
//       propertyType.toLowerCase() !== "all" &&
//       propertyType.toLowerCase() !== ""
//     ) {
//       if (propertyType.includes(",")) {
//         const propertyTypes = propertyType
//           .split(",")
//           .map((type) => type.trim());
//         filterQuery["general_listing_information.propertytype"] = {
//           $in: propertyTypes,
//         };
//       } else {
//         filterQuery["general_listing_information.propertytype"] = propertyType;
//       }
//     }

//     // 3. Add bedrooms filter if provided and not 'all'
//     if (
//       bedrooms &&
//       bedrooms.toLowerCase() !== "all" &&
//       bedrooms.toLowerCase() !== ""
//     ) {
//       if (bedrooms.toLowerCase() === "studio" || bedrooms === "0") {
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: ["0", "Studio", "studio"],
//         };
//       } else if (bedrooms.toString().endsWith("+")) {
//         const minBedrooms = parseInt(bedrooms.replace("+", ""));
//         if (!isNaN(minBedrooms)) {
//           filterQuery["general_listing_information.bedrooms"] = {
//             $gte: minBedrooms.toString(),
//           };
//         }
//       } else if (bedrooms.includes(",")) {
//         const bedroomOptions = bedrooms.split(",").map((bed) => bed.trim());
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: bedroomOptions,
//         };
//       } else {
//         filterQuery["general_listing_information.bedrooms"] =
//           bedrooms.toString();
//       }
//     }

//     // 4. Add bathrooms filter if provided and not 'all'
//     if (
//       bathrooms &&
//       bathrooms.toLowerCase() !== "all" &&
//       bathrooms.toLowerCase() !== ""
//     ) {
//       if (bathrooms.toString().endsWith("+")) {
//         const minBathrooms = parseInt(bathrooms.replace("+", ""));
//         if (!isNaN(minBathrooms)) {
//           filterQuery["general_listing_information.fullbathrooms"] = {
//             $gte: minBathrooms.toString(),
//           };
//         }
//       } else if (bathrooms.includes(",")) {
//         const bathroomOptions = bathrooms.split(",").map((bath) => bath.trim());
//         filterQuery["general_listing_information.fullbathrooms"] = {
//           $in: bathroomOptions,
//         };
//       } else {
//         filterQuery["general_listing_information.fullbathrooms"] =
//           bathrooms.toString();
//       }
//     }

//     // 5. Add furnishing filter if provided and not 'all'
//     if (
//       furnishing &&
//       furnishing.toLowerCase() !== "all" &&
//       furnishing.toLowerCase() !== ""
//     ) {
//       const furnishingMapValues = {
//         furnished: "Yes",
//         unfurnished: "No",
//         partial: "Partial",
//         yes: "Yes",
//         no: "No",
//       };

//       if (furnishing.includes(",")) {
//         const furnishingOptions = furnishing
//           .split(",")
//           .map(
//             (furn) =>
//               furnishingMapValues[furn.trim().toLowerCase()] || furn.trim()
//           );
//         filterQuery["custom_fields.furnished"] = { $in: furnishingOptions };
//       } else {
//         const furnishingValue =
//           furnishingMapValues[furnishing.toLowerCase()] || furnishing;
//         filterQuery["custom_fields.furnished"] = furnishingValue;
//       }
//     }

//     // 6. FIXED: Add property size range filter with better error handling
//     if (minSize !== "0" || maxSize !== "100000") {
//       console.log(
//         "Applying size filter - MinSize:",
//         minSize,
//         "MaxSize:",
//         maxSize
//       );

//       const sizeConditions = [];

//       const numericCondition = {};
//       if (minSize !== "0") {
//         const minSizeNum = parseInt(minSize);
//         if (!isNaN(minSizeNum)) {
//           numericCondition["$gte"] = minSizeNum;
//         }
//       }
//       if (maxSize !== "100000") {
//         const maxSizeNum = parseInt(maxSize);
//         if (!isNaN(maxSizeNum)) {
//           numericCondition["$lte"] = maxSizeNum;
//         }
//       }

//       const exprConditions = [];
//       if (minSize !== "0") {
//         const minSizeNum = parseInt(minSize);
//         if (!isNaN(minSizeNum)) {
//           exprConditions.push({
//             $gte: [
//               {
//                 $toDouble: {
//                   $ifNull: ["$general_listing_information.totalarea", "0"],
//                 },
//               },
//               minSizeNum,
//             ],
//           });
//         }
//       }
//       if (maxSize !== "100000") {
//         const maxSizeNum = parseInt(maxSize);
//         if (!isNaN(maxSizeNum)) {
//           exprConditions.push({
//             $lte: [
//               {
//                 $toDouble: {
//                   $ifNull: ["$general_listing_information.totalarea", "0"],
//                 },
//               },
//               maxSizeNum,
//             ],
//           });
//         }
//       }

//       if (Object.keys(numericCondition).length > 0) {
//         sizeConditions.push({
//           "general_listing_information.totalarea": numericCondition,
//         });
//       }

//       if (exprConditions.length > 0) {
//         sizeConditions.push({ $expr: { $and: exprConditions } });
//       }

//       if (sizeConditions.length > 0) {
//         filterQuery["$and"] = filterQuery["$and"] || [];
//         filterQuery["$and"].push({ $or: sizeConditions });
//       }
//     }

//     // 7. FIXED: Add amenities filter with better validation
//     if (
//       amenities &&
//       amenities.toLowerCase() !== "all" &&
//       amenities.trim() !== ""
//     ) {
//       const requestedAmenities = amenities
//         .split(",")
//         .map((amenity) => amenity.trim())
//         .filter((amenity) => amenity !== "");
//       if (requestedAmenities.length > 0) {
//         filterQuery["custom_fields.private_amenities"] = {
//           $all: requestedAmenities.map((amenity) => new RegExp(amenity, "i")),
//         };
//       }
//     }

//     console.log("Final Filter Query:", JSON.stringify(filterQuery, null, 2));

//     // Calculate skip for pagination
//     const skip = (page - 1) * limit;

//     // Get total count for pagination with error handling
//     let totalCount = 0;
//     try {
//       totalCount = await PropertyModel.countDocuments(filterQuery);
//       console.log(`Found ${totalCount} matching documents`);
//     } catch (countError) {
//       console.error("Error counting documents:", countError);
//       console.error("PropertyModel:", PropertyModel.modelName);
//       console.error("FilterQuery:", JSON.stringify(filterQuery, null, 2));
//       throw new Error(`Failed to count documents: ${countError.message}`);
//     }

//     const totalPages = Math.ceil(totalCount / limit);

//     // Determine collection name for response using normalized offering type
//     const collectionName = getCollectionName(offeringType);

//     // If there are no results, return appropriate response
//     if (totalCount === 0) {
//       return res.status(200).json({
//         success: true,
//         message: `No ${collectionName} properties found matching the filter criteria`,
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalCount: 0,
//           perPage: limit,
//           hasNextPage: false,
//           hasPrevPage: page > 1,
//         },
//         count: 0,
//         data: [],
//         debug: {
//           modelUsed: PropertyModel.modelName,
//           rawOfferingType: finalRawType,
//           normalizedOfferingType: offeringType,
//           collectionName: collectionName,
//           filterQuery: filterQuery,
//         },
//       });
//     }

//     // Execute the query with pagination and sorting
//     let properties = [];
//     try {
//       properties = await PropertyModel.find(filterQuery)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(); // Add lean() for better performance
//     } catch (findError) {
//       console.error("Error finding properties:", findError);
//       console.error("PropertyModel:", PropertyModel.modelName);
//       console.error("FilterQuery:", JSON.stringify(filterQuery, null, 2));
//       throw new Error(`Failed to find properties: ${findError.message}`);
//     }

//     console.log(
//       `Found ${properties.length} ${collectionName} properties for page ${page}`
//     );

//     // Create response with applied filters
//     const activeFilters = [];

//     if (location && location.trim() !== "") {
//       activeFilters.push(`location: ${location.trim()}`);
//     }
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       activeFilters.push(
//         `price range: ${minPrice === "0" ? "min" : minPrice} - ${
//           maxPrice === "10000000" ? "max" : maxPrice
//         } AED`
//       );
//     }
//     if (propertyType && propertyType.toLowerCase() !== "all") {
//       activeFilters.push(`property type: ${propertyType}`);
//     }
//     if (bedrooms && bedrooms.toLowerCase() !== "all") {
//       activeFilters.push(`bedrooms: ${bedrooms}`);
//     }
//     if (bathrooms && bathrooms.toLowerCase() !== "all") {
//       activeFilters.push(`bathrooms: ${bathrooms}`);
//     }
//     if (furnishing && furnishing.toLowerCase() !== "all") {
//       activeFilters.push(`furnishing: ${furnishing}`);
//     }
//     if (minSize !== "0" || maxSize !== "100000") {
//       activeFilters.push(`size range: ${minSize} - ${maxSize} sqft`);
//     }
//     if (
//       amenities &&
//       amenities.toLowerCase() !== "all" &&
//       amenities.trim() !== ""
//     ) {
//       activeFilters.push(`amenities: ${amenities}`);
//     }

//     const summaryText =
//       activeFilters.length > 0
//         ? `${collectionName} properties filtered by ${activeFilters.join(", ")}`
//         : `All ${collectionName} properties`;

//     return res.status(200).json({
//       success: true,
//       message: summaryText,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalCount: totalCount,
//         perPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//       searchTerm: location?.trim() || "",
//       count: properties.length,
//       data: properties,
//       debug: {
//         modelUsed: PropertyModel.modelName,
//         rawOfferingType: finalRawType,
//         normalizedOfferingType: offeringType,
//         collectionName: collectionName,
//       },
//     });
//   } catch (error) {
//     console.error("Error in enhancedSpecializedFilter:", error);
//     console.error("Stack trace:", error.stack);
//     res.status(500).json({
//       success: false,
//       message: "Failed to filter properties",
//       error: error.message,
//       stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//     });
//   }
// };

// Helper function to determine PropertyModel based on offering type
// const getPropertyModelByOfferingType = (offeringType) => {
//   console.log("Determining model for offering type:", offeringType);

//   switch (offeringType?.toUpperCase()) {
//     case "RS": // Sale Property
//       console.log("Using SaleProperty model");
//       return SaleProperty;
//     case "RR": // Rent Property
//       console.log("Using RentProperty model");
//       return RentProperty;
//     case "CS": // Commercial Sale
//     case "CR": // Commercial Rent
//       console.log("Using CommercialProperty model");
//       return CommercialProperty;
//     case "OP": // OffPlan
//       console.log("Using Offplan model");
//       return Offplan;
//     default: // Default to Sale if unknown
//       console.log("Unknown offering type, using SaleProperty model as default");
//       return SaleProperty;
//   }
// };
// const normalizeOfferingType = (offeringType) => {
//   if (!offeringType) return "RS"; // Default to Sale if not specified

//   const normalizedType = offeringType.toString().toLowerCase(); // Use toLowerCase for consistency

//   // Map frontend values to backend codes
//   switch (normalizedType) {
//     case "sale":
//     case "Sale":
//     case "SALE":
//       return "RS";
//     case "rent":
//     case "Rent":
//     case "RENT":
//       return "RR";
//     case "commercial":
//     case "Commercial":
//     case "COMMERCIAL":
//       return "CS";
//     case "offplan":
//     case "OffPlan":
//     case "Offplan":
//     case "OFFPLAN":
//     case "all":
//       return "OP";
//     // If already in correct format, return as is (convert to uppercase)
//     case "rs":
//     case "rr":
//     case "cs":
//     case "op":
//     case "cr":
//       return normalizedType.toUpperCase();
//     default:
//       console.log(
//         `Unknown offeringType: ${offeringType}, defaulting to RS (Sale)`
//       );
//       return "RS"; // Default to Sale instead of OffPlan for unknown types
//   }
// };

// Helper function to get collection name for response
// const getCollectionName = (offeringType) => {
//   switch (offeringType?.toUpperCase()) {
//     case "RS":
//       return "Sale";
//     case "RR":
//       return "Rent";
//     case "CS":
//     case "CR":
//       return "Commercial";
//     case "OP":
//       return "OffPlan";
//     default:
//       return "Sale"; // Default to Sale instead of OffPlan
//   }
// };

// Updated Sorting function

const UniversalSpecializedFilter = async (req, res) => {
  try {
    console.log("Working")
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get listing types - can be comma-separated for multiple types
    const listingTypeParam = req.query.listingType || "Sale";
    const listingTypes = listingTypeParam.split(",").map((type) => type.trim());

    // Get sort parameter
    const sortBy = req.query.sortBy || "newest";

    console.log("Universal Filter - Listing Types:", listingTypes);
    console.log("Universal Filter - Sort By:", sortBy);

    // Build base query
    let query = {};

    // Add listing type filter
    if (listingTypes.length === 1) {
      query.listing_type = listingTypes[0];
    } else {
      query.listing_type = { $in: listingTypes };
    }

    // Add other filters
    if (req.query.propertyType && req.query.propertyType !== "") {
      query.property_type = new RegExp(req.query.propertyType, "i");
    }

    if (req.query.minPrice) {
      query["general_listing_information.listingprice"] = {
        ...query["general_listing_information.listingprice"],
        $gte: parseInt(req.query.minPrice),
      };
    }

    if (req.query.maxPrice) {
      query["general_listing_information.listingprice"] = {
        ...query["general_listing_information.listingprice"],
        $lte: parseInt(req.query.maxPrice),
      };
    }

    if (req.query.bedrooms && req.query.bedrooms !== "") {
      if (req.query.bedrooms.toLowerCase() === "studio") {
        query["general_listing_information.bedrooms"] = new RegExp(
          "studio",
          "i"
        );
      } else if (req.query.bedrooms === "5+") {
        query["general_listing_information.bedrooms"] = {
          $regex: /^[5-9]\d*$|^[1-9]\d{1,}$/,
        };
      } else {
        query["general_listing_information.bedrooms"] = req.query.bedrooms;
      }
    }

    if (req.query.address && req.query.address !== "") {
      query["custom_fields.pba__addresstext_pb"] = new RegExp(
        req.query.address,
        "i"
      );
    }

    if (req.query.developer && req.query.developer !== "") {
      query["custom_fields.developer"] = new RegExp(req.query.developer, "i");
    }

    if (req.query.bathrooms && req.query.bathrooms !== "") {
      query["general_listing_information.fullbathrooms"] = req.query.bathrooms;
    }

    if (req.query.furnishing && req.query.furnishing !== "") {
      query["custom_fields.furnished"] = new RegExp(req.query.furnishing, "i");
    }

    if (req.query.minSize) {
      query["general_listing_information.totalarea"] = {
        ...query["general_listing_information.totalarea"],
        $gte: parseInt(req.query.minSize),
      };
    }

    if (req.query.maxSize) {
      query["general_listing_information.totalarea"] = {
        ...query["general_listing_information.totalarea"],
        $lte: parseInt(req.query.maxSize),
      };
    }

    if (req.query.amenities) {
      const amenitiesArray = req.query.amenities
        .split(",")
        .map((a) => a.trim());
      const amenityRegexArray = amenitiesArray.map(
        (amenity) => new RegExp(amenity, "i")
      );
      query["custom_fields.private_amenities"] = { $in: amenityRegexArray };
    }

    console.log("Universal Filter - Query:", JSON.stringify(query, null, 2));

    // Define sort options and aggregation pipeline
    let sortOptions = {};
    let useAggregation = false;
    let aggregationPipeline = [];

    switch (sortBy.toLowerCase()) {
      case "most_recent":
      case "newest":
        sortOptions = { createdAt: -1 };
        break;

      case "highest_price":
      case "price-high":
        useAggregation = true;
        aggregationPipeline = [
          { $match: query },
          {
            $addFields: {
              numericPrice: {
                $convert: {
                  input: "$general_listing_information.listingprice",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
          },
          { $sort: { numericPrice: -1 } }, // -1 for descending (highest first)
          { $skip: skip },
          { $limit: limit },
        ];
        break;

      case "lowest_price":
      case "price-low":
        useAggregation = true;
        aggregationPipeline = [
          { $match: query },
          {
            $addFields: {
              numericPrice: {
                $convert: {
                  input: "$general_listing_information.listingprice",
                  to: "double",
                  onError: 0,
                  onNull: 0,
                },
              },
            },
          },
          { $sort: { numericPrice: 1 } }, // 1 for ascending (lowest first)
          { $skip: skip },
          { $limit: limit },
        ];
        break;

      case "most_bedrooms":
        useAggregation = true;
        aggregationPipeline = [
          { $match: query },
          {
            $addFields: {
              numericBedrooms: {
                $cond: {
                  if: {
                    $eq: ["$general_listing_information.bedrooms", "Studio"],
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: "$general_listing_information.bedrooms",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                },
              },
            },
          },
          { $sort: { numericBedrooms: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        break;

      case "least_bedrooms":
        useAggregation = true;
        aggregationPipeline = [
          { $match: query },
          {
            $addFields: {
              numericBedrooms: {
                $cond: {
                  if: {
                    $eq: ["$general_listing_information.bedrooms", "Studio"],
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: "$general_listing_information.bedrooms",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                },
              },
            },
          },
          { $sort: { numericBedrooms: 1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        break;

      default:
        sortOptions = { createdAt: -1 };
        break;
    }
    let PropertyModel = Property;
    // Get total count for pagination
    const totalCount = await PropertyModel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Execute query with or without aggregation
    let properties = [];
    if (useAggregation) {
      console.log("Universal Filter - Using aggregation pipeline");
      properties = await PropertyModel.aggregate(aggregationPipeline);
    } else {
      console.log(
        "Universal Filter - Using standard query with sort:",
        sortOptions
      );
      properties = await PropertyModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Generate sort description
    const sortDescriptions = {
      most_recent: "most recent first",
      newest: "newest first",
      highest_price: "highest price first",
      "price-high": "highest price first",
      lowest_price: "lowest price first",
      "price-low": "lowest price first",
      most_bedrooms: "most bedrooms first",
      least_bedrooms: "least bedrooms first",
      largest_area: "largest area first",
      smallest_area: "smallest area first",
      oldest: "oldest first",
      popular: "most popular first",
    };

    const sortDescription =
      sortDescriptions[sortBy.toLowerCase()] || "most recent first";

    // Success response
    res.status(200).json({
      success: true,
      message: `Found ${properties.length} properties (${listingTypes.join(
        ", "
      )}) - sorted by ${sortDescription}`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: {
        listingTypes: listingTypes,
        propertyType: req.query.propertyType || null,
        priceRange: {
          min: req.query.minPrice || null,
          max: req.query.maxPrice || null,
        },
        bedrooms: req.query.bedrooms || null,
        address: req.query.address || null,
        developer: req.query.developer || null,
        sortBy: sortBy,
        sortDescription: sortDescription,
      },
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Error in Universal Filter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter and sort properties",
      error: error.message,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        limit: parseInt(req.query.limit) || 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
      data: [],
    });
  }
};

const SortProperties = async (req, res) => {
  try {
    // FIXED: Normalize offering type
    const rawOfferingType = req.query.offeringType || req.query.type || "Sale";
    const offeringType = normalizeOfferingType(rawOfferingType);
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);

    console.log("Raw Offering Type:", rawOfferingType);
    console.log("Normalized Offering Type:", offeringType);
    console.log(`Using ${PropertyModel.modelName} collection for sorting`);

    const sortBy = req.query.sortBy || "most_recent";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    // UPDATED: Remove status filter since all properties in collections are now Live
    const baseQuery = {};

    let sortOptions = {};
    let useAggregation = false;
    let aggregationPipeline = [];

    switch (sortBy.toLowerCase()) {
      case "most_recent":
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "highest_price":
      case "price-high":
        sortOptions = { "general_listing_information.listingprice": -1 };
        break;
      case "lowest_price":
      case "price-low":
        sortOptions = { "general_listing_information.listingprice": 1 };
        break;
      case "most_bedrooms":
        useAggregation = true;
        aggregationPipeline = [
          { $match: baseQuery },
          {
            $addFields: {
              numericBedrooms: {
                $cond: {
                  if: {
                    $eq: ["$general_listing_information.bedrooms", "Studio"],
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: "$general_listing_information.bedrooms",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                },
              },
            },
          },
          { $sort: { numericBedrooms: -1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        break;
      case "least_bedrooms":
        useAggregation = true;
        aggregationPipeline = [
          { $match: baseQuery },
          {
            $addFields: {
              numericBedrooms: {
                $cond: {
                  if: {
                    $eq: ["$general_listing_information.bedrooms", "Studio"],
                  },
                  then: 0,
                  else: {
                    $convert: {
                      input: "$general_listing_information.bedrooms",
                      to: "int",
                      onError: 0,
                      onNull: 0,
                    },
                  },
                },
              },
            },
          },
          { $sort: { numericBedrooms: 1 } },
          { $skip: skip },
          { $limit: limit },
        ];
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "popular":
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    const totalCount = await PropertyModel.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / limit);

    let properties = [];
    if (useAggregation) {
      properties = await PropertyModel.aggregate(aggregationPipeline);
    } else {
      properties = await PropertyModel.find(baseQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const sortDescriptions = {
      most_recent: "most recent first",
      newest: "newest first",
      highest_price: "highest price first",
      "price-high": "highest price first",
      lowest_price: "lowest price first",
      "price-low": "lowest price first",
      most_bedrooms: "most bedrooms first",
      least_bedrooms: "least bedrooms first",
      oldest: "oldest first",
      popular: "most popular first",
    };

    const sortDescription =
      sortDescriptions[sortBy.toLowerCase()] || "most recent first";

    res.status(200).json({
      success: true,
      message: `${collectionName} properties sorted by ${sortDescription}`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sort: sortBy,
      count: properties.length,
      data: properties,
      debug: {
        modelUsed: PropertyModel.modelName,
        rawOfferingType: rawOfferingType,
        normalizedOfferingType: offeringType,
        collectionName: collectionName,
      },
    });
  } catch (error) {
    console.error("Error in SortProperties:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sort properties",
      error: error.message,
    });
  }
};

// Updated specializedFilter (Hero Section filter)
// const specializedFilter = async (req, res) => {
//   try {
//     console.log("Working - Specialized Filter");

//     // FIXED: Normalize offering type
//     const rawOfferingType =
//       req.query.offeringType ||
//       req.query.type ||
//       req.query.propertyCollection ||
//       "Sale";
//     const offeringType = normalizeOfferingType(rawOfferingType);
//     const PropertyModel = getPropertyModelByOfferingType(offeringType);
//     const collectionName = getCollectionName(offeringType);

//     console.log("Raw Offering Type:", rawOfferingType);
//     console.log("Normalized Offering Type:", offeringType);
//     console.log(`Using ${PropertyModel.modelName} collection for filtering`);

//     // FIXED: Better parameter handling
//     const minPrice =
//       req.query.minPrice &&
//       req.query.minPrice !== "" &&
//       req.query.minPrice !== "any"
//         ? req.query.minPrice
//         : "0";
//     const maxPrice =
//       req.query.maxPrice &&
//       req.query.maxPrice !== "" &&
//       req.query.maxPrice !== "any"
//         ? req.query.maxPrice
//         : "10000000";
//     const propertyType =
//       req.query.propertyType && req.query.propertyType !== ""
//         ? req.query.propertyType
//         : "all";
//     const bedrooms =
//       req.query.bedrooms &&
//       req.query.bedrooms !== "" &&
//       req.query.bedrooms !== "any"
//         ? req.query.bedrooms
//         : "all";
//     const location = req.query.location || req.query.address || "";

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 30;

//     // Build the filter query
//     const filterQuery = {};

//     // FIXED: Add price range filter with proper numeric conversion
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       filterQuery["general_listing_information.listingprice"] = {};
//       if (minPrice !== "0") {
//         const minPriceNum = parseInt(minPrice);
//         if (!isNaN(minPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$gte"] =
//             minPriceNum;
//         }
//       }
//       if (maxPrice !== "10000000") {
//         const maxPriceNum = parseInt(maxPrice);
//         if (!isNaN(maxPriceNum)) {
//           filterQuery["general_listing_information.listingprice"]["$lte"] =
//             maxPriceNum;
//         }
//       }
//     }

//     // Add property type filter
//     if (
//       propertyType &&
//       propertyType.toLowerCase() !== "all" &&
//       propertyType.toLowerCase() !== ""
//     ) {
//       if (propertyType.includes(",")) {
//         const propertyTypes = propertyType
//           .split(",")
//           .map((type) => type.trim());
//         filterQuery["general_listing_information.propertytype"] = {
//           $in: propertyTypes,
//         };
//       } else {
//         filterQuery["general_listing_information.propertytype"] = propertyType;
//       }
//     }

//     // Add bedrooms filter
//     if (
//       bedrooms &&
//       bedrooms.toLowerCase() !== "all" &&
//       bedrooms.toLowerCase() !== ""
//     ) {
//       if (bedrooms.toLowerCase() === "studio" || bedrooms === "0") {
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: ["0", "Studio", "studio"],
//         };
//       } else if (bedrooms.toString().endsWith("+")) {
//         const minBedrooms = parseInt(bedrooms.replace("+", ""));
//         if (!isNaN(minBedrooms)) {
//           filterQuery["general_listing_information.bedrooms"] = {
//             $gte: minBedrooms.toString(),
//           };
//         }
//       } else if (bedrooms.includes(",")) {
//         const bedroomOptions = bedrooms.split(",").map((bed) => bed.trim());
//         filterQuery["general_listing_information.bedrooms"] = {
//           $in: bedroomOptions,
//         };
//       } else {
//         filterQuery["general_listing_information.bedrooms"] =
//           bedrooms.toString();
//       }
//     }

//     // UPDATED: Add location filter using the correct field
//     if (location && location.trim() !== "") {
//       const searchTerm = location.trim();
//       console.log("Adding location filter for:", searchTerm);
//       filterQuery["custom_fields.pba__addresstext_pb"] = {
//         $regex: searchTerm,
//         $options: "i",
//       };
//     }

//     console.log("Final Filter Query:", JSON.stringify(filterQuery, null, 2));

//     const skip = (page - 1) * limit;
//     const totalCount = await PropertyModel.countDocuments(filterQuery);
//     const totalPages = Math.ceil(totalCount / limit);

//     if (totalCount === 0) {
//       return res.status(200).json({
//         success: true,
//         message: `No ${collectionName} properties found matching the filter criteria`,
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalCount: 0,
//           perPage: limit,
//           hasNextPage: false,
//           hasPrevPage: page > 1,
//         },
//         count: 0,
//         data: [],
//         debug: {
//           modelUsed: PropertyModel.modelName,
//           rawOfferingType: rawOfferingType,
//           normalizedOfferingType: offeringType,
//           filterQuery: filterQuery,
//         },
//       });
//     }

//     const properties = await PropertyModel.find(filterQuery)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     const activeFilters = [];
//     if (minPrice !== "0" || maxPrice !== "10000000") {
//       activeFilters.push(
//         `price range: ${minPrice === "0" ? "min" : minPrice} - ${
//           maxPrice === "10000000" ? "max" : maxPrice
//         } AED`
//       );
//     }
//     if (propertyType && propertyType.toLowerCase() !== "all") {
//       activeFilters.push(`property type: ${propertyType}`);
//     }
//     if (bedrooms && bedrooms.toLowerCase() !== "all") {
//       activeFilters.push(`bedrooms: ${bedrooms}`);
//     }
//     if (location && location.trim() !== "") {
//       activeFilters.push(`location: ${location}`);
//     }

//     const summaryText =
//       activeFilters.length > 0
//         ? `${collectionName} properties filtered by ${activeFilters.join(", ")}`
//         : `All ${collectionName} properties`;

//     res.status(200).json({
//       success: true,
//       message: summaryText,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalCount: totalCount,
//         perPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//       count: properties.length,
//       data: properties,
//       debug: {
//         modelUsed: PropertyModel.modelName,
//         rawOfferingType: rawOfferingType,
//         normalizedOfferingType: offeringType,
//       },
//     });
//   } catch (error) {
//     console.error("Error in specializedFilter:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to filter properties",
//       error: error.message,
//     });
//   }
// };

// Updated filterByLocation
// const filterByLocation = async (req, res) => {
//   try {
//     const location = req.query.location || req.query.address;

//     // FIXED: Normalize offering type
//     const rawOfferingType =
//       req.query.offeringType ||
//       req.query.type ||
//       req.query.propertyCollection ||
//       "Sale";
//     const offeringType = normalizeOfferingType(rawOfferingType);
//     const PropertyModel = getPropertyModelByOfferingType(offeringType);
//     const collectionName = getCollectionName(offeringType);

//     console.log("Raw Offering Type:", rawOfferingType);
//     console.log("Normalized Offering Type:", offeringType);

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 30;

//     if (!location) {
//       return res.status(400).json({
//         success: false,
//         message: "Location parameter is required",
//       });
//     }

//     const searchTerm = location.trim();
//     console.log("Cleaned search term:", searchTerm);

//     // UPDATED: Remove status filter since all properties in collections are now Live
//     const combinedQuery = {
//       "custom_fields.pba__addresstext_pb": {
//         $regex: searchTerm,
//         $options: "i",
//       },
//     };

//     console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

//     const skip = (page - 1) * limit;
//     const totalCount = await PropertyModel.countDocuments(combinedQuery);
//     const totalPages = Math.ceil(totalCount / limit);

//     if (totalCount === 0) {
//       return res.status(200).json({
//         success: true,
//         message: `No ${collectionName} properties found with "${searchTerm}" in the address`,
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalCount: 0,
//           perPage: limit,
//           hasNextPage: false,
//           hasPrevPage: page > 1,
//         },
//         searchTerm: searchTerm,
//         count: 0,
//         data: [],
//         debug: {
//           modelUsed: PropertyModel.modelName,
//           rawOfferingType: rawOfferingType,
//           normalizedOfferingType: offeringType,
//         },
//       });
//     }

//     const properties = await PropertyModel.find(combinedQuery)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     res.status(200).json({
//       success: true,
//       message: `${collectionName} properties with "${searchTerm}" in address found successfully`,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalCount: totalCount,
//         perPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//       searchTerm: searchTerm,
//       count: properties.length,
//       data: properties,
//       debug: {
//         modelUsed: PropertyModel.modelName,
//         rawOfferingType: rawOfferingType,
//         normalizedOfferingType: offeringType,
//         collectionName: collectionName,
//       },
//     });
//   } catch (error) {
//     console.error("Error in filterByLocation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to filter properties by location",
//       error: error.message,
//     });
//   }
// };

// Updated getAddressSuggestions
const getAddressSuggestions = async (req, res) => {
  try {
    // Get listing_type from query parameters - this is the indexed field at base level
    const listingType =
      req.query.listing_type ||
      req.query.listingType ||
      req.query.type ||
      "Sale";

    const prefix = req.query.prefix;
    const maxSuggestions = parseInt(req.query.limit) || 8;

    console.log(
      `Getting address suggestions for listing_type: "${listingType}"`
    );

    if (!prefix) {
      return res.status(400).json({
        success: false,
        message: "Prefix parameter is required",
      });
    }

    if (prefix.length < 2) {
      return res.json({
        success: true,
        message: "Prefix too short",
        data: [],
        debug: {
          listingType: listingType,
          prefix: prefix,
        },
      });
    }

    console.log(
      `Getting address suggestions for prefix: "${prefix}" from ${listingType} properties`
    );

    // Build query using listing_type (indexed field at base level) and address field
    const query = {
      listing_type: listingType, // Use the indexed field at document root
      "custom_fields.pba__addresstext_pb": {
        $regex: new RegExp(`\\b${prefix}`, "i"),
      },
    };

    // Use a generic Property model or determine the model based on your setup
    // If you have different models for different listing types, adjust accordingly
    const properties = await Property.find(query)
      .limit(5) // Get more results to process
      .select("custom_fields.pba__addresstext_pb listing_type")
      .lean();

    console.log(
      `Found ${properties.length} ${listingType} properties matching query`
    );

    const suggestions = new Set();

    const processAddress = (fullAddress) => {
      if (!fullAddress) return;

      // Split address by common delimiters and process each part
      const addressParts = fullAddress
        .split(/[,\/\-_|]+/)
        .map((part) => part.trim());

      for (const part of addressParts) {
        if (part && part.length >= 2) {
          // Check if this part matches the prefix
          if (
            part.toLowerCase().match(new RegExp(`\\b${prefix.toLowerCase()}`))
          ) {
            suggestions.add(part);
            if (suggestions.size >= maxSuggestions) return;
          }
        }
      }
    };

    // Process each property's address
    properties.forEach((property) => {
      if (property.custom_fields?.pba__addresstext_pb) {
        processAddress(property.custom_fields.pba__addresstext_pb);
        if (suggestions.size >= maxSuggestions) return;
      }
    });

    let suggestionsArray = Array.from(suggestions);

    // Sort suggestions: exact matches first, then by length, then alphabetically
    suggestionsArray.sort((a, b) => {
      const aExact = a.toLowerCase().startsWith(prefix.toLowerCase());
      const bExact = b.toLowerCase().startsWith(prefix.toLowerCase());

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });

    // Limit to requested number of suggestions
    suggestionsArray = suggestionsArray.slice(0, maxSuggestions);

    console.log(
      `Returning ${suggestionsArray.length} suggestions for ${listingType} properties`
    );

    res.status(200).json({
      success: true,
      message: `Found ${suggestionsArray.length} address suggestions for "${prefix}" from ${listingType} properties`,
      count: suggestionsArray.length,
      listingType: listingType,
      data: suggestionsArray,
      debug: {
        listingType: listingType,
        prefix: prefix,
        totalPropertiesFound: properties.length,
      },
    });
  } catch (error) {
    console.error("Error in getAddressSuggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get address suggestions",
      error: error.message,
    });
  }
};


const getOffPlanAddressSuggestions = async (req, res) => {
  try {
    const prefix = req.query.prefix;
    const maxSuggestions = parseInt(req.query.limit) || 8;

    console.log(`Getting off-plan project name suggestions for prefix: "${prefix}"`);

    // Validation
    if (!prefix) {
      return res.status(400).json({
        success: false,
        message: "Prefix parameter is required"
      });
    }

    if (prefix.length < 2) {
      return res.json({
        success: true,
        message: "Prefix too short for meaningful search",
        data: [],
        count: 0,
        debug: {
          prefix: prefix,
          minLength: 2
        }
      });
    }

    // Build query to search project names that start with or contain the prefix
    // Using word boundary regex for better matching
    const query = {
      "name": { 
        $regex: new RegExp(`\\b${prefix}`, "i") // Word boundary search, case insensitive
      }
    };

    console.log("MongoDB query:", JSON.stringify(query, null, 2));

    // Find matching off-plan properties
    const properties = await OffPlanProperty.find(query)
      .limit(maxSuggestions * 2) // Get more results to have variety
      .select("name area developer") // Select only needed fields for suggestions
      .lean();

    console.log(`Found ${properties.length} off-plan properties matching query`);

    // Create suggestions set to avoid duplicates
    const suggestions = new Set();
    
    // Process each property name
    properties.forEach((property) => {
      if (property.name && property.name.trim()) {
        const projectName = property.name.trim();
        
        // Check if the project name contains the prefix (case insensitive)
        if (projectName.toLowerCase().includes(prefix.toLowerCase())) {
          suggestions.add(projectName);
        }
        
        // Stop if we have enough suggestions
        if (suggestions.size >= maxSuggestions) return;
      }
    });

    // Convert to array and sort
    let suggestionsArray = Array.from(suggestions);
    
    // Sort suggestions for better user experience:
    // 1. Exact matches first
    // 2. Names starting with prefix
    // 3. Names containing prefix
    // 4. Alphabetically within each group
    suggestionsArray.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const prefixLower = prefix.toLowerCase();
      
      // Check for exact match
      const aExact = aLower === prefixLower;
      const bExact = bLower === prefixLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Check for starts with
      const aStarts = aLower.startsWith(prefixLower);
      const bStarts = bLower.startsWith(prefixLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Check for word boundary match at start
      const aWordStart = aLower.match(new RegExp(`^${prefixLower}\\b`));
      const bWordStart = bLower.match(new RegExp(`^${prefixLower}\\b`));
      if (aWordStart && !bWordStart) return -1;
      if (!aWordStart && bWordStart) return 1;
      
      // Sort by length (shorter first)
      if (a.length !== b.length) return a.length - b.length;
      
      // Finally sort alphabetically
      return a.localeCompare(b);
    });

    // Limit to requested number
    suggestionsArray = suggestionsArray.slice(0, maxSuggestions);

    console.log(`Returning ${suggestionsArray.length} project name suggestions`);

    return res.status(200).json({
      success: true,
      message: `Found ${suggestionsArray.length} off-plan project suggestions for "${prefix}"`,
      count: suggestionsArray.length,
      data: suggestionsArray,
      debug: {
        prefix: prefix,
        totalPropertiesFound: properties.length,
        uniqueSuggestions: suggestionsArray.length
      }
    });

  } catch (error) {
    console.error("Error in getOffPlanAddressSuggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get off-plan project suggestions",
      error: error.message,
      data: []
    });
  }
};


// const filterByCommunity = async (req, res) => {
//   try {
//     const community = req.query.community;

//     const rawOfferingType =
//       req.query.offeringType ||
//       req.query.type ||
//       req.query.propertyCollection ||
//       "Sale";
//     const offeringType = normalizeOfferingType(rawOfferingType);
//     const PropertyModel = getPropertyModelByOfferingType(offeringType);
//     const collectionName = getCollectionName(offeringType);

//     // console.log("Raw Offering Type:", rawOfferingType);
//     // console.log("Normalized Offering Type:", offeringType);

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 12;

//     if (!community) {
//       return res.status(400).json({
//         success: false,
//         message: "Community parameter is required",
//       });
//     }

//     const searchWords = community
//       .trim()
//       .split(/\s+/)
//       .filter((word) => word.length > 0);

//     const wordRegexPatterns = searchWords.map((word) => {
//       const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//       return new RegExp(`\\b${escapedWord}\\b`, "i");
//     });

//     // UPDATED: Remove status filter since all properties in collections are now Live
//     const combinedQuery = {
//       "custom_fields.community": {
//         $all: wordRegexPatterns,
//       },
//     };

//     console.log("Community search terms:", searchWords);
//     console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

//     const skip = (page - 1) * limit;
//     const totalCount = await PropertyModel.countDocuments(combinedQuery);
//     const totalPages = Math.ceil(totalCount / limit);

//     if (totalCount === 0) {
//       return res.status(200).json({
//         success: true,
//         message: `No ${collectionName} properties found in "${community}" community`,
//         pagination: {
//           currentPage: page,
//           totalPages: 0,
//           totalCount: 0,
//           perPage: limit,
//           hasNextPage: false,
//           hasPrevPage: page > 1,
//         },
//         count: 0,
//         data: [],
//         debug: {
//           modelUsed: PropertyModel.modelName,
//           rawOfferingType: rawOfferingType,
//           normalizedOfferingType: offeringType,
//           filterQuery: combinedQuery,
//         },
//       });
//     }

//     const properties = await PropertyModel.find(combinedQuery)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     console.log(
//       `Found ${properties.length} ${collectionName} properties for page ${page} in "${community}" community`
//     );

//     res.status(200).json({
//       success: true,
//       message: `${collectionName} properties in "${community}" community found successfully`,
//       pagination: {
//         currentPage: page,
//         totalPages: totalPages,
//         totalCount: totalCount,
//         perPage: limit,
//         hasNextPage: page < totalPages,
//         hasPrevPage: page > 1,
//       },
//       searchTerms: searchWords,
//       searchField: "pba_uaefields__community_propertyfinder",
//       collectionType: collectionName,
//       count: properties.length,
//       data: properties,
//       debug: {
//         modelUsed: PropertyModel.modelName,
//         rawOfferingType: rawOfferingType,
//         normalizedOfferingType: offeringType,
//         collectionName: collectionName,
//       },
//     });
//   } catch (error) {
//     console.error("Error in filterByCommunity:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to filter properties by community",
//       error: error.message,
//     });
//   }
// };

const filterByCommunity = async (req, res) => {
  try {
    const community = req.query.community;
    const listingType = req.query.listingType || req.query.type || "Sale"; // Default to Sale
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    if (!community) {
      return res.status(400).json({
        success: false,
        message: "Community parameter is required",
      });
    }

    // Normalize listing type to match your data structure
    const normalizedListingType = listingType.charAt(0).toUpperCase() + listingType.slice(1).toLowerCase();

    const searchWords = community
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const wordRegexPatterns = searchWords.map((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escapedWord}\\b`, "i");
    });

    // Build the query for unified property architecture
    const combinedQuery = {
      $and: [
        {
          "custom_fields.community": {
            $all: wordRegexPatterns,
          },
        },
        {
          "listing_type": normalizedListingType, // Filter by listing type (Sale/Rent)
        },
        {
          "general_listing_information.status": "Live", // Only live properties
        }
      ]
    };

    console.log("Community search terms:", searchWords);
    console.log("Listing type:", normalizedListingType);
    console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

    const skip = (page - 1) * limit;
    
    // Assuming you have a unified Property model
    const totalCount = await Property.countDocuments(combinedQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${normalizedListingType.toLowerCase()} properties found in "${community}" community`,
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          perPage: limit,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
        count: 0,
        data: [],
        debug: {
          listingType: normalizedListingType,
          filterQuery: combinedQuery,
          searchTerms: searchWords,
        },
      });
    }

    const properties = await Property.find(combinedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(
      `Found ${properties.length} ${normalizedListingType.toLowerCase()} properties for page ${page} in "${community}" community`
    );

    res.status(200).json({
      success: true,
      message: `${normalizedListingType} properties in "${community}" community found successfully`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      searchTerms: searchWords,
      searchField: "custom_fields.community",
      listingType: normalizedListingType,
      count: properties.length,
      data: properties,
      debug: {
        listingType: normalizedListingType,
        filterQuery: combinedQuery,
      },
    });
  } catch (error) {
    console.error("Error in filterByCommunity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter properties by community",
      error: error.message,
    });
  }
};

// Alternative version if you want to support both offering_type and listing_type
const filterByCommunityFlexible = async (req, res) => {
  try {
    const community = req.query.community;
    const listingType = req.query.listingType || req.query.type || "Sale";
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    if (!community) {
      return res.status(400).json({
        success: false,
        message: "Community parameter is required",
      });
    }

    const normalizedListingType = listingType.charAt(0).toUpperCase() + listingType.slice(1).toLowerCase();

    const searchWords = community
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const wordRegexPatterns = searchWords.map((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escapedWord}\\b`, "i");
    });

    // Build query with flexible listing type matching
    const combinedQuery = {
      $and: [
        {
          "custom_fields.community": {
            $all: wordRegexPatterns,
          },
        },
        {
          $or: [
            { "listing_type": normalizedListingType },
            { "_classification.listingType": normalizedListingType },
            { 
              "offering_type": normalizedListingType === "Sale" ? "RS" : "RR" 
            }
          ]
        },
        {
          "general_listing_information.status": "Live"
        }
      ]
    };

    console.log("Community search terms:", searchWords);
    console.log("Listing type:", normalizedListingType);
    console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

    const skip = (page - 1) * limit;
    const totalCount = await Property.countDocuments(combinedQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${normalizedListingType.toLowerCase()} properties found in "${community}" community`,
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          perPage: limit,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
        count: 0,
        data: [],
      });
    }

    const properties = await Property.find(combinedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      message: `${normalizedListingType} properties in "${community}" community found successfully`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      searchTerms: searchWords,
      listingType: normalizedListingType,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Error in filterByCommunity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter properties by community",
      error: error.message,
    });
  }
};
module.exports = {
  SortProperties,
  getAddressSuggestions,
  filterByCommunity,
  //New filter
  UniversalSpecializedFilter,
};
