const News = require("../Models/NewsModel");
const Agent = require("../Models/AgentModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const newsDir = path.join(__dirname, "..", "uploads", "News");
    
    console.log("=== MULTER DESTINATION DEBUG ===");
    console.log("__dirname:", __dirname);
    console.log("Calculated newsDir:", newsDir);
    console.log("Directory exists:", fsSync.existsSync(newsDir));
    
    if (!fsSync.existsSync(newsDir)) {
      fsSync.mkdirSync(newsDir, { recursive: true });
      console.log("Created directory:", newsDir);
    }
    
    cb(null, newsDir);
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

const createNews = async (req, res) => {
  try {
    console.log("=== NEWS CREATION START ===");
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
      
      const fileExists = fsSync.existsSync(req.file.path);
      console.log("File exists at path:", fileExists);
      console.log("Full file path:", req.file.path);
    }

    const { parsedData, agentId } = req.body;
    console.log(agentId, "Agent ID");
    
    console.log("Raw parsedData type:", typeof parsedData);
    console.log("Raw parsedData:", parsedData ? parsedData.substring(0, 100) + '...' : 'null/undefined');
    console.log("AgentId:", agentId);

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
    let newsData;
    try {
      if (typeof parsedData === "string") {
        console.log("Parsing string data...");
        
        if (parsedData.trim().startsWith("{")) {
          console.log("Detected JSON format");
          newsData = JSON.parse(parsedData);
        } else {
          console.log("Detected plain text format, using text parser");
          newsData = News.parseTextToNewsStructure(parsedData);
        }
      } else if (typeof parsedData === "object" && parsedData !== null) {
        console.log("Data already parsed as object");
        newsData = parsedData;
      } else {
        throw new Error(`Invalid parsedData type: ${typeof parsedData}`);
      }
    } catch (parseError) {
      console.error("Parse error:", parseError.message);
      return res.status(400).json({
        success: false,
        message: "Failed to parse news data",
        error: parseError.message,
        receivedType: typeof parsedData,
        receivedData: parsedData ? parsedData.substring(0, 200) : 'null'
      });
    }

    console.log("=== PARSED NEWS DATA ===");
    console.log("News data keys:", Object.keys(newsData || {}));
    console.log("Content title:", newsData?.content?.title);
    console.log("Metadata title:", newsData?.metadata?.title);
    console.log("Sections count:", newsData?.content?.sections?.length);
    console.log("=== END PARSED DATA ===");

    if (!newsData || typeof newsData !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Parsed data must be an object",
        received: newsData
      });
    }

    if (!newsData.content || !newsData.content.title) {
      return res.status(400).json({
        success: false,
        message: "News content and title are required",
        received: {
          hasContent: !!newsData.content,
          contentTitle: newsData.content?.title,
          newsDataKeys: Object.keys(newsData)
        }
      });
    }

    if (!newsData.content.sections || !Array.isArray(newsData.content.sections)) {
      return res.status(400).json({
        success: false,
        message: "News content sections are required and must be an array",
        received: {
          hasSections: !!newsData.content.sections,
          sectionsType: typeof newsData.content.sections,
          sectionsLength: Array.isArray(newsData.content.sections) ? newsData.content.sections.length : 'not array'
        }
      });
    }

    // Find the agent using the custom agentId
    console.log("Finding agent with custom agentId:", agentId);
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
    console.log("Agent custom ID:", agent.agentId);
    console.log("Agent MongoDB _id:", agent._id);

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
        path: "uploads/News/placeholder.jpg",
      };
    }

    // Create the news document - STORE CUSTOM agentId instead of MongoDB _id
    const newNews = new News({
      originalId: newsData.id || `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        title: newsData.metadata?.title || newsData.content?.title,
        description: newsData.metadata?.description || newsData.seo?.metaDescription || "",
        author: newsData.metadata?.author || agent.agentName,
        tags: newsData.metadata?.tags || [],
        category: newsData.metadata?.category || "",
        slug: newsData.metadata?.slug || null,
      },
      content: {
        title: newsData.content.title,
        sections: newsData.content.sections || [],
        wordCount: newsData.content.wordCount || 0,
        readingTime: newsData.content.readingTime || 0,
      },
      seo: {
        metaTitle: newsData.seo?.metaTitle || "",
        metaDescription: newsData.seo?.metaDescription || "",
        keywords: newsData.seo?.keywords || [],
      },
      author: {
        agentId: agent.agentId, // Store custom agentId (e.g., "AGENT_12345")
        agentName: agent.agentName,
        agentEmail: agent.email,
      },
      image: imageData,
      status: newsData.status || "draft",
      isPublished: newsData.status === "published" || false,
    });

    console.log("Saving news to database...");
    const savedNews = await newNews.save();
    console.log("News saved with ID:", savedNews._id);
    console.log("News author.agentId:", savedNews.author.agentId);

    // Add news to agent's news array (if such method exists)
    try {
      const newsForAgent = {
        newsId: savedNews._id,
        title: savedNews.content.title,
        slug: savedNews.metadata.slug,
        image: savedNews.image,
        isPublished: savedNews.isPublished,
        publishedAt: savedNews.publishedAt,
        createdAt: savedNews.createdAt,
        updatedAt: savedNews.updatedAt,
      };

      if (typeof agent.addOrUpdateNews === "function") {
        agent.addOrUpdateNews(newsForAgent);
        await agent.save({ validateBeforeSave: false });
        console.log("News added to agent successfully");
      } else {
        console.log("Warning: addOrUpdateNews method not available on agent");
      }
    } catch (agentUpdateError) {
      console.log(
        "Warning: Could not update agent's news array:",
        agentUpdateError.message
      );
    }

    console.log("=== NEWS CREATION SUCCESS ===");

    res.status(201).json({
      success: true,
      message: "News created successfully from parsed content",
      data: {
        news: savedNews,
        stats: savedNews.getContentStats(),
        linkedAgent: {
          agentId: agent.agentId,
          agentName: agent.agentName,
          email: agent.email,
        },
      },
    });

  } catch (error) {
    console.error("=== NEWS CREATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

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
      message: "Failed to create news from parsed content",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const updateNews = async (req, res) => {
  try {
    console.log("=== NEWS UPDATE START ===");
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Request file:", req.file ? "Present" : "Not present");

    if (req.file) {
      console.log("=== FILE UPLOAD DEBUG ===");
      console.log("File details:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        destination: req.file.destination,
        path: req.file.path,
      });
    }

    const { newsId, parsedData, agentId } = req.body;

    console.log("NewsId:", newsId);
    console.log("New AgentId:", agentId);
    console.log("Raw parsedData type:", typeof parsedData);

    // Validate required fields
    if (!newsId) {
      return res.status(400).json({
        success: false,
        message: "newsId is required",
      });
    }

    // Find the news to update
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
        newsId: newsId,
      });
    }

    console.log("News found:", news.content?.title || news.metadata?.title);
    console.log("Current news author agentId:", news.author.agentId);

    // Store old agent info for later cleanup
    const oldAgentId = news.author.agentId;
    let agentChanged = false;

    // Handle agent change if new agentId is provided
    if (agentId && agentId !== oldAgentId) {
      console.log("=== AGENT CHANGE DETECTED ===");
      console.log("Old Agent ID:", oldAgentId);
      console.log("New Agent ID:", agentId);

      // Find the new agent using custom agentId
      const newAgent = await Agent.findOne({ agentId: agentId });

      if (!newAgent) {
        return res.status(404).json({
          success: false,
          message: "New agent not found",
          requestedAgentId: agentId,
        });
      }

      if (!newAgent.isActive) {
        return res.status(400).json({
          success: false,
          message: "New agent is not active",
          agentId: agentId,
        });
      }

      console.log("New agent found:", newAgent.agentName);

      // Update news's author info with new agent
      news.author.agentId = newAgent.agentId;
      news.author.agentName = newAgent.agentName;
      news.author.agentEmail = newAgent.email;

      agentChanged = true;
    }

    // Parse and update news data if provided
    if (parsedData) {
      let updateData;

      try {
        if (typeof parsedData === "string") {
          console.log("Parsing string data...");

          if (parsedData.trim().startsWith("{")) {
            console.log("Detected JSON format");
            updateData = JSON.parse(parsedData);
          } else {
            console.log("Detected plain text format, using text parser");
            updateData = News.parseTextToNewsStructure(parsedData);
          }
        } else if (typeof parsedData === "object" && parsedData !== null) {
          console.log("Data already parsed as object");
          updateData = parsedData;
        } else {
          throw new Error(`Invalid parsedData type: ${typeof parsedData}`);
        }
      } catch (parseError) {
        console.error("Parse error:", parseError.message);
        return res.status(400).json({
          success: false,
          message: "Failed to parse news data",
          error: parseError.message,
          receivedType: typeof parsedData,
        });
      }

      console.log("=== PARSED UPDATE DATA ===");
      console.log("Update data keys:", Object.keys(updateData || {}));
      console.log("Content title:", updateData?.content?.title);
      console.log("Sections count:", updateData?.content?.sections?.length);
      console.log("=== END PARSED DATA ===");

      // Update metadata fields if provided
      if (updateData.metadata) {
        if (updateData.metadata.title) {
          news.metadata.title = updateData.metadata.title;
        }
        if (updateData.metadata.description !== undefined) {
          news.metadata.description = updateData.metadata.description;
        }
        if (updateData.metadata.author) {
          news.metadata.author = updateData.metadata.author;
        }
        if (updateData.metadata.tags) {
          news.metadata.tags = Array.isArray(updateData.metadata.tags)
            ? updateData.metadata.tags
            : [];
        }
        if (updateData.metadata.category !== undefined) {
          news.metadata.category = updateData.metadata.category;
        }
        if (updateData.metadata.slug !== undefined) {
          news.metadata.slug = updateData.metadata.slug;
        }
      }

      // Update content fields if provided
      if (updateData.content) {
        if (updateData.content.title) {
          news.content.title = updateData.content.title;
        }
        if (
          updateData.content.sections &&
          Array.isArray(updateData.content.sections)
        ) {
          news.content.sections = updateData.content.sections;
        }
        if (updateData.content.wordCount !== undefined) {
          news.content.wordCount = updateData.content.wordCount;
        }
        if (updateData.content.readingTime !== undefined) {
          news.content.readingTime = updateData.content.readingTime;
        }
      }

      // Update SEO fields if provided
      if (updateData.seo) {
        if (updateData.seo.metaTitle !== undefined) {
          news.seo.metaTitle = updateData.seo.metaTitle;
        }
        if (updateData.seo.metaDescription !== undefined) {
          news.seo.metaDescription = updateData.seo.metaDescription;
        }
        if (updateData.seo.keywords) {
          news.seo.keywords = Array.isArray(updateData.seo.keywords)
            ? updateData.seo.keywords
            : [];
        }
      }

      // Update status if provided
      if (updateData.status) {
        news.status = updateData.status;

        // Handle publish/unpublish based on status
        if (updateData.status === "published" && !news.isPublished) {
          news.isPublished = true;
          news.publishedAt = new Date();
        } else if (updateData.status === "draft" && news.isPublished) {
          news.isPublished = false;
          news.publishedAt = null;
        }
      }
    }

    // Handle image update
    if (req.file) {
      console.log("Updating news image...");

      // Delete old image if it exists and isn't placeholder
      if (
        news.image &&
        news.image.path &&
        news.image.filename !== "placeholder.jpg"
      ) {
        const oldImagePath = news.image.path;
        try {
          await fs.unlink(oldImagePath);
          console.log("Deleted old image:", oldImagePath);
        } catch (err) {
          console.log("Could not delete old image:", err.message);
        }
      }

      // Update with new image
      news.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
      console.log("Image updated:", req.file.filename);
    }

    // Save the updated news
    console.log("Saving updated news...");
    await news.save();
    console.log("News saved successfully");

    // Prepare news data for agent array
    const newsForAgent = {
      newsId: news._id,
      title: news.content?.title || news.metadata?.title || "Untitled",
      slug: news.metadata?.slug || "",
      image: {
        filename: news.image?.filename || "placeholder.jpg",
        originalName: news.image?.originalName || "placeholder.jpg",
        mimetype: news.image?.mimetype || "image/jpeg",
        size: news.image?.size || 0,
        path: news.image?.path || "uploads/News/placeholder.jpg",
      },
      isPublished: news.isPublished || false,
      publishedAt: news.publishedAt || null,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
    };

    // Handle agent reassignment
    if (agentChanged) {
      console.log("=== HANDLING AGENT REASSIGNMENT ===");

      // Remove news from old agent
      try {
        const oldAgent = await Agent.findOne({ agentId: oldAgentId });
        if (oldAgent) {
          // Remove news from old agent's news array
          if (oldAgent.news && Array.isArray(oldAgent.news)) {
            oldAgent.news = oldAgent.news.filter(
              (n) => n.newsId.toString() !== news._id.toString()
            );
            await oldAgent.save({ validateBeforeSave: false });
            console.log("Removed news from old agent:", oldAgent.agentName);
          }
        }
      } catch (oldAgentError) {
        console.log(
          "Warning: Could not remove news from old agent:",
          oldAgentError.message
        );
      }

      // Add news to new agent
      try {
        const newAgent = await Agent.findOne({ agentId: news.author.agentId });
        if (newAgent && typeof newAgent.addOrUpdateNews === "function") {
          newAgent.addOrUpdateNews(newsForAgent);
          await newAgent.save({ validateBeforeSave: false });
          console.log("Added news to new agent:", newAgent.agentName);
        }
      } catch (newAgentError) {
        console.log(
          "Warning: Could not add news to new agent:",
          newAgentError.message
        );
      }
    } else {
      // No agent change, just update news entry in current agent
      try {
        const currentAgent = await Agent.findOne({ agentId: news.author.agentId });
        if (currentAgent && typeof currentAgent.addOrUpdateNews === "function") {
          currentAgent.addOrUpdateNews(newsForAgent);
          await currentAgent.save({ validateBeforeSave: false });
          console.log("Updated news entry in current agent:", currentAgent.agentName);
        }
      } catch (agentError) {
        console.log(
          "Warning: Could not update agent's news entry:",
          agentError.message
        );
      }
    }

    console.log("=== NEWS UPDATE SUCCESS ===");

    res.status(200).json({
      success: true,
      message: agentChanged 
        ? "News updated and reassigned to new agent successfully" 
        : "News updated successfully",
      data: {
        news: news,
        stats: news.getContentStats ? news.getContentStats() : undefined,
        linkedAgent: {
          agentId: news.author.agentId,
          agentName: news.author.agentName,
          email: news.author.agentEmail,
        },
        agentChanged: agentChanged,
      },
    });
  } catch (error) {
    console.error("=== NEWS UPDATE ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    console.error("Request body keys:", Object.keys(req.body));
    console.error("NewsId:", req.body.newsId);
    console.error("AgentId:", req.body.agentId);
    console.error("Has parsedData:", !!req.body.parsedData);
    console.error("Has file:", !!req.file);

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
      message: "Failed to update news",
      error: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const GetAllNews = async (req, res) => {
  try {
    console.log("Fetching all news for cards display...");

    const news = await News.find({})
      .populate("author.agentId", "agentName email imageUrl designation")
      .sort({ createdAt: -1 });

    console.log(`Found ${news.length} news articles`);

    res.status(200).json({
      success: true,
      message: "All news fetched successfully",
      totalNews: news.length,
      data: news,
    });
  } catch (error) {
    console.error("Error fetching all news:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all news",
      error: error.message,
    });
  }
};

const getSingleNews = async (req, res) => {
  try {
    const newsId = req.query.id;

    console.log("News ID:", newsId);

    if (!newsId) {
      return res.status(400).json({
        success: false,
        message: "News ID is required",
      });
    }

    const news = await News.findById(newsId).populate(
      "author.agentId",
      "agentName email imageUrl designation specialistAreas phone whatsapp description"
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "News fetched successfully",
      data: news,
    });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
      error: error.message,
    });
  }
};

const getNewsByTags = async (req, res) => {
  try {
    const { tags, limit = 6, excludeId } = req.query;

    if (!tags) {
      return res.status(400).json({
        success: false,
        message: "Tags are required. Pass tags as comma-separated values.",
        example: "/api/news/by-tags?tags=dubai,uae,property&limit=6"
      });
    }

    // Convert comma-separated tags to array and normalize
    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);

    // Build query to find news with any of these tags
    const query = {
      'metadata.tags': { $in: tagsArray },
      // isPublished: true // Only show published news
    };

    // Exclude the current news if excludeId is provided
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    // Find news and sort by most matching tags
    const news = await News.find(query)
      .populate('author.agentId', 'agentName email imageUrl designation')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Calculate match score for each news (how many tags match)
    const newsWithScore = news.map(item => {
      const matchingTags = item.metadata.tags.filter(tag => 
        tagsArray.includes(tag.toLowerCase())
      );
      return {
        ...item.toObject(),
        matchScore: matchingTags.length,
        matchingTags: matchingTags
      };
    });

    // Sort by match score (most matching tags first)
    newsWithScore.sort((a, b) => b.matchScore - a.matchScore);

    console.log(`Found ${newsWithScore.length} news with matching tags`);

    res.status(200).json({
      success: true,
      message: "News with matching tags fetched successfully",
      count: newsWithScore.length,
      searchedTags: tagsArray,
      data: newsWithScore
    });

  } catch (error) {
    console.error("Error fetching news by tags:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch news by tags",
      error: error.message
    });
  }
};

const deleteNews = async (req, res) => {
  try {
    const newsId = req.query.id || req.body.id;

    console.log("News ID for deletion:", newsId);

    if (!newsId) {
      return res.status(400).json({
        success: false,
        message: "News ID is required",
      });
    }

    const news = await News.findById(newsId);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    // Remove news from agent's news array
    const agent = await Agent.findOne({ agentId: news.author.agentId });
    if (agent && agent.news && Array.isArray(agent.news)) {
      agent.news = agent.news.filter(
        (n) => n.newsId.toString() !== news._id.toString()
      );
      await agent.save();
      console.log(`✅ News removed from agent ${agent.agentName}`);
    }

    // Delete associated image
    if (news.image && news.image.path) {
      await fs.unlink(news.image.path).catch(() => {});
    }

    // Delete the news
    await News.findByIdAndDelete(newsId);

    res.status(200).json({
      success: true,
      message: "News deleted successfully and unlinked from agent",
    });
  } catch (error) {
    console.error("Error deleting news:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete news",
      error: error.message,
    });
  }
};

const getNewsByAgent = async (req, res) => {
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

    const news = await News.find(filter)
      .populate("author.agentId", "agentName email imageUrl designation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalNews = await News.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Agent news fetched successfully",
      data: {
        news,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNews / limit),
          totalNews,
          hasNext: page * limit < totalNews,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching agent news:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agent news",
      error: error.message,
    });
  }
};

const getAgentsWithNews = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const agentsWithNews = await Agent.findAgentsWithNews(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Agents with news fetched successfully",
      data: agentsWithNews,
    });
  } catch (error) {
    console.error("Error fetching agents with news:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agents with news",
      error: error.message,
    });
  }
};

const toggleNewsPublishStatus = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { publish } = req.body;

    if (!newsId) {
      return res.status(400).json({
        success: false,
        message: "News ID is required",
      });
    }

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    let result;
    if (publish === true || publish === "true") {
      result = await news.publish();
    } else {
      result = await news.unpublish();
    }

    // Update agent's news entry
    const agent = await Agent.findOne({ agentId: news.author.agentId });
    if (agent) {
      const newsForAgent = {
        newsId: news._id,
        title: news.content.title,
        slug: news.metadata.slug,
        isPublished: news.isPublished,
        publishedAt: news.publishedAt,
      };
      if (typeof agent.addOrUpdateNews === "function") {
        agent.addOrUpdateNews(newsForAgent);
        await agent.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `News ${publish ? "published" : "unpublished"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Error toggling news publish status:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to toggle news publish status",
      error: error.message,
    });
  }
};

// Export all functions and upload middleware
module.exports = {
  GetAllNews,
  getSingleNews,
  getNewsByTags,
  createNews,
  updateNews,
  deleteNews,
  getNewsByAgent,
  getAgentsWithNews,
  toggleNewsPublishStatus,
  upload,
};