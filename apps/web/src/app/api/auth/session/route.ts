import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Since we don't have firebase-admin configured by default, we will just securely store
    // the ID token in an HTTP-only cookie to be checked by middleware. 
    // In a fully secure production environment, you should use firebase-admin to create a session cookie.
    
    // Set a secure HTTP-only cookie with a max age of 1 week
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      maxAge: 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ status: 'success' }, { status: 200 });
}
