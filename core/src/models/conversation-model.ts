import mongoose, { Document } from "mongoose"

export interface IConversation extends Document {
  // Sorted "<idA>_<idB>" so each pair of users has exactly one conversation.
  key: string
  participants: mongoose.Types.ObjectId[]
  lastMessage?: mongoose.Types.ObjectId
  lastMessageAt?: Date
  // Per-user state, keyed by user id.
  lastReadAt: Map<string, Date>
  clearedAt: Map<string, Date>
  // Users who've accepted the chat (by starting it, replying or accepting).
  // For everyone else it's a message request.
  acceptedBy: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new mongoose.Schema<IConversation>(
  {
    key: { type: String, required: true, unique: true },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
    lastReadAt: { type: Map, of: Date, default: {} },
    clearedAt: { type: Map, of: Date, default: {} },
    acceptedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, collection: "conversation-data" }
)

conversationSchema.index({ participants: 1, lastMessageAt: -1 })

export const conversationKey = (a: string, b: string) => [a, b].sort().join("_")

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
)

export default Conversation
