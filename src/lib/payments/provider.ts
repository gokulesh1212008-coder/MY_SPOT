/**
 * Payment provider abstraction.
 *
 * The app NEVER stores card details. It delegates to a provider and stores only
 * the provider reference + status. `PAYMENT_PROVIDER` selects the implementation:
 *
 *   - "sandbox"  (default): simulated gateway, clearly labelled, no real money.
 *   - "stripe"   : real Stripe — requires STRIPE_SECRET_KEY.
 *   - "razorpay" : real Razorpay — requires RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.
 *
 * Real providers throw a clear configuration error when keys are missing, so the
 * app can never silently claim a payment succeeded.
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  bookingRef: string;
  description: string;
  forceFail?: boolean;
}

export interface PaymentResult {
  success: boolean;
  providerRef: string;
  message: string;
}

export interface RefundRequest {
  providerRef: string;
  amount: number;
  currency: string;
  reason: string;
}

export interface PaymentProvider {
  readonly name: string;
  charge(req: PaymentRequest): Promise<PaymentResult>;
  refund(req: RefundRequest): Promise<PaymentResult>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class SandboxPaymentProvider implements PaymentProvider {
  readonly name = "sandbox";

  async charge(req: PaymentRequest): Promise<PaymentResult> {
    await delay(600); // simulate network round-trip
    if (req.forceFail) {
      return { success: false, providerRef: "", message: "Sandbox gateway declined the payment (simulated failure)." };
    }
    const ref = `SBX_${Date.now().toString(36).toUpperCase()}_${Math.floor(Math.random() * 1e6)}`;
    return { success: true, providerRef: ref, message: "Sandbox payment succeeded (simulated)." };
  }

  async refund(_req: RefundRequest): Promise<PaymentResult> {
    await delay(400);
    return {
      success: true,
      providerRef: `RF_${Date.now().toString(36).toUpperCase()}`,
      message: "Sandbox refund processed (simulated).",
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER || "sandbox").toLowerCase();
  if (name === "sandbox") return new SandboxPaymentProvider();
  if (name === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY in the environment.");
    }
    return new StripeProviderStub(process.env.STRIPE_SECRET_KEY);
  }
  if (name === "razorpay") {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("PAYMENT_PROVIDER=razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    return new RazorpayProviderStub(process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_SECRET);
  }
  throw new Error(`Unknown PAYMENT_PROVIDER "${name}". Use sandbox, stripe or razorpay.`);
}

/**
 * Integration stubs for real providers. They validate configuration now and are
 * the exact place to plug in the official SDK calls (Stripe.createPaymentIntent,
 * razorpay.orders.create) — see README "Going live with payments".
 */
class StripeProviderStub implements PaymentProvider {
  readonly name = "stripe";
  constructor(private _secretKey: string) {}
  async charge(_req: PaymentRequest): Promise<PaymentResult> {
    throw new Error("Stripe live integration not configured yet — add the Stripe SDK call here (see README).");
  }
  async refund(_req: RefundRequest): Promise<PaymentResult> {
    throw new Error("Stripe live integration not configured yet — add the Stripe SDK call here (see README).");
  }
}

class RazorpayProviderStub implements PaymentProvider {
  readonly name = "razorpay";
  constructor(
    private _keyId: string,
    private _keySecret: string
  ) {}
  async charge(_req: PaymentRequest): Promise<PaymentResult> {
    throw new Error("Razorpay live integration not configured yet — add the Razorpay SDK call here (see README).");
  }
  async refund(_req: RefundRequest): Promise<PaymentResult> {
    throw new Error("Razorpay live integration not configured yet — add the Razorpay SDK call here (see README).");
  }
}
