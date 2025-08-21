const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [255, 'Title cannot exceed 255 characters']
  },
  heading: {
    type: String,
    required: [true, 'Blog heading is required'],
    trim: true,
    maxlength: [500, 'Heading cannot exceed 500 characters']
  },
  desc1: {
    type: String,
    required: [true, 'First description is required'],
    trim: true,
    minlength: [10, 'First description must be at least 10 characters']
  },
  desc2: {
    type: String,
    trim: true,
    minlength: [10, 'Second description must be at least 10 characters'],
    default: null
  },
  desc3: {
    type: String,
    trim: true,
    minlength: [10, 'Third description must be at least 10 characters'],
    default: null
  },
  image: {
    filename: {
      type: String,
      required: [true, 'Image filename is required']
    },
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
 
  // ——— UPDATED: Link to Agent instead of just author name ———
  author: {
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent ID is required']
    },
    agentName: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true
    },
    agentEmail: {
      type: String,
      required: [true, 'Agent email is required'],
      trim: true,
      lowercase: true
    }
  },
 
  publishedAt: {
    type: Date,
    default: null
  },
 
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better performance
blogSchema.index({ 'author.agentId': 1 });
blogSchema.index({ 'author.agentEmail': 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ isPublished: 1 });

// Virtual to populate agent details
blogSchema.virtual('agentDetails', {
  ref: 'Agent',
  localField: 'author.agentId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to generate slug
blogSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, '') // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Replace multiple hyphens with single
      .trim('-');                     // Remove leading/trailing hyphens
       
    // Add timestamp to ensure uniqueness
    this.slug = this.slug + '-' + Date.now();
  }
  next();
});

// Static method to find blogs by agent
blogSchema.statics.findByAgent = function(agentId) {
  return this.find({ 'author.agentId': agentId }).sort({ createdAt: -1 });
};

// Static method to find published blogs by agent
blogSchema.statics.findPublishedByAgent = function(agentId) {
  return this.find({
    'author.agentId': agentId,
    isPublished: true
  }).sort({ createdAt: -1 });
};

// Instance method to publish blog
blogSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Instance method to unpublish blog
blogSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
};

// ——— CRITICAL FIX: Use overwrite protection ———
module.exports = mongoose.models.Blog || mongoose.model('Blog', blogSchema);