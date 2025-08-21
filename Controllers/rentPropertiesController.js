const RentProperty = require("../Models/RentPropertyModel");

const getRentProperties = async (req, res) => {
  try {
    // Get page number from query params, default to page 1
    const page = parseInt(req.query.page) || 1;
    // Set items per page to 10
    const limit = 10;
    // Calculate number of documents to skip
    const skip = (page - 1) * limit;

    // No status filter needed since only Live properties are stored in this collection
    const filterQuery = {};

    // Get total count of rent properties for pagination info
    const totalCount = await RentProperty.countDocuments(filterQuery);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get rent properties with pagination
    const rentProperties = await RentProperty.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    // Check if properties were found
    if (rentProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: page > 1 ? "No more rent properties found" : "No rent properties found"
      });
    }
    
    console.log(`Rent properties for page ${page}:`, rentProperties.length);
    
    // Return paginated response
    return res.status(200).json({
      success: true,
      message: "Rent properties fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      count: rentProperties.length,
      data: rentProperties
    });
  } catch (error) {
    console.error("Error fetching rent properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rent properties",
      error: error.message
    });
  }
};

module.exports = { getRentProperties };