const parseXmlFromUrl = require("./XmlParser");

const getAllProperties = async (req, res) => {
  const xmlUrl = process.env.XML_URL;
  try {
    const result = await parseXmlFromUrl(xmlUrl);

    const allProperties = [];

    if (result && Array.isArray(result)) {
      allProperties.push(...result);
      totalCount = result.length;
    } else if (result.listings && Array.isArray(result.listings.listing)) {
      allProperties.push(...result.listings.listing);
      totalCount = result.listings.listing.length;
    } else if (result.listings && result.listings.listing) {
      // Single listing in listings
      allProperties.push(result.listings.listing);
      totalCount = 1;
    } else {
      // Search for any array in the result that might contain property listings
      const findPropertiesArray = (obj) => {
        for (const key in obj) {
          if (
            Array.isArray(obj[key]) &&
            obj[key].length > 0 &&
            obj[key][0] &&
            (obj[key][0].general_listing_information || obj[key][0].id)
          ) {
            return obj[key];
          } else if (typeof obj[key] === "object" && obj[key] !== null) {
            const found = findPropertiesArray(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      const propertiesArray = findPropertiesArray(result);
      if (propertiesArray) {
        allProperties.push(...propertiesArray);
        totalCount = propertiesArray.length;
      }
    }

    if (allProperties.length === 0) {
        console.log("No property array found!!!");
        return res.status(404).json({
          success: false,
          message: "No property listings found in the XML data",
        });
      }else{

          
          
          res.status(200).json({
              success: true,
              message: "All properties fetched successfully",
              data: allProperties,
            });
        }
  } catch (error) {
    console.error("Error fetching all properties:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all properties",
      error: error.message,
    });
  }
};

module.exports = getAllProperties;
