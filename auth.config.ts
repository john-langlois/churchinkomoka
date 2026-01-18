import { NextAuthConfig, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyOTPCode } from "@/src/services/otpService";
import { getProfileByIdentifier, checkIsAdmin } from "@/src/services/profileService";

export default {
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        type: { label: "Type", type: "select", options: ['email', 'phone'] },
        identifier: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.code || typeof credentials.identifier !== 'string') {
          return null;
        }

        // Only email authentication is supported
        const type = 'email';

        const verification = await verifyOTPCode(
          credentials.identifier as string,
          credentials.code as string,
          type
        );

        if (!verification.valid) {
          throw new Error(verification.error);
        }

        // Only allow existing profiles - no new sign ups
        const { success, profile } = await getProfileByIdentifier(credentials.identifier as string, type);
        if (!success || !profile) {
          throw new Error('Profile not found. Please contact an administrator to create an account.');
        }

        // Check if user is admin
        const isAdmin = await checkIsAdmin(profile.id);

        return {
          id: profile.id,
          email: profile.email || null,
          phone: profile.phone || null,
          firstName: profile.firstName || null,
          lastName: profile.lastName || null,
          avatarUrl: profile.avatarUrl || null,
          isAdmin: isAdmin,
        } as User;
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as any).phone;
        token.email = (user as any).email;
        token.isAdmin = (user as any).isAdmin;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.avatarUrl = (user as any).avatarUrl;
      }
      
      // Support for manual session update
      if (trigger === "update" && session) {
        token.firstName = session.firstName ?? token.firstName;
        token.lastName = session.lastName ?? token.lastName;
        token.avatarUrl = session.avatarUrl ?? token.avatarUrl;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).phone = token.phone as string | undefined;
        (session.user as any).email = token.email as string | undefined;
        (session.user as any).isAdmin = token.isAdmin as boolean | undefined;
        (session.user as any).firstName = token.firstName as string | undefined;
        (session.user as any).lastName = token.lastName as string | undefined;
        (session.user as any).avatarUrl = token.avatarUrl as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
