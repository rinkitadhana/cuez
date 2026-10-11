"use client"
import { useParams } from "next/navigation"
import ChatLayout from "@/components/chat/ChatLayout"

const ConversationPage = () => {
  const { id } = useParams()
  return <ChatLayout conversationId={id as string} />
}

export default ConversationPage
