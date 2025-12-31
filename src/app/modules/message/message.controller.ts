import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { messageService } from "./message.service";

const generateFileUrl = catchAsync(async (req, res) => {
  const files = req.files as { [fieldName: string]: Express.Multer.File[] };
  const fileUrl = await messageService.urlGenerate(files);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File URL generated successfully",
    data: fileUrl,
  });
});

const personalMessages = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const query = req.query;
  const messages = await messageService.personalMessages(roomId, query);
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
