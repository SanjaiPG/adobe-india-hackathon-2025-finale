// app/api/config/adobe/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Read Adobe Embed API client ID from environment
    const clientId = process.env.NEXT_PUBLIC_PDF_EMBED_API_KEY;

    // If not set, return 500 error
    if (!clientId) {
      console.error('ADOBE_EMBED_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Adobe Embed API key not configured' },
        { status: 500 }
      );
    }

    // Return the client ID to the frontend
    return NextResponse.json({ clientId: clientId.trim() });
  } catch (error) {
    console.error('Error fetching Adobe configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disallow other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
