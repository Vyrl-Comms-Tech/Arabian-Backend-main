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


const createBlog = async (req, res) => {
  try {
    console.log("=== CREATING BLOG FROM PARSED CONTENT ===");
    console.log("Request body keys:", Object.keys(req.body));

    const { parsedData, agentId } = req.body;

    // Validate input
    if (!parsedData) {
      return res.status(400).json({
        success: false,
        message: "Parsed data is required",
      });
    }

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: "Agent ID is required",
      });
    }

    // ADD THIS MISSING SECTION - Parse the data
    let blogData;
    try {
      if (typeof parsedData === "string") {
        // Check if it's JSON or plain text
        if (parsedData.trim().startsWith("{")) {
          // It's JSON
          blogData = JSON.parse(parsedData);
        } else {
          // It's plain text, use the parser
          console.log("Using text parser for plain text data");
          blogData = Blog.parseTextToBlogStructure(parsedData);
        }
      } else {
        blogData = parsedData;
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        error: parseError.message,
      });
    }

    // Add debugging
    console.log("=== PARSED BLOG DATA ===");
    console.log("Title:", blogData.content?.title);
    console.log("Slug:", blogData.metadata?.slug);
    console.log("Sections count:", blogData.content?.sections?.length);
    console.log("=== END DEBUG ===");

    // Enhanced validation for parsed data
    if (!blogData.content || !blogData.content.title) {
      return res.status(400).json({
        success: false,
        message: "Content title is required in parsed data",
        received: blogData
      });
    }

    if (!blogData.content.sections || !Array.isArray(blogData.content.sections)) {
      return res.status(400).json({
        success: false,
        message: "Content sections are required in parsed data",
        sectionsReceived: blogData.content?.sections
      });
    }

    // Ensure slug exists or will be generated
    if (!blogData.metadata?.slug) {
      console.log("No slug found, will be generated by pre-save middleware");
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

    // Image is optional for parsed content blogs
    let imageData = null;
    if (req.file) {
      imageData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    } else {
      // Create a placeholder image entry
      imageData = {
        filename: "placeholder.jpg",
        originalName: "placeholder.jpg",
        mimetype: "image/jpeg",
        size: 0,
        path: "uploads/Blogs/placeholder.jpg",
      };
    }

    // Create the blog document with explicit slug handling
    const newBlog = new Blog({
      originalId:
        blogData.id ||
        `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        title: blogData.metadata?.title || blogData.content?.title,
        description:
          blogData.metadata?.description || blogData.seo?.metaDescription || "",
        author: blogData.metadata?.author || agent.agentName,
        tags: blogData.metadata?.tags || [],
        category: blogData.metadata?.category || "",
        slug: blogData.metadata?.slug || null, // Let pre-save middleware handle this
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
      console.log(
        "Warning: Could not update agent's blog array:",
        agentUpdateError.message
      );
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
