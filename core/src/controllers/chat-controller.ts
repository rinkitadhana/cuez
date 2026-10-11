import { Request, Response } from "express"
import mongoose from "mongoose"
import { errorHandler } from "../utils/errorHandler"
import Conversation, {
  IConversation,
  conversationKey,
} from "../models/conversation-model"
import Message, { IMessage } from "../models/message-model"
import User from "../models/user-model"
import { getPagination, paginate } from "../utils/pagination"
import { uploadToR2, deleteFromR2 } from "../utils/storage"
import { emitToUsers } from "../socket"

const CHAT_USER_FIELDS = "fullName username profileImg cuezBadge"
const MAX_TEXT_LENGTH = 10000

const isId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.isValidObjectId(id)

const getMap = (map: Map<string, Date> | undefined, key: string) =>
  map?.get(key) ?? null

// Shape sent to the client. Unsent messages keep their place but lose content.
const serializeMessage = (message: IMessage | null | undefined) => {
  if (!message) return null
  const m = message.toObject ? message.toObject() : message
  const deleted = !!m.deletedAt
  const reply = m.replyTo as unknown as
    | (Pick<IMessage, "sender" | "text" | "img" | "deletedAt"> & {
        _id: mongoose.Types.ObjectId
      })
    | undefined
  return {
    _id: String(m._id),
    conversation: String(m.conversation),
    sender: String(m.sender),
    text: deleted ? undefined : m.text,
    img: deleted ? undefined : m.img,
    replyTo:
      reply && typeof reply === "object" && "_id" in reply
        ? {
            _id: String(reply._id),
            sender: String(reply.sender),
            text: reply.deletedAt ? undefined : reply.text,
            img: reply.deletedAt ? undefined : reply.img,
            deleted: !!reply.deletedAt,
          }
        : null,
    reactions: deleted
      ? []
      : (m.reactions ?? []).map((r: { user: unknown; emoji: string }) => ({
          user: String(r.user),
          emoji: r.emoji,
        })),
    deleted,
    createdAt: m.createdAt,
  }
}

const serializeConversation = async (
  conversation: IConversation,
  meId: string,
  myFollowings: string[]
) => {
  const participants = conversation.participants as unknown as {
    _id: mongoose.Types.ObjectId
  }[]
  const other = participants.find((p) => String(p._id) !== meId) ?? null
  const otherId = other ? String(other._id) : ""
  const clearedAt = getMap(conversation.clearedAt, meId)
  const myLastReadAt = getMap(conversation.lastReadAt, meId)
  const since = [clearedAt, myLastReadAt]
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0]

  const unreadCount = await Message.countDocuments({
    conversation: conversation._id,
    sender: { $ne: meId },
    deletedAt: null,
    ...(since ? { createdAt: { $gt: since } } : {}),
  })

  const accepted = conversation.acceptedBy.map(String).includes(meId)
  const lastMessage = conversation.lastMessage as unknown as IMessage | null
  const lastVisible =
    lastMessage && (!clearedAt || lastMessage.createdAt > clearedAt)

  return {
    _id: String(conversation._id),
    otherUser: other,
    lastMessage: lastVisible ? serializeMessage(lastMessage) : null,
    lastMessageAt: conversation.lastMessageAt ?? null,
    unreadCount,
    isRequest: !accepted && !myFollowings.includes(otherId),
    myLastReadAt,
    otherLastReadAt: getMap(conversation.lastReadAt, otherId),
  }
}

const getMyFollowings = async (meId: string) => {
  const me = await User.findById(meId).select("followings")
  return (me?.followings ?? []).map(String)
}

const findMyConversation = (id: unknown, meId: string) =>
  isId(id)
    ? Conversation.findOne({ _id: id, participants: meId })
    : Promise.resolve(null)

const populateConversation = (query: mongoose.Query<unknown, unknown>) =>
  query
    .populate({ path: "participants", select: CHAT_USER_FIELDS })
    .populate({ path: "lastMessage" })

// GET /conversations?filter=inbox|requests
const getConversations = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const followings = await getMyFollowings(meId)
    const requests = req.query.filter === "requests"
    const { limit, cursorFilter, sort } = getPagination(req, "lastMessageAt")

    const followingIds = followings.map((id) => new mongoose.Types.ObjectId(id))
    const conversations = await populateConversation(
      Conversation.find({
        $and: [
          { participants: meId },
          { lastMessageAt: { $exists: true } },
          // Hide conversations cleared since their last message.
          {
            $expr: {
              $gt: [
                "$lastMessageAt",
                { $ifNull: [`$clearedAt.${meId}`, new Date(0)] },
              ],
            },
          },
          requests
            ? {
                acceptedBy: { $ne: meId },
                participants: { $nin: followingIds },
              }
            : {
                $or: [
                  { acceptedBy: meId },
                  { participants: { $in: followingIds } },
                ],
              },
          cursorFilter,
        ],
      })
        .sort(sort)
        .limit(limit + 1)
    )

    const { page, nextCursor } = paginate(
      conversations as IConversation[],
      limit,
      "lastMessageAt"
    )
    const items = await Promise.all(
      page.map((c) => serializeConversation(c, meId, followings))
    )
    res.status(200).json({
      message: "Conversations fetched",
      conversations: items,
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

// GET /unread — conversations with unread messages, for the nav badge.
const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const conversations = await Conversation.find({
      participants: meId,
      lastMessageAt: { $exists: true },
    })
      .select("lastMessageAt lastReadAt clearedAt lastMessage")
      .populate({ path: "lastMessage", select: "sender deletedAt" })

    const count = conversations.filter((c) => {
      const last = c.lastMessage as unknown as IMessage | null
      if (!last || last.deletedAt || String(last.sender) === meId) return false
      const seen = [getMap(c.lastReadAt, meId), getMap(c.clearedAt, meId)]
        .filter(Boolean)
        .map((d) => d!.getTime())
      return c.lastMessageAt!.getTime() > Math.max(0, ...seen)
    }).length

    res.status(200).json({ message: "Unread count", count })
  } catch (error) {
    errorHandler(res, error)
  }
}

// POST /conversations { userId } — open (or create) the chat with someone.
const startConversation = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const { userId } = req.body
    if (!isId(userId) || userId === meId) {
      res.status(400).json({ message: "Invalid user!" })
      return
    }
    if (!(await User.exists({ _id: userId }))) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const key = conversationKey(meId, userId)
    await Conversation.updateOne(
      { key },
      {
        $setOnInsert: {
          key,
          participants: [meId, userId],
          acceptedBy: [meId],
        },
      },
      { upsert: true }
    )
    const conversation = (await populateConversation(
      Conversation.findOne({ key })
    )) as IConversation
    res.status(200).json({
      message: "Conversation ready",
      conversation: await serializeConversation(
        conversation,
        meId,
        await getMyFollowings(meId)
      ),
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

// GET /conversations/:id
const getConversation = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    if (!isId(req.params.id)) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    const conversation = (await populateConversation(
      Conversation.findOne({ _id: req.params.id, participants: meId })
    )) as IConversation | null
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    res.status(200).json({
      message: "Conversation fetched",
      conversation: await serializeConversation(
        conversation,
        meId,
        await getMyFollowings(meId)
      ),
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

// GET /conversations/:id/messages — newest first, cursor paginated.
const getMessages = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const conversation = await findMyConversation(req.params.id, meId)
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    const clearedAt = getMap(conversation.clearedAt, meId)
    const { limit, cursorFilter, sort } = getPagination(req)
    const messages = await Message.find({
      $and: [
        { conversation: conversation._id },
        clearedAt ? { createdAt: { $gt: clearedAt } } : {},
        cursorFilter,
      ],
    })
      .sort(sort)
      .limit(limit + 1)
      .populate({ path: "replyTo", select: "sender text img deletedAt" })
    const { page, nextCursor } = paginate(messages, limit)
    res.status(200).json({
      message: "Messages fetched",
      messages: page.map(serializeMessage),
      nextCursor,
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

// POST /conversations/:id/messages { text?, img?, replyTo?, clientId? }
const sendMessage = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const conversation = await findMyConversation(req.params.id, meId)
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    const text =
      typeof req.body.text === "string" ? req.body.text.trim() : undefined
    const { img, replyTo, clientId } = req.body
    if (!text && !img) {
      res.status(400).json({ message: "Message can't be empty!" })
      return
    }
    if (text && text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({ message: "Message is too long!" })
      return
    }
    if (
      replyTo &&
      !(isId(replyTo) &&
        (await Message.exists({ _id: replyTo, conversation: conversation._id })))
    ) {
      res.status(400).json({ message: "Can't reply to that message!" })
      return
    }

    const imgUrl =
      typeof img === "string" && img ? await uploadToR2(img, "cuez/chat") : undefined

    const message = await Message.create({
      conversation: conversation._id,
      sender: meId,
      text: text || undefined,
      img: imgUrl,
      replyTo: replyTo || undefined,
    })
    await message.populate({ path: "replyTo", select: "sender text img deletedAt" })

    // Sending counts as reading and as accepting a message request.
    await Conversation.updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessage: message._id,
          lastMessageAt: message.createdAt,
          [`lastReadAt.${meId}`]: message.createdAt,
        },
        $addToSet: { acceptedBy: meId },
      }
    )

    const payload = {
      conversationId: String(conversation._id),
      message: serializeMessage(message),
      clientId: typeof clientId === "string" ? clientId : undefined,
    }
    emitToUsers(conversation.participants, "chat:message", payload)
    res.status(201).json({ message: "Message sent", data: payload.message })
  } catch (error) {
    errorHandler(res, error)
  }
}

// POST /conversations/:id/read
const markRead = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const conversation = await findMyConversation(req.params.id, meId)
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    const at = new Date()
    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { [`lastReadAt.${meId}`]: at } }
    )
    // The other person sees "Seen"; my other tabs clear their badge.
    emitToUsers(conversation.participants, "chat:read", {
      conversationId: String(conversation._id),
      userId: meId,
      at,
    })
    res.status(200).json({ message: "Marked as read", at })
  } catch (error) {
    errorHandler(res, error)
  }
}

// POST /conversations/:id/accept — move a message request to the inbox.
const acceptConversation = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const result = await Conversation.updateOne(
      { _id: isId(req.params.id) ? req.params.id : null, participants: meId },
      { $addToSet: { acceptedBy: meId } }
    )
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    res.status(200).json({ message: "Request accepted" })
  } catch (error) {
    errorHandler(res, error)
  }
}

// DELETE /conversations/:id — "Delete conversation" for me only.
const clearConversation = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const at = new Date()
    const result = await Conversation.updateOne(
      { _id: isId(req.params.id) ? req.params.id : null, participants: meId },
      { $set: { [`clearedAt.${meId}`]: at, [`lastReadAt.${meId}`]: at } }
    )
    if (result.matchedCount === 0) {
      res.status(404).json({ message: "Conversation not found!" })
      return
    }
    res.status(200).json({ message: "Conversation deleted" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const loadMessageForUpdate = async (id: unknown, meId: string) => {
  if (!isId(id)) return null
  const message = await Message.findById(id)
  if (!message) return null
  const conversation = await Conversation.findOne({
    _id: message.conversation,
    participants: meId,
  }).select("participants")
  return conversation ? { message, conversation } : null
}

const emitMessageUpdate = async (
  message: IMessage,
  participants: mongoose.Types.ObjectId[]
) => {
  await message.populate({ path: "replyTo", select: "sender text img deletedAt" })
  emitToUsers(participants, "chat:message-updated", {
    conversationId: String(message.conversation),
    message: serializeMessage(message),
  })
}

// DELETE /messages/:id — unsend (sender only); leaves a "deleted" stub.
const unsendMessage = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const found = await loadMessageForUpdate(req.params.id, meId)
    if (!found || String(found.message.sender) !== meId) {
      res.status(404).json({ message: "Message not found!" })
      return
    }
    const { message, conversation } = found
    if (!message.deletedAt) {
      if (message.img) await deleteFromR2(message.img)
      message.deletedAt = new Date()
      message.text = undefined
      message.img = undefined
      message.reactions = []
      await message.save()
    }
    await emitMessageUpdate(message, conversation.participants)
    res.status(200).json({ message: "Message unsent" })
  } catch (error) {
    errorHandler(res, error)
  }
}

// POST /messages/:id/react { emoji } — one reaction per person; same emoji
// again removes it.
const reactToMessage = async (req: Request, res: Response) => {
  try {
    const meId = req.user._id.toString()
    const { emoji } = req.body
    if (typeof emoji !== "string" || !emoji || emoji.length > 16) {
      res.status(400).json({ message: "Invalid reaction!" })
      return
    }
    const found = await loadMessageForUpdate(req.params.id, meId)
    if (!found || found.message.deletedAt) {
      res.status(404).json({ message: "Message not found!" })
      return
    }
    const { message, conversation } = found
    const mine = message.reactions.find((r) => String(r.user) === meId)
    message.reactions = message.reactions.filter(
      (r) => String(r.user) !== meId
    )
    if (mine?.emoji !== emoji) {
      message.reactions.push({
        user: new mongoose.Types.ObjectId(meId),
        emoji,
      })
    }
    await message.save()
    await emitMessageUpdate(message, conversation.participants)
    res.status(200).json({ message: "Reaction updated" })
  } catch (error) {
    errorHandler(res, error)
  }
}

export {
  getConversations,
  getUnreadCount,
  startConversation,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
  acceptConversation,
  clearConversation,
  unsendMessage,
  reactToMessage,
}
