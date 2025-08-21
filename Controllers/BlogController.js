// const Blog = require('../models/BlogsModel');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const { validationResult } = require('express-validator');

// // Multer configuration for image upload
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     const uploadPath = 'uploads/blogs/';
//     // Create directory if it doesn't exist
//     require('fs').mkdirSync(uploadPath, { recursive: true });
//     cb(null, uploadPath);
//   },
//   filename: function(req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|gif|webp/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
//   fileFilter: fileFilter
// });

// // Get all blogs (Admin)
// const GetAllBlogs = async (req, res) => {
//   try {
//     console.log("Fetching all blogs for cards display...");

//     const blogs = await Blog.find({})
//       // .select('title heading image createdAt _id') // Only select needed fields
//       // .sort({ createdAt: -1 });

//     console.log(`Found ${blogs.length} blogs`);

//     res.status(200).json({
//       success: true,
//       message: "All blogs fetched successfully",
//       totalBlogs: blogs.length,
//       data: blogs
//     });
//   } catch (error) {
//     console.error("Error fetching all blogs:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch all blogs',
//       error: error.message
//     })};
// };

// // Get single blog
// const getSingleBlog = async (req, res) => {
//   try {
//     const blogId = req.query.id;

//     console.log("Blog ID:", blogId);

//     if (!blogId) {
//       return res.status(400).json({
//         success: false,
//         message: "Blog ID is required"
//       });
//     }

//     const blog = await Blog.findById(blogId);

//     if (!blog) {
//       return res.status(404).json({
//         success: false,
//         message: 'Blog not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Blog fetched successfully",
//       data: blog
//     });
//   } catch (error) {
//     console.error("Error fetching blog:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch blog',
//       error: error.message
//     });
//   }
// };

// // Create new blog
// const createBlog = async (req, res) => {
//   try {
//     // console.log("=== CREATE BLOG DEBUG ===");
//     // console.log("req.body:", req.body);
//     // console.log("req.file:", req.file);
//     // console.log("========================");

//     if (!req.body) {
//       return res.status(400).json({
//         success: false,
//         message: 'Request body is undefined - multer middleware not working'
//       });
//     }

//     const { title, heading, desc1, desc2, desc3, author, tags } = req.body;

//     console.log("Extracted data:", { title, heading, desc1, desc2, desc3, author, tags });

//     // Validate required fields
//     if (!title || !heading || !desc1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title, heading, and desc1 are required',
//         received: { title, heading, desc1 }
//       });
//     }

//     // Validate author (required according to schema)
//     if (!author || !author.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Author name is required',
//         received: { author }
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Image is required'
//       });
//     }

//     const blogData = {
//       title: title.trim(),
//       heading: heading.trim(),
//       desc1: desc1.trim(),
//       desc2: desc2 ? desc2.trim() : null,
//       desc3: desc3 ? desc3.trim() : null,
//       author: author.trim(),
//       image: {
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//         path: req.file.path
//       }
//     };

//     // Handle tags if provided
//     if (tags) {
//       if (Array.isArray(tags)) {
//         blogData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
//       } else if (typeof tags === 'string') {
//         blogData.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
//       }
//     }

//     const blog = new Blog(blogData);
//     await blog.save();

//     res.status(201).json({
//       success: true,
//       message: 'Blog created successfully',
//       data: blog
//     });
//   } catch (error) {
//     console.error("Error creating blog:", error.message);

//     // Delete uploaded file if blog creation fails
//     if (req.file) {
//       await fs.unlink(req.file.path).catch(() => {});
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Failed to create blog',
//       error: error.message
//     });
//   }
// };

// // Update blog
// // const updateBlog = async (req, res) => {
// //   try {
// //     const errors = validationResult(req);
// //     if (!errors.isEmpty()) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Validation errors',
// //         errors: errors.array()
// //       });
// //     }
// //     console.log(req.body)
// //     const {blogId} = req.body
// //     const { title, heading, desc1, desc2, desc3, tags } = req.body;

// //     console.log("Blog update data:", { blogId, title, heading, desc1, desc2, desc3, tags });

// //     if (!blogId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Blog ID is required"
// //       });
// //     }

// //     const blog = await Blog.findById(blogId);
// //     if (!blog) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Blog not found'
// //       });
// //     }

// //     // Update fields
// //     blog.title = title;
// //     blog.heading = heading;
// //     blog.desc1 = desc1;
// //     blog.desc2 = desc2 || null;
// //     blog.desc3 = desc3 || null;
// //     // blog.isActive = isActive === 'true' || isActive === true;

// //     if (tags) {
// //       blog.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
// //     }

// //     // Handle image update
// //     if (req.file) {
// //       // Delete old image
// //       if (blog.image && blog.image.path) {
// //         await fs.unlink(blog.image.path).catch(() => {});
// //       }

// //       blog.image = {
// //         filename: req.file.filename,
// //         originalName: req.file.originalname,
// //         mimetype: req.file.mimetype,
// //         size: req.file.size,
// //         path: req.file.path
// //       };
// //     }

// //     await blog.save();

// //     res.status(200).json({
// //       success: true,
// //       message: 'Blog updated successfully',
// //       data: blog
// //     });
// //   } catch (error) {
// //     console.error("Error updating blog:", error.message);

// //     if (req.file) {
// //       await fs.unlink(req.file.path).catch(() => {});
// //     }

// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to update blog',
// //       error: error.message
// //     });
// //   }
// // };
// const updateBlog = async (req, res) => {
//   try {
//     console.log("=== UPDATE BLOG DEBUG ===");
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);
//     console.log("========================");

//     // Check if req.body exists (same as createBlog)
//     if (!req.body) {
//       return res.status(400).json({
//         success: false,
//         message: 'Request body is undefined - multer middleware not working'
//       });
//     }

//     const { blogId, title, heading, desc1, desc2, desc3, author, tags } = req.body;

//     console.log("Extracted data:", { blogId, title, heading, desc1, desc2, desc3, author, tags });

//     // Validate required fields
//     if (!blogId) {
//       return res.status(400).json({
//         success: false,
//         message: "Blog ID is required"
//       });
//     }

//     // Find the blog to update
//     const blog = await Blog.findById(blogId);
//     if (!blog) {
//       return res.status(404).json({
//         success: false,
//         message: 'Blog not found'
//       });
//     }

//     // Update fields only if provided, keep existing values if not provided
//     if (title !== undefined && title.trim()) {
//       blog.title = title.trim();

//       // Update slug when title changes (same logic as createBlog)
//       const generateSlug = (title) => {
//         const baseSlug = title
//           .toLowerCase()
//           .replace(/[^a-zA-Z0-9 ]/g, '')
//           .replace(/\s+/g, '-')
//           .replace(/-+/g, '-')
//           .trim('-');

//         return baseSlug + '-' + Date.now();
//       };

//       blog.slug = generateSlug(title);
//     }

//     if (heading !== undefined && heading.trim()) {
//       blog.heading = heading.trim();
//     }

//     if (desc1 !== undefined && desc1.trim()) {
//       if (desc1.trim().length < 10) {
//         return res.status(400).json({
//           success: false,
//           message: 'First description must be at least 10 characters'
//         });
//       }
//       blog.desc1 = desc1.trim();
//     }

//     if (desc2 !== undefined) {
//       blog.desc2 = desc2 && desc2.trim() ? desc2.trim() : null;
//     }

//     if (desc3 !== undefined) {
//       blog.desc3 = desc3 && desc3.trim() ? desc3.trim() : null;
//     }

//     // Only update author if provided
//     if (author !== undefined && author.trim()) {
//       blog.author = author.trim();
//     }

//     // Handle tags update
//     if (tags !== undefined) {
//       if (Array.isArray(tags)) {
//         blog.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
//       } else if (typeof tags === 'string') {
//         blog.tags = tags.split(',')
//           .map(tag => tag.trim().toLowerCase())
//           .filter(tag => tag.length > 0);
//       } else {
//         blog.tags = [];
//       }
//     }

//     // Handle image update
//     if (req.file) {
//       // Delete old image
//       if (blog.image && blog.image.path) {
//         await fs.unlink(blog.image.path).catch((err) => {
//           console.log("Could not delete old image:", err.message);
//         });
//       }

//       // Update with new image
//       blog.image = {
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//         path: req.file.path
//       };
//     }

//     // Save the updated blog
//     await blog.save();

//     res.status(200).json({
//       success: true,
//       message: 'Blog updated successfully',
//       data: blog
//     });

//   } catch (error) {
//     console.error("Error updating blog:", error.message);

//     // Delete uploaded file if blog update fails
//     if (req.file) {
//       await fs.unlink(req.file.path).catch(() => {});
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Failed to update blog',
//       error: error.message
//     });
//   }
// };

// // Delete blog
// const deleteBlog = async (req, res) => {
//   try {
//     const blogId = req.query.id || req.body.id;

//     console.log("Blog ID for deletion:", blogId);

//     if (!blogId) {
//       return res.status(400).json({
//         success: false,
//         message: "Blog ID is required"
//       });
//     }

//     const blog = await Blog.findById(blogId);

//     if (!blog) {
//       return res.status(404).json({
//         success: false,
//         message: 'Blog not found'
//       });
//     }

//     // Delete associated image
//     if (blog.image && blog.image.path) {
//       await fs.unlink(blog.image.path).catch(() => {});
//     }

//     await Blog.findByIdAndDelete(blogId);

//     res.status(200).json({
//       success: true,
//       message: 'Blog deleted successfully'
//     });
//   } catch (error) {
//     console.error("Error deleting blog:", error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete blog',
//       error: error.message
//     });
//   }
// };

// // Export all functions and upload middleware
// module.exports = {
//   GetAllBlogs,
//   getSingleBlog,
//   createBlog,
//   deleteBlog,
//   updateBlog
// };

const Blog = require("../Models/BlogsModel");
const Agent = require("../Models/AgentModel"); // Add Agent model
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
// const { validationResult } = require('express-validator');

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/Blogs/";
    require("fs").mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter,
});

// Get all blogs (Admin)
const GetAllBlogs = async (req, res) => {
  try {
    console.log("Fetching all blogs for cards display...");

    const blogs = await Blog.find({})
      .populate("author.agentId", "agentName email imageUrl designation") // Populate agent details
      .sort({ createdAt: -1 });

    console.log(`Found ${blogs.length} blogs`);

    res.status(200).json({
      success: true,
      message: "All blogs fetched successfully",
      totalBlogs: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Error fetching all blogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all blogs",
      error: error.message,
    });
  }
};

// Get single blog
const getSingleBlog = async (req, res) => {
  try {
    const blogId = req.query.id;

    console.log("Blog ID:", blogId);

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    const blog = await Blog.findById(blogId).populate(
      "author.agentId",
      "agentName email imageUrl designation specialistAreas phone whatsapp description"
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    });
  }
};

// ——— UPDATED: Create new blog with agent linking ———

const createBlog = async (req, res) => {
  try {
    console.log("=== BLOG CREATION DEBUG START ===");
    console.log("Raw req.body:", req.body);
    console.log("req.file exists:", !!req.file);
    
    const { title, heading, desc1, desc2, desc3, agentId, tags } = req.body;
    console.log("Extracted data:", { title, heading, desc1, desc2, desc3, agentId, tags });
    
    // Validate required fields
    if (!title || !heading || !desc1) {
      return res.status(400).json({
        success: false,
        message: 'Title, heading, and desc1 are required',
        received: { title, heading, desc1 }
      });
    }

    // Validate agent (required)
    if (!agentId || !agentId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required',
        received: { agentId }
      });
    }

    // STEP 1: Find the agent using CUSTOM agentId field (like AGENT_4A88440C)
    console.log("=== SEARCHING FOR AGENT ===");
    console.log(`Searching for agent with custom agentId: "${agentId}"`);
    
    const agent = await Agent.findOne({ agentId: agentId.trim() });
    
    if (!agent) {
      console.log("❌ AGENT NOT FOUND");
      
      // Get some sample agents for debugging
      const sampleAgents = await Agent.find({ isActive: true }, 'agentId agentName').limit(5);
      
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
        searchedFor: agentId,
        debug: {
          agentIdType: typeof agentId,
          agentIdValue: agentId,
          trimmedValue: agentId.trim(),
          hint: 'Check if the agentId exactly matches one in the database'
        },
        availableAgents: sampleAgents.map(a => ({
          agentId: a.agentId,
          agentName: a.agentName
        }))
      });
    }

    console.log("✅ AGENT FOUND:");
    console.log(`  - MongoDB _id: ${agent._id}`);
    console.log(`  - Custom agentId: ${agent.agentId}`);
    console.log(`  - agentName: ${agent.agentName}`);
    console.log(`  - isActive: ${agent.isActive}`);
    console.log(`  - Current blogs count: ${agent.blogs ? agent.blogs.length : 0}`);

    if (!agent.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Agent is not active',
        agentId: agentId
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    // STEP 2: Create blog data
    console.log("=== CREATING BLOG DATA ===");
    const blogData = {
      title: title.trim(),
      heading: heading.trim(),
      desc1: desc1.trim(),
      desc2: desc2 ? desc2.trim() : null,
      desc3: desc3 ? desc3.trim() : null,
      author: {
        agentId: agent._id,  // ✅ IMPORTANT: Use MongoDB ObjectId for blog's author reference
        agentName: agent.agentName,
        agentEmail: agent.email
      },
      image: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      isPublished: false // Default to draft
    };

    // Handle tags if provided
    if (tags) {
      if (Array.isArray(tags)) {
        blogData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      } else if (typeof tags === 'string') {
        let tagString = tags;
        if (tagString.startsWith('[') && tagString.endsWith(']')) {
          tagString = tagString.slice(1, -1);
        }
        blogData.tags = tagString.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
      }
    }

    console.log("Blog data structure:");
    console.log("  - title:", blogData.title);
    console.log("  - author.agentId (ObjectId):", blogData.author.agentId);
    console.log("  - author.agentName:", blogData.author.agentName);
    console.log("  - image filename:", blogData.image.filename);
    console.log("  - tags:", blogData.tags);

    // STEP 3: Save the blog
    console.log("=== SAVING BLOG ===");
    const blog = new Blog(blogData);
    await blog.save();
    console.log("✅ Blog saved successfully with ID:", blog._id);

    // STEP 4: Add blog to agent's blogs array with complete image data
    console.log("=== UPDATING AGENT WITH BLOG ===");
    console.log(`Updating agent with custom agentId: ${agent.agentId} (MongoDB _id: ${agent._id})`);
    
    try {
      const blogForAgent = {
        blogId: blog._id,
        title: blog.title,
        slug: blog.slug || blog.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''),
        image: {
          filename: blog.image.filename,
          originalName: blog.image.originalName,
          mimetype: blog.image.mimetype,
          size: blog.image.size,
          path: blog.image.path
        },
        isPublished: blog.isPublished,
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt
      };

      console.log("=== DETAILED DEBUGGING ===");
      console.log("Agent before update:");
      console.log("  - Custom agentId:", agent.agentId);
      console.log("  - MongoDB _id:", agent._id.toString());
      console.log("  - Agent name:", agent.agentName);
      console.log("  - Current blogs (direct check):", agent.blogs);
      console.log("  - Current blogs count:", agent.blogs ? agent.blogs.length : 0);
      console.log("  - Is blogs array:", Array.isArray(agent.blogs));
      
      console.log("Blog data being added:");
      console.log("  - blogId:", blogForAgent.blogId.toString());
      console.log("  - title:", blogForAgent.title);
      console.log("  - image:", blogForAgent.image);
      console.log("  - Complete blogForAgent:", JSON.stringify(blogForAgent, null, 2));

      // ✅ ENHANCED: Check if the method exists
      if (typeof agent.addOrUpdateBlog !== 'function') {
        console.error("❌ ERROR: addOrUpdateBlog method not found on agent");
        throw new Error("addOrUpdateBlog method not available");
      }

      console.log("✅ addOrUpdateBlog method exists, calling it...");
      
      // Use the method to add blog to agent
      const resultAgent = agent.addOrUpdateBlog(blogForAgent);
      
      console.log("Method returned:", !!resultAgent);
      console.log("Blogs after method call:", agent.blogs ? agent.blogs.length : 0);
      console.log("Last blog in array:", agent.blogs && agent.blogs.length > 0 ? agent.blogs[agent.blogs.length - 1] : 'No blogs');
      
      // ✅ CRITICAL: Ensure validation passes
      console.log("=== SAVING AGENT ===");
      console.log("Agent validation errors before save:", agent.validateSync());
      
      const savedAgent = await agent.save();
      
      console.log("✅ Agent saved successfully");
      console.log("Agent after save:");
      console.log("  - Custom agentId:", savedAgent.agentId);
      console.log("  - Total blogs:", savedAgent.blogs ? savedAgent.blogs.length : 0);
      console.log("  - Published blogs virtual:", savedAgent.publishedBlogs);
      
      // ✅ VERIFICATION: Log the complete blog data in agent
      if (savedAgent.blogs && savedAgent.blogs.length > 0) {
        console.log("=== COMPLETE AGENT BLOGS VERIFICATION ===");
        savedAgent.blogs.forEach((agentBlog, index) => {
          console.log(`Blog ${index + 1} (Complete Data):`, {
            blogId: agentBlog.blogId ? agentBlog.blogId.toString() : 'MISSING',
            title: agentBlog.title || 'MISSING',
            slug: agentBlog.slug || 'MISSING',
            hasImage: !!agentBlog.image,
            imageComplete: agentBlog.image || 'MISSING',
            isPublished: agentBlog.isPublished,
            createdAt: agentBlog.createdAt,
            updatedAt: agentBlog.updatedAt
          });
        });
      } else {
        console.log("❌ NO BLOGS FOUND AFTER SAVE!");
      }
      
      // ✅ TRIPLE CHECK: Re-query the agent from database
      console.log("=== TRIPLE CHECK - RE-QUERY FROM DATABASE ===");
      const freshAgent = await Agent.findOne({ agentId: agent.agentId });
      
      if (!freshAgent) {
        console.log("❌ ERROR: Could not re-query agent from database");
      } else {
        console.log("Fresh agent from database:");
        console.log("  - Custom agentId:", freshAgent.agentId);
        console.log("  - Blogs count:", freshAgent.blogs ? freshAgent.blogs.length : 0);
        console.log("  - Raw blogs array:", freshAgent.blogs);
        
        if (freshAgent.blogs && freshAgent.blogs.length > 0) {
          console.log("✅ SUCCESS: Blogs found in database!");
          freshAgent.blogs.forEach((blog, i) => {
            console.log(`  DB Blog ${i + 1}:`, {
              blogId: blog.blogId ? blog.blogId.toString() : 'MISSING',
              title: blog.title,
              hasImage: !!blog.image,
              imageFilename: blog.image?.filename
            });
          });
        } else {
          console.log("❌ FAILURE: No blogs found in database after save");
          
          // Additional debugging: Check if there are any validation errors
          console.log("=== ADDITIONAL DEBUGGING ===");
          console.log("Agent schema paths:", Object.keys(Agent.schema.paths));
          console.log("Blogs schema path exists:", !!Agent.schema.paths.blogs);
          console.log("Agent document paths:", Object.keys(freshAgent.toObject()));
        }
      }
      
    } catch (agentError) {
      console.error("❌ CRITICAL ERROR in agent update:");
      console.error("Error message:", agentError.message);
      console.error("Error stack:", agentError.stack);
      console.error("Error details:", agentError);
      
      // Try to understand what went wrong
      console.log("=== ERROR ANALYSIS ===");
      console.log("Agent object type:", typeof agent);
      console.log("Agent constructor:", agent.constructor.name);
      console.log("Agent methods available:", Object.getOwnPropertyNames(Object.getPrototypeOf(agent)));
      
      throw agentError; // Re-throw to see full error
    }

    console.log("=== BLOG CREATION SUCCESS ===");
    console.log(`✅ Blog "${blog.title}" created and linked to agent ${agent.agentName} (${agent.agentId})`);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully and linked to agent',
      data: {
        blog: blog,
        linkedAgent: {
          agentId: agent.agentId, // ✅ Return the custom agentId format
          agentName: agent.agentName,
          email: agent.email,
          totalBlogs: agent.totalBlogs,
          publishedBlogs: agent.publishedBlogs,
          // ✅ Include the blog that was just added
          latestBlog: {
            blogId: blog._id,
            title: blog.title,
            slug: blog.slug,
            image: blog.image,
            isPublished: blog.isPublished
          }
        }
      }
    });

  } catch (error) {
    console.error("=== BLOG CREATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Delete uploaded file if blog creation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        console.log("Cleaned up uploaded file");
      } catch (unlinkError) {
        console.log("Could not delete uploaded file:", unlinkError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};
// ——— UPDATED: Create new blog with agent linking ———
// const createBlog = async (req, res) => {
//   try {
//     console.log("=== CREATE BLOG DEBUG ===");
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);
//     console.log("========================");

//     if (!req.body) {
//       return res.status(400).json({
//         success: false,
//         message: 'Request body is undefined - multer middleware not working'
//       });
//     }

//     const { title, heading, desc1, desc2, desc3, agentId, tags } = req.body;

//     console.log("Extracted data:", { title, heading, desc1, desc2, desc3, agentId, tags });

//     // Validate required fields
//     if (!title || !heading || !desc1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Title, heading, and desc1 are required',
//         received: { title, heading, desc1 }
//       });
//     }

//     // Validate agent (required)
//     if (!agentId || !agentId.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Agent ID is required',
//         received: { agentId }
//       });
//     }

//     // Find the agent - FIXED: Use findOne with agentId field instead of findById
//     const agent = await Agent.findOne({ agentId: agentId });
//     console.log("Agent found:", agent);
//     if (!agent) {
//       return res.status(404).json({
//         success: false,
//         message: 'Agent not found',
//         agentId: agentId
//       });
//     }

//     if (!agent.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: 'Agent is not active',
//         agentId: agentId
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Image is required'
//       });
//     }

//     // Create blog data with agent linking - Use the MongoDB _id for the relationship
//     const blogData = {
//       title: title.trim(),
//       heading: heading.trim(),
//       desc1: desc1.trim(),
//       desc2: desc2 ? desc2.trim() : null,
//       desc3: desc3 ? desc3.trim() : null,
//       author: {
//         agentId: agent._id, // Use the MongoDB _id here
//         agentName: agent.agentName,
//         agentEmail: agent.email
//       },
//       image: {
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         mimetype: req.file.mimetype,
//         size: req.file.size,
//         path: req.file.path
//       },
//       isPublished: false // Default to draft
//     };

//     // Handle tags if provided
//     if (tags) {
//       if (Array.isArray(tags)) {
//         blogData.tags = tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
//       } else if (typeof tags === 'string') {
//         blogData.tags = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
//       }
//     }

//     // Create and save blog
//     const blog = new Blog(blogData);
//     await blog.save();

//     // Add blog to agent's blogs array (if the method exists)
//     try {
//       if (typeof agent.addOrUpdateBlog === 'function') {
//         const blogForAgent = {
//           blogId: blog._id,
//           title: blog.title,
//           slug: blog.slug,
//           isPublished: blog.isPublished,
//           publishedAt: blog.publishedAt
//         };
//         agent.addOrUpdateBlog(blogForAgent);
//         await agent.save();
//       } else {
//         // Fallback: manually push to blogs array if method doesn't exist
//         agent.blogs = agent.blogs || [];
//         agent.blogs.push({
//           blogId: blog._id,
//           title: blog.title,
//           slug: blog.slug || blog.title.toLowerCase().replace(/\s+/g, '-'),
//           isPublished: blog.isPublished,
//           publishedAt: blog.publishedAt
//         });
//         await agent.save();
//       }
//     } catch (agentUpdateError) {
//       console.log("Warning: Could not update agent's blog array:", agentUpdateError.message);
//       // Don't fail the whole operation if agent update fails
//     }

//     console.log(`✅ Blog created and linked to agent ${agent.agentName}`);

//     res.status(201).json({
//       success: true,
//       message: 'Blog created successfully and linked to agent',
//       data: {
//         blog: blog,
//         linkedAgent: {
//           agentId: agent.agentId, // Return the custom agentId
//           agentName: agent.agentName,
//           email: agent.email
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error creating blog:", error.message);

//     // Delete uploaded file if blog creation fails
//     if (req.file) {
//       await fs.unlink(req.file.path).catch(() => {});
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Failed to create blog',
//       error: error.message
//     });
//   }
// };

// const createBlog = async (req, res) => {
//   try {
//     console.log("=== CREATE BLOG DEBUG ===");
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);
//     console.log("========================");
//     return res.status(200).json({
//       success: false,
//       message: 'Request body is undefined - multer middleware not working'
//     });
//   }catch(err){
//     console.log(err)
//   }
// }

// const createBlog = async (req, res) => {
//   try {
//     console.log("=== CREATE BLOG DEBUG ===");
//     console.log("req.body:", req.body);
//     console.log("req.file:", req.file);
//     console.log("========================");

//     if (!req.body) {
//       return res.status(400).json({
//         success: false,
//       })
//     }
//   }catch(error){
//     console.log(error)
//   }
// }

// ——— UPDATED: Update blog with agent linking ———
const updateBlog = async (req, res) => {
  try {
    console.log("=== UPDATE BLOG DEBUG ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("========================");

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is undefined - multer middleware not working",
      });
    }

    const {
      blogId,
      title,
      heading,
      desc1,
      desc2,
      desc3,
      agentId,
      tags,
      isPublished,
    } = req.body;

    console.log("Extracted data:", {
      blogId,
      title,
      heading,
      desc1,
      desc2,
      desc3,
      agentId,
      tags,
      isPublished,
    });

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    // Find the blog to update
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    let oldAgent = null;
    let newAgent = null;

    // Handle agent change
    if (agentId && agentId !== blog.author.agentId.toString()) {
      // Find new agent
      newAgent = await Agent.findById(agentId);
      if (!newAgent) {
        return res.status(404).json({
          success: false,
          message: "New agent not found",
          agentId: agentId,
        });
      }

      if (!newAgent.isActive) {
        return res.status(400).json({
          success: false,
          message: "New agent is not active",
          agentId: agentId,
        });
      }

      // Find old agent to remove blog
      oldAgent = await Agent.findById(blog.author.agentId);
    }

    // Update blog fields
    if (title !== undefined && title.trim()) {
      blog.title = title.trim();
    }

    if (heading !== undefined && heading.trim()) {
      blog.heading = heading.trim();
    }

    if (desc1 !== undefined && desc1.trim()) {
      if (desc1.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "First description must be at least 10 characters",
        });
      }
      blog.desc1 = desc1.trim();
    }

    if (desc2 !== undefined) {
      blog.desc2 = desc2 && desc2.trim() ? desc2.trim() : null;
    }

    if (desc3 !== undefined) {
      blog.desc3 = desc3 && desc3.trim() ? desc3.trim() : null;
    }

    // Update agent if changed
    if (newAgent) {
      blog.author = {
        agentId: newAgent._id,
        agentName: newAgent.agentName,
        agentEmail: newAgent.email,
      };
    }

    // Handle publish/unpublish
    if (isPublished !== undefined) {
      const publishStatus = isPublished === "true" || isPublished === true;
      if (publishStatus && !blog.isPublished) {
        // Publishing the blog
        blog.publish();
      } else if (!publishStatus && blog.isPublished) {
        // Unpublishing the blog
        blog.unpublish();
      }
    }

    // Handle tags update
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        blog.tags = tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
      } else if (typeof tags === "string") {
        blog.tags = tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
      } else {
        blog.tags = [];
      }
    }

    // Handle image update
    if (req.file) {
      // Delete old image
      if (blog.image && blog.image.path) {
        await fs.unlink(blog.image.path).catch((err) => {
          console.log("Could not delete old image:", err.message);
        });
      }

      // Update with new image
      blog.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    // Save the updated blog
    await blog.save();

    // Handle agent changes
    if (oldAgent && newAgent) {
      // Remove blog from old agent
      oldAgent.removeBlog(blog._id);
      await oldAgent.save();

      // Add blog to new agent
      const blogForAgent = {
        blogId: blog._id,
        title: blog.title,
        slug: blog.slug,
        isPublished: blog.isPublished,
        publishedAt: blog.publishedAt,
      };
      newAgent.addOrUpdateBlog(blogForAgent);
      await newAgent.save();

      console.log(
        `✅ Blog transferred from ${oldAgent.agentName} to ${newAgent.agentName}`
      );
    } else if (!newAgent) {
      // Update existing agent's blog entry
      const currentAgent = await Agent.findById(blog.author.agentId);
      if (currentAgent) {
        const blogForAgent = {
          blogId: blog._id,
          title: blog.title,
          slug: blog.slug,
          isPublished: blog.isPublished,
          publishedAt: blog.publishedAt,
        };
        currentAgent.addOrUpdateBlog(blogForAgent);
        await currentAgent.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error.message);

    // Delete uploaded file if blog update fails
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

// ——— UPDATED: Delete blog with agent unlinking ———
const deleteBlog = async (req, res) => {
  try {
    const blogId = req.query.id || req.body.id;

    console.log("Blog ID for deletion:", blogId);

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Remove blog from agent's blogs array
    const agent = await Agent.findById(blog.author.agentId);
    if (agent) {
      agent.removeBlog(blog._id);
      await agent.save();
      console.log(`✅ Blog removed from agent ${agent.agentName}`);
    }

    // Delete associated image
    if (blog.image && blog.image.path) {
      await fs.unlink(blog.image.path).catch(() => {});
    }

    // Delete the blog
    await Blog.findByIdAndDelete(blogId);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully and unlinked from agent",
    });
  } catch (error) {
    console.error("Error deleting blog:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error: error.message,
    });
  }
};

// ——— NEW: Get blogs by agent ———
const getBlogsByAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { published, page = 1, limit = 10 } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    // Build filter
    let filter = { "author.agentId": agentId };
    if (published !== undefined) {
      filter.isPublished = published === "true";
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(filter)
      .populate("author.agentId", "agentName email imageUrl designation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBlogs = await Blog.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Agent blogs fetched successfully",
      data: {
        blogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBlogs / limit),
          totalBlogs,
          hasNext: page * limit < totalBlogs,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching agent blogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agent blogs",
      error: error.message,
    });
  }
};

// ——— NEW: Get all agents who have written blogs ———
const getAgentsWithBlogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const agentsWithBlogs = await Agent.findAgentsWithBlogs(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Agents with blogs fetched successfully",
      data: agentsWithBlogs,
    });
  } catch (error) {
    console.error("Error fetching agents with blogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agents with blogs",
      error: error.message,
    });
  }
};

// ——— NEW: Publish/Unpublish blog ———
const toggleBlogPublishStatus = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { publish } = req.body;

    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    let result;
    if (publish === true || publish === "true") {
      result = await blog.publish();
    } else {
      result = await blog.unpublish();
    }

    // Update agent's blog entry
    const agent = await Agent.findById(blog.author.agentId);
    if (agent) {
      const blogForAgent = {
        blogId: blog._id,
        title: blog.title,
        slug: blog.slug,
        isPublished: blog.isPublished,
        publishedAt: blog.publishedAt,
      };
      agent.addOrUpdateBlog(blogForAgent);
      await agent.save();
    }

    res.status(200).json({
      success: true,
      message: `Blog ${publish ? "published" : "unpublished"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error toggling blog publish status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to toggle blog publish status",
      error: error.message,
    });
  }
};

// Export all functions and upload middleware
module.exports = {
  GetAllBlogs,
  getSingleBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogsByAgent, // NEW
  getAgentsWithBlogs, // NEW
  toggleBlogPublishStatus, // NEW
  upload, // For multer middleware
};
