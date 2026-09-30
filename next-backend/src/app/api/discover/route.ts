import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch users based on filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const gender = searchParams.get('gender');
    const language = searchParams.get('language');
    const onlineOnly = searchParams.get('onlineOnly') === 'true';
    const currentUserId = searchParams.get('currentUserId');

    let whereClause: any = {};

    // Exclude current user from results
    if (currentUserId) {
      whereClause.id = { not: currentUserId };
    }

    // Apply filters if provided
    if (district) whereClause.district = district;
    if (gender) whereClause.gender = gender;
    if (language) whereClause.language = language;
    if (onlineOnly) whereClause.isOnline = true;

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        interests: {
          include: {
            interest: true,
          }
        }
      },
      take: 50, // Limit to 50 users per request
      orderBy: { lastSeen: 'desc' },
    });

    // Map data to match frontend expectations
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.generatedName,
      district: user.district,
      gender: user.gender,
      lang: user.language,
      online: user.isOnline,
      interests: user.interests.map(ui => ui.interest.name),
    }));

    return NextResponse.json({ success: true, users: mappedUsers });
  } catch (error) {
    console.error('Discover API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
