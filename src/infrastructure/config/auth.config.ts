import { env } from 'node:process'
import { betterAuth, type User } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin as adminPlugin, emailOTP, openAPI } from 'better-auth/plugins'
import { stripe as stripePlugin } from '@better-auth/stripe'
import { Hono } from 'hono'
import Stripe from 'stripe'
import { db } from '../database/db'
import {
  emailTemplates,
  sendChangeEmailVerification,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail
} from './mail.config'

// Initialize Stripe client
const stripeClient = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
})

// Stripe subscription plans configuration
const stripePlans = [
  {
    id: 'starter-monthly',
    name: 'Starter Monthly',
    priceId: env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    planType: 'starter',
    interval: 'month' as const
  },
  {
    id: 'starter-yearly',
    name: 'Starter Yearly',
    priceId: env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    planType: 'starter',
    interval: 'year' as const
  },
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    priceId: env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    planType: 'pro',
    interval: 'month' as const
  },
  {
    id: 'pro-yearly',
    name: 'Pro Yearly',
    priceId: env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    planType: 'pro',
    interval: 'year' as const
  },
  {
    id: 'enterprise-monthly',
    name: 'Enterprise Monthly',
    priceId: env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    planType: 'enterprise',
    interval: 'month' as const
  },
  {
    id: 'enterprise-yearly',
    name: 'Enterprise Yearly',
    priceId: env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
    planType: 'enterprise',
    interval: 'year' as const
  }
]

// Use 'as any' to bypass complex type inference issues with the stripe plugin
export const auth: any = betterAuth({
  plugins: [
    openAPI(),
    emailOTP({
      expiresIn: 300,
      otpLength: 6,
      async sendVerificationOTP({ email, otp }) {
        const template = await emailTemplates.otpLogin(otp)
        await sendEmail({
          to: email,
          ...template
        })
      }
    }),
    adminPlugin(),
    stripePlugin({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        trialPeriodDays: 14,
        plans: stripePlans
      }
    })
  ],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
    }
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true
  }),
  baseURL: env.BETTER_AUTH || 'http://localhost:3000',
  trustedOrigins: [env.BETTER_AUTH || 'http://localhost:3000', env.REACT_APP_URL || 'http://localhost:5173'],
  user: {
    modelName: 'users',
    additionalFields: {
      firstname: { type: 'string', default: '', returned: true },
      lastname: { type: 'string', default: '', returned: true },
      isAdmin: { type: 'boolean', default: false, returned: true },
      role: { type: 'string', default: 'user', returned: true },
      banned: { type: 'boolean', default: false, returned: true },
      banReason: { type: 'string', default: null, returned: true },
      banExpires: { type: 'date', default: null, returned: true },
      subscriptionPlan: { type: 'string', default: 'free', returned: true }
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ newEmail, token }) => {
        await sendChangeEmailVerification({
          email: newEmail,
          verificationUrl: token
        })
      }
    }
  },
  session: {
    modelName: 'sessions',
    additionalFields: {
      impersonatedBy: { type: 'string', default: null, returned: true }
    }
  },
  account: {
    modelName: 'accounts'
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    requireEmailVerification: false,
    emailVerification: {
      sendVerificationEmail: async ({ user, token }: { user: User; token: string }) => {
        await sendVerificationEmail({
          email: user.email,
          verificationUrl: token
        })
      },
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600 // 1 hour
    },
    sendResetPassword: async ({ user, token }) => {
      await sendResetPasswordEmail({
        email: user.email,
        verificationUrl: token
      })
    }
  }
})

const router = new Hono({
  strict: false
})

router.on(['POST', 'GET'], '/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

export default router
