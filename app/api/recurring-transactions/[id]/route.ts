import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: {
        id,
        userId,
      },
      include: { transactions: true },
    });

    if (!recurringTransaction) {
      return NextResponse.json({ error: 'Recurring transaction not found' }, { status: 404 });
    }

    return NextResponse.json(recurringTransaction);
  } catch (error) {
    console.error('Error fetching recurring transaction:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

    const body = await request.json();
    const {
      frequency,
      interval,
      startDate,
      endDate,
      autoCreate,
      isActive,
      type,
      amount,
      category,
      description,
    } = body;

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

    // Calculate next due date if frequency or interval changed
    let nextDue = existing.nextDue;
    if (frequency !== existing.frequency || interval !== existing.interval) {
      const start = new Date(startDate || existing.startDate);
      nextDue = calculateNextDueDate(start, frequency, interval);
    }

    const updatedRecurringTransaction = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        frequency,
        interval,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        nextDue,
        autoCreate,
        isActive,
      },
      include: { transactions: true },
    });

    // Update the associated transaction if details provided
    if (type !== undefined || amount !== undefined || category !== undefined || description !== undefined) {
      const transaction = await prisma.transaction.findFirst({
        where: {
          recurringId: id,
          userId,
        },
      });
      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            type: type !== undefined ? type : undefined,
            amount: amount !== undefined ? parseFloat(String(amount)) : undefined,
            category: category !== undefined ? category : undefined,
            description: description !== undefined ? description : undefined,
          },
        });
      }
    }

    return NextResponse.json(updatedRecurringTransaction);
  } catch (error) {
    console.error('Error updating recurring transaction:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { id } = await context.params;

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

    // Delete associated transactions first
    await prisma.transaction.deleteMany({
      where: { recurringId: id, userId },
    });

    await prisma.recurringTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateNextDueDate(startDate: Date, frequency: string, interval: number): Date {
  const nextDue = new Date(startDate);

  switch (frequency) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + interval);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + (interval * 7));
      break;
    case 'biweekly':
      nextDue.setDate(nextDue.getDate() + (interval * 14));
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + interval);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + (interval * 3));
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + interval);
      break;
    default:
      nextDue.setDate(nextDue.getDate() + interval); // Default to daily
  }

  return nextDue;
}
