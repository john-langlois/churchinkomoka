import { db } from '@/src/lib/db/connection';
import { otpCodes } from '@/src/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { NewOtpCode } from '@/src/lib/db/schema/otp';

/**
 * Verify OTP code for an identifier
 * This is a placeholder implementation - actual OTP sending/verification
 * should be integrated with Twilio (SMS) or SendGrid (Email)
 */
export async function verifyOTPCode(
  identifier: string,
  code: string,
  type: 'email' | 'phone'
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Find unexpired, unverified OTP code
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.identifier, identifier),
          eq(otpCodes.type, type),
          eq(otpCodes.code, code),
          eq(otpCodes.verified, false),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (result.length === 0) {
      return { valid: false, error: 'Invalid or expired OTP code' };
    }

    const otp = result[0];

    // Mark as verified
    await db
      .update(otpCodes)
      .set({ verified: true })
      .where(eq(otpCodes.id, otp.id));

    return { valid: true };
  } catch (error) {
    console.error('Error in verifyOTPCode:', error);
    return { valid: false, error: 'Failed to verify OTP code' };
  }
}

/**
 * Generate and send OTP code
 * This is a placeholder - should integrate with Twilio/SendGrid
 */
export async function sendOTPCode(
  identifier: string,
  type: 'email' | 'phone'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const newOtp: NewOtpCode = {
      identifier,
      type,
      code,
      expiresAt,
      verified: false,
    };

    await db.insert(otpCodes).values(newOtp);

    // TODO: Integrate with Twilio (SMS) or SendGrid (Email)
    // For now, just log the code (remove in production!)
    console.log(`OTP Code for ${identifier}: ${code}`);

    return { success: true };
  } catch (error) {
    console.error('Error in sendOTPCode:', error);
    return { success: false, error: 'Failed to send OTP code' };
  }
}
