# Spherial AI — Agentic Platform

Spherial AI (formerly Friends AI) is a next-generation emotional companion and conversational agent, built with a production-ready LangGraph orchestration architecture. 

It dynamically routes user intent across specialized agents—ranging from empathetic chat and deep reasoning, to real-time multimodal voice processing and image generation.

## 🌟 Key Features

*   **Multi-Agent Intelligence**: Powered by `LangGraph`, incoming queries are pre-processed by `Safety`, `Intent`, and `Sentiment` nodes before a `Supervisor` routes them to specialized agents (Buddy, Visual, Recommendation).
*   **Policy-Driven Provider Routing**: Automatically selects the most efficient model based on cost, latency, and tier limits across Google (Gemini), NVIDIA (NIM), and OpenRouter.
*   **Live Avatar (Premium)**: Real-time WebRTC-based interactive voice session. PCM audio is streamed and converted into dynamic Visemes and Gestures for full-body 3D avatar animation.
*   **Asynchronous Media Generation**: Long-running multimodal tasks (like Flux Image Generation) are securely offloaded to a Redis-backed `BullMQ` worker pool.
*   **Enterprise-Grade Entitlements**: A robust Mongoose `Subscription` layer with daily quota tracking, seamlessly integrated with Razorpay.
*   **Professional Observability**: First-class integration with LangSmith for tracing agent trajectories, token usage, and latency metrics across the entire application state.

## 🛠 Tech Stack

*   **Framework**: Next.js 14+ (App Router), React, TypeScript
*   **AI Orchestration**: LangChain, LangGraph, Vercel AI SDK
*   **Providers**: Google Gemini, OpenRouter, NVIDIA NIM, OpenAI TTS
*   **Database**: MongoDB (Mongoose) with Global Connection Caching
*   **Background Jobs**: BullMQ, Redis (Valkey)
*   **State Management**: Redux Toolkit
*   **Payments**: Razorpay

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.x
- MongoDB Instance
- Redis / Valkey Instance
- API Keys: Google Generative AI, OpenRouter, Razorpay

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/mohdshubair313/FriendsAI.git
cd FriendsAI

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your specific keys
```

### 3. Running Locally
```bash
# Start the Next.js frontend and API server
npm run dev
```

In a separate terminal, start the background job worker (for async media):
```bash
npx tsx src/worker.ts
```

## 🔒 Security & Architecture

*   **Zero Exposed Keys**: All multimodal processes, API calls, and WebRTC handshakes are routed through secure, authenticated backend proxies. No provider keys are exposed to the browser.
*   **HMAC Webhooks**: The BullMQ worker communicates with the Next.js server via cryptographically verified (`sha256`) signatures.
*   **Granular Moderation**: All generated media and textual outputs pass through a `SafetyNode` and an async `ModerationQueue`, logging events to a durable `ModerationEvent` database for administrative review.

## 📄 License
Private Repository. All rights reserved.
