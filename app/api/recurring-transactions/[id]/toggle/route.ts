import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Check if the recurring transaction exists and belongs to the user
    const existing = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    const updatedRecurringTransaction = await prisma.recurringTransaction.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updatedRecurringTransaction);
  } catch (error) {
    console.error('Error toggling recurring transaction:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
