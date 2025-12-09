import { friendServices } from "./friend.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const sendFriendRequest = catchAsync(async (req, res) => {
  await friendServices.sendFriendRequest(req.user.id, req.params.userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Friend request sent successfully",
  });
});

const myFriends = catchAsync(async (req, res) => {
  const result = await friendServices.myFriends(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My all friends has been retrived successfully",
    data: result,
  });
});

const receiveRequests = catchAsync(async (req, res) => {
  const result = await friendServices.receiveRequests(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All received friend requests have been retrieved successfully",
    data: result,
  });
});

const getFriendById = catchAsync(async (req, res) => {
  const result = await friendServices.getFriendById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "friend has been retrived successfully",
    data: result,
  });
});

const acceptRequest = catchAsync(async (req, res) => {
  await friendServices.acceptRequest(req.params.requestId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Friend request has been accepted successfully",
  });
});

const removeRequest = catchAsync(async (req, res) => {
  await friendServices.removeRequest(req.params.requestId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "friend request has been removed successfully",
  });
});

const deleteFriend = catchAsync(async (req, res) => {
  await friendServices.deleteFriend(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "friend has been deleted successfully",
  });
});

const matchesUsers = catchAsync(async (req, res) => {
  const result = await friendServices.matchesUsers(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Matches users have been retrieved successfully",
    data: result,
  });
});

export const friendControllers = {
  sendFriendRequest,
  myFriends,
  receiveRequests,
  getFriendById,
  acceptRequest,
  removeRequest,
  deleteFriend,
  matchesUsers,
};
