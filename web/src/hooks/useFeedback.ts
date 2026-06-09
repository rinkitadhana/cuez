import config from "@/config/config"
import useMessageStore from "@/store/messageStore"
import axios, { AxiosError } from "axios"
import { useMutation } from "@tanstack/react-query"

interface CreateFeedbackResponse {
  message: string
}

export interface FeedbackInput {
  title: string
  description: string
}

const createFeedback = async (
  feedback: FeedbackInput
): Promise<CreateFeedbackResponse> => {
  const { data } = await axios.post<CreateFeedbackResponse>(
    `${config.backendUrl}/feedback/create-feedback`,
    feedback,
    {
      withCredentials: true,
    }
  )
  return data
}

export const useCreateFeedback = () => {
  const { setMessage } = useMessageStore()
  return useMutation<CreateFeedbackResponse, AxiosError, FeedbackInput>({
    mutationFn: createFeedback,
    onSuccess: (data: CreateFeedbackResponse) => {
      setMessage(data.message, "success")
    },
    onError: (error: AxiosError) => {
      const message =
        (error.response?.data as CreateFeedbackResponse)?.message ||
        "Create feedback failed!"
      setMessage(message, "error")
    },
  })
}
