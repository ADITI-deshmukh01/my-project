const mongoose = require('mongoose');

const placementSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    industry: {
      type: String,
      enum: ['Technology', 'Manufacturing', 'Consulting', 'Finance', 'Healthcare', 'Education', 'Other'],
      required: true
    },
    size: {
      type: String,
      enum: ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'],
      default: 'Medium'
    }
  },
  position: {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract', 'Part-time'],
      default: 'Full-time'
    },
    level: {
      type: String,
      enum: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead'],
      default: 'Entry'
    }
  },
  package: {
    ctc: {
      type: Number,
      required: [true, 'CTC is required'],
      min: [0, 'CTC cannot be negative']
    },
    base: {
      type: Number,
      min: [0, 'Base salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    benefits: [{
      type: String,
      enum: ['Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance', '401k', 'Stock Options', 'Bonus', 'Other']
    }]
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'India'
    },
    remote: {
      type: Boolean,
      default: false
    }
  },
  timeline: {
    appliedDate: {
      type: Date,
      default: Date.now
    },
    interviewDate: {
      type: Date
    },
    offerDate: {
      type: Date
    },
    joiningDate: {
      type: Date
    }
  },
  process: {
    rounds: [{
      name: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['Online Test', 'Technical Interview', 'HR Interview', 'Group Discussion', 'Case Study', 'Other'],
        required: true
      },
      date: Date,
      status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Passed', 'Failed'],
        default: 'Scheduled'
      },
      feedback: String
    }],
    totalRounds: {
      type: Number,
      default: 1
    }
  },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Offer Received', 'Offer Accepted', 'Offer Declined', 'Rejected'],
    default: 'Applied'
  },
  skills: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total package value
placementSchema.virtual('totalPackage').get(function() {
  return this.package.ctc || 0;
});

// Virtual for application status
placementSchema.virtual('applicationStatus').get(function() {
  return this.status;
});

// Index for better query performance
placementSchema.index({ 
  student: 1, 
  company: 1, 
  status: 1, 
  'timeline.appliedDate': -1 
});
placementSchema.index({ 
  'company.industry': 1, 
  'package.ctc': -1 
});

// Pre-save middleware to update total rounds
placementSchema.pre('save', function(next) {
  if (this.process.rounds) {
    this.process.totalRounds = this.process.rounds.length;
  }
  next();
});

// Static method to get placement statistics
placementSchema.statics.getPlacementStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalPlacements: { $sum: 1 },
        totalOffers: { $sum: { $cond: [{ $eq: ['$status', 'Offer Received'] }, 1, 0] } },
        totalAccepted: { $sum: { $cond: [{ $eq: ['$status', 'Offer Accepted'] }, 1, 0] } },
        avgPackage: { $avg: '$package.ctc' },
        maxPackage: { $max: '$package.ctc' },
        minPackage: { $min: '$package.ctc' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalPlacements: 0,
    totalOffers: 0,
    totalAccepted: 0,
    avgPackage: 0,
    maxPackage: 0,
    minPackage: 0
  };
};

// Static method to get placements by department
placementSchema.statics.getPlacementsByDepartment = async function(department, year) {
  return await this.find({
    'student.department': department,
    'student.year': year,
    status: { $in: ['Offer Received', 'Offer Accepted'] }
  }).populate('student', 'firstName lastName studentId department year');
};

module.exports = mongoose.model('Placement', placementSchema);
