import { Request, Response } from "express"
import { Feedback } from "../models/feedback-model"
import { errorHandler } from "../utils/errorHandler"
import User from "../models/user-model"

const createFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      res.status(400).json({ message: "UnAuthorized user!" })
      return
    }
    if (!title || !description) {
      res.status(400).json({ message: "All fields are required!" })
      return
    }
    const feedback = new Feedback({
      title,
      description,
      user: req.user._id,
    })
    await feedback.save()
    if (!user.cuezBadge) {
      user.cuezBadge = true
      await user.save()
      res.status(201).json({
        message: "Congratulations! You got a Cuez badge, check your profile.",
      })
    } else {
      res
        .status(201)
        .json({ message: "Thankyou for making this platform better!" })
    }
  } catch (error) {
    errorHandler(res, error)
  }
}

export { createFeedback }
