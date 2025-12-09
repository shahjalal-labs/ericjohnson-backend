import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { messageService } from "./message.service";

const generateFileUrl = catchAsync(async (req, res) => {
  const fileUrl = await messageService.urlGenerate(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File URL generated successfully",
    data: fileUrl,
  });
});

const personalMessages = catchAsync(async (req, res) => {
  const messages = await messageService.personalMessages(req);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Personal Messages retrived successfully",
    data: messages,
  });
});

export const messageControllers = {
  generateFileUrl,
  personalMessages,
};
