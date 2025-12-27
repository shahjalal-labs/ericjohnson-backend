import { matchServices } from "./match.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

// const createMatch = catchAsync(async (req, res) => {
//   await matchServices.createMatch(req.user.id, req.body.userIds);
//   sendResponse(res, {
//     success: true,
//     statusCode: 201,
//     message: "The match has been created successfully",
//   });
// });

const matchingUsers = catchAsync(async (req, res) => {
  const result = await matchServices.matchingUsers(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Matches users have been retrieved successfully",
    data: result,
  });
});

const matchedMe = catchAsync(async (req, res) => {
  const result = await matchServices.matchedMe(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Matched users have been retrieved successfully",
    data: result,
  });
});

const deleteMatch = catchAsync(async (req, res) => {
  await matchServices.deleteMatch(req.params.matchedId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "matched has been deleted successfully",
  });
});

export const matchControllers = {
  // createMatch,
  matchingUsers,
  matchedMe,
  deleteMatch,
};
