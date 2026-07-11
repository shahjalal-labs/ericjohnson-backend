import ApiError from "../../errors/ApiErrors";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import env from "./game.env";
import crypto from "crypto";

export const generateZegoToken = catchAsync(async (req, res) => {
  const appId = Number(env.ZEGO_APP_ID);
  const serverSecret = env.ZEGO_APP_SECRET;

  if (!appId || !serverSecret) {
    throw new ApiError(503, "Zego is not configured");
  }

  const { userId, roomId } = req.query;

  const effectiveTimeInSeconds = 3600;
  const createTime = Math.floor(Date.now() / 1000);
  const expire = createTime + effectiveTimeInSeconds;
  const nonce = Math.floor(Math.random() * 2147483647);

  const payload = {
    room_id: roomId,
    privilege: {
      1: 1,
      2: 1,
    },
    stream_id_list: [],
  };

  const tokenObj = {
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: createTime,
    expire,
    payload: JSON.stringify(payload),
  };

  const jsonStr = JSON.stringify(tokenObj);

  // Generate AES key
  const key = new Uint8Array(
    crypto.createHash("md5").update(serverSecret).digest(),
  );

  // Generate IV
  const iv = new Uint8Array(crypto.randomBytes(16));

  const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);

  const encryptedPart1 = cipher.update(jsonStr, "utf8");
  const encryptedPart2 = cipher.final();

  const encrypted = new Uint8Array(
    encryptedPart1.length + encryptedPart2.length,
  );

  encrypted.set(encryptedPart1, 0);
  encrypted.set(encryptedPart2, encryptedPart1.length);

  // Create final token buffer
  const buffer = new Uint8Array(16 + 2 + encrypted.length);

  // Add IV
  buffer.set(iv, 0);

  // Add encrypted length (big endian)
  const view = new DataView(buffer.buffer);
  view.setUint16(16, encrypted.length, false);

  // Add encrypted data
  buffer.set(encrypted, 18);

  const token = "04" + Buffer.from(buffer).toString("base64");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Token generated successfully",
    data: {
      token,
      appId,
      userId,
      roomId,
    },
  });
});
