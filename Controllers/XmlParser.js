// const axios = require("axios");
// const xml2js = require("xml2js");
// const SaleProperty = require("../Models/SalePropertyModel");
// const RentProperty = require("../Models/RentPropertyModel");
// const OffPlanProperty = require("../Models/OffplanModel");
// const CommercialProperty = require("../Models/CommercialPropertyModel");
// const Agent = require("../Models/AgentModel");
// const NonActiveProperties = require('../Models/Nonactiveproperties');

// // Simple QR code extraction function
// const extractQRCodeUrl = (qrCode) => {
//   if (!qrCode) return '';
  
//   console.log(`DEBUG - QR Code structure:`, JSON.stringify(qrCode, null, 2));
  
//   // Case 1: Direct string
//   if (typeof qrCode === 'string') {
//     console.log(`DEBUG - QR code is direct string:`, qrCode);
//     return qrCode;
//   }
  
//   // Case 2: Object with url property (most common case based on your XML)
//   if (qrCode.url) {
//     // If url is a string directly
//     if (typeof qrCode.url === 'string') {
//       console.log(`DEBUG - Found QR URL (direct string):`, qrCode.url);
//       return qrCode.url;
//     }
    
//     // If url is an object with text content (xml2js parsing)
//     if (typeof qrCode.url === 'object') {
//       // Handle xml2js parsed text content (_ property contains the actual URL)
//       if (qrCode.url._) {
//         console.log(`DEBUG - Found QR URL (url._):`, qrCode.url._);
//         return qrCode.url._;
//       }
      
//       // Handle $t property (another xml2js text content property)
//       if (qrCode.url.$t) {
//         console.log(`DEBUG - Found QR URL (url.$t):`, qrCode.url.$t);
//         return qrCode.url.$t;
//       }
//     }
    
//     // If url is an array (multiple URLs, take first)
//     if (Array.isArray(qrCode.url) && qrCode.url.length > 0) {
//       const firstUrl = qrCode.url[0];
//       if (typeof firstUrl === 'string') {
//         console.log(`DEBUG - Found QR URL (array string):`, firstUrl);
//         return firstUrl;
//       }
//       if (firstUrl && (firstUrl._ || firstUrl.$t)) {
//         const url = firstUrl._ || firstUrl.$t;
//         console.log(`DEBUG - Found QR URL (array object):`, url);
//         return url;
//       }
//     }
//   }
  
//   // Case 3: Direct text content at qr_code level
//   if (qrCode._ || qrCode.$t) {
//     const url = qrCode._ || qrCode.$t;
//     console.log(`DEBUG - Found QR URL (direct text):`, url);
//     return url;
//   }
  
//   console.log(`DEBUG - No QR URL found`);
//   return '';
// };

// // NEW FUNCTION: Check if property status is Live
// const isPropertyLive = (propertyData) => {
//   const status = propertyData.general_listing_information?.status;
//   const isLive = status && status.toLowerCase() === 'live';
//   console.log(`DEBUG - Property ${propertyData.id}: Status = "${status}", IsLive = ${isLive}`);
//   return isLive;
// };

// // UPDATED FUNCTION: Determine property type based on completion_status and offering_type (only for Live properties)
// const determinePropertyType = (customFields) => {
//   const completionStatus = customFields?.completion_status;
//   const offeringType = customFields?.offering_type;
  
//   console.log(`DEBUG - Property classification: completion_status=${completionStatus}, offering_type=${offeringType}`);
  
//   // FIRST: Check completion_status for off-plan properties
//   if (completionStatus === 'off_plan_primary' || completionStatus === 'off_plan_secondary') {
//     console.log(`DEBUG - Property classified as OffPlan due to completion_status: ${completionStatus}`);
//     return {
//       type: 'OffPlan',
//       listingType: 'OffPlan',
//       reason: `completion_status is ${completionStatus}`
//     };
//   }
  
//   // SECOND: If not off-plan, check offering_type
//   if (offeringType === 'RR') {
//     console.log(`DEBUG - Property classified as Rent due to offering_type: ${offeringType}`);
//     return {
//       type: 'Rent',
//       listingType: 'Rent',
//       reason: `offering_type is ${offeringType}`
//     };
//   } else if (offeringType === 'RS') {
//     console.log(`DEBUG - Property classified as Sale due to offering_type: ${offeringType}`);
//     return {
//       type: 'Sale',
//       listingType: 'Sale',
//       reason: `offering_type is ${offeringType}`
//     };
//   } else if (offeringType === 'CS' || offeringType === 'CR') {
//     console.log(`DEBUG - Property classified as Commercial due to offering_type: ${offeringType}`);
//     return {
//       type: 'Commercial',
//       listingType: 'Commercial',
//       reason: `offering_type is ${offeringType}`
//     };
//   }
  
//   // FALLBACK: Default to Sale if no clear classification
//   console.log(`DEBUG - Property defaulted to Sale - completion_status: ${completionStatus}, offering_type: ${offeringType}`);
//   return {
//     type: 'Sale',
//     listingType: 'Sale',
//     reason: `Fallback - no clear classification found`
//   };
// };

// const parseXmlFromUrl = async (req, res, next) => {
//   try {
//     const xmlUrl = process.env.XML_URL;
//     console.log(`Fetching XML from: ${xmlUrl}`);
//     const response = await axios.get(xmlUrl, {
//       headers: { Accept: "application/xml" },
//     });

//     const parser = new xml2js.Parser({
//       explicitArray: false,
//       mergeAttrs: true,
//       normalize: true,
//       normalizeTags: false,
//       trim: true,
//     });

//     console.log("Parsing XML data...");
//     const result = await parser.parseStringPromise(response.data);

//     let allProperties = [];

//     // Handle the new XML structure - properties are directly in the list
//     if (result && result.list && result.list.property) {
//       if (Array.isArray(result.list.property)) {
//         allProperties = result.list.property;
//       } else {
//         allProperties = [result.list.property];
//       }
//     } else {
//       // Fallback to find properties array
//       const findPropertiesArray = (obj) => {
//         for (const key in obj) {
//           if (
//             Array.isArray(obj[key]) &&
//             obj[key].length > 0 &&
//             obj[key][0] &&
//             (obj[key][0].general_listing_information || obj[key][0].Id)
//           ) {
//             return obj[key];
//           } else if (typeof obj[key] === "object" && obj[key] !== null) {
//             const found = findPropertiesArray(obj[key]);
//             if (found) return found;
//           }
//         }
//         return null;
//       };

//       const propertiesArray = findPropertiesArray(result);
//       if (propertiesArray) {
//         allProperties = propertiesArray;
//       }
//     }

//     console.log(`Found ${allProperties.length} properties in XML`);

//     // Transform new XML format to match existing structure
//     const transformPropertyData = (property) => {
//       // Debug QR code structure for troubleshooting
//       if (property.custom_fields?.qr_code) {
//         console.log(`DEBUG - Property ${property.Id}: QR Code found in custom_fields`);
//       } else {
//         console.log(`DEBUG - Property ${property.Id}: No QR Code found in custom_fields`);
//       }
      
//       // Map new structure to old structure
//       const transformedProperty = {
//         id: property.Id || property.id,
//         mode: "CREATE", // Default mode since new XML doesn't have mode
//         created_at: property.created_at,
//         timestamp: property.timestamp,
        
//         // Transform address information
//         address_information: property.address_information || {},
        
//         // Transform general listing information - INITIAL MAPPING (classification will be determined later for Live properties)
//         general_listing_information: {
//           listing_title: property.general_listing_information?.listing_title || "",
//           listingprice: property.general_listing_information?.listingprice || "0",
//           listingtype: property.general_listing_information?.listingtype || "Sale", // Temporary, will be updated for Live properties
//           currency_iso_code: property.general_listing_information?.currency_iso_code || "AED",
//           property_type: property.general_listing_information?.property_type || "apartment",
//           status: property.general_listing_information?.status || "Live",
//           totalarea: property.general_listing_information?.totalarea || "0",
//           description: property.general_listing_information?.description || "",
//           bedrooms: property.general_listing_information?.bedrooms || "0",
//           fullbathrooms: property.general_listing_information?.fullbathrooms || "0",
//           // Map property_type to both propertytype and property for schema compatibility
//           propertytype: property.general_listing_information?.property_type || "apartment",
//           property: property.general_listing_information?.property_type || "apartment"
//         },
        
//         // Transform listing agent
//         listing_agent: {
//           listing_agent_email: property.listing_agent?.listing_agent_email || "",
//           listing_agent_firstname: property.listing_agent?.listing_agent_firstname || "",
//           listing_agent_lastname: property.listing_agent?.listing_agent_lastname || "",
//           listing_agent_mobil_phone: property.listing_agent?.listing_agent_mobil_phone || "",
//           listing_agent_phone: property.listing_agent?.listing_agent_phone || property.listing_agent?.listing_agent_mobil_phone || ""
//         },
        
//         // Transform custom fields - mapping ALL fields from new XML format
//         custom_fields: {
//           // New XML fields - direct mapping
//           property_record_id: property.custom_fields?.property_record_id || "",
//           permit_number: property.custom_fields?.permit_number || "",
//           offering_type: property.custom_fields?.offering_type || "",
//           price_on_application: property.custom_fields?.price_on_application || "No",
//           payment_method: property.custom_fields?.payment_method || "",
//           city: property.custom_fields?.city || "",
//           community: property.custom_fields?.community || "",
//           sub_community: property.custom_fields?.sub_community || "",
//           property_name: property.custom_fields?.property_name || "",
//           propertyfinder_region: property.custom_fields?.propertyfinder_region || "",
//           autonumber: property.custom_fields?.autonumber || "",
//           unitnumber: property.custom_fields?.unitnumber || "",
//           private_amenities: property.custom_fields?.private_amenities || "",
//           plot_size: property.custom_fields?.plot_size || "0",
//           developer: property.custom_fields?.developer || "",
//           completion_status: property.custom_fields?.completion_status || "completed",
//           parking: property.custom_fields?.parking || "0",
//           furnished: property.custom_fields?.furnished || "No",
//           project_name: property.custom_fields?.project_name || "",
//           title_deed: property.custom_fields?.title_deed || "",
//           availability_date: property.custom_fields?.availability_date || "",
          
//           // Map to the field names your existing code expects for backward compatibility
//           community_name: property.custom_fields?.community || "",
//           tower_text: property.custom_fields?.property_name || "",
//           pba__addresstext_pb: property.custom_fields?.propertyfinder_region || "",
          
//           // Map completion status for OffPlan detection with multiple variants
//           pba_uaefields__completion_status: 
//             property.custom_fields?.completion_status === "off_plan_primary" || 
//             property.custom_fields?.completion_status === "off_plan_secondary" ? "Off Plan" : "Completed",
          
//           // Store QR code URL as string - SIMPLIFIED VERSION
//           qr_code: extractQRCodeUrl(property.custom_fields?.qr_code),
          
//           // Additional fields that might be in the XML but not captured yet
//           sub_community_name: property.custom_fields?.sub_community || "",
//           building_name: property.custom_fields?.property_name || "",
//           rera_permit_number: property.custom_fields?.permit_number || "",
//           plot_area: property.custom_fields?.plot_size || "0",
//           completion_date: property.custom_fields?.availability_date || "",
          
//           // Map any other fields dynamically - but exclude qr_code to avoid object storage
//           ...Object.keys(property.custom_fields || {}).reduce((acc, key) => {
//             // Don't override already mapped fields and skip qr_code to avoid storing object
//             if (!acc[key] && key !== 'qr_code' && property.custom_fields[key] !== undefined) {
//               acc[key] = property.custom_fields[key];
//             }
//             return acc;
//           }, {})
//         },
        
//         // Transform listing media with proper image handling for nested URL structures
//         listing_media: {
//           images: {
//             image: (() => {
//               const images = property.listing_media?.images?.image;
//               if (!images) return [];
              
//               // Handle array of images
//               if (Array.isArray(images)) {
//                 return images.map(img => {
//                   if (typeof img === 'string') {
//                     return { title: '', url: img };
//                   }
                  
//                   // Handle nested url structure from xml2js parsing
//                   if (img.url) {
//                     if (typeof img.url === 'string') {
//                       return { title: img.title || '', url: img.url };
//                     } else if (Array.isArray(img.url)) {
//                       // Handle array of URLs within single image
//                       return img.url.map(urlItem => ({
//                         title: urlItem.title || '',
//                         url: urlItem._ || urlItem.$t || urlItem
//                       }));
//                     } else if (img.url._ || img.url.$t) {
//                       return { title: img.url.title || '', url: img.url._ || img.url.$t };
//                     }
//                   }
                  
//                   return img;
//                 }).flat(); // Flatten in case of nested arrays
//               }
              
//               // Handle single image object
//               if (images.url) {
//                 if (Array.isArray(images.url)) {
//                   return images.url.map(urlItem => ({
//                     title: urlItem.title || '',
//                     url: urlItem._ || urlItem.$t || urlItem
//                   }));
//                 } else if (typeof images.url === 'string') {
//                   return [{ title: images.title || '', url: images.url }];
//                 } else if (images.url._ || images.url.$t) {
//                   return [{ title: images.url.title || '', url: images.url._ || images.url.$t }];
//                 }
//               }
              
//               return [];
//             })()
//           }
//         },
        
//         // Add QR code at root level for easier access - SIMPLIFIED VERSION
//         qr_code: extractQRCodeUrl(property.custom_fields?.qr_code)
//       };

//       return transformedProperty;
//     };

//     // Transform all properties to match expected structure
//     const transformedProperties = allProperties.map(transformPropertyData);

//     // Filter valid properties (all are valid since we're setting mode to CREATE)
//     const validProperties = transformedProperties.filter(property => {
//       const mode = property.mode;
//       if (mode === "CREATE" || mode === "CHANGE" || mode === "NEW") {
//         return true;
//       }
//       console.log(`Skipping property ${property.id} with mode: ${mode}`);
//       return false;
//     });

//     console.log(`Processing ${validProperties.length} properties`);

//     // UPDATED: Separate properties by status FIRST
//     const liveProperties = [];
//     const nonLiveProperties = [];

//     validProperties.forEach(property => {
//       if (isPropertyLive(property)) {
//         // For Live properties, determine the proper classification
//         const propertyClassification = determinePropertyType(property.custom_fields);
//         console.log(`DEBUG - Live Property ${property.id}: Classified as ${propertyClassification.type} (${propertyClassification.reason})`);
        
//         // Update the listingtype for Live properties
//         property.general_listing_information.listingtype = propertyClassification.listingType;
//         property._classification = propertyClassification;
        
//         liveProperties.push(property);
//       } else {
//         // For non-Live properties, add to non-active without classification
//         console.log(`DEBUG - Non-Live Property ${property.id}: Status = "${property.general_listing_information?.status}", moving to NonActive`);
//         property._classification = {
//           type: 'NonActive',
//           listingType: 'NonActive',
//           reason: `Status is not Live: ${property.general_listing_information?.status}`
//         };
        
//         nonLiveProperties.push(property);
//       }
//     });

//     console.log(`Live properties: ${liveProperties.length}`);
//     console.log(`Non-Live properties: ${nonLiveProperties.length}`);

//     // UPDATED Helper functions with new classification logic
//     const getModelByListingType = (listingType) => {
//       if (listingType === "Sale") {
//         return SaleProperty;
//       } else if (listingType === "Rent") {
//         return RentProperty;
//       } else if (listingType === "OffPlan") {
//         return OffPlanProperty;
//       } else if (listingType === "Commercial") {
//         return CommercialProperty;
//       } else if (listingType === "NonActive") {
//         return NonActiveProperties;
//       }
//       return null;
//     };

//     const findExistingProperty = async (propertyId, listingType) => {
//       const Model = getModelByListingType(listingType);
//       if (!Model) return null;

//       try {
//         const existingProperty = await Model.findOne({ id: propertyId });
//         return existingProperty;
//       } catch (error) {
//         console.error(`Error finding existing property ${propertyId}:`, error);
//         return null;
//       }
//     };

//     // UPDATED: Remove property from other collections when it changes type
//     const removePropertyFromOtherCollections = async (propertyId, currentListingType) => {
//       const allModels = [
//         { name: 'Sale', model: SaleProperty },
//         { name: 'Rent', model: RentProperty },
//         { name: 'OffPlan', model: OffPlanProperty },
//         { name: 'Commercial', model: CommercialProperty },
//         { name: 'NonActive', model: NonActiveProperties }
//       ];

//       const removedFrom = [];

//       for (const modelInfo of allModels) {
//         if (modelInfo.name !== currentListingType) {
//           try {
//             const deleted = await modelInfo.model.deleteOne({ id: propertyId });
//             if (deleted.deletedCount > 0) {
//               console.log(`Removed property ${propertyId} from ${modelInfo.name} collection`);
//               removedFrom.push(modelInfo.name);
//             }
//           } catch (error) {
//             console.error(`Error removing property ${propertyId} from ${modelInfo.name} collection:`, error);
//           }
//         }
//       }

//       return removedFrom;
//     };

//     const validateAndCleanPropertyData = (propertyData) => {
//       try {
//         if (typeof propertyData.address_information === "string") {
//           propertyData.address_information = {};
//         }

//         if (!propertyData.general_listing_information) {
//           propertyData.general_listing_information = {};
//         }

//         if (!propertyData.general_listing_information.listingprice) {
//           propertyData.general_listing_information.listingprice = "0";
//           console.log(`Warning: Property ${propertyData.id} missing price, setting to 0`);
//         }

//         if (!propertyData.general_listing_information.propertytype) {
//           propertyData.general_listing_information.propertytype = propertyData.general_listing_information.property_type || "Unknown";
//         }

//         // Ensure the required 'property' field is set for schema compatibility
//         if (!propertyData.general_listing_information.property) {
//           propertyData.general_listing_information.property = propertyData.general_listing_information.property_type || propertyData.general_listing_information.propertytype || "Unknown";
//         }

//         if (!propertyData.general_listing_information.status) {
//           propertyData.general_listing_information.status = "Active";
//         }

//         if (!propertyData.general_listing_information.bedrooms) {
//           propertyData.general_listing_information.bedrooms = "0";
//         }

//         if (!propertyData.general_listing_information.fullbathrooms) {
//           propertyData.general_listing_information.fullbathrooms = "0";
//         }

//         if (!propertyData.general_listing_information.totalarea) {
//           propertyData.general_listing_information.totalarea = "0";
//         }

//         if (!propertyData.general_listing_information.currency_iso_code) {
//           propertyData.general_listing_information.currency_iso_code = "AED";
//         }

//         if (propertyData.listing_agent) {
//           if (!propertyData.listing_agent.listing_agent_phone) {
//             propertyData.listing_agent.listing_agent_phone =
//               propertyData.listing_agent.listing_agent_mobil_phone || "Unknown";
//           }

//           if (!propertyData.listing_agent.listing_agent_mobil_phone) {
//             propertyData.listing_agent.listing_agent_mobil_phone =
//               propertyData.listing_agent.listing_agent_phone || "Unknown";
//           }
//         }

//         if (!propertyData.custom_fields) {
//           propertyData.custom_fields = {};
//         }

//         // SIMPLIFIED QR code validation - extract URL string if it's an object
//         if (propertyData.custom_fields.qr_code && typeof propertyData.custom_fields.qr_code === 'object') {
//           const extractedUrl = extractQRCodeUrl(propertyData.custom_fields.qr_code);
//           propertyData.custom_fields.qr_code = extractedUrl;
//           console.log(`DEBUG - Validation: Extracted QR URL for ${propertyData.id}:`, extractedUrl);
//         }

//         return { success: true, data: propertyData };
//       } catch (error) {
//         return { success: false, error: error.message };
//       }
//     };

//     // UPDATED Function to create property data for agent linking (only for Live properties)
//     const createPropertyDataForAgent = (propertyData) => {
//       const generalInfo = propertyData.general_listing_information || {};
//       const addressInfo = propertyData.address_information || {};
//       const customFields = propertyData.custom_fields || {};
      
//       // Use the new classification logic
//       const listingType = generalInfo.listingtype || 'Sale';

//       return {
//         propertyId: propertyData.id,
//         listingTitle: generalInfo.listing_title || 'No Title',
//         listingType: listingType,
//         propertyType: generalInfo.propertytype || generalInfo.property_type || 'Unknown',
//         price: generalInfo.listingprice || '0',
//         currency: generalInfo.currency_iso_code || 'AED',
//         status: generalInfo.status || 'Active',
//         bedrooms: generalInfo.bedrooms || '0',
//         bathrooms: generalInfo.fullbathrooms || '0',
//         area: generalInfo.totalarea || '0',
//         location: {
//           city: customFields.city || addressInfo.city || '',
//           address: customFields.propertyfinder_region || addressInfo.address || '',
//           community: customFields.community || '',
//           building: customFields.property_name || ''
//         },
//         images: propertyData.listing_media?.images?.image || [],
//         description: generalInfo.description || '',
//         addedDate: new Date(),
//         lastUpdated: new Date()
//       };
//     };

//     // Function to link property to existing agent (only for Live properties)
//     const linkPropertyToAgent = async (propertyData) => {
//       try {
//         const listingAgent = propertyData.listing_agent;
        
//         if (!listingAgent || !listingAgent.listing_agent_email) {
//           return {
//             success: false,
//             operation: 'skipped',
//             reason: 'No agent email found in property data'
//           };
//         }

//         const agentEmail = listingAgent.listing_agent_email.toLowerCase().trim();
        
//         // Find existing agent by email
//         const existingAgent = await Agent.findOne({ 
//           email: agentEmail,
//           isActive: true 
//         });

//         if (!existingAgent) {
//           return {
//             success: false,
//             operation: 'agent_not_found',
//             reason: `No active agent found with email: ${agentEmail}`
//           };
//         }

//         // Create property data
//         const propertyDataForAgent = createPropertyDataForAgent(propertyData);

//         // Check if property already exists in agent's properties
//         const existingPropertyIndex = existingAgent.properties?.findIndex(
//           p => p.propertyId === propertyData.id
//         );

//         if (!existingAgent.properties) {
//           existingAgent.properties = [];
//         }

//         if (existingPropertyIndex > -1) {
//           // Update existing property
//           existingAgent.properties[existingPropertyIndex] = {
//             ...existingAgent.properties[existingPropertyIndex],
//             ...propertyDataForAgent,
//             lastUpdated: new Date()
//           };
//           console.log(`Updated property ${propertyData.id} for agent ${agentEmail}`);
//         } else {
//           // Add new property
//           existingAgent.properties.push(propertyDataForAgent);
//           console.log(`Added property ${propertyData.id} to agent ${agentEmail}`);
//         }

//         // Update agent's active sale listings count
//         const activeSaleCount = existingAgent.properties.filter(
//           p => p.listingType === 'Sale' && p.status !== 'Off Market'
//         ).length;
        
//         existingAgent.activeSaleListings = activeSaleCount;
//         existingAgent.lastUpdated = new Date();

//         await existingAgent.save();

//         return {
//           success: true,
//           operation: existingPropertyIndex > -1 ? 'property_updated' : 'property_added',
//           agentEmail: agentEmail,
//           agentName: existingAgent.agentName,
//           totalProperties: existingAgent.properties.length,
//           activeSaleListings: existingAgent.activeSaleListings
//         };

//       } catch (error) {
//         console.error(`Error linking property ${propertyData.id} to agent:`, error);
//         return {
//           success: false,
//           operation: 'failed',
//           error: error.message
//         };
//       }
//     };

//     // UPDATED: Main save function with status filtering logic
//     const saveOrUpdatePropertyToDb = async (propertyData) => {
//       try {
//         let mode = propertyData.mode;
//         if (mode === "NEW") {
//           mode = "CREATE";
//           propertyData.mode = "CREATE";
//         }

//         console.log(`Processing property ${propertyData.id} with mode: ${mode}`);

//         // Validate and clean property data
//         const validationResult = validateAndCleanPropertyData(propertyData);
//         if (!validationResult.success) {
//           return {
//             success: false,
//             error: `Data validation failed: ${validationResult.error}`,
//             operationResults: {
//               mode: mode,
//               mainOperation: 'failed',
//               agentOperation: 'failed',
//               errors: [validationResult.error]
//             }
//           };
//         }

//         propertyData = validationResult.data;

//         // USE CLASSIFICATION FROM PROPERTY
//         const listingType = propertyData._classification.listingType;
//         console.log(`DEBUG - Property ${propertyData.id}: Final listingType = ${listingType}`);
        
//         const operationResults = {
//           mode: mode,
//           listingType: listingType,
//           isLive: listingType !== 'NonActive',
//           isOffPlan: listingType === 'OffPlan',
//           isCommercial: listingType === 'Commercial',
//           isNonActive: listingType === 'NonActive',
//           mainOperation: null,
//           cleanupOperations: [],
//           agentOperation: null,
//           errors: []
//         };

//         const SpecificModel = getModelByListingType(listingType);
        
//         if (!SpecificModel) {
//           operationResults.errors.push(`No model found for listing type: ${listingType}`);
//           return {
//             success: false,
//             operationResults: operationResults,
//             error: `No model found for listing type: ${listingType}`
//           };
//         }

//         try {
//           // Remove property from other collections first
//           const removedFrom = await removePropertyFromOtherCollections(propertyData.id, listingType);
//           operationResults.cleanupOperations = removedFrom;

//           // Find existing property in the correct collection
//           const existingProperty = await findExistingProperty(propertyData.id, listingType);
          
//           if (existingProperty) {
//             // Update existing property
//             const updatedProperty = await SpecificModel.findOneAndUpdate(
//               { id: propertyData.id },
//               propertyData,
//               { new: true, upsert: false }
//             );
//             console.log(`Updated existing property ${propertyData.id} in ${SpecificModel.modelName}`);
//             operationResults.mainOperation = 'updated';
//           } else {
//             // Create new property
//             const newProperty = new SpecificModel(propertyData);
//             const savedProperty = await newProperty.save();
//             console.log(`Created new property ${savedProperty.id} in ${SpecificModel.modelName}`);
//             operationResults.mainOperation = 'created';
//           }

//           // Link property to agent ONLY if it's a Live property (not NonActive)
//           if (listingType !== 'NonActive') {
//             const agentResult = await linkPropertyToAgent(propertyData);
//             operationResults.agentOperation = agentResult.operation;
//             if (!agentResult.success) {
//               operationResults.errors.push(`Agent operation failed: ${agentResult.error || agentResult.reason}`);
//             }
//           } else {
//             operationResults.agentOperation = 'skipped_nonactive';
//             console.log(`Skipped agent linking for non-active property ${propertyData.id}`);
//           }

//         } catch (error) {
//           console.error(`Error processing property ${propertyData.id}:`, error);
//           operationResults.mainOperation = 'failed';
//           operationResults.errors.push(`Main operation failed: ${error.message}`);
//         }

//         const isSuccess = operationResults.mainOperation === 'created' || 
//                          operationResults.mainOperation === 'updated' ||
//                          operationResults.mainOperation === 'skipped';

//         return {
//           success: isSuccess,
//           operationResults: operationResults,
//           error: isSuccess ? null : operationResults.errors.join('; ')
//         };

//       } catch (error) {
//         console.error(`Error in saveOrUpdatePropertyToDb for property ${propertyData.id || "unknown"}:`, error);
//         return {
//           success: false,
//           error: error.message,
//           operationResults: {
//             mode: propertyData.mode,
//             mainOperation: 'failed',
//             agentOperation: 'failed',
//             errors: [error.message]
//           }
//         };
//       }
//     };

//     console.log("Starting to process all properties...");

//     // UPDATED: Process results tracking with status-based categories
//     const processResults = {
//       totalAttempted: validProperties.length,
//       livePropertiesAttempted: liveProperties.length,
//       nonLivePropertiesAttempted: nonLiveProperties.length,
//       successful: 0,
//       failed: 0,
//       skipped: allProperties.length - validProperties.length,
//       failures: [],
//       operations: {
//         created: 0,
//         updated: 0,
//         skipped: 0,
//         agentPropertiesAdded: 0,
//         agentPropertiesUpdated: 0,
//         agentNotFound: 0,
//         agentSkipped: 0,
//         agentSkippedNonActive: 0,
//         agentFailed: 0
//       },
//       byType: {
//         Sale: { created: 0, updated: 0, skipped: 0 },
//         Rent: { created: 0, updated: 0, skipped: 0 },
//         OffPlan: { created: 0, updated: 0, skipped: 0 },
//         Commercial: { created: 0, updated: 0, skipped: 0 },
//         NonActive: { created: 0, updated: 0, skipped: 0 },
//         Other: { created: 0, updated: 0, skipped: 0 }
//       },
//       statusStats: {
//         liveProcessed: 0,
//         nonLiveProcessed: 0,
//         statusBreakdown: {}
//       },
//       classificationStats: {
//         byCompletionStatus: {},
//         byOfferingType: {},
//         fallbacks: 0
//       }
//     };

//     // Process Live properties first
//     console.log(`Processing ${liveProperties.length} Live properties...`);
//     for (let i = 0; i < liveProperties.length; i++) {
//       try {
//         const property = liveProperties[i];
        
//         // Track classification stats for Live properties
//         const completionStatus = property.custom_fields?.completion_status;
//         const offeringType = property.custom_fields?.offering_type;
//         const classification = property._classification;
        
//         if (completionStatus) {
//           processResults.classificationStats.byCompletionStatus[completionStatus] = 
//             (processResults.classificationStats.byCompletionStatus[completionStatus] || 0) + 1;
//         }
        
//         if (offeringType) {
//           processResults.classificationStats.byOfferingType[offeringType] = 
//             (processResults.classificationStats.byOfferingType[offeringType] || 0) + 1;
//         }
        
//         if (classification && classification.reason.includes('Fallback')) {
//           processResults.classificationStats.fallbacks++;
//         }

//         const result = await saveOrUpdatePropertyToDb(property);

//         if (result.success) {
//           processResults.successful++;
//           processResults.statusStats.liveProcessed++;

//           const ops = result.operationResults;
          
//           // Track main operations
//           if (ops.mainOperation === 'created') {
//             processResults.operations.created++;
//             if (processResults.byType[ops.listingType]) {
//               processResults.byType[ops.listingType].created++;
//             } else {
//               processResults.byType.Other.created++;
//             }
//           } else if (ops.mainOperation === 'updated') {
//             processResults.operations.updated++;
//             if (processResults.byType[ops.listingType]) {
//               processResults.byType[ops.listingType].updated++;
//             } else {
//               processResults.byType.Other.updated++;
//             }
//           } else if (ops.mainOperation === 'skipped') {
//             processResults.operations.skipped++;
//             if (processResults.byType[ops.listingType]) {
//               processResults.byType[ops.listingType].skipped++;
//             } else {
//               processResults.byType.Other.skipped++;
//             }
//           }

//           // Track Agent operations
//           if (ops.agentOperation === 'property_added') {
//             processResults.operations.agentPropertiesAdded++;
//           } else if (ops.agentOperation === 'property_updated') {
//             processResults.operations.agentPropertiesUpdated++;
//           } else if (ops.agentOperation === 'agent_not_found') {
//             processResults.operations.agentNotFound++;
//           } else if (ops.agentOperation === 'skipped') {
//             processResults.operations.agentSkipped++;
//           } else if (ops.agentOperation === 'skipped_nonactive') {
//             processResults.operations.agentSkippedNonActive++;
//           } else if (ops.agentOperation === 'failed') {
//             processResults.operations.agentFailed++;
//           }

//           if (processResults.statusStats.liveProcessed % 10 === 0) {
//             console.log(`Progress (Live): ${processResults.statusStats.liveProcessed}/${liveProperties.length} Live properties processed`);
//           }
//         } else {
//           processResults.failed++;
//           processResults.failures.push({
//             id: property.id || `Unknown Live property at index ${i}`,
//             mode: property.mode || 'Unknown',
//             status: property.general_listing_information?.status || 'Unknown',
//             classification: property._classification,
//             error: result.error
//           });
//         }
//       } catch (error) {
//         console.error(`Error in Live property processing loop at index ${i}:`, error);
//         processResults.failed++;
//         processResults.failures.push({
//           id: liveProperties[i]?.id || `Unknown Live property at index ${i}`,
//           mode: liveProperties[i]?.mode || 'Unknown',
//           status: liveProperties[i]?.general_listing_information?.status || 'Unknown',
//           error: error.message
//         });
//       }
//     }

//     // Process Non-Live properties
//     console.log(`Processing ${nonLiveProperties.length} Non-Live properties...`);
//     for (let i = 0; i < nonLiveProperties.length; i++) {
//       try {
//         const property = nonLiveProperties[i];
        
//         // Track status breakdown for Non-Live properties
//         const status = property.general_listing_information?.status || 'Unknown';
//         processResults.statusStats.statusBreakdown[status] = 
//           (processResults.statusStats.statusBreakdown[status] || 0) + 1;

//         const result = await saveOrUpdatePropertyToDb(property);

//         if (result.success) {
//           processResults.successful++;
//           processResults.statusStats.nonLiveProcessed++;

//           const ops = result.operationResults;
          
//           // Track main operations
//           if (ops.mainOperation === 'created') {
//             processResults.operations.created++;
//             processResults.byType.NonActive.created++;
//           } else if (ops.mainOperation === 'updated') {
//             processResults.operations.updated++;
//             processResults.byType.NonActive.updated++;
//           } else if (ops.mainOperation === 'skipped') {
//             processResults.operations.skipped++;
//             processResults.byType.NonActive.skipped++;
//           }

//           // Track Agent operations (should be skipped_nonactive for all)
//           if (ops.agentOperation === 'skipped_nonactive') {
//             processResults.operations.agentSkippedNonActive++;
//           }

//           if (processResults.statusStats.nonLiveProcessed % 10 === 0) {
//             console.log(`Progress (Non-Live): ${processResults.statusStats.nonLiveProcessed}/${nonLiveProperties.length} Non-Live properties processed`);
//           }
//         } else {
//           processResults.failed++;
//           processResults.failures.push({
//             id: property.id || `Unknown Non-Live property at index ${i}`,
//             mode: property.mode || 'Unknown',
//             status: property.general_listing_information?.status || 'Unknown',
//             classification: property._classification,
//             error: result.error
//           });
//         }
//       } catch (error) {
//         console.error(`Error in Non-Live property processing loop at index ${i}:`, error);
//         processResults.failed++;
//         processResults.failures.push({
//           id: nonLiveProperties[i]?.id || `Unknown Non-Live property at index ${i}`,
//           mode: nonLiveProperties[i]?.mode || 'Unknown',
//           status: nonLiveProperties[i]?.general_listing_information?.status || 'Unknown',
//           error: error.message
//         });
//       }
//     }

//     console.log("Database processing operation completed.");
//     console.log(`Successfully processed ${processResults.successful} properties.`);
//     console.log(`Failed to process ${processResults.failed} properties.`);
//     console.log(`Skipped ${processResults.skipped} properties (invalid modes).`);
//     console.log(`Status Summary:`);
//     console.log(`  - Live properties processed: ${processResults.statusStats.liveProcessed}`);
//     console.log(`  - Non-Live properties processed: ${processResults.statusStats.nonLiveProcessed}`);
//     console.log(`Operations summary:`);
//     console.log(`  - Created: ${processResults.operations.created}`);
//     console.log(`  - Updated: ${processResults.operations.updated}`);
//     console.log(`  - Skipped: ${processResults.operations.skipped}`);
//     console.log(`  - Agent Properties Added: ${processResults.operations.agentPropertiesAdded}`);
//     console.log(`  - Agent Properties Updated: ${processResults.operations.agentPropertiesUpdated}`);
//     console.log(`  - Agent Not Found: ${processResults.operations.agentNotFound}`);
//     console.log(`  - Agent Skipped: ${processResults.operations.agentSkipped}`);
//     console.log(`  - Agent Skipped (Non-Active): ${processResults.operations.agentSkippedNonActive}`);
//     console.log(`  - Agent Failed: ${processResults.operations.agentFailed}`);
    
//     console.log(`Classification Summary (Live Properties Only):`);
//     console.log(`  - By Property Type:`);
//     console.log(`    * Sale: Created ${processResults.byType.Sale.created}, Updated ${processResults.byType.Sale.updated}`);
//     console.log(`    * Rent: Created ${processResults.byType.Rent.created}, Updated ${processResults.byType.Rent.updated}`);
//     console.log(`    * OffPlan: Created ${processResults.byType.OffPlan.created}, Updated ${processResults.byType.OffPlan.updated}`);
//     console.log(`    * Commercial: Created ${processResults.byType.Commercial.created}, Updated ${processResults.byType.Commercial.updated}`);
//     console.log(`    * NonActive: Created ${processResults.byType.NonActive.created}, Updated ${processResults.byType.NonActive.updated}`);
//     console.log(`  - By Completion Status:`, processResults.classificationStats.byCompletionStatus);
//     console.log(`  - By Offering Type:`, processResults.classificationStats.byOfferingType);
//     console.log(`  - Fallback Classifications: ${processResults.classificationStats.fallbacks}`);
//     console.log(`  - Non-Live Status Breakdown:`, processResults.statusStats.statusBreakdown);

//     return res.status(200).json({
//       success: true,
//       message: "XML data fetched, parsed, and processed successfully with status-based filtering",
//       totalPropertiesInXml: allProperties.length,
//       processedProperties: validProperties.length,
//       liveProperties: liveProperties.length,
//       nonLiveProperties: nonLiveProperties.length,
//       skippedProperties: processResults.skipped,
//       databaseResults: {
//         propertiesProcessed: processResults.successful,
//         propertiesFailed: processResults.failed,
//         operations: processResults.operations,
//         byType: processResults.byType,
//         statusStats: processResults.statusStats,
//         classificationStats: processResults.classificationStats,
//         failures: processResults.failures.slice(0, 10)
//       }
//     });

//   } catch (error) {
//     console.error("Error parsing XML:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to parse XML",
//       error: error.message,
//     });
//   }
// };

// module.exports = parseXmlFromUrl;



const axios = require("axios");
const xml2js = require("xml2js");
const Property = require("../Models/PropertyModel");
const Agent = require("../Models/AgentModel");

// Simple QR code extraction function
const extractQRCodeUrl = (qrCode) => {
  if (!qrCode) return '';
  
  // Case 1: Direct string
  if (typeof qrCode === 'string') {
    return qrCode;
  }
  
  // Case 2: Object with url property (most common case based on your XML)
  if (qrCode.url) {
    // If url is a string directly
    if (typeof qrCode.url === 'string') {
      return qrCode.url;
    }
    
    // If url is an object with text content (xml2js parsing)
    if (typeof qrCode.url === 'object') {
      // Handle xml2js parsed text content (_ property contains the actual URL)
      if (qrCode.url._) {
        return qrCode.url._;
      }
      
      // Handle $t property (another xml2js text content property)
      if (qrCode.url.$t) {
        return qrCode.url.$t;
      }
    }
    
    // If url is an array (multiple URLs, take first)
    if (Array.isArray(qrCode.url) && qrCode.url.length > 0) {
      const firstUrl = qrCode.url[0];
      if (typeof firstUrl === 'string') {
        return firstUrl;
      }
      if (firstUrl && (firstUrl._ || firstUrl.$t)) {
        const url = firstUrl._ || firstUrl.$t;
        return url;
      }
    }
  }
  
  // Case 3: Direct text content at qr_code level
  if (qrCode._ || qrCode.$t) {
    const url = qrCode._ || qrCode.$t;
    return url;
  }
  
  return '';
};

// Check if property status is Live
const isPropertyLive = (propertyData) => {
  const status = propertyData.general_listing_information?.status;
  return status && status.toLowerCase() === 'live';
};

// Determine property type based on completion_status and offering_type
const determinePropertyType = (customFields) => {
  const offeringType = customFields?.offering_type;
  const completionStatus = customFields?.completion_status;
  
  // FIRST: Check completion_status for off-plan properties
  if (completionStatus === 'off_plan_primary' || completionStatus === 'off_plan_secondary' ) {
    return {
      type: 'OffPlan',
      listingType: 'OffPlan',
      reason: `completion_status is ${completionStatus}`
    };
  }
  
  // SECOND: If not off-plan, check offering_type
  if (offeringType === 'RR') {
    return {
      type: 'Rent',
      listingType: 'Rent',
      reason: `offering_type is ${offeringType}`
    };
  } else if (offeringType === 'RS') {
    return {
      type: 'Sale',
      listingType: 'Sale',
      reason: `offering_type is ${offeringType}`
    };
  } else if (offeringType === 'CS' || offeringType === 'CR') {
    return {
      type: 'Commercial',
      listingType: 'Commercial',
      reason: `offering_type is ${offeringType}`
    };
  }
  
  // FALLBACK: Default to Sale if no clear classification
  return {
    type: 'Sale',
    listingType: 'Sale',
    reason: `Fallback - no clear classification found`
  };
};

// Create property data for agent linking
const createPropertyDataForAgent = (propertyData) => {
  const generalInfo = propertyData.general_listing_information || {};
  const addressInfo = propertyData.address_information || {};
  const customFields = propertyData.custom_fields || {};

  // Map listingType to match Agent model enum ['Sale', 'Rent', 'Off Plan']
  let agentListingType = propertyData.listing_type || 'Sale';
  if (agentListingType === 'OffPlan') {
    agentListingType = 'Off Plan'; // Convert to match Agent model enum
  }

  return {
    propertyId: propertyData.id,
    listingTitle: generalInfo.listing_title || 'No Title',
    listingType: agentListingType,
    propertyType: propertyData.property_type || 'Unknown',
    price: generalInfo.listingprice || '0',
    currency: generalInfo.currency_iso_code || 'AED',
    status: generalInfo.status || 'Active',
    bedrooms: generalInfo.bedrooms || '0',
    bathrooms: generalInfo.fullbathrooms || '0',
    area: generalInfo.totalarea || '0',
    location: {
      city: customFields.city || addressInfo.city || '',
      address: customFields.propertyfinder_region || addressInfo.address || '',
      community: customFields.community || '',
      building: customFields.property_name || ''
    },
    images: propertyData.listing_media?.images?.image || [],
    description: generalInfo.description || '',
    addedDate: new Date(),
    lastUpdated: new Date()
  };
};

// Link property to existing agent
const linkPropertyToAgent = async (propertyData) => {
  try {
    const listingAgent = propertyData.listing_agent;
    
    if (!listingAgent || !listingAgent.listing_agent_email) {
      return {
        success: false,
        operation: 'skipped',
        reason: 'No agent email found in property data'
      };
    }

    const agentEmail = listingAgent.listing_agent_email.toLowerCase().trim();
    
    // Find existing agent by email using the static method from Agent model
    const existingAgent = await Agent.findByEmail(agentEmail);

    if (!existingAgent) {
      return {
        success: false,
        operation: 'agent_not_found',
        reason: `No active agent found with email: ${agentEmail}`
      };
    }

    // Create property data for agent
    const propertyDataForAgent = createPropertyDataForAgent(propertyData);

    // Check if property already exists in agent's properties
    const existingProperty = existingAgent.properties?.find(
      p => p.propertyId === propertyData.id
    );

    const operation = existingProperty ? 'property_updated' : 'property_added';

    // Use the Agent model's addOrUpdateProperty method
    existingAgent.addOrUpdateProperty(propertyDataForAgent);

    // Save the agent with updated properties
    await existingAgent.save();

    return {
      success: true,
      operation: operation,
      agentEmail: agentEmail,
      agentName: existingAgent.agentName,
      totalProperties: existingAgent.totalProperties, // Using virtual field
      activeSaleListings: existingAgent.activeSaleListings
    };

  } catch (error) {
    return {
      success: false,
      operation: 'failed',
      error: error.message
    };
  }
};

const parseXmlFromUrl = async (req, res, next) => {
  try {
    const xmlUrl = process.env.XML_URL;
    console.log(`Fetching XML from: ${xmlUrl}`);
    
    const response = await axios.get(xmlUrl, {
      headers: { Accept: "application/xml" },
    });

    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      normalize: true,
      normalizeTags: false,
      trim: true,
    });

    console.log("Parsing XML data...");
    const result = await parser.parseStringPromise(response.data);

    let allProperties = [];

    // Handle the new XML structure - properties are directly in the list
    if (result && result.list && result.list.property) {
      if (Array.isArray(result.list.property)) {
        allProperties = result.list.property;
      } else {
        allProperties = [result.list.property];
      }
    } else {
      // Fallback to find properties array
      const findPropertiesArray = (obj) => {
        for (const key in obj) {
          if (
            Array.isArray(obj[key]) &&
            obj[key].length > 0 &&
            obj[key][0] &&
            (obj[key][0].general_listing_information || obj[key][0].Id)
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
        allProperties = propertiesArray;
      }
    }

    console.log(`Found ${allProperties.length} properties in XML`);

    // Transform new XML format to match existing structure
    const transformPropertyData = (property) => {
      // Determine property classification
      const classification = determinePropertyType(property.custom_fields);
      
      const transformedProperty = {
        id: property.Id || property.id,
        mode: "CREATE", // Default mode since new XML doesn't have mode
        created_at: property.created_at,
        timestamp: property.timestamp,
        
        // Base level fields for indexing - use classification results
        offering_type: property.custom_fields?.offering_type || "RS",
        property_type: property.general_listing_information?.property_type || "apartment",
        
        // Add listing_type based on classification
        listing_type: classification.listingType,
        
        // Transform address information
        address_information: property.address_information || {},
        
        // Transform general listing information
        general_listing_information: {
          listing_title: property.general_listing_information?.listing_title || "",
          listingprice: property.general_listing_information?.listingprice || "0",
          listingtype: classification.listingType, // Use classification result
          currency_iso_code: property.general_listing_information?.currency_iso_code || "AED",
          property_type: property.general_listing_information?.property_type || "apartment",
          status: property.general_listing_information?.status || "Live",
          totalarea: property.general_listing_information?.totalarea || "0",
          description: property.general_listing_information?.description || "",
          bedrooms: property.general_listing_information?.bedrooms || "0",
          fullbathrooms: property.general_listing_information?.fullbathrooms || "0",
          // Map property_type to both propertytype and property for schema compatibility
          propertytype: property.general_listing_information?.property_type || "apartment",
          property: property.general_listing_information?.property_type || "apartment"
        },
        
        // Transform listing agent
        listing_agent: {
          listing_agent_email: property.listing_agent?.listing_agent_email || "",
          listing_agent_firstname: property.listing_agent?.listing_agent_firstname || "",
          listing_agent_lastname: property.listing_agent?.listing_agent_lastname || "",
          listing_agent_mobil_phone: property.listing_agent?.listing_agent_mobil_phone || "",
          listing_agent_phone: property.listing_agent?.listing_agent_phone || 
                               property.listing_agent?.listing_agent_mobil_phone || ""
        },
        
        // Transform custom fields - mapping ALL fields from new XML format
        custom_fields: {
          // New XML fields - direct mapping
          property_record_id: property.custom_fields?.property_record_id || "",
          permit_number: property.custom_fields?.permit_number || "",
          offering_type: property.custom_fields?.offering_type || "",
          price_on_application: property.custom_fields?.price_on_application || "No",
          payment_method: property.custom_fields?.payment_method || "",
          city: property.custom_fields?.city || "",
          community: property.custom_fields?.community || "",
          sub_community: property.custom_fields?.sub_community || "",
          property_name: property.custom_fields?.property_name || "",
          propertyfinder_region: property.custom_fields?.propertyfinder_region || "",
          autonumber: property.custom_fields?.autonumber || "",
          unitnumber: property.custom_fields?.unitnumber || "",
          private_amenities: property.custom_fields?.private_amenities || "",
          plot_size: property.custom_fields?.plot_size || "0",
          developer: property.custom_fields?.developer || "",
          completion_status: property.custom_fields?.completion_status || "completed",
          parking: property.custom_fields?.parking || "0",
          furnished: property.custom_fields?.furnished || "No",
          project_name: property.custom_fields?.project_name || "",
          title_deed: property.custom_fields?.title_deed || "",
          availability_date: property.custom_fields?.availability_date || "",
          qr_code: extractQRCodeUrl(property.custom_fields?.qr_code),
          
          // Map to the field names your existing code expects for backward compatibility
          community_name: property.custom_fields?.community || "",
          tower_text: property.custom_fields?.property_name || "",
          pba__addresstext_pb: property.custom_fields?.propertyfinder_region || "",
          
          // Map completion status for OffPlan detection with multiple variants
          pba_uaefields__completion_status: 
            property.custom_fields?.completion_status === "off_plan_primary" || 
            property.custom_fields?.completion_status === "off_plan_secondary" ? "Off Plan" : "Completed",
          
          // Additional fields that might be in the XML but not captured yet
          sub_community_name: property.custom_fields?.sub_community || "",
          building_name: property.custom_fields?.property_name || "",
          rera_permit_number: property.custom_fields?.permit_number || "",
          plot_area: property.custom_fields?.plot_size || "0",
          completion_date: property.custom_fields?.availability_date || "",
          
          // Map any other fields dynamically - but exclude qr_code to avoid object storage
          ...Object.keys(property.custom_fields || {}).reduce((acc, key) => {
            // Don't override already mapped fields and skip qr_code to avoid storing object
            if (!acc[key] && key !== 'qr_code' && property.custom_fields[key] !== undefined) {
              acc[key] = property.custom_fields[key];
            }
            return acc;
          }, {})
        },
        
        // Transform listing media with proper image handling for nested URL structures
        listing_media: {
          images: {
            image: (() => {
              const images = property.listing_media?.images?.image;
              if (!images) return [];
              
              // Handle array of images
              if (Array.isArray(images)) {
                return images.map(img => {
                  if (typeof img === 'string') {
                    return { title: '', url: img };
                  }
                  
                  // Handle nested url structure from xml2js parsing
                  if (img.url) {
                    if (typeof img.url === 'string') {
                      return { title: img.title || '', url: img.url };
                    } else if (Array.isArray(img.url)) {
                      // Handle array of URLs within single image
                      return img.url.map(urlItem => ({
                        title: urlItem.title || '',
                        url: urlItem._ || urlItem.$t || urlItem
                      }));
                    } else if (img.url._ || img.url.$t) {
                      return { title: img.url.title || '', url: img.url._ || img.url.$t };
                    }
                  }
                  
                  return img;
                }).flat(); // Flatten in case of nested arrays
              }
              
              // Handle single image object
              if (images.url) {
                if (Array.isArray(images.url)) {
                  return images.url.map(urlItem => ({
                    title: urlItem.title || '',
                    url: urlItem._ || urlItem.$t || urlItem
                  }));
                } else if (typeof images.url === 'string') {
                  return [{ title: images.title || '', url: images.url }];
                } else if (images.url._ || images.url.$t) {
                  return [{ title: images.url.title || '', url: images.url._ || images.url.$t }];
                }
              }
              
              return [];
            })()
          }
        },
        
        // Add QR code at root level for easier access
        qr_code: extractQRCodeUrl(property.custom_fields?.qr_code),
        
        // Store classification info
        _classification: classification,
      };

      return transformedProperty;
    };

    // Transform all properties to match expected structure
    const transformedProperties = allProperties.map(transformPropertyData);

    // Filter valid properties (all are valid since we're setting mode to CREATE)
    const validProperties = transformedProperties.filter(property => {
      const mode = property.mode;
      if (mode === "CREATE" || mode === "CHANGE" || mode === "NEW") {
        return true;
      }
      console.log(`Skipping property ${property.id} with mode: ${mode}`);
      return false;
    });

    console.log(`Processing ${validProperties.length} properties`);

    // Separate properties by status FIRST
    const liveProperties = [];
    const nonLiveProperties = [];

    validProperties.forEach(property => {
      if (isPropertyLive(property)) {
        liveProperties.push(property);
      } else {
        // For non-Live properties, update classification to NonActive
        property._classification = {
          type: 'NonActive',
          listingType: 'NonActive',
          reason: `Status is not Live: ${property.general_listing_information?.status}`
        };
        property.listing_type = 'NonActive';
        property.general_listing_information.listingtype = 'NonActive';
        
        nonLiveProperties.push(property);
      }
    });

    console.log(`Live properties: ${liveProperties.length}`);
    console.log(`Non-Live properties: ${nonLiveProperties.length}`);

    const validateAndCleanPropertyData = (propertyData) => {
      try {
        // Ensure required fields are present
        if (!propertyData.general_listing_information) {
          propertyData.general_listing_information = {};
        }

        if (!propertyData.general_listing_information.listingprice) {
          propertyData.general_listing_information.listingprice = "0";
        }

        if (!propertyData.general_listing_information.currency_iso_code) {
          propertyData.general_listing_information.currency_iso_code = "AED";
        }

        if (!propertyData.general_listing_information.status) {
          propertyData.general_listing_information.status = "Live";
        }

        if (!propertyData.general_listing_information.listing_title) {
          propertyData.general_listing_information.listing_title = "No Title";
        }

        if (!propertyData.general_listing_information.bedrooms) {
          propertyData.general_listing_information.bedrooms = "0";
        }

        if (!propertyData.general_listing_information.fullbathrooms) {
          propertyData.general_listing_information.fullbathrooms = "0";
        }

        if (!propertyData.general_listing_information.totalarea) {
          propertyData.general_listing_information.totalarea = "0";
        }

        // Validate listing agent required fields
        if (!propertyData.listing_agent) {
          propertyData.listing_agent = {};
        }

        if (!propertyData.listing_agent.listing_agent_email) {
          propertyData.listing_agent.listing_agent_email = "";
        }

        if (!propertyData.listing_agent.listing_agent_firstname) {
          propertyData.listing_agent.listing_agent_firstname = "";
        }

        if (!propertyData.listing_agent.listing_agent_lastname) {
          propertyData.listing_agent.listing_agent_lastname = "";
        }

        if (!propertyData.listing_agent.listing_agent_mobil_phone) {
          propertyData.listing_agent.listing_agent_mobil_phone = "";
        }

        if (!propertyData.listing_agent.listing_agent_phone) {
          propertyData.listing_agent.listing_agent_phone = propertyData.listing_agent.listing_agent_mobil_phone || "";
        }

        // Ensure custom_fields exists
        if (!propertyData.custom_fields) {
          propertyData.custom_fields = {};
        }

        // Ensure base level fields are set (required by PropertyModel)
        if (!propertyData.offering_type) {
          propertyData.offering_type = "RS";
        }

        if (!propertyData.property_type) {
          propertyData.property_type = "apartment";
        }

        // Ensure required root level fields
        if (!propertyData.created_at) {
          propertyData.created_at = new Date().toISOString();
        }

        if (!propertyData.timestamp) {
          propertyData.timestamp = new Date().toISOString();
        }

        // SIMPLIFIED QR code validation - extract URL string if it's an object
        if (propertyData.custom_fields.qr_code && typeof propertyData.custom_fields.qr_code === 'object') {
          const extractedUrl = extractQRCodeUrl(propertyData.custom_fields.qr_code);
          propertyData.custom_fields.qr_code = extractedUrl;
        }

        return { success: true, data: propertyData };
      } catch (error) {
        return { success: false, error: error.message };
      }
    };

    // SIMPLIFIED save function for single Property collection
    // const saveOrUpdatePropertyToDb = async (propertyData) => {
    //   try {
    //     console.log(`Processing property ${propertyData.id}`);

    //     // Validate and clean property data
    //     const validationResult = validateAndCleanPropertyData(propertyData);
    //     if (!validationResult.success) {
    //       return {
    //         success: false,
    //         error: `Data validation failed: ${validationResult.error}`,
    //         operationResults: {
    //           mainOperation: 'failed',
    //           agentOperation: 'failed',
    //           errors: [validationResult.error]
    //         }
    //       };
    //     }

    //     propertyData = validationResult.data;

    //     const listingType = propertyData._classification?.listingType || 'Sale';
        
    //     const operationResults = {
    //       listingType: listingType,
    //       isLive: listingType !== 'NonActive',
    //       isOffPlan: listingType === 'OffPlan',
    //       isCommercial: listingType === 'Commercial',
    //       isNonActive: listingType === 'NonActive',
    //       mainOperation: null,
    //       agentOperation: null,
    //       errors: []
    //     };

    //     try {
    //       // Find existing property in the SINGLE Property collection
    //       const existingProperty = await Property.findOne({ id: propertyData.id });
          
    //       if (existingProperty) {
    //         // Update existing property
    //         await Property.findOneAndUpdate(
    //           { id: propertyData.id },
    //           propertyData,
    //           { new: true, upsert: false }
    //         );
    //         console.log(`✅ Updated existing property ${propertyData.id} in Property collection`);
    //         operationResults.mainOperation = 'updated';
    //       } else {
    //         // Create new property
    //         const newProperty = new Property(propertyData);
    //         await newProperty.save();
    //         console.log(`✅ Created new property ${propertyData.id} in Property collection`);
    //         operationResults.mainOperation = 'created';
    //       }

    //       // Link property to agent ONLY if it's a Live property (not NonActive)
    //       if (listingType !== 'Off Market'  && propertyData.listing_agent?.listing_agent_email) {
    //         const agentResult = await linkPropertyToAgent(propertyData);
    //         operationResults.agentOperation = agentResult.operation;
    //         if (!agentResult.success) {
    //           operationResults.errors.push(`Agent operation failed: ${agentResult.error || agentResult.reason}`);
    //         } else {
    //           console.log(`✅ Agent linking: ${agentResult.operation} for property ${propertyData.id}`);
    //         }
    //       } else {
    //         operationResults.agentOperation = 'skipped_nonactive';
    //         console.log(`⏭️ Skipped agent linking for non-active property ${propertyData.id}`);
    //       }

    //     } catch (error) {
    //       console.error(`❌ Error processing property ${propertyData.id}:`, error);
    //       operationResults.mainOperation = 'failed';
    //       operationResults.errors.push(`Main operation failed: ${error.message}`);
    //     }

    //     const isSuccess = operationResults.mainOperation === 'created' || 
    //                      operationResults.mainOperation === 'updated';

    //     return {
    //       success: isSuccess,
    //       operationResults: operationResults,
    //       error: isSuccess ? null : operationResults.errors.join('; ')
    //     };

    //   } catch (error) {
    //     console.error(`❌ Error in saveOrUpdatePropertyToDb for property ${propertyData.id || "unknown"}:`, error);
    //     return {
    //       success: false,
    //       error: error.message,
    //       operationResults: {
    //         mainOperation: 'failed',
    //         agentOperation: 'failed',
    //         errors: [error.message]
    //       }
    //     };
    //   }
    // };

    const saveOrUpdatePropertyToDb = async (propertyData) => {
      try {
        console.log(`Processing property ${propertyData.id}`);
    
        // Validate and clean property data
        const validationResult = validateAndCleanPropertyData(propertyData);
        if (!validationResult.success) {
          return {
            success: false,
            error: `Data validation failed: ${validationResult.error}`,
            operationResults: {
              mainOperation: 'failed',
              agentOperation: 'failed',
              errors: [validationResult.error]
            }
          };
        }
    
        propertyData = validationResult.data;
    
        const listingType = propertyData._classification?.listingType || 'Sale';
        
        // Get the actual property status from general_listing_information
        const propertyStatus = propertyData.general_listing_information?.status;
        const isLiveProperty = propertyStatus && propertyStatus.toLowerCase() === 'live';
        
        const operationResults = {
          listingType: listingType,
          propertyStatus: propertyStatus,
          isLive: isLiveProperty,
          isOffPlan: listingType === 'OffPlan',
          isCommercial: listingType === 'Commercial',
          isNonActive: listingType === 'NonActive',
          mainOperation: null,
          agentOperation: null,
          errors: []
        };
    
        try {
          // Find existing property in the SINGLE Property collection
          const existingProperty = await Property.findOne({ id: propertyData.id });
          
          if (existingProperty) {
            // Update existing property
            await Property.findOneAndUpdate(
              { id: propertyData.id },
              propertyData,
              { new: true, upsert: false }
            );
            console.log(`✅ Updated existing property ${propertyData.id} in Property collection`);
            operationResults.mainOperation = 'updated';
          } else {
            // Create new property
            const newProperty = new Property(propertyData);
            await newProperty.save();
            console.log(`✅ Created new property ${propertyData.id} in Property collection`);
            operationResults.mainOperation = 'created';
          }
    
          // CRITICAL CHANGE: Link property to agent ONLY if status is "Live" 
          // (not just checking listingType !== 'NonActive')
          if (isLiveProperty && propertyData.listing_agent?.listing_agent_email) {
            console.log(`🔗 Attempting to link Live property ${propertyData.id} to agent...`);
            const agentResult = await linkPropertyToAgent(propertyData);
            operationResults.agentOperation = agentResult.operation;
            
            if (!agentResult.success) {
              operationResults.errors.push(`Agent operation failed: ${agentResult.error || agentResult.reason}`);
              console.log(`⚠️ Agent linking failed for property ${propertyData.id}: ${agentResult.reason}`);
            } else {
              console.log(`✅ Agent linking: ${agentResult.operation} for property ${propertyData.id}`);
            }
          } else {
            // More specific logging for why agent linking was skipped
            if (!isLiveProperty) {
              operationResults.agentOperation = 'skipped_not_live';
              console.log(`⏭️ Skipped agent linking for property ${propertyData.id} - Status: "${propertyStatus}" (not Live)`);
            } else if (!propertyData.listing_agent?.listing_agent_email) {
              operationResults.agentOperation = 'skipped_no_agent';
              console.log(`⏭️ Skipped agent linking for property ${propertyData.id} - No agent email found`);
            }
          }
    
        } catch (error) {
          console.error(`❌ Error processing property ${propertyData.id}:`, error);
          operationResults.mainOperation = 'failed';
          operationResults.errors.push(`Main operation failed: ${error.message}`);
        }
    
        const isSuccess = operationResults.mainOperation === 'created' || 
                         operationResults.mainOperation === 'updated';
    
        return {
          success: isSuccess,
          operationResults: operationResults,
          error: isSuccess ? null : operationResults.errors.join('; ')
        };
    
      } catch (error) {
        console.error(`❌ Error in saveOrUpdatePropertyToDb for property ${propertyData.id || "unknown"}:`, error);
        return {
          success: false,
          error: error.message,
          operationResults: {
            mainOperation: 'failed',
            agentOperation: 'failed',
            errors: [error.message]
          }
        };
      }
    };

    console.log("Starting to process all properties...");

    // Process results tracking
    const processResults = {
      totalAttempted: validProperties.length,
      livePropertiesAttempted: liveProperties.length,
      nonLivePropertiesAttempted: nonLiveProperties.length,
      successful: 0,
      failed: 0,
      skipped: allProperties.length - validProperties.length,
      failures: [],
      operations: {
        created: 0,
        updated: 0,
        agentPropertiesAdded: 0,
        agentPropertiesUpdated: 0,
        agentNotFound: 0,
        agentSkipped: 0,
        agentSkippedNonActive: 0,
        agentFailed: 0
      },
      byType: {
        Sale: { created: 0, updated: 0 },
        Rent: { created: 0, updated: 0 },
        OffPlan: { created: 0, updated: 0 },
        Commercial: { created: 0, updated: 0 },
        NonActive: { created: 0, updated: 0 }
      },
      classificationStats: {
        byCompletionStatus: {},
        byOfferingType: {},
        fallbacks: 0
      }
    };

    // Process ALL properties (Live and Non-Live)
    const allPropertiesToProcess = [...liveProperties, ...nonLiveProperties];
    
    for (let i = 0; i < allPropertiesToProcess.length; i++) {
      try {
        const property = allPropertiesToProcess[i];
        
        // Track classification stats
        const completionStatus = property.custom_fields?.completion_status;
        const offeringType = property.custom_fields?.offering_type;
        const classification = property._classification;
        
        if (completionStatus) {
          processResults.classificationStats.byCompletionStatus[completionStatus] = 
            (processResults.classificationStats.byCompletionStatus[completionStatus] || 0) + 1;
        }
        
        if (offeringType) {
          processResults.classificationStats.byOfferingType[offeringType] = 
            (processResults.classificationStats.byOfferingType[offeringType] || 0) + 1;
        }
        
        if (classification && classification.reason.includes('Fallback')) {
          processResults.classificationStats.fallbacks++;
        }

        // Save property to single Property collection
        const result = await saveOrUpdatePropertyToDb(property);

        if (result.success) {
          processResults.successful++;
          
          const ops = result.operationResults;
          
          // Track main operations
          if (ops.mainOperation === 'created') {
            processResults.operations.created++;
            if (processResults.byType[ops.listingType]) {
              processResults.byType[ops.listingType].created++;
            }
          } else if (ops.mainOperation === 'updated') {
            processResults.operations.updated++;
            if (processResults.byType[ops.listingType]) {
              processResults.byType[ops.listingType].updated++;
            }
          }

          // Track Agent operations
          if (ops.agentOperation === 'property_added') {
            processResults.operations.agentPropertiesAdded++;
          } else if (ops.agentOperation === 'property_updated') {
            processResults.operations.agentPropertiesUpdated++;
          } else if (ops.agentOperation === 'agent_not_found') {
            processResults.operations.agentNotFound++;
          } else if (ops.agentOperation === 'skipped') {
            processResults.operations.agentSkipped++;
          } else if (ops.agentOperation === 'skipped_nonactive') {
            processResults.operations.agentSkippedNonActive++;
          } else if (ops.agentOperation === 'failed') {
            processResults.operations.agentFailed++;
          }

          if (processResults.successful % 50 === 0) {
            console.log(`Progress: ${processResults.successful}/${allPropertiesToProcess.length} properties processed`);
          }
        } else {
          processResults.failed++;
          processResults.failures.push({
            id: property.id || `Unknown property at index ${i}`,
            status: property.general_listing_information?.status || 'Unknown',
            classification: property._classification,
            error: result.error
          });
        }
      } catch (error) {
        console.error(`Error in property processing loop at index ${i}:`, error);
        processResults.failed++;
        processResults.failures.push({
          id: allPropertiesToProcess[i]?.id || `Unknown property at index ${i}`,
          status: allPropertiesToProcess[i]?.general_listing_information?.status || 'Unknown',
          error: error.message
        });
      }
    }

    console.log("=== DATABASE PROCESSING COMPLETED ===");
    console.log(`Successfully processed: ${processResults.successful} properties`);
    console.log(`Failed: ${processResults.failed} properties`);
    console.log(`Skipped: ${processResults.skipped} properties (invalid data)`);
    console.log(`Live properties: ${processResults.livePropertiesAttempted}`);
    console.log(`Non-Live properties: ${processResults.nonLivePropertiesAttempted}`);
    console.log(`Operations: Created ${processResults.operations.created}, Updated ${processResults.operations.updated}`);
    console.log(`Agent Operations: Added ${processResults.operations.agentPropertiesAdded}, Updated ${processResults.operations.agentPropertiesUpdated}, Not Found ${processResults.operations.agentNotFound}, Skipped ${processResults.operations.agentSkippedNonActive}`);
    console.log(`By Type:`, processResults.byType);

    return res.status(200).json({
      success: true,
      message: "✅ XML data processed successfully - All properties saved to single Property collection with proper classification and agent linking",
      totalPropertiesInXml: allProperties.length,
      processedProperties: validProperties.length,
      liveProperties: liveProperties.length,
      nonLiveProperties: nonLiveProperties.length,
      skippedProperties: processResults.skipped,
      databaseResults: {
        propertiesProcessed: processResults.successful,
        propertiesFailed: processResults.failed,
        operations: processResults.operations,
        byType: processResults.byType,
        classificationStats: processResults.classificationStats,
        failures: processResults.failures.slice(0, 5) // Show first 5 failures only
      }
    });

  } catch (error) {
    console.error("❌ Error parsing XML:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to parse XML",
      error: error.message,
    });
  }
};

module.exports = parseXmlFromUrl;