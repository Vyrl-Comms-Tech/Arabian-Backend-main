const OffPlanProperty = require("../Models/OffplanModel");
// const ErrorMid=require("../Middlewares/ErrorMiddleware")

const GetOffPlanProperties = async (req, res) => {
  try {
    console.log("Working")
    // Get page number from query params, default to page 1
    const page = parseInt(req.query.page) || 1;
    // Set items per page to 10
    const limit = 10;
    // Calculate number of documents to skip
    const skip = (page - 1) * limit;

    // No status filter needed since only Live properties are stored in this collection
    const filterQuery = {};

    // Get total count of OffPlan properties for pagination info
    const totalCount = await OffPlanProperty.countDocuments(filterQuery);
    // console.log(totalCount)
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get OffPlan properties with pagination
    const offPlanProperties = await OffPlanProperty.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    // Check if properties were found
    if (offPlanProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: page > 1 ? "No more OffPlan properties found" : "No OffPlan properties found"
      });
    }
    
    console.log(`OffPlan properties for page ${page}:`, offPlanProperties.length);
    
    // Return paginated response
    return res.status(200).json({
      success: true,
      message: "OffPlan properties fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      count: offPlanProperties.length,
      data: offPlanProperties
    });
  } catch (error) {
    console.error("Error fetching OffPlan properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch OffPlan properties",
      error: error.message
    });
  }
};

const OffplanPropertyType = async (req, res) => {
  try {
    // Implementation for OffPlan property type functionality
    // Add your logic here
    return res.status(200).json({
      success: true,
      message: "OffPlan property type endpoint working"
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error in OffPlan property type",
      error: err.message
    });
  }
};

// const FilterDeveloperOffplanProperty=async(req,res)=>{
//   try{
    
//     return res.status(200).json({
//       success:true,
//       message:"Filtered offplan properties by developer"
//     })
 
//   }catch(err){
//     console.log(err)
//   }
// }

module.exports = { GetOffPlanProperties, OffplanPropertyType };