const express = require("express");
const { pool, query } = require("../db/pool");
const { memoryStore } = require("../db/memoryStore");
const { signToken, requireAuth } = require("../middleware/auth");
const { sendOtpEmail } = require("../utils/mailer");
const {
  validateEmail,
  validateFullName,
  validateOtp,
  sendValidation,
} = require("../utils/validate");

const router = express.Router();

// POST /api/auth/request-otp
router.post("/request-otp", async (req, res) => {
  try {
    const rawEmail = validateEmail(req.body.email);
    const fullName = validateFullName(req.body.fullName);

    if (pool) {
      const recent = await query(
        `SELECT COUNT(*)::int AS cnt FROM email_otps
         WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [rawEmail]
      );
      if (recent.rows[0].cnt >= 5) {
        return res.status(429).json({
          error: "Too many codes sent. Wait up to an hour and try again.",
          fields: { email: "Too many codes sent. Wait up to an hour and try again." },
        });
      }
    } else {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      const recent = memoryStore.otps.filter(
        (o) => o.email === rawEmail && new Date(o.created_at || 0).getTime() > hourAgo
      );
      if (recent.length >= 5) {
        return res.status(429).json({
          error: "Too many codes sent. Wait up to an hour and try again.",
          fields: { email: "Too many codes sent. Wait up to an hour and try again." },
        });
      }
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (pool) {
      await query(
        `INSERT INTO email_otps (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
        [rawEmail, otpCode, expiresAt]
      );
    } else {
      memoryStore.otps.push({
        email: rawEmail,
        otp_code: otpCode,
        expires_at: expiresAt,
        consumed: false,
        created_at: new Date().toISOString(),
      });
    }

    const mailResult = await sendOtpEmail(rawEmail, otpCode);

    return res.json({
      success: true,
      email: rawEmail,
      fullName,
      expiresInSeconds: 600,
      delivery: mailResult.deliveredVia,
      // Returned when SMTP is not configured so testing on phone/emulator is effortless
      devOtpPreview: mailResult.deliveredVia !== "smtp" ? otpCode : undefined,
    });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[AUTH] request-otp error:", err);
    return res.status(500).json({ error: "Failed to generate email OTP" });
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const email = validateEmail(req.body.email);
    const otp = validateOtp(req.body.otp);
    const fullName = validateFullName(req.body.fullName);

    let userRecord = null;

    if (pool) {
      const otpRes = await query(
        `SELECT * FROM email_otps
         WHERE email = $1 AND otp_code = $2 AND consumed = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otp]
      );

      if (otpRes.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired OTP code" });
      }

      await query(`UPDATE email_otps SET consumed = TRUE WHERE id = $1`, [
        otpRes.rows[0].id,
      ]);

      const upsertUser = await query(
        `INSERT INTO users (email, full_name, last_login_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (email) DO UPDATE SET
           full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
           last_login_at = NOW()
         RETURNING id, email, full_name, created_at`,
        [email, fullName || email.split("@")[0]]
      );
      userRecord = upsertUser.rows[0];
    } else {
      const match = [...memoryStore.otps]
        .reverse()
        .find(
          (o) =>
            o.email === email &&
            o.otp_code === otp &&
            !o.consumed &&
            new Date(o.expires_at) > new Date()
        );

      if (!match) {
        return res.status(400).json({ error: "Invalid or expired OTP code" });
      }
      match.consumed = true;

      userRecord = memoryStore.users.find((u) => u.email === email);
      if (!userRecord) {
        userRecord = {
          id: memoryStore.users.length + 1,
          email,
          full_name: fullName || email.split("@")[0],
          created_at: new Date().toISOString(),
        };
        memoryStore.users.push(userRecord);
      }
    }

    const token = signToken({
      id: userRecord.id,
      email: userRecord.email,
      fullName: userRecord.full_name,
    });

    return res.json({
      token,
      user: userRecord,
    });
  } catch (err) {
    const invalid = sendValidation(res, err);
    if (invalid) return invalid;
    console.error("[AUTH] verify-otp error:", err);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
