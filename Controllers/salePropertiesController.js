const SaleProperty = require("../Models/SalePropertyModel");

const getSaleProperties = async (req, res) => {
  try {
    // Get page number from query params, default to page 1
    console.log("Fetching sale properties...");
    const page = parseInt(req.query.page) || 1;
    // Set items per page to 10
    const limit = 10;
    // Calculate number of documents to skip
    const skip = (page - 1) * limit;
    
    // No status filter needed since only Live properties are stored in this collection
    const filterQuery = {};
    
    // Get total count of sale properties for pagination info
    const totalCount = await SaleProperty.countDocuments(filterQuery);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get sale properties with pagination
    const saleProperties = await SaleProperty.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    // Check if properties were found
    if (saleProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: page > 1 ? "No more sale properties found" : "No sale properties found"
      });
    }
    
    console.log(`Sale properties for page ${page}:`, saleProperties.length);
    
    // Return paginated response
    return res.status(200).json({
      success: true,
      message: "Sale properties fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      count: saleProperties.length,
      data: saleProperties
    });
  } catch (error) {
    console.error("Error fetching sale properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sale properties",
      error: error.message
    });
  }
};

module.exports = getSaleProperties;