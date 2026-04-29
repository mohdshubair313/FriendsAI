import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log("[TEST-ORCHESTRATE] Starting test...");
  
  try {
    // Get auth
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    console.log("[TEST-ORCHESTRATE] Token:", token?.id);
    
    if (!token?.id) {
      return NextResponse.json({ 
        error: "Unauthorized - No token", 
        debug: "Need to be logged in" 
      }, { status: 401 });
    }

    // Get body
    const body = await req.json();
    console.log("[TEST-ORCHESTRATE] Body received:", JSON.stringify(body).slice(0, 200));
    
    const { messages, mood } = body;
    
    // Simple test response - bypass LangGraph completely for testing
    const lastMessage = messages?.[messages?.length - 1]?.content || "empty";
    console.log("[TEST-ORCHESTRATE] Last message:", lastMessage);
    
    // Return a simple response
    const responseText = `Hi there! I received your message: "${lastMessage}". This is a test response to verify the pipeline is working. The full AI pipeline will be enabled after we verify this test works.`;
    
    return NextResponse.json({
      success: true,
      testResponse: responseText,
      debug: {
        userId: token.id,
        mood: mood,
        messageReceived: lastMessage
      }
    });

  } catch (error) {
    console.error("[TEST-ORCHESTRATE] Error:", error);
    return NextResponse.json({ 
      error: "Test failed", 
      details: String(error) 
    }, { status: 500 });
  }
}