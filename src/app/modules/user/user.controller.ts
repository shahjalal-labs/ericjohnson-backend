import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

// register user
const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Check your email for signup verification",
    data: result,
  });
});

// signup verification
const signupVerification = catchAsync(async (req, res) => {
  const result = await userService.signupVerification(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "OTP verification successful for signup",
    data: result,
  });
});

//get single user
const getSingleUser = catchAsync(async (req, res) => {
  const user = await userService.getSingleUserIntoDB(
    req.params.id,
    req.user.id,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});

//get single user
const useToken = catchAsync(async (req, res) => {
  await userService.useTokenFromDB(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Token used successfully",
  });
});
//get single user
const buyToken = catchAsync(async (req, res) => {
  await userService.buyTokenIntoDB(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Token purchased successfully",
  });
});

export const UserControllers = {
  createUser,
  signupVerification,
  getSingleUser,
  useToken,
  buyToken,
};
