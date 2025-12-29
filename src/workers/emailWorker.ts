import { Worker } from "bullmq";
import sendEmail from "../helpers/sendEmail";
import redisClient from "../helpers/redis";
import { verificationHtml } from "../helpers/verificationHtml";
import { forgetPasswordHtml } from "../helpers/forgetPasswordHtml";

new Worker(
  "emails",
  async (job) => {
    const { email, fullName, otp } = job.data;

    let subject = "";
    let html = "";

    if (job.name === "sendOtp") {
      subject = "Account verification";
      html = verificationHtml(fullName, otp);
    } else if (job.name === "forgotPasswordOtp") {
      subject = "Your Password Reset OTP";
      html = forgetPasswordHtml(fullName, otp);
    } else {
      console.warn(`Unknown job name: ${job.name}`);
      return;
    }
    try {
      await sendEmail(email, subject, html);
      console.log(`✅ Email sent to ${email} for job: ${job.name}`);
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  },
  { connection: redisClient }
);
