import mongoose, { Document } from "mongoose"

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId
  sender: mongoose.Types.ObjectId
  text?: string
  img?: string
  replyTo?: mongoose.Types.ObjectId
  reactions: { user: mongoose.Types.ObjectId; emoji: string }[]
  // Set when the sender unsends it; content is cleared.
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, maxlength: 10000 },
    img: String,
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reactions: [
      {
        _id: false,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    deletedAt: Date,
  },
  { timestamps: true, collection: "message-data" }
)

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 })

const Message = mongoose.model<IMessage>("Message", messageSchema)

export default Message
