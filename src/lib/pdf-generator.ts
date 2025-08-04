"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Session } from "./types";

export function generateSessionPDF(allSessions: Session[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Document Properties ---
  doc.setDocumentProperties({
    title: 'PlayStation Sessions Report',
  });
  doc.setLanguage('en');

  // --- Header ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PlayStation Sessions Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, 28, { align: 'center' });

  // --- Data Processing ---
  const consoles = ['PS4', 'PS3', 'PS2', 'PS1'];
  const completedSessions = allSessions.filter(s => s.status === 'completed');
  let grandTotal = 0;
  let startY = 40;

  // --- Loop through each console ---
  consoles.forEach(consoleName => {
    const sessions = completedSessions.filter(s => s.console_name === consoleName);
    if (sessions.length === 0) return; // Skip if no sessions for this console

    const consoleTotal = sessions.reduce((sum, s) => sum + (s.price || 0), 0);
    grandTotal += consoleTotal;

    const tableBody = sessions.map(s => [
      new Date(s.created_at).toLocaleDateString('en-CA'), // YYYY-MM-DD for consistency
      s.start_time ? new Date(s.start_time).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute:'2-digit' }) : 'N/A',
      s.end_time ? new Date(s.end_time).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute:'2-digit' }) : 'N/A',
      s.duration?.toFixed(2) ?? 'N/A',
      s.price?.toFixed(2) ?? 'N/A',
    ]);

    // Check for page overflow before drawing table
    const tableHeight = (sessions.length + 2) * 10 + 20;
    if (startY + tableHeight > doc.internal.pageSize.getHeight()) {
        doc.addPage();
        startY = 20; // Reset Y position for new page
    }

    // Console Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`🎮 ${consoleName} Sessions`, 14, startY);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Date', 'Start Time', 'End Time', 'Duration (H)', 'Price (EGP)']],
      body: tableBody,
      foot: [[
        { 
          content: `Total Revenue for ${consoleName}: ${consoleTotal.toFixed(2)} EGP`, 
          colSpan: 5, 
          styles: { halign: 'right', fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#000' } 
        }
      ]],
      headStyles: { 
        fillColor: '#6A11CB', 
        textColor: '#FFFFFF',
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        halign: 'center', 
        font: 'helvetica',
        cellPadding: 2
      },
      theme: 'grid',
    });

    startY = (doc as any).lastAutoTable.finalY + 15; // Update Y for next table
  });

  // --- Grand Total Section ---
  if (grandTotal > 0) {
    if (startY + 20 > doc.internal.pageSize.getHeight()) {
      doc.addPage();
      startY = 20;
    }
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Summary', pageWidth / 2, startY, { align: 'center' });
    
    autoTable(doc, {
        startY: startY + 8,
        body: [
            [{ content: 'Grand Total Revenue (All Consoles)', styles: { fontStyle: 'bold', halign: 'left' } }, 
             { content: `${grandTotal.toFixed(2)} EGP`, styles: { fontStyle: 'bold', halign: 'right' } }],
        ],
        theme: 'striped',
        styles: { fontSize: 14 }
    });
  }


  // --- Save the PDF ---
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Yuri_Game_Time_Report_${dateStr}.pdf`);
}
