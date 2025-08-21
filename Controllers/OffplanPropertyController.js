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

    // Filter query to only get properties with Active status
    const filterQuery = {
      "general_listing_information.status": "Active"
    };

    // Get total count of active OffPlan properties for pagination info
    const totalCount = await OffPlanProperty.countDocuments(filterQuery);
    // console.log(totalCount)
    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get OffPlan properties with pagination and status filter
    const offPlanProperties = await OffPlanProperty.find(filterQuery)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by most recent first
    
    // Check if properties were found
    if (offPlanProperties.length === 0) {
      return res.status(404).json({
        success: false,
        message: page > 1 ? "No more active OffPlan properties found" : "No active OffPlan properties found"
      });
    }
    
    console.log(`Active OffPlan properties for page ${page}:`, offPlanProperties.length);
    
    // Optional: Log how many properties were skipped due to status
    const totalAllProperties = await OffPlanProperty.countDocuments();
    const skippedProperties = totalAllProperties - totalCount;
    
    if (skippedProperties > 0) {
      console.log(`Skipped ${skippedProperties} properties with non-Active status (Off Market, etc.)`);
    }
    
    // Return paginated response
    return res.status(200).json({
      success: true,
      message: "Active OffPlan properties fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount, // Only active properties count
        totalActiveProperties: totalCount,
        totalAllProperties: totalAllProperties,
        skippedProperties: skippedProperties,
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

const OffplanPropertyType=async(req,res)=>{
  try{

  }catch(err){
    console.log(err)
  }
}



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






module.exports =  {GetOffPlanProperties} ;