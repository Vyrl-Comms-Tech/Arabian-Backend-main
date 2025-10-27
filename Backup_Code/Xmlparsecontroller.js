const axios = require("axios");
const xml2js = require("xml2js");
const SavePropertInDb = require("../Models/PropertyModel");

const allProperties = [];
const saleProperties = [];
const rentProperties = [];
let totalCount = 0;

// Parsing the xml file and saving the properties
const XmlParseFunction = async (req, res, next) => {
  
  // XML feed URL
  const xmlUrl =
    "https://manda.propertybase.com/api/v2/feed/00D8d000005AHV4EAO/generic/a0h8d000001Cz2XAAS/full";
  try {
    console.log(`Fetching XML from: ${xmlUrl}`);

    // Fetching the XML data from the URL
    const response = await axios.get(xmlUrl, {
      headers: {
        Accept: "application/xml",
      },
    });

    // Step 2: Configuring the XML parser
    const parser = new xml2js.Parser({
      explicitArray: false, // Don't put single values in arrays
      mergeAttrs: true, // Merge attributes with element content
      normalize: true, // Trim whitespace
      normalizeTags: false, // Don't convert tags to lowercase
      trim: true, // Trim whitespace from text nodes
    });

    // Step 3: Parsing the XML data
    const result = await parser.parseStringPromise(response.data);


    // Extracting and processing the data
    // Counting the total number of properties and pushing them into the allProperties array
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

    // If we don't have properties return 404 error
    if (allProperties.length === 0) {
      console.log("No property array found!!!");
      return res.status(404).json({
        success: false,
        message: "No property listings found in the XML data",
      });
    }

    //  Separating properties based on listingtype (Sale or Rent)
    allProperties.forEach((property) => {
      if (
        property.general_listing_information &&
        property.general_listing_information.listingtype
      ) {
        const listingType =
          property.general_listing_information.listingtype.toLowerCase();

        // Adding properties to respective arrays based on listing type
        if (listingType === "sale") {
          saleProperties.push(property);
        } else if (listingType === "rent") {
          rentProperties.push(property);
        } else {
          // Log unusual listing types
          console.log(
            `Property ${property.id} has unusual listing type: ${listingType}`
          );
        }
      } else {
        // Handle properties without listing type information
        console.log(
          `Property ${property.id} is missing listing type information`
        );
      }
    });

    // Log counts for debugging
    console.log(`Total properties: ${totalCount}`);
    console.log(`Sale properties: ${saleProperties.length}`);
    console.log(`Rent properties: ${rentProperties.length}`);

    // New Function to save a Property
    const savePropertyToDb = async (propertyData) => {
      try {
    
        // Fix for ERROR 1: Map 'NEW' mode to 'CREATE'
        if (propertyData.mode === 'NEW') {
          propertyData.mode = 'CREATE';
        }
    
        // Fix for ERROR 2: Convert string address_information to object
        if (typeof propertyData.address_information === 'string') {
          propertyData.address_information = {};
        }

        // Missing agent numbers
        if (propertyData.listing_agent) {
          if (!propertyData.listing_agent.listing_agent_phone) {
            propertyData.listing_agent.listing_agent_phone = 
              propertyData.listing_agent.listing_agent_mobil_phone || 'Unknown';
          }
          
          if (!propertyData.listing_agent.listing_agent_mobil_phone) {
            propertyData.listing_agent.listing_agent_mobil_phone = 
              propertyData.listing_agent.listing_agent_phone || 'Unknown';
          }
        }
    
        

        // Check if the property already exists
        // We have to add an update condition which we will get from the team on which bases they are changing the data 
        const existingProperty = await SavePropertInDb.findOne({
          id: propertyData.id,
        });
      

        // Updating Property 
        if (existingProperty) {
          console.log(
            `Property with ID ${propertyData.id} already exists, updating...`
          );
    
          // Update existing property
          Object.assign(existingProperty, propertyData);
          const updatedProperty = await existingProperty.save();
    
          console.log(`Property ${updatedProperty.id} updated successfully`);
          return updatedProperty;
        } else {
    
          // Create new property document
          const property = new SavePropertInDb(propertyData);
          const savedProperty = await property.save();
    
          console.log(`Property ${savedProperty.id} saved successfully`);
          return savedProperty;
        }
      } catch (error) {
        console.error(`Error saving property ${propertyData.id}:`, error);
        return null;
      }
    };
    // Step 6: Save all properties to the database
    // console.log("Starting to save all properties to database...");
    
    const savedResults = {
      totalAttempted: allProperties.length,
      successful: 0,
      failed: 0,
      salePropertiesSaved: 0,
      rentPropertiesSaved: 0,
      failures: []
    };

    // Loop through all properties and save each one
    for (let i = 0; i < allProperties.length; i++) {
      try {
        const property = allProperties[i];
        const result = await savePropertyToDb(property);
        
        if (result) {
          savedResults.successful++;
          
          // Count by type
          if (property.general_listing_information && 
              property.general_listing_information.listingtype) {
            const type = property.general_listing_information.listingtype.toLowerCase();
            if (type === 'sale') {
              savedResults.salePropertiesSaved++;
            } else if (type === 'rent') {
              savedResults.rentPropertiesSaved++;
            }
          }
          
          // Log progress every 10 properties
          if (savedResults.successful % 10 === 0) {
            console.log(`Progress: ${savedResults.successful}/${allProperties.length} properties saved`);
          }
        } else {
          savedResults.failed++;
          savedResults.failures.push(property.id);
        }
      } catch (error) {
        console.error(`Error in property save loop at index ${i}:`, error);
        savedResults.failed++;
        if (allProperties[i] && allProperties[i].id) {
          savedResults.failures.push(allProperties[i].id);
        } else {
          savedResults.failures.push(`Unknown property at index ${i}`);
        }
      }
    }

    // console.log("Database save operation completed.");
    // console.log(`Successfully saved ${savedResults.successful} properties.`);
    // console.log(`Failed to save ${savedResults.failed} properties.`);

    // Return the results
    return res.status(200).json({
      success: true,
      message: "XML data fetched, parsed, and saved to database",
      totalProperties: totalCount,
      saleProperties: saleProperties.length,
      rentProperties: rentProperties.length,
      databaseResults: {
        propertiesSaved: savedResults.successful,
        propertiesFailed: savedResults.failed,
        salePropertiesSaved: savedResults.salePropertiesSaved,
        rentPropertiesSaved: savedResults.rentPropertiesSaved
      }
    });
  } catch (err) {
    console.log("Error occurred while fetching or parsing XML:", err);
    return res.status(500).json({
      success: false,
      message: "Error occurred while fetching or parsing XML",
      error: err.message,
    });
  }
};

module.exports = { XmlParseFunction };