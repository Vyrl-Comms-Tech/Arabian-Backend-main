const Blog = require("../Models/BlogsModel");
const Agent = require("../Models/AgentModel"); // Add Agent model
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs"); 
// const { validationResult } = require('express-validator');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use absolute path
    const blogsDir = path.join(__dirname, "..", "uploads", "Blogs");
    
    console.log("=== MULTER DESTINATION DEBUG ===");
    console.log("__dirname:", __dirname);
    console.log("Calculated blogsDir:", blogsDir);
    console.log("Directory exists:", fsSync.existsSync(blogsDir));
    
    // Ensure directory exists using sync methods (required for multer)
    if (!fsSync.existsSync(blogsDir)) {
      fsSync.mkdirSync(blogsDir, { recursive: true });
      console.log("Created directory:", blogsDir);
    }
    
    cb(null, blogsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = unique + "-" + file.originalname;
    
    console.log("=== MULTER FILENAME DEBUG ===");
    console.log("Generated filename:", filename);
    console.log("Original name:", file.originalname);
    
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log("=== FILE FILTER DEBUG ===");
  console.log("File mimetype:", file.mimetype);
  console.log("File originalname:", file.originalname);
  
  if (file.mimetype.startsWith("image/")) {
    console.log("File accepted");
    cb(null, true);
  } else {
    console.log("File rejected - not an image");
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

const createBlog = async (req, res) => {
  try {
    console.log("=== BLOG CREATION START ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request file:", req.file ? 'Present' : 'Not present');
    
    if (req.file) {
      console.log("=== FILE UPLOAD DEBUG ===");
      console.log("File details:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        destination: req.file.destination,
        path: req.file.path
      });
      
      // Verify file actually exists at the path
      const fileExists = fsSync.existsSync(req.file.path);
      console.log("File exists at path:", fileExists);
      console.log("Full file path:", req.file.path);
    }

    // Extract and validate basic fields
    const { parsedData, agentId } = req.body;
    
    console.log("Raw parsedData type:", typeof parsedData);
    console.log("Raw parsedData:", parsedData ? parsedData.substring(0, 100) + '...' : 'null/undefined');
    console.log("AgentId:", agentId);

    // Validate required fields
    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: "parsedData is required",
        received: { parsedData, agentId }
      });
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "agentId is required",
        received: { parsedData: "present", agentId }
      });
    }

    // Parse the data
    let blogData;
    try {
      if (typeof parsedData === "string") {
        console.log("Parsing string data...");
        
        if (parsedData.trim().startsWith("{")) {
          console.log("Detected JSON format");
          blogData = JSON.parse(parsedData);
        } else {
          console.log("Detected plain text format, using text parser");
          blogData = Blog.parseTextToBlogStructure(parsedData);
        }
      } else if (typeof parsedData === "object" && parsedData !== null) {
        console.log("Data already parsed as object");
        blogData = parsedData;
      } else {
        throw new Error(`Invalid parsedData type: ${typeof parsedData}`);
      }
    } catch (parseError) {
      console.error("Parse error:", parseError.message);
      return res.status(400).json({
        success: false,
        message: "Failed to parse blog data",
        error: parseError.message,
        receivedType: typeof parsedData,
        receivedData: parsedData ? parsedData.substring(0, 200) : 'null'
      });
    }

    console.log("=== PARSED BLOG DATA ===");
    console.log("Blog data keys:", Object.keys(blogData || {}));
    console.log("Content title:", blogData?.content?.title);
    console.log("Metadata title:", blogData?.metadata?.title);
    console.log("Sections count:", blogData?.content?.sections?.length);
    console.log("=== END PARSED DATA ===");

    // Validate parsed blog data structure
    if (!blogData || typeof blogData !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Parsed data must be an object",
        received: blogData
      });
    }

    if (!blogData.content || !blogData.content.title) {
      return res.status(400).json({
        success: false,
        message: "Blog content and title are required",
        received: {
          hasContent: !!blogData.content,
          contentTitle: blogData.content?.title,
          blogDataKeys: Object.keys(blogData)
        }
      });
    }

    if (!blogData.content.sections || !Array.isArray(blogData.content.sections)) {
      return res.status(400).json({
        success: false,
        message: "Blog content sections are required and must be an array",
        received: {
          hasSections: !!blogData.content.sections,
          sectionsType: typeof blogData.content.sections,
          sectionsLength: Array.isArray(blogData.content.sections) ? blogData.content.sections.length : 'not array'
        }
      });
    }

    // Find the agent
    console.log("Finding agent with ID:", agentId);
    const agent = await Agent.findOne({ agentId: agentId });

    if (!agent) {
      const sampleAgents = await Agent.find(
        { isActive: true },
        "agentId agentName"
      ).limit(5);
      return res.status(404).json({
        success: false,
        message: "Agent not found",
        searchedFor: agentId,
        availableAgents: sampleAgents.map((a) => ({
          agentId: a.agentId,
          agentName: a.agentName,
        })),
      });
    }

    if (!agent.isActive) {
      return res.status(400).json({
        success: false,
        message: "Agent is not active",
        agentId: agentId,
      });
    }

    console.log("Agent found:", agent.agentName);

    // Handle image upload
    let imageData = null;
    if (req.file) {
      console.log("File uploaded successfully to:", req.file.path);
      imageData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    } else {
      console.log("No file uploaded, using placeholder");
      imageData = {
        filename: "placeholder.jpg",
        originalName: "placeholder.jpg",
        mimetype: "image/jpeg",
        size: 0,
        path: "uploads/Blogs/placeholder.jpg",
      };
    }

    // Create the blog document
    const newBlog = new Blog({
      originalId: blogData.id || `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        title: blogData.metadata?.title || blogData.content?.title,
        description: blogData.metadata?.description || blogData.seo?.metaDescription || "",
        author: blogData.metadata?.author || agent.agentName,
        tags: blogData.metadata?.tags || [],
        category: blogData.metadata?.category || "",
        slug: blogData.metadata?.slug || null,
      },
      content: {
        title: blogData.content.title,
        sections: blogData.content.sections || [],
        wordCount: blogData.content.wordCount || 0,
        readingTime: blogData.content.readingTime || 0,
      },
      seo: {
        metaTitle: blogData.seo?.metaTitle || "",
        metaDescription: blogData.seo?.metaDescription || "",
        keywords: blogData.seo?.keywords || [],
      },
      author: {
        agentId: agent._id,
        agentName: agent.agentName,
        agentEmail: agent.email,
      },
      image: imageData,
      status: blogData.status || "draft",
      isPublished: blogData.status === "published" || false,
    });

    // Save the blog
    console.log("Saving blog to database...");
    const savedBlog = await newBlog.save();
    console.log("Blog saved with ID:", savedBlog._id);

    // Add blog to agent's blogs array
    try {
      const blogForAgent = {
        blogId: savedBlog._id,
        title: savedBlog.content.title,
        slug: savedBlog.metadata.slug,
        image: savedBlog.image,
        isPublished: savedBlog.isPublished,
        publishedAt: savedBlog.publishedAt,
        createdAt: savedBlog.createdAt,
        updatedAt: savedBlog.updatedAt,
      };

      if (typeof agent.addOrUpdateBlog === "function") {
        agent.addOrUpdateBlog(blogForAgent);
        await agent.save();
        console.log("Blog added to agent successfully");
      } else {
        console.log("Warning: addOrUpdateBlog method not available on agent");
      }
    } catch (agentUpdateError) {
      console.log("Warning: Could not update agent's blog array:", agentUpdateError.message);
    }

    console.log("=== BLOG CREATION SUCCESS ===");

    res.status(201).json({
      success: true,
      message: "Blog created successfully from parsed content",
      data: {
        blog: savedBlog,
        stats: savedBlog.getContentStats(),
        linkedAgent: {
          agentId: agent.agentId,
          agentName: agent.agentName,
          email: agent.email,
        },
      },
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
      message: "Failed to create blog from parsed content",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


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
