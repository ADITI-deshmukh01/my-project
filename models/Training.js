const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Training title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Training description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    enum: ['Technical Skills', 'Soft Skills', 'Interview Preparation', 'Aptitude', 'Coding', 'Communication', 'Leadership', 'Other'],
    required: true
  },
  type: {
    type: String,
    enum: ['Workshop', 'Seminar', 'Online Course', 'Bootcamp', 'Certification', 'Mock Interview', 'Practice Session'],
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  instructor: {
    name: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    expertise: [String],
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration in hours is required'],
      min: [1, 'Duration must be at least 1 hour']
    },
    sessions: [{
      date: Date,
      startTime: String,
      endTime: String,
      topic: String,
      description: String
    }]
  },
  capacity: {
    maxStudents: {
      type: Number,
      required: [true, 'Maximum capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    currentEnrolled: {
      type: Number,
      default: 0
    },
    waitlist: {
      type: Number,
      default: 0
    }
  },
  requirements: {
    prerequisites: [String],
    materials: [String],
    software: [String],
    eligibility: {
      departments: [{
        type: String,
        enum: ['Computer Engineering', 'Mechanical Engineering', 'E&TC Engineering', 'All']
      }],
      years: [{
        type: Number,
        min: 1,
        max: 4
      }],
      cgpa: {
        min: {
          type: Number,
          min: 0,
          max: 10
        }
      }
    }
  },
  content: {
    modules: [{
      title: String,
      description: String,
      duration: Number,
      topics: [String],
      resources: [{
        type: String,
        name: String,
        url: String,
        description: String
      }]
    }],
    assessments: [{
      title: String,
      type: {
        type: String,
        enum: ['Quiz', 'Assignment', 'Project', 'Presentation', 'Exam']
      },
      weightage: {
        type: Number,
        min: 0,
        max: 100
      },
      dueDate: Date
    }]
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      min: 0,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    earlyBirdDiscount: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      validUntil: Date
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Enrollment Open', 'Enrollment Closed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  enrollment: {
    startDate: Date,
    endDate: Date,
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Enrolled', 'Completed', 'Dropped', 'On Hold'],
      default: 'Enrolled'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    certificate: {
      issued: {
        type: Boolean,
        default: false
      },
      issuedDate: Date,
      certificateId: String
    }
  }],
  feedback: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for availability
trainingSchema.virtual('isAvailable').get(function() {
  return this.status === 'Published' && this.enrollment.isOpen;
});

// Virtual for enrollment percentage
trainingSchema.virtual('enrollmentPercentage').get(function() {
  return Math.round((this.capacity.currentEnrolled / this.capacity.maxStudents) * 100);
});

// Virtual for average rating
trainingSchema.virtual('averageRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  return Math.round((totalRating / this.feedback.length) * 10) / 10;
});

// Index for better query performance
trainingSchema.index({ 
  category: 1, 
  level: 1, 
  status: 1, 
  'schedule.startDate': 1 
});
trainingSchema.index({ 
  'enrollment.isOpen': 1, 
  'capacity.currentEnrolled': 1 
});

// Pre-save middleware to update enrollment status
trainingSchema.pre('save', function(next) {
  if (this.enrollment.startDate && this.enrollment.endDate) {
    const now = new Date();
    this.enrollment.isOpen = now >= this.enrollment.startDate && now <= this.enrollment.endDate;
  }
  next();
});

// Static method to get available trainings
trainingSchema.statics.getAvailableTrainings = function(filters = {}) {
  return this.find({
    ...filters,
    status: { $in: ['Published', 'Enrollment Open'] },
    'enrollment.isOpen': true
  }).populate('instructor', 'name designation company');
};

// Static method to get trainings by category
trainingSchema.statics.getTrainingsByCategory = function(category) {
  return this.find({ 
    category: category,
    status: { $in: ['Published', 'Enrollment Open'] }
  }).sort({ 'schedule.startDate': 1 });
};

module.exports = mongoose.model('Training', trainingSchema);
