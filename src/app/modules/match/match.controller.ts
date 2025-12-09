import { matchServices } from "./match.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createMatch = catchAsync(async (req, res) => {
  await matchServices.createMatch(req.user.id, req.body.userIds);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The match has been created successfully",
  });
});

const myMatches = catchAsync(async (req, res) => {
  const result = await matchServices.myMatches(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All matchs has been retrived successfully",
    data: result,
  });
});

const getMatchById = catchAsync(async (req, res) => {
  const result = await matchServices.getMatchById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "match has been retrived successfully",
    data: result,
  });
});

const updateMatch = catchAsync(async (req, res) => {
  await matchServices.updateMatch(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "match has been updated successfully",
  });
});

const deleteMatch = catchAsync(async (req, res) => {
  await matchServices.deleteMatch(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "match has been deleted successfully",
  });
});

export const matchControllers = {
  createMatch,
  myMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
};
