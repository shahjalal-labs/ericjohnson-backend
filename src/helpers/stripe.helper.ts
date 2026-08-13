import Stripe from "stripe";
import config from "../config";
import prisma from "../shared/prisma";

const stripe = new Stripe(config.stripe.stripe_secret as string);

const createCustomerStripeAccount = async (name: string, email: string) => {
  const account = await stripe.customers.create({
    email,
    name,
  });
  return account;
};

export const createStripePaymentIntent = async (
  userId: string,
  paymentMethodId: string,
  amount: number,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  let account = null;

  if (!user.stripeCustomerId) {
    account = await createCustomerStripeAccount(user.fullName, user.email);
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        stripeCustomerId: account.id,
      },
    });
  }

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.stripeCustomerId || (account?.id as string),
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    customer: user.stripeCustomerId || (account?.id as string),
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  return paymentIntent;
};