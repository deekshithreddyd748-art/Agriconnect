import { AppError } from '../middleware/errorHandler.js';

/**
 * Check which legitimate SMS OTP provider is configured via environment variables.
 * Supported providers: 'msg91', 'twilio_verify', '2factor', 'twilio'.
 */
export function getSmsProviderStatus() {
  const preferred = (process.env.SMS_PROVIDER || '').toLowerCase().trim();

  const hasMsg91 = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
  const hasTwilioVerify = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
  const hasTwoFactor = Boolean(process.env.TWOFACTOR_API_KEY);
  const hasTwilio = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );

  if (preferred === 'msg91' && hasMsg91) return { configured: true, provider: 'msg91' };
  if (preferred === 'twilio_verify' && hasTwilioVerify) {
    return { configured: true, provider: 'twilio_verify' };
  }
  if (preferred === '2factor' && hasTwoFactor) return { configured: true, provider: '2factor' };
  if (preferred === 'twilio' && hasTwilio) return { configured: true, provider: 'twilio' };

  if (hasMsg91) return { configured: true, provider: 'msg91' };
  if (hasTwilioVerify) return { configured: true, provider: 'twilio_verify' };
  if (hasTwoFactor) return { configured: true, provider: '2factor' };
  if (hasTwilio) return { configured: true, provider: 'twilio' };

  return {
    configured: false,
    provider: preferred || 'unconfigured',
  };
}

/**
 * Returns true if the configured provider verifies OTP codes remotely via its own API.
 */
export function usesRemoteProviderVerification(provider) {
  if (provider === 'twilio_verify') return true;
  if (provider === 'msg91' && process.env.MSG91_SERVER_VERIFY === 'true') return true;
  return false;
}

/**
 * Dispatch a real OTP via the configured Indian SMS provider.
 * Throws HTTP 503 with code 'SMS_NOT_CONFIGURED' if credentials are missing.
 */
export async function sendSmsOtp({ mobileNumber, otp }) {
  const status = getSmsProviderStatus();
  if (!status.configured) {
    throw new AppError(
      'SMS OTP provider credentials are not configured on the server.',
      503,
      'SMS_NOT_CONFIGURED'
    );
  }

  if (status.provider === 'msg91') {
    const useServerVerify = process.env.MSG91_SERVER_VERIFY === 'true';
    const bodyPayload = {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: `91${mobileNumber}`,
      ...(useServerVerify ? { otp_length: 6, otp_expiry: 5 } : { otp }),
    };

    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      throw new AppError('Failed to send OTP via MSG91 SMS gateway.', 502, 'SMS_GATEWAY_ERROR');
    }
    return { provider: 'msg91', remoteVerification: useServerVerify };
  }

  if (status.provider === 'twilio_verify') {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');
    const params = new URLSearchParams({
      To: `+91${mobileNumber}`,
      Channel: 'sms',
    });
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(
        process.env.TWILIO_VERIFY_SERVICE_SID
      )}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      throw new AppError('Failed to send OTP via Twilio Verify.', 502, 'SMS_GATEWAY_ERROR');
    }
    return { provider: 'twilio_verify', remoteVerification: true };
  }

  if (status.provider === '2factor') {
    const template = process.env.TWOFACTOR_TEMPLATE_NAME
      ? `/${encodeURIComponent(process.env.TWOFACTOR_TEMPLATE_NAME)}`
      : '';
    const url = `https://2factor.in/API/V1/${encodeURIComponent(
      process.env.TWOFACTOR_API_KEY
    )}/SMS/+91${mobileNumber}/${otp}${template}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new AppError('Failed to send OTP via 2Factor SMS gateway.', 502, 'SMS_GATEWAY_ERROR');
    }
    return { provider: '2factor', remoteVerification: false };
  }

  if (status.provider === 'twilio') {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');
    const params = new URLSearchParams({
      To: `+91${mobileNumber}`,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: `Your AgriConnect verification OTP is ${otp}. Valid for 5 minutes.`,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      throw new AppError('Failed to send OTP via Twilio SMS gateway.', 502, 'SMS_GATEWAY_ERROR');
    }
    return { provider: 'twilio', remoteVerification: false };
  }

  throw new AppError('Unsupported SMS provider configuration.', 503, 'SMS_NOT_CONFIGURED');
}

/**
 * Verify a 6-digit OTP against a remote provider verification API (Twilio Verify / MSG91 v5).
 * Returns true if approved/verified, false otherwise.
 */
export async function verifyRemoteSmsOtp({ provider, mobileNumber, otp }) {
  if (provider === 'twilio_verify') {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');
    const params = new URLSearchParams({
      To: `+91${mobileNumber}`,
      Code: otp,
    });
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${encodeURIComponent(
        process.env.TWILIO_VERIFY_SERVICE_SID
      )}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data?.status === 'approved' || data?.valid === true;
  }

  if (provider === 'msg91') {
    const url = `https://control.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(
      otp
    )}&mobile=${encodeURIComponent(`91${mobileNumber}`)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
      },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.type === 'success';
  }

  return false;
}
