import mongoose, { Document } from "mongoose"

export interface IFeedback extends Document {
  title: string
  description: string
  user: mongoose.Types.ObjectId
  // Marked by an admin once triaged.
  reviewed?: boolean
  createdAt: Date
  updatedAt: Date
}

const feedbackShema = new mongoose.Schema<IFeedback>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "feedback-data" }
)

export const Feedback = mongoose.model<IFeedback>("Feedback", feedbackShema)
