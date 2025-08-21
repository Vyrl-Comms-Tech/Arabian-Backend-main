const Podcast = require("../Models/PodcastModel");

const createPodcast = async (req, res) => {
  try {
    const { title, description, youtubeUrl, category, tags, orderNumber } =
      req.body;

    // Validate required fields
    if (!title || !description || !youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and YouTube URL are required",
      });
    }

    // Get next order number if not provided
    let finalOrderNumber = orderNumber;
    if (!finalOrderNumber) {
      finalOrderNumber = await getNextOrderNumber();
    } else {
      // Check if order number already exists
      const existingPodcast = await Podcast.findOne({
        orderNumber: finalOrderNumber,
      });
      if (existingPodcast) {
        return res.status(400).json({
          success: false,
          message: `Order number ${finalOrderNumber} already exists`,
        });
      }
    }

    const podcastData = {
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      category: category?.trim() || "General",
      tags: tags || [],
      orderNumber: finalOrderNumber,
    };

    const podcast = new Podcast(podcastData);
    await podcast.save();

    res.status(201).json({
      success: true,
      message: "Podcast created successfully",
      data: podcast,
    });
  } catch (error) {
    console.error("Error creating podcast:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating podcast",
      error: error.message,
    });
  }
};

// Get All Podcasts
const getAllPodcasts = async (req, res) => {
  try {
    // console.log("Workking");

    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    // // Build filter object
    const filter = {};

    // Filter by category if provided
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search, "i")] } },
      ];
    }

    // Sort options
    let sortOption = { orderNumber: 1 }; // Default sort by order number
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case "title":
          sortOption = { title: 1 };
          break;
        case "date":
          sortOption = { createdDate: -1 };
          break;
        case "category":
          sortOption = { category: 1, orderNumber: 1 };
          break;
        default:
          sortOption = { orderNumber: 1 };
      }
    }

    const podcasts = await Podcast.find(filter)
    //   .sort(sortOption)
    //   .skip(skip)
    //   .limit(limit)
    //   .select("-__v");

    const total = await Podcast.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Podcasts retrieved successfully",
      data: podcasts,
      // pagination: {
      //   currentPage: page,
      //   totalPages: Math.ceil(total / limit),
      //   totalItems: total,
      //   itemsPerPage: limit,
      //   hasNextPage: page < Math.ceil(total / limit),
      //   hasPrevPage: page > 1,
      // },
      
    });
  } catch (error) {
    console.error("Error fetching podcasts:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching podcasts",
      error: error.message,
    });
  }
};

// Get Single Podcast by ID
const getPodcastById = async (req, res) => {
  try {
    const podcastId = req.query.id;
    if (!podcastId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid podcast ID format",
      });
    }

    const podcast = await Podcast.findById(podcastId).select("-__v");

    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: "Podcast not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Podcast retrieved successfully",
      data: podcast,
    });
  } catch (error) {
    console.error("Error fetching podcast:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid podcast ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching podcast",
      error: error.message,
    });
  }
};


const updatePodcast = async (req, res) => {
  try {
    const { title, description, youtubeUrl, category, tags, orderNumber } = req.body;
    
    const podcast = await Podcast.findById(req.query.id);
    console.log(podcast);
    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast not found'
      });
    }
    
    // Check if new order number conflicts with existing one
    if (orderNumber && orderNumber !== podcast.orderNumber) {
      const existingPodcast = await Podcast.findOne({ 
        orderNumber: orderNumber,
        _id: { $ne: req.query.id} 
      });
      if (existingPodcast) {
        return res.status(400).json({
          success: false,
          message: `Order number ${orderNumber} already exists`
        });
      }
    }
    
    // Update fields
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    
    const updatedPodcast = await Podcast.findByIdAndUpdate(
      req.query.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v');
    
    res.json({
      success: true,
      message: 'Podcast updated successfully',
      data: updatedPodcast
    });
  } catch (error) {
    console.error('Error updating podcast:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid podcast ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating podcast',
      error: error.message
    });
  }
};
const deletePodcast = async (req, res) => {
  try {
    const podcast = await Podcast.findById(req.query.id);
    
    if (!podcast) {
      return res.status(404).json({
        success: false,
        message: 'Podcast not found'
      });
    }
    
    await Podcast.findByIdAndDelete(req.query.id);
    
    res.json({
      success: true,
      message: 'Podcast deleted successfully',
      data: {
        deletedPodcast: {
          _id: podcast._id,
          title: podcast.title,
          orderNumber: podcast.orderNumber
        }
      }
    });
  } catch (error) {
    console.error('Error deleting podcast:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid podcast ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting podcast',
      error: error.message
    });
  }
};


module.exports = {
  createPodcast,
  getAllPodcasts,
  getPodcastById,
  updatePodcast,
  deletePodcast
};
