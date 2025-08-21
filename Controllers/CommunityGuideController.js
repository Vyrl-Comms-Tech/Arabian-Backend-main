const CommunityGuide = require('../models/CommunityGuideModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { validationResult } = require('express-validator');

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = 'uploads/community-guides/';
    // Create directory if it doesn't exist
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

// Get all community guides (Admin)
const GetAllCommunityGuides = async (req, res) => {
  try {
    console.log("Fetching all community guides for cards display...");

    const guides = await CommunityGuide.find({})
    //   .select('title heading image createdAt _id faqCount') // Include faqCount virtual
    //   .sort({ createdAt: -1 });

    // console.log(`Found ${guides.length} community guides`);

    res.status(200).json({
      success: true,
      message: "All community guides fetched successfully",
      totalGuides: guides.length,
      data: guides
    });
  } catch (error) {
    console.error("Error fetching all community guides:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all community guides',
      error: error.message
    });
  }
};

// Get single community guide
const getSingleCommunityGuide = async (req, res) => {
  try {
    const guideId = req.query.id;
    
    console.log("Community Guide ID:", guideId);
    
    if (!guideId) {
      return res.status(400).json({
        success: false,
        message: "Community Guide ID is required"
      });
    }

    const guide = await CommunityGuide.findById(guideId);
    
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Community Guide not found'
      });
    }

    res.status(200).json({
      success: true,
      message: "Community Guide fetched successfully",
      data: guide
    });
  } catch (error) {
    console.error("Error fetching community guide:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community guide',
      error: error.message
    });
  }
};

// Create new community guide
const createCommunityGuide = async (req, res) => {
  try {
    // console.log("=== CREATE COMMUNITY GUIDE DEBUG ===");
    // console.log("req.body:", req.body);
    // console.log("req.file:", req.file);
    // console.log("====================================");

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is undefined - multer middleware not working'
      });
    }

    const { 
      title, 
      heading, 
      desc1, 
      desc2, 
      desc3, 
      author, 
      tags,
      faq1Question,
      faq1Answer,
      faq2Question,
      faq2Answer,
      faq3Question,
      faq3Answer
    } = req.body;

    console.log("Extracted data:", { 
      title, heading, desc1, desc2, desc3, author, tags,
      faq1Question, faq1Answer, faq2Question, faq2Answer, faq3Question, faq3Answer
    });

    // Validate required fields
    if (!title || !heading || !desc1) {
      return res.status(400).json({
        success: false,
        message: 'Title, heading, and desc1 are required',
        received: { title, heading, desc1 }
      });
    }

    // Validate author (required according to schema)
    if (!author || !author.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Author name is required',
        received: { author }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // Validate FAQ pairs
    const faqErrors = [];
    if ((faq1Question && !faq1Answer) || (!faq1Question && faq1Answer)) {
      faqErrors.push('FAQ1 must have both question and answer');
    }
    if ((faq2Question && !faq2Answer) || (!faq2Question && faq2Answer)) {
      faqErrors.push('FAQ2 must have both question and answer');
    }
    if ((faq3Question && !faq3Answer) || (!faq3Question && faq3Answer)) {
      faqErrors.push('FAQ3 must have both question and answer');
    }

    if (faqErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ validation failed',
        errors: faqErrors
      });
    }

    const guideData = {
      title: title.trim(),
      heading: heading.trim(),
      desc1: desc1.trim(),
      desc2: desc2 ? desc2.trim() : null,
      desc3: desc3 ? desc3.trim() : null,
      author: author.trim(),
      image: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      // FAQ fields
      faq1Question: faq1Question ? faq1Question.trim() : null,
      faq1Answer: faq1Answer ? faq1Answer.trim() : null,
      faq2Question: faq2Question ? faq2Question.trim() : null,
      faq2Answer: faq2Answer ? faq2Answer.trim() : null,
      faq3Question: faq3Question ? faq3Question.trim() : null,
      faq3Answer: faq3Answer ? faq3Answer.trim() : null
    };

    // Handle tags if provided
    if (tags) {
      if (Array.isArray(tags)) {
        guideData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      } else if (typeof tags === 'string') {
        guideData.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }
    }

    const guide = new CommunityGuide(guideData);
    await guide.save();

    res.status(201).json({
      success: true,
      message: 'Community Guide created successfully',
      data: guide
    });
  } catch (error) {
    console.error("Error creating community guide:", error.message);
    
    // Delete uploaded file if guide creation fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create community guide',
      error: error.message
    });
  }
};

// Update community guide
const updateCommunityGuide = async (req, res) => {
  try {
    // console.log("=== UPDATE COMMUNITY GUIDE DEBUG ===");
    // console.log("req.body:", req.body);
    // console.log("req.file:", req.file);
    // console.log("====================================");

    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is undefined - multer middleware not working'
      });
    }

    const { 
      guideId, 
      title, 
      heading, 
      desc1, 
      desc2, 
      desc3, 
      author, 
      tags,
      faq1Question,
      faq1Answer,
      faq2Question,
      faq2Answer,
      faq3Question,
      faq3Answer
    } = req.body;

    console.log("Extracted data:", { 
      guideId, title, heading, desc1, desc2, desc3, author, tags,
      faq1Question, faq1Answer, faq2Question, faq2Answer, faq3Question, faq3Answer
    });

    // Validate required fields
    if (!guideId) {
      return res.status(400).json({
        success: false,
        message: "Community Guide ID is required"
      });
    }

    // Find the guide to update
    const guide = await CommunityGuide.findById(guideId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Community Guide not found'
      });
    }

    // Validate FAQ pairs before updating
    const faqErrors = [];
    if ((faq1Question && !faq1Answer) || (!faq1Question && faq1Answer)) {
      faqErrors.push('FAQ1 must have both question and answer');
    }
    if ((faq2Question && !faq2Answer) || (!faq2Question && faq2Answer)) {
      faqErrors.push('FAQ2 must have both question and answer');
    }
    if ((faq3Question && !faq3Answer) || (!faq3Question && faq3Answer)) {
      faqErrors.push('FAQ3 must have both question and answer');
    }

    if (faqErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ validation failed',
        errors: faqErrors
      });
    }

    // Update fields only if provided, keep existing values if not provided
    if (title !== undefined && title.trim()) {
      guide.title = title.trim();
      
      // Update slug when title changes
      const generateSlug = (title) => {
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-');
        
        return baseSlug + '-' + Date.now();
      };
      
      guide.slug = generateSlug(title);
    }
    
    if (heading !== undefined && heading.trim()) {
      guide.heading = heading.trim();
    }
    
    if (desc1 !== undefined && desc1.trim()) {
      if (desc1.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'First description must be at least 10 characters'
        });
      }
      guide.desc1 = desc1.trim();
    }
    
    if (desc2 !== undefined) {
      guide.desc2 = desc2 && desc2.trim() ? desc2.trim() : null;
    }
    
    if (desc3 !== undefined) {
      guide.desc3 = desc3 && desc3.trim() ? desc3.trim() : null;
    }
    
    // Only update author if provided
    if (author !== undefined && author.trim()) {
      guide.author = author.trim();
    }

    // Update FAQ fields
    if (faq1Question !== undefined) {
      guide.faq1Question = faq1Question && faq1Question.trim() ? faq1Question.trim() : null;
    }
    if (faq1Answer !== undefined) {
      guide.faq1Answer = faq1Answer && faq1Answer.trim() ? faq1Answer.trim() : null;
    }
    if (faq2Question !== undefined) {
      guide.faq2Question = faq2Question && faq2Question.trim() ? faq2Question.trim() : null;
    }
    if (faq2Answer !== undefined) {
      guide.faq2Answer = faq2Answer && faq2Answer.trim() ? faq2Answer.trim() : null;
    }
    if (faq3Question !== undefined) {
      guide.faq3Question = faq3Question && faq3Question.trim() ? faq3Question.trim() : null;
    }
    if (faq3Answer !== undefined) {
      guide.faq3Answer = faq3Answer && faq3Answer.trim() ? faq3Answer.trim() : null;
    }

    // Handle tags update
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        guide.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      } else if (typeof tags === 'string') {
        guide.tags = tags.split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0);
      } else {
        guide.tags = [];
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image
      if (guide.image && guide.image.path) {
        await fs.unlink(guide.image.path).catch((err) => {
          console.log("Could not delete old image:", err.message);
        });
      }

      // Update with new image
      guide.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    // Save the updated guide
    await guide.save();

    res.status(200).json({
      success: true,
      message: 'Community Guide updated successfully',
      data: guide
    });

  } catch (error) {
    console.error("Error updating community guide:", error.message);
    
    // Delete uploaded file if guide update fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update community guide',
      error: error.message
    });
  }
};

// Delete community guide
const deleteCommunityGuide = async (req, res) => {
  try {
    const guideId = req.query.id || req.body.id;
    
    console.log("Community Guide ID for deletion:", guideId);

    if (!guideId) {
      return res.status(400).json({
        success: false,
        message: "Community Guide ID is required"
      });
    }

    const guide = await CommunityGuide.findById(guideId);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Community Guide not found'
      });
    }

    // Delete associated image
    if (guide.image && guide.image.path) {
      await fs.unlink(guide.image.path).catch(() => {});
    }

    await CommunityGuide.findByIdAndDelete(guideId);

    res.status(200).json({
      success: true,
      message: 'Community Guide deleted successfully'
    });
  } catch (error) {
    console.error("Error deleting community guide:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete community guide',
      error: error.message
    });
  }
};

// Get published community guides (Public endpoint)
// const getPublishedCommunityGuides = async (req, res) => {
//   try {
//     console.log("Fetching published community guides...");

//     const guides = await CommunityGuide.findPublished()
//       .select('title heading image publishedAt _id slug faqCount')
//       .limit(20); // Limit for performance

//     console.log(`Found ${guides.length} published community guides`);

//     res.status(200).json({
//       success: true,
//       message: "Published community guides fetched successfully",
//       totalGuides: guides.length,
//       data: guides
//     });
//   } catch (error) {
//     console.error("Error fetching published community guides:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch published community guides',
//       error: error.message
//     });
//   }
// };

// Search community guides
// const searchCommunityGuides = async (req, res) => {
//   try {
//     const { q: searchTerm } = req.query;
    
//     if (!searchTerm || searchTerm.trim().length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'Search term must be at least 2 characters long'
//       });
//     }

//     console.log("Searching community guides for:", searchTerm);

//     const guides = await CommunityGuide.search(searchTerm.trim())
//       .select('title heading image createdAt _id slug faqCount')
//       .limit(50);

//     res.status(200).json({
//       success: true,
//       message: `Found ${guides.length} community guides matching "${searchTerm}"`,
//       searchTerm: searchTerm.trim(),
//       totalResults: guides.length,
//       data: guides
//     });
//   } catch (error) {
//     console.error("Error searching community guides:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to search community guides',
//       error: error.message
//     });
//   }
// };

// Get community guides by tag
// const getCommunityGuidesByTag = async (req, res) => {
//   try {
//     const { tag } = req.params;
    
//     if (!tag || tag.trim().length < 1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Tag is required'
//       });
//     }

//     console.log("Fetching community guides by tag:", tag);

//     const guides = await CommunityGuide.findByTag(tag.trim())
//       .select('title heading image createdAt _id slug faqCount')
//       .limit(50);

//     res.status(200).json({
//       success: true,
//       message: `Found ${guides.length} community guides with tag "${tag}"`,
//       tag: tag.trim(),
//       totalResults: guides.length,
//       data: guides
//     });
//   } catch (error) {
//     console.error("Error fetching community guides by tag:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch community guides by tag',
//       error: error.message
//     });
//   }
// };

// Export all functions and upload middleware
module.exports = {
  GetAllCommunityGuides,
  getSingleCommunityGuide,
  createCommunityGuide,
  updateCommunityGuide,
  deleteCommunityGuide,
  // getPublishedCommunityGuides,
  // searchCommunityGuides,
  // getCommunityGuidesByTag,
  upload
};