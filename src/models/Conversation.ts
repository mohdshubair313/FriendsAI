import mongoose, { Schema, Types, Document } from "mongoose";

// ─── Conversation ────────────────────────────────────────────────────────────
export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title?: string;
  lastMood?: string;
  lastSentimentScore?: number;
  agentRoute?: string;
  pinned: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: String,
    lastMood: String,
    lastSentimentScore: Number,
    agentRoute: String,
    pinned: { type: Boolean, default: false },
    archivedAt: Date,
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const Conversation =
  mongoose.models?.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);

// ─── Message Parts ───────────────────────────────────────────────────────────
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "image"; mediaJobId: Types.ObjectId; url?: string }
  | { type: "audio"; url: string; durationMs: number }
  | { type: "card"; cardType: "game" | "music" | "show"; payload: Record<string, unknown> }
  | { type: "tool-call"; toolName: string; args: unknown; result?: unknown }
  | { type: "tool-result"; toolName: string; result: unknown };

// ─── Message ─────────────────────────────────────────────────────────────────
export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  role: "user" | "assistant" | "tool" | "system";
  content: string; // Plain text fallback or combined parts
  parts: MessagePart[];
  
  // High-fidelity persistence for LangGraph
  rawLangChainMessage?: any; 
  
  // Agentic traces for observability (Section 9)
  trace?: {
    agentName: string;
    nodePath: string[];
    latencyMs: number;
    metadata?: Record<string, any>;
  };

  tokenUsage?: { input: number; output: number; modelId: string };
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "tool", "system"],
      required: true,
    },
    content: { type: String, default: "" },
    parts: { type: Schema.Types.Mixed, required: true, default: [] },
    
    rawLangChainMessage: { type: Schema.Types.Mixed },
    
    trace: {
      agentName: String,
      nodePath: [String],
      latencyMs: Number,
      metadata: Schema.Types.Mixed,
    },

    tokenUsage: {
      input: Number,
      output: Number,
      modelId: String,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message =
  mongoose.models?.Message ||
  mongoose.model<IMessage>("Message", messageSchema);
