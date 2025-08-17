
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the Adobe Embed API client ID from environment variables
    const clientId = process.env.NEXT_PUBLIC_PDF_EMBED_API_KEY;

    // Check if the client ID is configured
    if (!clientId) {
      console.error('ADOBE_EMBED_API_KEY environment variable is not set');
      return NextResponse.json(
        {
          error: 'Adobe Embed API key not configured',
          message: 'Please set ADOBE_EMBED_API_KEY environment variable'
        },
        { status: 500 }
      );
    }

    // Return the client ID for frontend use
    return NextResponse.json({
      clientId: clientId.trim()
    });

  } catch (error) {
    console.error('Error fetching Adobe configuration:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve Adobe configuration'
      },
      { status: 500 }
    );
  }
}

// Ensure only GET method is allowed
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
