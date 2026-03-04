import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth-helper";
import { NextRequest, NextResponse } from "next/server";

// Export endpoint - keep dynamic, no caching (fresh data for exports)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get Firebase user ID from token
    const userId = await getAuthenticatedUserId(req);

    // reuse query filtering logic from /api/transactions
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const format = (searchParams.get("format") || "csv").toLowerCase();

    const where: any = { userId };
    if (type && type !== "all") where.type = type;
    if (month && month !== "all") {
      const [y, m] = String(month).split("-");
      const startDate = new Date(parseInt(y), parseInt(m) - 1, 1);
      const endDate = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }

    const transactions = await prisma.transaction.findMany({ where, orderBy: { date: "desc" } });

    // build response based on format
    let body: string;
    let contentType: string;
    let filename: string;

    if (format === "json") {
      body = JSON.stringify(transactions, null, 2);
      contentType = "application/json";
      filename = "transactions.json";
    } else if (format === "pdf") {
      // Generate HTML formatted as PDF (can be printed to PDF)
      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const tableRows = transactions
        .slice(0, 200)
        .map((tx) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${tx.date ? new Date(tx.date).toLocaleDateString() : ''}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${tx.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${tx.amount?.toFixed(2) || '0.00'}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${tx.type || ''}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${tx.category || ''}</td>
          </tr>
        `)
        .join('');

      body = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              margin: 40px;
              background: white;
            }
            h1 {
              text-align: center;
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            .meta {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-bottom: 20px;
            }
            .summary {
              display: flex;
              gap: 20px;
              margin-bottom: 20px;
              justify-content: center;
            }
            .summary-item {
              padding: 10px 20px;
              border: 1px solid #ccc;
              border-radius: 4px;
              background: #f9f9f9;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              font-weight: bold;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #1a1a1a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #f0f0f0;
              padding: 10px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background: #fafafa;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>Transaction Report</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()}</div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Income</div>
              <div class="summary-value">$${totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Expenses</div>
              <div class="summary-value">$${totalExpense.toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Net</div>
              <div class="summary-value" style="color: ${totalIncome - totalExpense >= 0 ? '#4CAF50' : '#f44336'};">$${(totalIncome - totalExpense).toFixed(2)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          ${transactions.length > 200 ? `<div class="footer">... and ${transactions.length - 200} more transactions (showing first 200)</div>` : ''}
          
          <div class="footer">
            <p>This PDF was generated from SmartBudget | ${new Date().getFullYear()}</p>
            <p style="margin-top: 10px; font-size: 10px;">Note: This is an HTML file that can be printed to PDF using your browser's print function (Ctrl+P or Cmd+P).</p>
          </div>
        </body>
        </html>
      `;
      contentType = "text/html; charset=utf-8";
      filename = "transactions.html";
    } else {
      // csv
      if (transactions.length === 0) {
        body = "date,description,amount,type,category,tag,vat,churchTax,employmentStatus\n";
      } else {
        const header = ['date', 'description', 'amount', 'type', 'category', 'tag', 'vat', 'churchTax', 'employmentStatus'].join(",");
        const rows = transactions
          .map((tx) => [
            tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
            `"${String(tx.description).replace(/"/g, '""')}"`,
            tx.amount || 0,
            tx.type || '',
            tx.category || '',
            `"${String(tx.tag || '').replace(/"/g, '""')}"`,
            tx.vat || 0,
            tx.churchTax || 0,
            tx.employmentStatus || '',
          ].join(","))
          .join("\n");
        body = header + "\n" + rows;
      }
      contentType = "text/csv";
      filename = "transactions.csv";
    }

    // For PDF, return as HTML that can be printed; for others, download
    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };

    if (format === "pdf") {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("GET /api/transactions/export error:", err);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
