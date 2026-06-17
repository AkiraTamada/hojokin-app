import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const checkout = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL || "https://hojokin-app-w5mh.vercel.app"}/success`,
    cancel_url: `${process.env.NEXTAUTH_URL || "https://hojokin-app-w5mh.vercel.app"}`,
    customer_email: session.user.email!,
  });

  return NextResponse.json({ url: checkout.url });
}
