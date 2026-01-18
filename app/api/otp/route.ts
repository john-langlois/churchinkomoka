import { NextRequest, NextResponse } from 'next/server';
import { sendOTPCode } from '@/src/services/otpService';
import { getProfileByIdentifier } from '@/src/services/profileService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if profile exists - only allow existing profiles
    const { success, profile } = await getProfileByIdentifier(email, 'email');
    if (!success || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please contact an administrator to create an account.' },
        { status: 404 }
      );
    }

    // Send OTP code
    const result = await sendOTPCode(email, 'email');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send OTP code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'OTP code sent to your email' 
    });
  } catch (error) {
    console.error('Error in OTP route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
