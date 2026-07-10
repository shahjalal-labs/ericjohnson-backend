import jwt, { JwtPayload } from "jsonwebtoken";
import { logger } from "./logger";
import config from "../../config";

interface GameTokenPayload extends JwtPayload {
  userId: string;
}

export const verifyToken = (
  token: string
): GameTokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.jwt_secret as string
    );

    if (typeof decoded === "string") {
      return null;
    }

    return decoded as GameTokenPayload;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return null;
  }
};