import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify user owns this transaction
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: body.type || existing.type,
        amount: body.amount ? parseFloat(String(body.amount)) : existing.amount,
        category: body.category || existing.category,
        description: body.description || existing.description,
        date: body.date ? new Date(body.date) : existing.date,
        tag: body.tag !== undefined ? body.tag : existing.tag,
        bundesland: body.bundesland !== undefined ? (body.bundesland || null) : existing.bundesland,
        vat: body.vat !== undefined ? (body.vat ? parseFloat(String(body.vat)) : null) : existing.vat,
        churchTax: body.churchTax !== undefined ? (body.applyChurchTax && body.churchTax ? parseFloat(String(body.churchTax)) : null) : existing.churchTax,
        applyChurchTax: body.applyChurchTax !== undefined ? !!body.applyChurchTax : existing.applyChurchTax,
        municipalTaxRange: body.municipalTaxRange !== undefined ? (body.municipalTaxRange ? JSON.stringify(body.municipalTaxRange) : null) : existing.municipalTaxRange,
        employmentStatus: body.employmentStatus !== undefined ? (body.employmentStatus || null) : existing.employmentStatus,
        taxClass: body.taxClass !== undefined ? (body.taxClass ? parseInt(String(body.taxClass)) : null) : existing.taxClass,
        hasKinder: body.hasKinder !== undefined ? !!body.hasKinder : existing.hasKinder,
        salaryAllocation: body.salaryAllocation !== undefined ? (body.salaryAllocation ? JSON.stringify(body.salaryAllocation) : null) : existing.salaryAllocation,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/transactions/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify user owns this transaction
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/transactions/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
