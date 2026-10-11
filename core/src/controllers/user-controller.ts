import { errorHandler } from "../utils/errorHandler"
import User, { IUser } from "../models/user-model"
import { Request, Response } from "express"
import { uploadToR2, deleteFromR2 } from "../utils/storage"
import Notification from "../models/notification-model"
import bcrypt from "bcrypt"
import { normalizeUsername, validateUsername } from "../utils/username"
import { getPagination, paginate } from "../utils/pagination"

const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params
    const user = await User.findOne({ username }).select("-password -email -bookmarks")
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    res
      .status(200)
      .json({ message: "User profile fetched successfully!", user })
  } catch (error) {
    errorHandler(res, error)
  }
}

const followUnfollowUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params
    const myId = req.user._id
    if (id == myId.toString()) {
      res.status(400).json({ message: "You cannot follow/unfollow yourself!" })
      return
    }
    const userToModify = await User.findById(id).select("_id")
    if (!userToModify) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    // Atomic toggle so rapid optimistic clicks can't double-follow.
    const added = await User.updateOne(
      { _id: myId, followings: { $ne: userToModify._id } },
      { $addToSet: { followings: userToModify._id } }
    )
    if (added.modifiedCount === 0) {
      await User.updateOne(
        { _id: myId },
        { $pull: { followings: userToModify._id } }
      )
      await User.updateOne(
        { _id: userToModify._id },
        { $pull: { followers: myId } }
      )
      await Notification.deleteMany({
        from: myId,
        to: userToModify._id,
        type: "follow",
        post: null,
      })
      res
        .status(200)
        .json({ message: "User unfollowed successfully!", following: false })
      return
    }
    await User.updateOne(
      { _id: userToModify._id },
      { $addToSet: { followers: myId } }
    )
    await Notification.create({
      from: myId,
      to: userToModify._id,
      type: "follow",
      post: null,
    })
    res
      .status(200)
      .json({ message: "User followed successfully!", following: true })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getSuggestedUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user._id
    const usersFollowedByMe = await User.findById(userId).select("followings")

    if (!usersFollowedByMe) {
      res.status(404).json({ message: "User not found!" })
      return
    }

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      { $sample: { size: 10 } },
    ])

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.followings.includes(user._id)
    )
    const suggestedUsers = filteredUsers.slice(0, 3)

    suggestedUsers.forEach((user) => (user.password = undefined))

    res.status(200).json({
      users: suggestedUsers,
      message: "Suggested users fetched successfully!",
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const updateUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { fullName, bio, link, location, currentPassword, newPassword } =
      req.body
    const username =
      req.body.username === undefined
        ? undefined
        : normalizeUsername(req.body.username)
    const { profileImg, coverImg } = req.body

    const userId = req.user._id

    const user = await User.findById(userId)

    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }

    if (username !== undefined && username !== user.username) {
      const usernameError = validateUsername(username)
      if (usernameError) {
        res.status(400).json({ message: usernameError })
        return
      }
      if (await User.exists({ username, _id: { $ne: userId } })) {
        res.status(400).json({ message: "Username is already taken!" })
        return
      }
    }

    if (currentPassword && newPassword) {
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      )
      if (!isPasswordCorrect) {
        res.status(400).json({ message: "Current password is incorrect!" })
        return
      }
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(newPassword, salt)
      user.password = hashedPassword

      await user.save()
      res.status(200).json({ message: "Password updated successfully!" })
      return
    }

    if (profileImg && profileImg !== user.profileImg) {
      if (user.profileImg) {
        await deleteFromR2(user.profileImg)
      }
      user.profileImg = await uploadToR2(profileImg, "cuez/profile-images")
    }
    if (coverImg && coverImg !== user.coverImg) {
      if (user.coverImg) {
        await deleteFromR2(user.coverImg)
      }
      user.coverImg = await uploadToR2(coverImg, "cuez/cover-images")
    }

    user.fullName = fullName || user.fullName
    user.username = username || user.username
    user.bio = bio || user.bio
    user.link = link || user.link
    user.location = location || user.location

    await user.save()
    res.status(200).json({ message: "User profile updated successfully!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const isFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const currentUser = await User.findById(req.user._id)
    const userToCheck = await User.findById(id)

    if (!currentUser || !userToCheck) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const isFollowing = currentUser.followings.includes(id as unknown as IUser)
    res
      .status(200)
      .json({ isFollowing, message: "User is following check successful!" })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getFollowings = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username })
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const users = await User.find({
      _id: { $in: user.followings },
      ...cursorFilter,
    })
      .select("-password -email -bookmarks")
      .sort(sort)
      .limit(limit + 1)
    const { page, nextCursor } = paginate(users, limit)
    res.status(200).json({
      followings: page,
      nextCursor,
      message: "Followings fetched successfully!",
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getFollowers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username })
    if (!user) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const { limit, cursorFilter, sort } = getPagination(req)
    const users = await User.find({
      _id: { $in: user.followers },
      ...cursorFilter,
    })
      .select("-password -email -bookmarks")
      .sort(sort)
      .limit(limit + 1)
    const { page, nextCursor } = paginate(users, limit)
    res.status(200).json({
      followers: page,
      nextCursor,
      message: "Followers fetched successfully!",
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

const getFollowsYou = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUser = await User.findById(req.user._id)
    const userToCheck = await User.findById(req.params.id)
    if (!currentUser || !userToCheck) {
      res.status(404).json({ message: "User not found!" })
      return
    }
    const followsYou = userToCheck.followings.includes(
      currentUser._id as unknown as IUser
    )
    res.status(200).json({
      followsYou,
      message: "Follows you check successful!",
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

// GET /username-available?username= — for the change-username form.
const checkUsernameAvailable = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const username = normalizeUsername(req.query.username)
    const error = validateUsername(username)
    if (error) {
      res.status(200).json({ available: false, message: error })
      return
    }
    const taken = await User.exists({ username, _id: { $ne: req.user._id } })
    res.status(200).json({
      available: !taken,
      message: taken ? "This username is already taken" : "Username is available",
    })
  } catch (error) {
    errorHandler(res, error)
  }
}

export {
  checkUsernameAvailable,
  getUserProfile,
  followUnfollowUser,
  getSuggestedUsers,
  updateUserProfile,
  isFollowing,
  getFollowers,
  getFollowings,
  getFollowsYou,
}
