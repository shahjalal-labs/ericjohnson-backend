import { intentServices } from "./intent.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createIntent = catchAsync(async (req, res) => {
  await intentServices.createIntent(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The intent has been created successfully",
  });
});

const checkIntent = catchAsync(async (req, res) => {
  const data = await intentServices.checkIntent(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The intent status retrived success",
    data,
  });
});

const getAllIntents = catchAsync(async (req, res) => {
  const result = await intentServices.getAllIntents();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All intents has been retrived successfully",
    data: result,
  });
});

const getIntentById = catchAsync(async (req, res) => {
  const result = await intentServices.getIntentById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "intent has been retrived successfully",
    data: result,
  });
});

const updateIntent = catchAsync(async (req, res) => {
  await intentServices.updateIntent(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "intent has been updated successfully",
  });
});

const deleteIntent = catchAsync(async (req, res) => {
  await intentServices.deleteIntent(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "intent has been deleted successfully",
  });
});

export const intentControllers = {
  createIntent,
  checkIntent,
  getAllIntents,
  getIntentById,
  updateIntent,
  deleteIntent,
};
