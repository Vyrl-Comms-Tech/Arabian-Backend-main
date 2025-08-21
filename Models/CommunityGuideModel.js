const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const communityGuideSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Community guide title is required'],
    trim: true,
    maxlength: [255, 'Title cannot exceed 255 characters']
  },
  heading: {
    type: String,
    required: [true, 'Community guide heading is required'],
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
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  
  // FAQ Fields
  faq1Question: {
    type: String,
    trim: true,
    maxlength: [300, 'FAQ1 question cannot exceed 300 characters'],
    default: null
  },
  faq1Answer: {
    type: String,
    trim: true,
    maxlength: [1000, 'FAQ1 answer cannot exceed 1000 characters'],
    default: null
  },
  faq2Question: {
    type: String,
    trim: true,
    maxlength: [300, 'FAQ2 question cannot exceed 300 characters'],
    default: null
  },
  faq2Answer: {
    type: String,
    trim: true,
    maxlength: [1000, 'FAQ2 answer cannot exceed 1000 characters'],
    default: null
  },
  faq3Question: {
    type: String,
    trim: true,
    maxlength: [300, 'FAQ3 question cannot exceed 300 characters'],
    default: null
  },
  faq3Answer: {
    type: String,
    trim: true,
    maxlength: [1000, 'FAQ3 answer cannot exceed 1000 characters'],
    default: null
  },
  
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate slug
communityGuideSchema.pre('save', function(next) {
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

// Virtual to get FAQ count
communityGuideSchema.virtual('faqCount').get(function() {
  let count = 0;
  if (this.faq1Question && this.faq1Answer) count++;
  if (this.faq2Question && this.faq2Answer) count++;
  if (this.faq3Question && this.faq3Answer) count++;
  return count;
});

// Virtual to get all FAQs as array
communityGuideSchema.virtual('faqs').get(function() {
  const faqs = [];
  
  if (this.faq1Question && this.faq1Answer) {
    faqs.push({
      question: this.faq1Question,
      answer: this.faq1Answer,
      index: 1
    });
  }
  
  if (this.faq2Question && this.faq2Answer) {
    faqs.push({
      question: this.faq2Question,
      answer: this.faq2Answer,
      index: 2
    });
  }
  
  if (this.faq3Question && this.faq3Answer) {
    faqs.push({
      question: this.faq3Question,
      answer: this.faq3Answer,
      index: 3
    });
  }
  
  return faqs;
});

// Instance method to validate FAQ pairs
communityGuideSchema.methods.validateFAQs = function() {
  const errors = [];
  
  // Check if question is provided without answer or vice versa
  if ((this.faq1Question && !this.faq1Answer) || (!this.faq1Question && this.faq1Answer)) {
    errors.push('FAQ1 must have both question and answer');
  }
  
  if ((this.faq2Question && !this.faq2Answer) || (!this.faq2Question && this.faq2Answer)) {
    errors.push('FAQ2 must have both question and answer');
  }
  
  if ((this.faq3Question && !this.faq3Answer) || (!this.faq3Question && this.faq3Answer)) {
    errors.push('FAQ3 must have both question and answer');
  }
  
  return errors;
};

// Static method to find published guides
communityGuideSchema.statics.findPublished = function() {
  return this.find({ publishedAt: { $ne: null } })
    .sort({ publishedAt: -1 });
};

// Static method to find guides by tag
communityGuideSchema.statics.findByTag = function(tag) {
  return this.find({ tags: { $in: [tag.toLowerCase()] } })
    .sort({ createdAt: -1 });
};

// Static method to search guides
communityGuideSchema.statics.search = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { title: regex },
      { heading: regex },
      { desc1: regex },
      { desc2: regex },
      { desc3: regex },
      { tags: regex },
      { author: regex }
    ]
  }).sort({ createdAt: -1 });
};

// Pre-validate middleware for FAQ validation
communityGuideSchema.pre('validate', function(next) {
  const errors = this.validateFAQs();
  if (errors.length > 0) {
    const error = new Error('FAQ validation failed');
    error.errors = errors;
    return next(error);
  }
  next();
});

// Index for better search performance
communityGuideSchema.index({ 
  title: 'text', 
  heading: 'text', 
  desc1: 'text',
  desc2: 'text',
  desc3: 'text',
  tags: 'text',
  author: 'text'
});

// Index for published guides
communityGuideSchema.index({ publishedAt: -1 });

// Index for tags
communityGuideSchema.index({ tags: 1 });

module.exports = mongoose.model('CommunityGuide', communityGuideSchema);