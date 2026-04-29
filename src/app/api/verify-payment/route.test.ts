import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import crypto from "crypto";

vi.mock("@/models/Subscription", () => ({
  Subscription: {
    findOneAndUpdate: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe("Razorpay Webhook Hardening", () => {
  it("should reject webhooks with invalid signatures", async () => {
    const body = JSON.stringify({ event: "order.paid", payload: {} });
    const req = new NextRequest("http://localhost/api/verify-payment", {
      method: "POST",
      body,
      headers: {
        "x-razorpay-signature": "invalid_signature"
      }
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("should accept valid signatures", async () => {
    const body = JSON.stringify({ event: "order.paid", payload: { order: { entity: { id: "ord_123" } } } });
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const req = new NextRequest("http://localhost/api/verify-payment", {
      method: "POST",
      body,
      headers: {
        "x-razorpay-signature": expectedSignature
      }
    });

    const response = await POST(req);
    // Even if it fails downstream (DB), it should pass signature verification
    expect(response.status).not.toBe(400);
  });
});
