// const Agent = require('../Models/AgentModel');
// const path = require('path');
// const fs = require('fs');

// // Create a new agent
// const createAgent = async (req, res) => {
//   console.log(req.body);
//   try {
//     // if an image was uploaded, set imageUrl to its path (relative to /public)
//     if (req.file) {
//       req.body.imageUrl = `/uploads/agents/${req.file.filename}`;
//     }
//     const agent = await Agent.create(req.body);
//     res.status(201).json({ success: true, data: agent });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };

// // Get all agents
// const getAgents = async (req, res) => {
//   try {
//     const agents = await Agent.find();
//     res.status(200).json({ success: true, data: agents });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // Get a single agent by agentId
// const getAgentById = async (req, res) => {
//   try {
//     const agent = await Agent.findOne({ agentId: req.params.agentId });
//     if (!agent) {
//       return res.status(404).json({ success: false, error: 'Agent not found' });
//     }
//     res.status(200).json({ success: true, data: agent });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// // Update an agent by agentId
// const updateAgent = async (req, res) => {
//   try {

//     const { agentId, ...requestFields } = req.body;

//     if (!agentId) {
//       return res.status(400).json({ success: false, error: 'Agent ID is required' });
//     }

//     // First, find the current agent
//     const existingAgent = await Agent.findOne({ agentId });
//     if (!existingAgent) {
//       return res.status(404).json({ success: false, error: 'Agent not found' });
//     }

//     // Build update object
//     const buildUpdateObject = (fields, file, currentAgent) => {
//       const updateObj = {};

//       const allowedFields = [
//         'agentName',
//         'designation',
//         'reraNumber',
//         'specialistAreas',
//         'email',
//         'phone',
//         'whatsapp',
//         'activeSaleListings',
//         'propertiesSoldLast15Days',
//         'agentLanguage',
//         'isActive'
//       ];

//       allowedFields.forEach(field => {
//         if (fields[field] !== undefined && fields[field] !== '') {
//           // Special handling for email - only update if different
//           if (field === 'email') {
//             if (fields[field] !== currentAgent.email) {
//               updateObj[field] = fields[field];
//             }
//             return;
//           }

//           // Handle other special cases
//           switch (field) {
//             case 'specialistAreas':
//               if (typeof fields[field] === 'string') {
//                 try {
//                   updateObj[field] = JSON.parse(fields[field]);
//                 } catch (e) {
//                   updateObj[field] = fields[field];
//                 }
//               } else {
//                 updateObj[field] = fields[field];
//               }
//               break;

//             case 'activeSaleListings':
//             case 'propertiesSoldLast15Days':
//               updateObj[field] = parseInt(fields[field]) || 0;
//               break;

//             case 'isActive':
//               updateObj[field] = fields[field] === 'true' || fields[field] === true;
//               break;

//             default:
//               updateObj[field] = fields[field];
//           }
//         }
//       });

//       if (file) {
//         updateObj.imageUrl = `/uploads/agents/${file.filename}`;
//       }

//       updateObj.lastUpdated = new Date();
//       return updateObj;
//     };

//     // Build update object with current agent data
//     const updateFields = buildUpdateObject(requestFields, req.file, existingAgent);

//     console.log('Fields to update:', updateFields);

//     // Check if email is being updated and if it already exists
//     if (updateFields.email) {
//       const emailExists = await Agent.findOne({
//         email: updateFields.email,
//         agentId: { $ne: agentId } // Exclude current agent
//       });

//       if (emailExists) {
//         return res.status(400).json({
//           success: false,
//           error: `Email "${updateFields.email}" is already in use by another agent`
//         });
//       }
//     }

//     // Update agent
//     const updatedAgent = await Agent.findOneAndUpdate(
//       { agentId },
//       { $set: updateFields },
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     res.status(200).json({
//       success: true,
//       message: `Agent updated successfully. Updated fields: ${Object.keys(updateFields).join(', ')}`,
//       data: updatedAgent
//     });

//   } catch (err) {
//     console.error('Update agent error:', err);

//     // Handle duplicate key errors specifically
//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern)[0];
//       const value = err.keyValue[field];
//       return res.status(400).json({
//         success: false,
//         error: `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists`
//       });
//     }

//     res.status(400).json({ success: false, error: err.message });
//   }
// };

// // Delete an agent by agentId
// const deleteAgent = async (req, res) => {
//   try {
//     // console.log(req.body)
//     const agent = await Agent.findOneAndDelete({ agentId: req.body.agentId });
//     if (!agent) {
//       return res.status(404).json({ success: false, error: 'Agent not found' });
//     }
//     // optionally remove the image file
//     if (agent.imageUrl) {
//       const filePath = path.join(__dirname, '../public', agent.imageUrl);
//       fs.unlink(filePath, () => {});
//     }
//     res.status(200).json({ success: true, msg:"Agent Removed" });
//   } catch (err) {
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
// module.exports = {
//   createAgent,
//   getAgents,
//   getAgentById,
//   updateAgent,
//   deleteAgent
// }

// // NEw agent after adding blog

const Agent = require("../Models/AgentModel");
const path = require("path");
const fs = require("fs");

// Create a new agent with sequence number
const createAgent = async (req, res) => {
  console.log(req.body);
  try {
    // if an image was uploaded, set imageUrl to its path (relative to /public)
    if (req.file) {
      req.body.imageUrl = `/uploads/agents/${req.file.filename}`;
    }
    if (req.body.superAgent !== undefined) {
      req.body.superAgent =
        req.body.superAgent === "true" || req.body.superAgent === true;
    }
    // If sequenceNumber is provided, validate it
    if (req.body.sequenceNumber) {
      const sequenceNumber = parseInt(req.body.sequenceNumber);
      if (sequenceNumber < 1) {
        return res.status(400).json({
          success: false,
          error: "Sequence number must be at least 1",
        });
      }

      // Check if sequence number already exists
      const existingAgent = await Agent.findOne({ sequenceNumber });
      if (existingAgent) {
        return res.status(400).json({
          success: false,
          error: `Sequence number ${sequenceNumber} is already taken by agent: ${existingAgent.agentName}`,
        });
      }

      req.body.sequenceNumber = sequenceNumber;
    }

    const agent = await Agent.create(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all agents (now sorted by sequence number)
const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find()
      // .select("agentName agentId email designation phone whatsapp imageUrl sequenceNumber")
      .sort({ sequenceNumber: 1, agentName: 1 });

    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Get a single agent by agentId
const getAgentById = async (req, res) => {
  try {
    // console.log(req.query.agentId)
    const agent = await Agent.findOne({ agentId: req.query.agentId });
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update an agent by agentId
const updateAgent = async (req, res) => {
  try {
    const { agentId, ...requestFields } = req.body;

    if (!agentId) {
      return res
        .status(400)
        .json({ success: false, error: "Agent ID is required" });
    }

    // First, find the current agent
    const existingAgent = await Agent.findOne({ agentId });
    if (!existingAgent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    // Handle sequence number update with swapping logic
    if (requestFields.sequenceNumber !== undefined) {
      const newSequenceNumber = parseInt(requestFields.sequenceNumber);

      if (isNaN(newSequenceNumber) || newSequenceNumber < 1) {
        return res.status(400).json({
          success: false,
          error: "Sequence number must be a positive integer",
        });
      }

      // Only proceed with swap if the sequence number is actually changing
      if (existingAgent.sequenceNumber !== newSequenceNumber) {
        try {
          await Agent.swapSequenceNumbers(agentId, newSequenceNumber);

          // Fetch the updated agent to return
          const updatedAgent = await Agent.findOne({ agentId });
          return res.status(200).json({
            success: true,
            message: `Agent sequence number updated successfully to ${newSequenceNumber}`,
            data: updatedAgent,
          });
        } catch (swapError) {
          return res.status(400).json({
            success: false,
            error: `Failed to update sequence number: ${swapError.message}`,
          });
        }
      } else {
        // Remove sequenceNumber from requestFields since it's not changing
        delete requestFields.sequenceNumber;
      }
    }

    // Build update object for other fields
    const buildUpdateObject = (fields, file, currentAgent) => {
      const updateObj = {};

      const allowedFields = [
        "agentName",
        "designation",
        "reraNumber",
        "specialistAreas",
        "description",
        "email",
        "phone",
        "whatsapp",
        "activeSaleListings",
        "propertiesSoldLast15Days",
        "agentLanguage",
        "isActive",
        "superAgent", // Add this line
      ];

      allowedFields.forEach((field) => {
        if (fields[field] !== undefined && fields[field] !== "") {
          // Special handling for email - only update if different
          if (field === "email") {
            if (fields[field] !== currentAgent.email) {
              updateObj[field] = fields[field];
            }
            return;
          }

          // Handle other special cases
          switch (field) {
            case "specialistAreas":
              if (typeof fields[field] === "string") {
                try {
                  updateObj[field] = JSON.parse(fields[field]);
                } catch (e) {
                  updateObj[field] = fields[field];
                }
              } else {
                updateObj[field] = fields[field];
              }
              break;

            case "activeSaleListings":
            case "propertiesSoldLast15Days":
              updateObj[field] = parseInt(fields[field]) || 0;
              break;

            case "isActive":
              updateObj[field] =
                fields[field] === "true" || fields[field] === true;
              break;
            case "superAgent":
              updateObj[field] =
                fields[field] === "true" || fields[field] === true;
              break;

            default:
              updateObj[field] = fields[field];
          }
        }
      });

      if (file) {
        updateObj.imageUrl = `/uploads/agents/${file.filename}`;
      }

      updateObj.lastUpdated = new Date();
      return updateObj;
    };

    // Build update object with current agent data (excluding sequenceNumber)
    const updateFields = buildUpdateObject(
      requestFields,
      req.file,
      existingAgent
    );

    // If no fields to update, return current agent
    if (Object.keys(updateFields).length <= 1) {
      // Only lastUpdated
      return res.status(200).json({
        success: true,
        message: "No changes detected",
        data: existingAgent,
      });
    }

    console.log("Fields to update:", updateFields);

    // Check if email is being updated and if it already exists
    if (updateFields.email) {
      const emailExists = await Agent.findOne({
        email: updateFields.email,
        agentId: { $ne: agentId }, // Exclude current agent
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: `Email "${updateFields.email}" is already in use by another agent`,
        });
      }
    }

    // Update agent
    const updatedAgent = await Agent.findOneAndUpdate(
      { agentId },
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: `Agent updated successfully. Updated fields: ${Object.keys(
        updateFields
      )
        .filter((f) => f !== "lastUpdated")
        .join(", ")}`,
      data: updatedAgent,
    });
  } catch (err) {
    console.error("Update agent error:", err);

    // Handle duplicate key errors specifically
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      return res.status(400).json({
        success: false,
        error: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } "${value}" already exists`,
      });
    }

    res.status(400).json({ success: false, error: err.message });
  }
};

// NEW: Update only sequence number with swapping
// const updateAgentSequence = async (req, res) => {
//   try {
//     const { agentId, sequenceNumber } = req.body;

//     if (!agentId) {
//       return res.status(400).json({ success: false, error: 'Agent ID is required' });
//     }

//     if (!sequenceNumber || isNaN(parseInt(sequenceNumber)) || parseInt(sequenceNumber) < 1) {
//       return res.status(400).json({
//         success: false,
//         error: 'Valid sequence number is required (must be a positive integer)'
//       });
//     }

//     const newSequenceNumber = parseInt(sequenceNumber);

//     // Find the current agent
//     const existingAgent = await Agent.findOne({ agentId });
//     if (!existingAgent) {
//       return res.status(404).json({ success: false, error: 'Agent not found' });
//     }

//     // Check if sequence number is actually changing
//     if (existingAgent.sequenceNumber === newSequenceNumber) {
//       return res.status(200).json({
//         success: true,
//         message: 'Sequence number is already set to this value',
//         data: existingAgent
//       });
//     }

//     try {
//       await Agent.swapSequenceNumbers(agentId, newSequenceNumber);

//       // Fetch the updated agent to return
//       const updatedAgent = await Agent.findOne({ agentId });

//       res.status(200).json({
//         success: true,
//         message: `Agent sequence number updated successfully to ${newSequenceNumber}`,
//         data: updatedAgent
//       });
//     } catch (swapError) {
//       res.status(400).json({
//         success: false,
//         error: `Failed to update sequence number: ${swapError.message}`
//       });
//     }

//   } catch (err) {
//     console.error('Update agent sequence error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// NEW: Reorder all agent sequences
// const reorderAgentSequences = async (req, res) => {
//   try {
//     await Agent.reorderSequences();

//     // Fetch all agents to return updated list
//     const agents = await Agent.find({ isActive: true })
//       .sort({ sequenceNumber: 1, agentName: 1 });

//     res.status(200).json({
//       success: true,
//       message: 'Agent sequences reordered successfully',
//       data: agents
//     });
//   } catch (err) {
//     console.error('Reorder sequences error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// NEW: Get agents sorted by sequence number
const getAgentsBySequence = async (req, res) => {
  try {
    const { activeOnly = true } = req.query;

    const query = activeOnly === "true" ? { isActive: true } : {};
    const agents = await Agent.find(query).sort({
      sequenceNumber: 1,
      agentName: 1,
    });

    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete an agent by agentId
const deleteAgent = async (req, res) => {
  try {
    const agent = await Agent.findOneAndDelete({ agentId: req.query.agentId });

    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    // optionally remove the image file
    if (agent.imageUrl) {
      const filePath = path.join(__dirname, "../public", agent.imageUrl);
      fs.unlink(filePath, () => {});
    }

    // After deleting an agent, you might want to reorder sequences
    // Uncomment the line below if you want automatic reordering after deletion
    // await Agent.reorderSequences();

    res.status(200).json({ success: true, msg: "Agent Removed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  getAgentsBySequence, // NEW: Get agents sorted by sequence
  deleteAgent,
};
