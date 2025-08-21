// Fixed Controller: NewOffplanController.js
const OffPlanProperty = require("../Models/NewOffplanModel");
const axios = require("axios");

// Fetch data from API and save to database
const fetchAndSaveProperties = async (req, res) => {
  try {
    console.log("Starting API fetch process...");

    // Fetch data from external API
    const response = await axios.get(
      `${process.env.AllOffPlanPropertyiesListUrl}`,
      {
        headers: {
          "X-API-Key": `${process.env.OffPlanApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response)

    console.log("API Response received:", response.status);

    const apiData = response.data.items;
    console.log(`Received ${apiData.length} properties from API`);

    // Check if response has data
    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data received from API or invalid format",
        receivedData: response.data,
      });
    }

    // Process and save data to database
    const savedProperties = [];
    const errors = [];

    for (let i = 0; i < apiData.length; i++) {
      let item = null; // Declare item outside try block for catch access
      console.log(`Processing property ${i + 1}/${apiData.length}`);
      try {
        item = apiData[i]; // Changed from 'marker' to 'item' for clarity

        console.log(`Processing: ${item.name} (ID: ${item.id})`);

        // Parse coordinates
        const [lat, lng] = item.coordinates.split(", ").map(Number);

        // Parse cover image URL (it's a JSON string)
        let coverImage = {};
        try {
          coverImage = JSON.parse(item.cover_image_url);
        } catch (e) {
          console.warn(
            `Failed to parse cover image for ${item.name}:`,
            e.message
          );
        }

        // FIXED: Parse completion date - use 'completion_datetime' instead of 'completion_date'
        let completionDate = null;
        if (item.completion_datetime) {
          completionDate = new Date(item.completion_datetime);
        }

        // FIXED: Create property object with ALL the new fields from your API
        const propertyData = {
          apiId: item.id,
          name: item.name,
          area: item.area,
          developer: item.developer,
          coordinates: item.coordinates,
          latitude: lat,
          longitude: lng,
          minPrice: item.min_price,
          maxPrice: item.max_price, // ADDED
          minPriceAed: item.min_price_aed, // ADDED
          minPricePerAreaUnit: item.min_price_per_area_unit, // ADDED
          priceCurrency: item.price_currency || "AED", // ADDED
          areaUnit: item.area_unit || "sqft", // ADDED
          status: item.status,
          saleStatus: item.sale_status,
          completionDate: completionDate,
          isPartnerProject: item.is_partner_project || false,
          hasEscrow: item.has_escrow || false, // ADDED
          postHandover: item.post_handover || false, // ADDED
          coverImage: coverImage,
        };

        console.log(`Property data prepared for: ${item.name}`, {
          apiId: propertyData.apiId,
          name: propertyData.name,
          minPrice: propertyData.minPrice,
          hasEscrow: propertyData.hasEscrow,
        });

        // Check if property already exists (by apiId)
        const existingProperty = await OffPlanProperty.findOne({
          apiId: item.id,
        });

        if (existingProperty) {
          console.log(`Updating existing property: ${item.name}`);
          // Update existing property
          const updatedProperty = await OffPlanProperty.findOneAndUpdate(
            { apiId: item.id },
            propertyData,
            { new: true, runValidators: true }
          );
          savedProperties.push({
            action: "updated",
            property: updatedProperty.name,
            apiId: updatedProperty.apiId,
          });
        } else {
          console.log(`Creating new property: ${item.name}`);
          // Create new property
          const newProperty = new OffPlanProperty(propertyData);
          const savedProperty = await newProperty.save();
          savedProperties.push({
            action: "created",
            property: savedProperty.name,
            apiId: savedProperty.apiId,
          });
        }

        console.log(`✅ Successfully processed: ${item.name}`);
      } catch (propertyError) {
        console.error(
          `❌ Error processing property ${
            item?.name || `Property ${i + 1}` || "Unknown"
          }:`,
          propertyError.message
        );
        console.error("Full error:", propertyError);
        errors.push({
          propertyName: item?.name || `Property ${i + 1}` || "Unknown",
          apiId: item?.id || `Position ${i + 1}` || "Unknown",
          error: propertyError.message,
          stack: propertyError.stack,
        });
      }
    }

    // Get final statistics
    const totalInDB = await OffPlanProperty.countDocuments();

    console.log(`\n🎉 Processing complete!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total from API: ${apiData.length}`);
    console.log(`   - Successfully processed: ${savedProperties.length}`);
    console.log(`   - Errors: ${errors.length}`);
    console.log(`   - Total in database: ${totalInDB}`);

    // FIXED: Return correct count from apiData.length instead of apiData.markers.length
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${savedProperties.length} properties from API`,
      summary: {
        totalFromAPI: apiData.length, // FIXED: was apiData.markers.length
        totalProcessed: savedProperties.length,
        totalErrors: errors.length,
        totalInDatabase: totalInDB,
        pagination: response.data.pagination || null,
      },
      processed: savedProperties,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("❌ Error in fetchAndSaveProperties:", error.message);

    // Handle different types of errors
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "Unable to connect to API endpoint",
        error: error.message,
      });
    }

    if (error.response) {
      // API returned an error response
      return res.status(error.response.status || 500).json({
        success: false,
        message: `API Error: ${error.response.status} - ${error.response.statusText}`,
        error: error.response.data || error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch and save properties",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Get all new off-plan properties with pagination
const getNewOffPlanProperties = async (req, res) => {
  try {
    // Get page number from query params, default to page 1
    const page = parseInt(req.query.page) || 1;
    // Set items per page to 10
    const limit = 12;
    // Calculate number of documents to skip
    const skip = (page - 1) * limit;

    // Build filter query
    const filterQuery = {};

    // Apply filters from query parameters
    if (req.query.area) {
      filterQuery.area = new RegExp(req.query.area, "i");
    }

    if (req.query.developer) {
      filterQuery.developer = new RegExp(req.query.developer, "i");
    }

    if (req.query.status) {
      filterQuery.status = req.query.status;
    }

    if (req.query.saleStatus) {
      filterQuery.saleStatus = req.query.saleStatus;
    }

    if (req.query.isPartnerProject !== undefined) {
      filterQuery.isPartnerProject = req.query.isPartnerProject === "true";
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filterQuery.minPrice = {};
      if (req.query.minPrice)
        filterQuery.minPrice.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice)
        filterQuery.minPrice.$lte = parseFloat(req.query.maxPrice);
    }

    // Search across multiple fields
    if (req.query.search) {
      filterQuery.$or = [
        { name: new RegExp(req.query.search, "i") },
        { area: new RegExp(req.query.search, "i") },
        { developer: new RegExp(req.query.search, "i") },
      ];
    }

    // Get total count of off-plan properties for pagination info
    const totalCount = await OffPlanProperty.countDocuments(filterQuery);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Get off-plan properties with pagination and filters
    const offPlanProperties = await OffPlanProperty.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by most recent first

    // Check if properties were found
    if (offPlanProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          page > 1
            ? "No more off-plan properties found"
            : "No off-plan properties found",
      });
    }

    console.log(
      `Off-plan properties for page ${page}:`,
      offPlanProperties.length
    );

    // Optional: Log how many properties match the filter
    const totalAllProperties = await OffPlanProperty.countDocuments();
    const filteredProperties = totalAllProperties - totalCount;

    if (filteredProperties > 0) {
      console.log(
        `Found ${totalCount} properties matching filters out of ${totalAllProperties} total properties`
      );
    }

    // Return paginated response
    return res.status(200).json({
      success: true,
      message: "Off-plan properties fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        totalMatchingProperties: totalCount,
        totalAllProperties: totalAllProperties,
        filteredProperties: filteredProperties,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      count: offPlanProperties.length,
      data: offPlanProperties,
    });
  } catch (error) {
    console.error("Error fetching new off-plan properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch off-plan properties",
      error: error.message,
    });
  }
};

const getSIngleOffplanProperty = async (req, res) => {
  const property_id = req.query.property_id;
  try {
    console.log("HELLO");
    const response = await axios.get(
      `${process.env.SingleOffPlanApi}/${property_id}`,
      {
        headers: {
          "X-API-Key": `${process.env.OffPlanApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    return res.status(200).json({
      msg:"Single Property Data Recieved",
      data:response.data
    })  
  } catch (err) {
    console.log(err);
  }
};



// Get current sync status
const getSyncStatus = async (req, res) => {
  try {
    const totalProperties = await OffPlanProperty.countDocuments();
    const recentProperties = await OffPlanProperty.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    const lastUpdated = await OffPlanProperty.findOne()
      .sort({ updatedAt: -1 })
      .select("updatedAt");

    return res.status(200).json({
      success: true,
      message: "Sync status retrieved successfully",
      data: {
        totalProperties,
        recentProperties,
        lastUpdated: lastUpdated?.updatedAt || null,
        apiConfig: {
          baseUrl: process.env.OffPlanPropertyiesUrl || "Not configured",
          hasApiKey: !!process.env.OffPlanApiKey,
          endpoint: "Off-plan properties endpoint",
        },
      },
    });
  } catch (error) {
    console.error("Error getting sync status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get sync status",
      error: error.message,
    });
  }
};



const FilterDeveloperOffplanProperty = async (req, res) => {
  try {
    const { developer } = req.query;
    const { page = 1, limit = 10 } = req.query;

    // console.log("Raw developer parameter:", developer);
    // console.log("Type of developer:", typeof developer);

    // Check if developer parameter exists
    if (!developer) {
      return res.status(400).json({
        success: false,
        message: "Developer parameter is required",
      });
    }

    // Clean the developer parameter (remove extra spaces, decode URL encoding)
    const cleanDeveloper = decodeURIComponent(developer).trim();
    // console.log("Cleaned developer parameter:", cleanDeveloper);

    // Simple exact match filter
    const filter = {
      developer: cleanDeveloper
    };
    
    // console.log("MongoDB filter being applied:", JSON.stringify(filter, null, 2));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // First, let's see what developers actually exist in the database
    const allDevelopers = await OffPlanProperty.distinct('developer');
    console.log("All developers in database:", allDevelopers);

    // Check if the requested developer exists in the list
    const developerExists = allDevelopers.includes(cleanDeveloper);
    console.log("Does requested developer exist?", developerExists);

    // Get total count first (for debugging)
    const totalCount = await OffPlanProperty.countDocuments(filter);
    console.log("Total matching properties:", totalCount);

    // Execute the main query
    const properties = await OffPlanProperty.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    console.log("Found properties count:", properties.length);
    console.log("Sample property developer (if found):", properties[0]?.developer);

    // Process the properties to match your expected format
    const processedProperties = properties.map(property => ({
      ...property,
      formattedPrice: property.minPriceAed 
        ? `AED ${property.minPriceAed.toLocaleString()}` 
        : "Price on Request",
      formattedMaxPrice: property.maxPrice 
        ? `AED ${property.maxPrice.toLocaleString()}` 
        : null,
      priceRange: property.minPriceAed 
        ? (property.maxPrice && property.maxPrice !== property.minPriceAed
          ? `AED ${property.minPriceAed.toLocaleString()} - ${property.maxPrice.toLocaleString()}`
          : `AED ${property.minPriceAed.toLocaleString()}`)
        : "Price on Request",
      mainImageUrl: property.coverImage?.url || null,
      id: property._id.toString()
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);

    // Response matching your expected format
    res.status(200).json({
      success: true,
      message: totalCount > 0 
        ? `Off-plan properties by developer: ${cleanDeveloper} fetched successfully`
        : `No properties found for developer: ${cleanDeveloper}`,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalCount: totalCount,
        totalMatchingProperties: totalCount,
        totalAllProperties: await OffPlanProperty.countDocuments({}),
        filteredProperties: totalCount,
        perPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      count: processedProperties.length,
      data: processedProperties,
      // Debug info (remove in production)
      debug: {
        requestedDeveloper: cleanDeveloper,
        developerExists: developerExists,
        allDevelopers: allDevelopers,
        filterUsed: filter
      }
    });

  } catch (error) {
    console.error('Error filtering by developer:', error);
    res.status(500).json({
      success: false,
      message: "Error filtering by developer",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


const filterByMinPrice = async (req, res) => {
  try {
    const { minPrice } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const filter = {
      minPriceAed: { $gte: parseInt(minPrice) }
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await OffPlanProperty.find(filter)
      .sort({ minPriceAed: 1 }) // Sort by price ascending
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCount = await OffPlanProperty.countDocuments(filter);

    const processedProperties = properties.map(property => ({
      ...property,
      formattedPrice: `AED ${property.minPriceAed?.toLocaleString()}`,
      mainImageUrl: property.coverImage?.url || null,
      id: property._id.toString()
    }));

    res.status(200).json({
      success: true,
      message: `Properties with minimum price AED ${parseInt(minPrice).toLocaleString()}`,
      data: processedProperties,
      totalCount,
      filteredByMinPrice: parseInt(minPrice)
    });

  } catch (error) {
    console.error('Error filtering by min price:', error);
    res.status(500).json({
      success: false,
      message: "Error filtering by minimum price",
      error: error.message
    });
  }
};


const filterByMaxPrice = async (req, res) => {
  try {
    const { maxPrice } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const filter = {
      $or: [
        { minPriceAed: { $lte: parseInt(maxPrice) } },
        { 
          maxPrice: { 
            $exists: true, 
            $ne: null, 
            $lte: parseInt(maxPrice) 
          } 
        }
      ]
    };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const properties = await OffPlanProperty.find(filter)
      .sort({ minPriceAed: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCount = await OffPlanProperty.countDocuments(filter);

    const processedProperties = properties.map(property => ({
      ...property,
      formattedPrice: `AED ${property.minPriceAed?.toLocaleString()}`,
      mainImageUrl: property.coverImage?.url || null,
      id: property._id.toString()
    }));

    res.status(200).json({
      success: true,
      message: `Properties with maximum price AED ${parseInt(maxPrice).toLocaleString()}`,
      data: processedProperties,
      totalCount,
      filteredByMaxPrice: parseInt(maxPrice)
    });

  } catch (error) {
    console.error('Error filtering by max price:', error);
    res.status(500).json({
      success: false,
      message: "Error filtering by maximum price",
      error: error.message
    });
  }
};

// const OffPlanAddressSuggestion=async(req,res)=>{
//   try{
//     const {prefix}=req.query
//     const minSuggestions=5
//     if (!prefix){
//       return res.status(400).json({
//         success:false,
//         message:"Please provide a prefix"
//       })
//     }
//     if(prefix.length<2){
//       return res.status(400).json({
//         success:false,
//         message:"Prefix must be at least 2 characters long",
//         data:[]
//       })
//     }

//     const primaryQuery = {
//       "name": { $regex: new RegExp(`\\b${prefix}`, "i") },
//     };
//     const Properties = await OffPlanProperty.find(primaryQuery)
//      .limit(100)
//      .select(name);

//      console.log(Properties)
//   } catch(err){
//     console.log(err)
//   }
// }


const OffPlanAddressSuggestion = async (req, res) => {
  try {
    const { prefix, limit = 5 } = req.query;
    const minSuggestions = parseInt(limit);

    // Validation
    if (!prefix) {
      return res.status(400).json({
        success: false,
        message: "Please provide a prefix"
      });
    }

    if (prefix.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Prefix must be at least 2 characters long",
        data: []
      });
    }

    // Search only in name field for address suggestions
    const query = {
      "name": { $regex: new RegExp(`\\b${prefix}`, "i") }
    };

    // Return full property details
    const suggestions = await OffPlanProperty.find(query)
      .limit(minSuggestions)
      .lean();

    return res.status(200).json({
      success: true,
      message: `Found ${suggestions.length} address suggestions`,
      data: suggestions,
      count: suggestions.length
    });

  } catch (err) {
    console.error('Address suggestion error:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: []
    });
  }
};






module.exports = {
  fetchAndSaveProperties,
  getNewOffPlanProperties,
  getSyncStatus,
  getSIngleOffplanProperty,
  FilterDeveloperOffplanProperty,
  filterByMinPrice,
  filterByMaxPrice,
  OffPlanAddressSuggestion
};
