const mongoose = require("mongoose");
const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Podcast title is required"],
      trim: true,
      maxlength: [200, "Podcast title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Podcast description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    youtubeUrl: {
      type: String,
      required: [true, "YouTube URL is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: "Please enter a valid YouTube URL",
      },
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: "General",
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (arr) {
          return arr.length <= 20;
        },
        message: "Cannot have more than 20 tags",
      },
    },
    orderNumber: {
      type: Number,
      required: [true, "Order number is required"],
      min: [1, "Order number must be at least 1"],
      index: true,
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
podcastSchema.index({ title: "text", description: "text", tags: "text" });
podcastSchema.index({ category: 1 });
podcastSchema.index({ createdDate: -1 });

// Middleware
podcastSchema.pre("save", function (next) {
  this.lastUpdated = new Date();

  // Ensure tags are unique and clean
  if (this.tags && this.tags.length > 0) {
    this.tags = [...new Set(this.tags.map((tag) => tag.trim().toLowerCase()))];
  }

  next();
});

podcastSchema.pre("findOneAndUpdate", function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

module.exports = mongoose.model("Podcast", podcastSchema);
