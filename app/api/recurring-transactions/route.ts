import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recurringTransactions);
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);

    const body = await request.json();
    const {
      frequency,
      interval = 1,
      startDate,
      endDate,
      type,
      amount,
      category,
      description,
      autoCreate = true,
    } = body;

    if (!frequency || !startDate || !type || !category || !description || amount === undefined || amount === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate next due date
    const start = new Date(startDate);
    const nextDue = calculateNextDueDate(start, frequency, interval);

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        userId,
        frequency,
        interval,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDue,
        isActive: true,
        autoCreate,
        type,
        amount: parseFloat(String(amount)),
        category,
        description,
      },
    });

    // Create the initial transaction
    await prisma.transaction.create({
      data: {
        userId,
        recurringId: recurringTransaction.id,
        type,
        amount: parseFloat(String(amount)),
        category,
        description,
        date: start,
      },
    });

    // Fetch the complete recurring transaction with transactions
    const completeRecurringTransaction = await prisma.recurringTransaction.findUnique({
      where: { id: recurringTransaction.id },
      include: { transactions: true },
    });

    return NextResponse.json(completeRecurringTransaction, { status: 201 });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
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
