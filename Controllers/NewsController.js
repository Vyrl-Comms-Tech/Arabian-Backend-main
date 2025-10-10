const News = require("../Models/NewsModel");
const Agent = require("../Models/AgentModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const newsDir = path.join(__dirname, "..", "uploads", "News");
    
    // console.log("=== MULTER DESTINATION DEBUG ===");
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
        path: "uploads/News/placeholder.jpg",
      };
    }

    // Create the news document
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
        agentId: agent._id,
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

const updateNews = async (req, res) => {
  try {
    console.log("=== UPDATE NEWS DEBUG ===");
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
      newsId,
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
      newsId,
      title,
      heading,
      desc1,
      desc2,
      desc3,
      agentId,
      tags,
      isPublished,
    });

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

    let oldAgent = null;
    let newAgent = null;

    // Handle agent change
    if (agentId && agentId !== news.author.agentId.toString()) {
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

      oldAgent = await Agent.findById(news.author.agentId);
    }

    // Update news fields
    if (title !== undefined && title.trim()) {
      news.metadata.title = title.trim();
      news.content.title = title.trim();
    }

    if (heading !== undefined && heading.trim()) {
      if (news.content.sections && news.content.sections.length > 0) {
        news.content.sections[0].heading = heading.trim();
      }
    }

    if (desc1 !== undefined && desc1.trim()) {
      if (desc1.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "First description must be at least 10 characters",
        });
      }
      if (news.content.sections && news.content.sections.length > 0) {
        if (news.content.sections[0].content && news.content.sections[0].content.length > 0) {
          news.content.sections[0].content[0].content = desc1.trim();
        }
      }
    }

    if (desc2 !== undefined) {
      const content = desc2 && desc2.trim() ? desc2.trim() : null;
      if (content && news.content.sections && news.content.sections.length > 0) {
        if (news.content.sections[0].subsections && news.content.sections[0].subsections.length > 0) {
          if (news.content.sections[0].subsections[0].content && news.content.sections[0].subsections[0].content.length > 0) {
            news.content.sections[0].subsections[0].content[0].content = content;
          }
        }
      }
    }

    if (desc3 !== undefined) {
      const content = desc3 && desc3.trim() ? desc3.trim() : null;
      if (content && news.content.sections && news.content.sections.length > 0) {
        if (news.content.sections[0].subsections && news.content.sections[0].subsections.length > 1) {
          if (news.content.sections[0].subsections[1].content && news.content.sections[0].subsections[1].content.length > 0) {
            news.content.sections[0].subsections[1].content[0].content = content;
          }
        }
      }
    }

    // Update agent if changed
    if (newAgent) {
      news.author = {
        agentId: newAgent._id,
        agentName: newAgent.agentName,
        agentEmail: newAgent.email,
      };
    }

    // Handle publish/unpublish
    if (isPublished !== undefined) {
      const publishStatus = isPublished === "true" || isPublished === true;
      if (publishStatus && !news.isPublished) {
        news.publish();
      } else if (!publishStatus && news.isPublished) {
        news.unpublish();
      }
    }

    // Handle tags update
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        news.metadata.tags = tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
      } else if (typeof tags === "string") {
        news.metadata.tags = tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0);
      } else {
        news.metadata.tags = [];
      }
    }

    // Handle image update
    if (req.file) {
      if (news.image && news.image.path) {
        await fs.unlink(news.image.path).catch((err) => {
          console.log("Could not delete old image:", err.message);
        });
      }

      news.image = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      };
    }

    await news.save();

    res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: news,
    });
  } catch (error) {
    console.error("Error updating news:", error.message);

    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: "Failed to update news",
      error: error.message,
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

    // Delete associated image
    if (news.image && news.image.path) {
      await fs.unlink(news.image.path).catch(() => {});
    }

    await News.findByIdAndDelete(newsId);

    res.status(200).json({
      success: true,
      message: "News deleted successfully",
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

module.exports = {
  GetAllNews,
  getSingleNews,
  createNews,
  updateNews,
  deleteNews,
  getNewsByAgent,
  toggleNewsPublishStatus,
  upload,
};