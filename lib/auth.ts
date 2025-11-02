import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (
          credentials.email === "test@example.com" &&
          credentials.password === "123"
        ) {
          // Find or create user in database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: "Test User",
              },
            });
          }

          return {
            id: user.id,
            name: user.name || "Test User",
            email: user.email || credentials.email,
          };
        }

        return null;
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Ensure user exists in database
      if (user.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          // Extract name and image from profile or user object
          const profileData = profile as any;
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || profileData?.name || null,
              image: user.image || profileData?.picture || profileData?.image || null,
            },
          });
        }

        // Update user ID to database ID
        user.id = dbUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  trustHost: true,
});