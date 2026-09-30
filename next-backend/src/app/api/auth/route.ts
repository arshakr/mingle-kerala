import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Register or login an anonymous user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, district, gender, language, interests } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if user exists (mock login), or create new (mock signup)
    let user = await prisma.user.findUnique({
      where: { generatedName: username },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          generatedName: username,
          district: district || null,
          gender: gender || null,
          language: language || null,
        },
      });

      // Handle interests if provided
      if (interests && Array.isArray(interests)) {
        for (const interestName of interests) {
          let interest = await prisma.interest.findUnique({ where: { name: interestName } });
          if (!interest) {
            interest = await prisma.interest.create({ data: { name: interestName } });
          }
          await prisma.userInterest.create({
            data: { userId: user.id, interestId: interest.id },
          });
        }
      }
    } else {
      // Update last seen and online status
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
