const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { ROLES } = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateOtp, generateResetToken, hashValue } = require("../utils/otp");
const { sendOtpEmail, sendResetLinkEmail } = require("../utils/sendEmail");
const MESSAGES = require("../utils/messages");
const { CODES } = require("../utils/messages");

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function issueOtp(userId) {
  const otp = generateOtp();
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        otpHash: hashValue(otp),
        otpExpiry: new Date(Date.now() + OTP_TTL_MS),
      },
    }
  );
  return otp;
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        errorCode: CODES.AUTH.EMAIL_ALREADY_REGISTERED,
        message: MESSAGES.AUTH.EMAIL_ALREADY_REGISTERED,
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      role: ROLES.includes(role) ? role : "employee",
      isVerified: false,
    });

    const otp = await issueOtp(user._id);
    await sendOtpEmail(user.email, otp);

    res.status(201).json({
      success: true,
      message: MESSAGES.AUTH.REGISTER_OTP_SENT,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select(
      "+otpHash +otpExpiry name email role isVerified"
    );
    if (!user || !user.otpHash || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.AUTH.OTP_INVALID_OR_EXPIRED,
        message: MESSAGES.AUTH.OTP_INVALID_OR_EXPIRED,
      });
    }

    const isExpired = user.otpExpiry.getTime() < Date.now();
    const isMatch = user.otpHash === hashValue(otp);
    if (isExpired || !isMatch) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.AUTH.OTP_INVALID_OR_EXPIRED,
        message: MESSAGES.AUTH.OTP_INVALID_OR_EXPIRED,
      });
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { otpHash: "", otpExpiry: "" },
      }
    );

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: MESSAGES.AUTH.ACCOUNT_VERIFIED,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password name email role isVerified");
    if (!user) {
      return res.status(401).json({
        success: false,
        errorCode: CODES.AUTH.INVALID_CREDENTIALS,
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        errorCode: CODES.AUTH.INVALID_CREDENTIALS,
        message: MESSAGES.AUTH.INVALID_CREDENTIALS,
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        errorCode: CODES.AUTH.ACCOUNT_NOT_VERIFIED,
        message: MESSAGES.AUTH.ACCOUNT_NOT_VERIFIED,
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select("_id email");
    if (user) {
      const resetToken = generateResetToken();
      const resetTokenHash = hashValue(resetToken);
      const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await User.updateOne(
        { _id: user._id },
        { $set: { resetTokenHash, resetTokenExpiry } }
      );

      const resetLink = `${process.env.FRONTEND_URL}/resetpassword.html?token=${resetToken}&email=${encodeURIComponent(
        user.email
      )}`;
      await sendResetLinkEmail(user.email, resetLink);
    }

    res.status(200).json({ success: true, message: MESSAGES.AUTH.FORGOT_PASSWORD_SENT });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        errorCode: CODES.AUTH.OLD_PASSWORD_INCORRECT,
        message: MESSAGES.AUTH.OLD_PASSWORD_INCORRECT,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ _id: user._id }, { $set: { password: passwordHash } });

    res.status(200).json({ success: true, message: MESSAGES.AUTH.PASSWORD_UPDATED });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, resetToken, newPassword } = req.body;

    const user = await User.findOne({ email }).select("+resetTokenHash +resetTokenExpiry");
    if (!user || !user.resetTokenHash || !user.resetTokenExpiry) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.AUTH.RESET_TOKEN_INVALID_OR_EXPIRED,
        message: MESSAGES.AUTH.RESET_TOKEN_INVALID_OR_EXPIRED,
      });
    }

    const isExpired = user.resetTokenExpiry.getTime() < Date.now();
    const isMatch = user.resetTokenHash === hashValue(resetToken);
    if (isExpired || !isMatch) {
      return res.status(400).json({
        success: false,
        errorCode: CODES.AUTH.RESET_TOKEN_INVALID_OR_EXPIRED,
        message: MESSAGES.AUTH.RESET_TOKEN_INVALID_OR_EXPIRED,
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: passwordHash },
        $unset: { resetTokenHash: "", resetTokenExpiry: "" },
      }
    );

    res.status(200).json({ success: true, message: MESSAGES.AUTH.PASSWORD_UPDATED });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, verifyOtp, login, forgotPassword, changePassword, resetPassword };
