// Enhanced filter that works with all property collections based on offering type
const RentProperty = require("../Models/RentPropertyModel");
const SaleProperty = require("../Models/SalePropertyModel");
const Offplan = require("../Models/OffplanModel");
const CommercialProperty = require("../Models/CommercialPropertyModel");
const ErrorMiddleware = require("../Middlewares/ErrorMiddleware");

// Helper function to determine PropertyModel based on offering type
const getPropertyModelByOfferingType = (offeringType) => {
  console.log("Determining model for offering type:", offeringType);
  
  switch (offeringType?.toUpperCase()) {
    case 'RS': // Sale Property
    case 'Sale': // Sale Property
    case 'SALE': // Sale Property
      console.log("Using SaleProperty model");
      return SaleProperty;
    case 'RR':
    case "Rent": // Rent Property
    case "RENT": // Rent Property
      console.log("Using RentProperty model");
      return RentProperty;
    case 'CS': // Commercial Sale
    case 'CR': // Commercial Rent
    case 'Commercial': // Commercial Rent
      console.log("Using CommercialProperty model");
      return CommercialProperty;
    default: // OffPlan or any other type
      console.log("Using Offplan model (default)");
      return Offplan;
  }
};

// Helper function to get collection name for response
const getCollectionName = (offeringType) => {
  switch (offeringType?.toUpperCase()) {
    case 'RS': return 'Sale';
    case 'RR': return 'Rent';
    case 'CS': 
    case 'CR': return 'Commercial';
    default: return 'OffPlan';
  }
};

const enhancedSpecializedFilter = async (req, res) => {
  try {
    // Get the offering type parameter instead of propertyCollection
    const offeringType = req.query.offeringType || req.query.type || "RS"; // Default to Sale if not specified
    console.log("Offering Type:", offeringType);

    // Determine which model to use based on offering type
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    
    console.log(`Using ${PropertyModel.modelName} collection for filtering`);
    console.log(`Offering Type parameter: ${offeringType}`);

    // Get location parameter for address filtering
    const location = req.query.address;
    console.log("Location parameter:", location);

    // Get all filter parameters - set to "all" by default to show all properties unless specifically filtered
    const minPrice = req.query.minPrice || "0";
    const maxPrice = req.query.maxPrice || "10000000";
    const propertyType = req.query.propertyType || "all";
    const bedrooms = req.query.bedrooms || "all";
    const bathrooms = req.query.bathrooms || "all";
    const furnishing = req.query.furnishing || "all";
    const minSize = req.query.minSize || "0";
    const maxSize = req.query.maxSize || "100000";
    const amenities = req.query.amenities || "all";

    console.log("Filters",minPrice,maxPrice,propertyType,bedrooms,bathrooms,furnishing,minSize,maxSize,amenities)


    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Build the filter query
    const filterQuery = {};

    // REMOVED: Status filter since all properties in collections are now Live
    // filterQuery["general_listing_information.status"] = "Active";

    // Add location/address filter if provided
    if (location && location.trim() !== "") {
      const searchTerm = location.trim();
      console.log("Adding location filter for:", searchTerm);
      filterQuery["custom_fields.pba__addresstext_pb"] = {
        $regex: searchTerm,
        $options: "i",
      };
    }

    // 1. Add price range filter only if not using full range defaults
    if (minPrice !== "0" || maxPrice !== "10000000") {
      filterQuery["general_listing_information.listingprice"] = {};
      if (minPrice !== "0") {
        filterQuery["general_listing_information.listingprice"]["$gte"] = minPrice - 1;
      }
      if (maxPrice !== "10000000") {
        filterQuery["general_listing_information.listingprice"]["$lte"] = maxPrice + 1;
      }
    }

    // 2. Add property type filter if provided and not 'all'
    if (propertyType && propertyType.toLowerCase() !== "all") {
      if (propertyType.includes(",")) {
        const propertyTypes = propertyType.split(",").map((type) => type.trim());
        filterQuery["general_listing_information.propertytype"] = { $in: propertyTypes };
      } else {
        filterQuery["general_listing_information.propertytype"] = propertyType;
      }
    }

    // 3. Add bedrooms filter if provided and not 'all'
    if (bedrooms && bedrooms.toLowerCase() !== "all") {
      if (bedrooms === "Studio" || bedrooms === "0") {
        filterQuery["general_listing_information.bedrooms"] = { $in: ["0", "Studio"] };
      } else if (bedrooms.endsWith("+")) {
        const minBedrooms = parseInt(bedrooms.replace("+", ""));
        filterQuery["general_listing_information.bedrooms"] = { $gte: minBedrooms.toString() };
      } else if (bedrooms.includes(",")) {
        const bedroomOptions = bedrooms.split(",").map((bed) => bed.trim());
        filterQuery["general_listing_information.bedrooms"] = { $in: bedroomOptions };
      } else {
        filterQuery["general_listing_information.bedrooms"] = bedrooms;
      }
    }

    // 4. Add bathrooms filter if provided and not 'all'
    if (bathrooms && bathrooms.toLowerCase() !== "all") {
      if (bathrooms.endsWith("+")) {
        const minBathrooms = parseInt(bathrooms.replace("+", ""));
        filterQuery["general_listing_information.fullbathrooms"] = { $gte: minBathrooms.toString() };
      } else if (bathrooms.includes(",")) {
        const bathroomOptions = bathrooms.split(",").map((bath) => bath.trim());
        filterQuery["general_listing_information.fullbathrooms"] = { $in: bathroomOptions };
      } else {
        filterQuery["general_listing_information.fullbathrooms"] = bathrooms;
      }
    }

    // 5. Add furnishing filter if provided and not 'all'
    if (furnishing && furnishing.toLowerCase() !== "all") {
      const furnishingMapValues = {
        furnished: "Yes",
        unfurnished: "No",
        partial: "Partial",
        yes: "Yes",
        no: "No",
      };

      if (furnishing.includes(",")) {
        const furnishingOptions = furnishing
          .split(",")
          .map((furn) => furnishingMapValues[furn.trim().toLowerCase()] || furn.trim());
        filterQuery["custom_fields.furnished"] = { $in: furnishingOptions };
      } else {
        const furnishingValue = furnishingMapValues[furnishing.toLowerCase()] || furnishing;
        filterQuery["custom_fields.furnished"] = furnishingValue;
      }
    }

    // 6. Add property size range filter only if not using full range defaults
    if (minSize !== "0" || maxSize !== "100000") {
      console.log("Applying size filter - MinSize:", minSize, "MaxSize:", maxSize);
      
      const sizeConditions = [];
      
      const numericCondition = {};
      if (minSize !== "0") {
        numericCondition["$gte"] = parseInt(minSize);
      }
      if (maxSize !== "100000") {
        numericCondition["$lte"] = parseInt(maxSize);
      }
      
      const exprConditions = [];
      if (minSize !== "0") {
        exprConditions.push({
          "$gte": [
            { "$toDouble": { "$ifNull": ["$general_listing_information.totalarea", "0"] } },
            parseInt(minSize)
          ]
        });
      }
      if (maxSize !== "100000") {
        exprConditions.push({
          "$lte": [
            { "$toDouble": { "$ifNull": ["$general_listing_information.totalarea", "0"] } },
            parseInt(maxSize)
          ]
        });
      }
      
      if (Object.keys(numericCondition).length > 0) {
        sizeConditions.push({ "general_listing_information.totalarea": numericCondition });
      }
      
      if (exprConditions.length > 0) {
        sizeConditions.push({ "$expr": { "$and": exprConditions } });
      }
      
      if (sizeConditions.length > 0) {
        filterQuery["$and"] = filterQuery["$and"] || [];
        filterQuery["$and"].push({ "$or": sizeConditions });
      }
    }

    // 7. Add amenities filter if provided and not 'all'
    if (amenities && amenities.toLowerCase() !== "all" && amenities.length > 0) {
      const requestedAmenities = amenities.split(",").map((amenity) => amenity.trim());
      if (requestedAmenities.length > 0) {
        filterQuery["custom_fields.private_amenities"] = {
          $all: requestedAmenities.map((amenity) => new RegExp(amenity, "i")),
        };
      }
    }

    console.log("Final Filter Query:", JSON.stringify(filterQuery, null, 2));

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    let totalCount = 0;
    try {
      totalCount = await PropertyModel.countDocuments(filterQuery);
      console.log(`Found ${totalCount} matching documents`);
    } catch (countError) {
      console.error("Error counting documents:", countError);
      console.error("PropertyModel:", PropertyModel.modelName);
      throw countError;
    }

    const totalPages = Math.ceil(totalCount / limit);

    // Determine collection name for response
    const collectionName = getCollectionName(offeringType);

    // If there are no results, return appropriate response
    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${collectionName} properties found matching the filter criteria`,
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
          modelUsed: PropertyModel.modelName,
          offeringType: offeringType,
          filterQuery: filterQuery,
        },
      });
    }

    // Execute the query with pagination and sorting
    let properties = [];
    try {
      properties = await PropertyModel.find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (findError) {
      console.error("Error finding properties:", findError);
      throw findError;
    }

    console.log(`Found ${properties.length} ${collectionName} properties for page ${page}`);

    // Create response with applied filters
    const activeFilters = [];

    if (location && location.trim() !== "") {
      activeFilters.push(`location: ${location.trim()}`);
    }
    if (minPrice !== "0" || maxPrice !== "10000000") {
      activeFilters.push(`price range: ${minPrice === "0" ? "min" : minPrice} - ${maxPrice === "10000000" ? "max" : maxPrice} AED`);
    }
    if (propertyType.toLowerCase() !== "all") {
      activeFilters.push(`property type: ${propertyType}`);
    }
    if (bedrooms.toLowerCase() !== "all") {
      activeFilters.push(`bedrooms: ${bedrooms}`);
    }
    if (bathrooms.toLowerCase() !== "all") {
      activeFilters.push(`bathrooms: ${bathrooms}`);
    }
    if (furnishing.toLowerCase() !== "all") {
      activeFilters.push(`furnishing: ${furnishing}`);
    }
    if (minSize !== "0" || maxSize !== "100000") {
      activeFilters.push(`size range: ${minSize} - ${maxSize} sqft`);
    }
    if (amenities.toLowerCase() !== "all" && amenities.length > 0) {
      activeFilters.push(`amenities: ${amenities}`);
    }

    const summaryText = activeFilters.length > 0
      ? `${collectionName} properties filtered by ${activeFilters.join(", ")}`
      : `All ${collectionName} properties`;

    return res.status(200).json({
      success: true,
      message: summaryText,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      searchTerm: location?.trim() || "",
      count: properties.length,
      data: properties,
      debug: {
        modelUsed: PropertyModel.modelName,
        offeringType: offeringType,
        collectionName: collectionName,
      },
    });

  } catch (error) {
    console.error("Error in enhancedSpecializedFilter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter properties",
      error: error.message,
    });
  }
};

// Updated Sorting function
const SortProperties = async (req, res) => {
  try {
    const offeringType = req.query.offeringType || req.query.type || "RS"; // Default to Sale
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);

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
        sortOptions = { createdAt: -1 };
        break;
      case "highest_price":
        sortOptions = { "general_listing_information.listingprice": -1 };
        break;
      case "lowest_price":
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
                  if: { $eq: ["$general_listing_information.bedrooms", "Studio"] },
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
                  if: { $eq: ["$general_listing_information.bedrooms", "Studio"] },
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

    const totalCount = await PropertyModel.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / limit);

    let properties = [];
    if (useAggregation) {
      properties = await PropertyModel.aggregate(aggregationPipeline);
    } else {
      properties = await PropertyModel.find(baseQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit);
    }

    const sortDescriptions = {
      most_recent: "most recent first",
      highest_price: "highest price first",
      lowest_price: "lowest price first",
      most_bedrooms: "most bedrooms first",
      least_bedrooms: "least bedrooms first",
    };

    const sortDescription = sortDescriptions[sortBy.toLowerCase()] || "most recent first";

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
    });
  } catch (err) {
    console.log("Error Forwarded");
    ErrorMiddleware(err);
  }
};

// Updated specializedFilter (Hero Section filter)
const specializedFilter = async (req, res) => {
  try {
    console.log("Working - Specialized Filter");

    const offeringType = req.query.offeringType || req.query.type || "RS"; // Default to Sale
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);

    console.log(`Using ${PropertyModel.modelName} collection for filtering`);

    const minPrice = req.query.minPrice || "0";
    const maxPrice = req.query.maxPrice || "10000000";
    const propertyType = req.query.propertyType || "all";
    const bedrooms = req.query.bedrooms || "all";
    const location = req.query.location || "";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    // Build the filter query
    const filterQuery = {};

    // REMOVED: Status filter since all properties in collections are now Live
    // filterQuery["general_listing_information.status"] = "Active";

    // Add price range filter
    if (minPrice !== "0" || maxPrice !== "10000000") {
      filterQuery["general_listing_information.listingprice"] = {};
      if (minPrice !== "0") {
        filterQuery["general_listing_information.listingprice"]["$gte"] = minPrice;
      }
      if (maxPrice !== "10000000") {
        filterQuery["general_listing_information.listingprice"]["$lte"] = maxPrice;
      }
    }

    // Add property type filter
    if (propertyType && propertyType.toLowerCase() !== "all") {
      if (propertyType.includes(",")) {
        const propertyTypes = propertyType.split(",").map((type) => type.trim());
        filterQuery["general_listing_information.propertytype"] = { $in: propertyTypes };
      } else {
        filterQuery["general_listing_information.propertytype"] = propertyType;
      }
    }

    // Add bedrooms filter
    if (bedrooms && bedrooms.toLowerCase() !== "all") {
      if (bedrooms === "Studio" || bedrooms === "0") {
        filterQuery["general_listing_information.bedrooms"] = { $in: ["0", "Studio"] };
      } else if (bedrooms.endsWith("+")) {
        const minBedrooms = parseInt(bedrooms.replace("+", ""));
        filterQuery["general_listing_information.bedrooms"] = { $gte: minBedrooms.toString() };
      } else if (bedrooms.includes(",")) {
        const bedroomOptions = bedrooms.split(",").map((bed) => bed.trim());
        filterQuery["general_listing_information.bedrooms"] = { $in: bedroomOptions };
      } else {
        filterQuery["general_listing_information.bedrooms"] = bedrooms;
      }
    }

    // Add location filter
    if (location && location.trim() !== "") {
      const locationRegex = new RegExp(location.trim(), "i");
      filterQuery["$or"] = [
        { "general_listing_information.city": locationRegex },
        { "general_listing_information.community": locationRegex },
        { "general_listing_information.building": locationRegex },
        { "general_listing_information.address": locationRegex },
        { "general_listing_information.area": locationRegex },
      ];
    }

    console.log("Final Filter Query:", JSON.stringify(filterQuery, null, 2));

    const skip = (page - 1) * limit;
    const totalCount = await PropertyModel.countDocuments(filterQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${collectionName} properties found matching the filter criteria`,
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

    const properties = await PropertyModel.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const activeFilters = [];
    if (minPrice !== "0" || maxPrice !== "10000000") {
      activeFilters.push(`price range: ${minPrice === "0" ? "min" : minPrice} - ${maxPrice === "10000000" ? "max" : maxPrice} AED`);
    }
    if (propertyType.toLowerCase() !== "all") {
      activeFilters.push(`property type: ${propertyType}`);
    }
    if (bedrooms.toLowerCase() !== "all") {
      activeFilters.push(`bedrooms: ${bedrooms}`);
    }
    if (location && location.trim() !== "") {
      activeFilters.push(`location: ${location}`);
    }

    const summaryText = activeFilters.length > 0
      ? `${collectionName} properties filtered by ${activeFilters.join(", ")}`
      : `All ${collectionName} properties`;

    res.status(200).json({
      success: true,
      message: summaryText,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      count: properties.length,
      data: properties,
    });

  } catch (error) {
    console.error("Error in specializedFilter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter properties",
      error: error.message,
    });
  }
};

// Updated filterByLocation
const filterByLocation = async (req, res) => {
  try {
    const location = req.query.location;
    const offeringType = req.query.offeringType || "RS"; 
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location parameter is required",
      });
    }

    const searchTerm = location.trim();
    console.log("Cleaned search term:", searchTerm);

    // UPDATED: Remove status filter since all properties in collections are now Live
    const combinedQuery = {
      "custom_fields.pba__addresstext_pb": {
        $regex: searchTerm,
        $options: "i",
      },
    };

    console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

    const skip = (page - 1) * limit;
    const totalCount = await PropertyModel.countDocuments(combinedQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${collectionName} properties found with "${searchTerm}" in the address`,
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalCount: 0,
          perPage: limit,
          hasNextPage: false,
          hasPrevPage: page > 1,
        },
        searchTerm: searchTerm,
        count: 0,
        data: [],
      });
    }

    const properties = await PropertyModel.find(combinedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: `${collectionName} properties with "${searchTerm}" in address found successfully`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      searchTerm: searchTerm,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error("Error in filterByLocation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to filter properties by location",
      error: error.message,
    });
  }
};

// Updated getAddressSuggestions
const getAddressSuggestions = async (req, res) => {
  try {
    const offeringType = req.query.offeringType || "RS"; // Default to Sale
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);
    
    const prefix = req.query.prefix;
    const maxSuggestions = 5;
    console.log("Working")
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
      });
    }

    console.log(`Getting address suggestions for prefix: "${prefix}" from ${collectionName} properties`);

    // UPDATED: Use new address field and remove status filter
    const primaryQuery = {
      "custom_fields.pba__addresstext_pb": { $regex: new RegExp(`\\b${prefix}`, "i") },
    };

    // FIXED: Select the correct address field
    const properties = await PropertyModel.find(primaryQuery)
      .limit(100)
      .select("custom_fields.pba__addresstext_pb"); // Changed from "custom_fields.full_address"

    console.log(`Found ${properties.length} ${collectionName} properties matching primary query`);

    const suggestions = new Set();

    const processAddress = (fullAddress) => {
      if (!fullAddress) return;

      const addressParts = fullAddress.split(/[,\/\-_|]+/).map((part) => part.trim());

      for (const part of addressParts) {
        if (part && part.length >= 2) {
          if (part.toLowerCase().match(new RegExp(`\\b${prefix.toLowerCase()}`))) {
            suggestions.add(part);
            if (suggestions.size >= maxSuggestions) return;
          }
        }
      }
    };

    properties.forEach((property) => {
      if (property.custom_fields?.pba__addresstext_pb) {
        processAddress(property.custom_fields.pba__addresstext_pb);
        if (suggestions.size >= maxSuggestions) return;
      }
    });

    let suggestionsArray = Array.from(suggestions);

    suggestionsArray.sort((a, b) => {
      const aExact = a.toLowerCase().startsWith(prefix.toLowerCase());
      const bExact = b.toLowerCase().startsWith(prefix.toLowerCase());

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });

    suggestionsArray = suggestionsArray.slice(0, maxSuggestions);

    console.log(`Returning ${suggestionsArray.length} suggestions from ${collectionName} properties`);

    res.status(200).json({
      success: true,
      message: `Found ${suggestionsArray.length} address suggestions for "${prefix}" from ${collectionName} properties`,
      count: suggestionsArray.length,
      collectionType: collectionName,
      data: suggestionsArray,
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

// Updated filterByCommunity - FIXED SYNTAX ERROR
const filterByCommunity = async (req, res) => {
  try {
    const community = req.query.community;
    const offeringType = req.query.offeringType || req.query.type || "RS"; // Default to Sale
    
    const PropertyModel = getPropertyModelByOfferingType(offeringType);
    const collectionName = getCollectionName(offeringType);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    if (!community) {
      return res.status(400).json({
        success: false,
        message: "Community parameter is required",
      });
    }

    const searchWords = community.trim().split(/\s+/).filter((word) => word.length > 0);

    const wordRegexPatterns = searchWords.map((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escapedWord}\\b`, "i");
    });

    // UPDATED: Remove status filter since all properties in collections are now Live
    const combinedQuery = {
      "custom_fields.pba_uaefields__community_propertyfinder": {
        $all: wordRegexPatterns,
      },
    };

    console.log("Community search terms:", searchWords);
    console.log("Combined query:", JSON.stringify(combinedQuery, null, 2));

    const skip = (page - 1) * limit;
    const totalCount = await PropertyModel.countDocuments(combinedQuery);
    const totalPages = Math.ceil(totalCount / limit);

    if (totalCount === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${collectionName} properties found in "${community}" community`,
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

    const properties = await PropertyModel.find(combinedQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${properties.length} ${collectionName} properties for page ${page} in "${community}" community`);

    res.status(200).json({
      success: true,
      message: `${collectionName} properties in "${community}" community found successfully`,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      searchTerms: searchWords,
      searchField: "pba_uaefields__community_propertyfinder",
      collectionType: collectionName,
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
  enhancedSpecializedFilter,
  SortProperties,
  specializedFilter,
  filterByLocation,
  getAddressSuggestions,
  filterByCommunity,
};