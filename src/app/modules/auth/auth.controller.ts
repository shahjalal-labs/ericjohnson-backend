import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const authLogin = catchAsync(async (req, res) => {
  const result = await authService.authLogin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google login has been successfull",
    data: result,
  });
});

const userLocationUpdateInRedis = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.userLocationUpdateInRedis(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your location updated successfully",
  });
});

const getNearbyUsers = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { radius } = req.query as any;
  const data = await authService.getNearbyUsers(id, radius);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users location retrived successfully",
    data,
  });
});

const sendForgotPasswordOtp = catchAsync(async (req, res) => {
  const email = req.body.email as string;
  const response = await authService.sendForgotPasswordOtpDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP send successfully",
    data: response,
  });
});

const verifyForgotPasswordOtpCode = catchAsync(async (req, res) => {
  const payload = req.body;
  const response = await authService.verifyForgotPasswordOtpCodeDB(payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully.",
    data: response,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;
  const result = await authService.resetForgotPasswordDB(newPassword, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated successfully.",
    data: result,
  });
});

const myProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const user = await authService.myProfile(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile has been retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.updateProfileIntoDB(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile has been updated successfully",
  });
});

const updateProfileImages = catchAsync(async (req, res) => {
  const { id } = req.user;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  await authService.updateProfileImages(id, files, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your profile has been updated successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.changePassword(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "You password has been changed successfully",
  });
});

const deleteAccount = catchAsync(async (req, res) => {
  const { id } = req.user;
  await authService.deleteAccount(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deletede successfully",
  });
});

export const authController = {
  loginUser,
  authLogin,
  myProfile,
  updateProfile,
  userLocationUpdateInRedis,
  getNearbyUsers,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtpCode,
  resetPassword,
  updateProfileImages,
  changePassword,
  deleteAccount,
};
