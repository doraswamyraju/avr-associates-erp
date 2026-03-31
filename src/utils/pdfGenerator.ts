import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Client } from '../../types';

export const generateInvoicePDF = (invoice: Invoice, client: Client | undefined) => {
    // A4 size: 210 x 297 mm
    const doc = new jsPDF({ format: 'a4', unit: 'mm' });

    // --- Fonts & Colors ---
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo 600
    const textColor: [number, number, number] = [51, 65, 85]; // Slate 700
    const lightText: [number, number, number] = [100, 116, 139]; // Slate 500
    
    // --- Header ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AVR Associates', 140, 15);
    doc.text('Chartered Accountants', 140, 20);
    doc.text('Shop No 12, Main Road', 140, 25);
    doc.text('Amalapuram, AP - 533201', 140, 30);
    doc.text('GSTIN: 37AACCA1234F1Z1', 140, 35); // Example AVR GSTIN

    // --- Invoice Info & Client Info ---
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', 14, 50);
    doc.setFont('helvetica', 'normal');
    // @ts-ignore
    doc.text(invoice.invoiceNumber || invoice.id, 50, 50);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 14, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.date, 50, 56);

    if (invoice.dueDate) {
        doc.setFont('helvetica', 'bold');
        doc.text('Due Date:', 14, 62);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.dueDate, 50, 62);
    }

    // Client Details
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 120, 50);
    
    doc.setFontSize(11);
    doc.text(client?.name || invoice.clientName, 120, 56);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    if (client) {
        if (client.address) doc.text(client.address, 120, 62);
        if (client.city) doc.text(`${client.city}, ${client.state} - ${client.pincode}`, 120, 67);
        if (client.gstin) {
            doc.setFont('helvetica', 'bold');
            doc.text(`GSTIN: ${client.gstin}`, 120, 73);
            doc.setFont('helvetica', 'normal');
        } else {
            doc.text('GSTIN: Unregistered', 120, 73);
        }
    }

    // --- Table ---
    let startY = 85;

    // Check if items are strings (old mock data) or objects (new format)
    const tableBody = invoice.items.map((item, index) => {
        if (typeof item === 'string') {
            return [index + 1, item, '-', '1', '-', '-'];
        }
        return [
            index + 1,
            item.description,
            item.hsnSac || '-',
            item.quantity || 1,
            `Rs ${item.rate?.toLocaleString() || 0}`,
            `Rs ${item.amount?.toLocaleString() || 0}`
        ];
    });

    autoTable(doc, {
        startY: startY,
        head: [['#', 'Description of Services', 'HSN/SAC', 'Qty', 'Rate', 'Amount']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 80 },
            2: { cellWidth: 25 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 30 },
            5: { halign: 'right', cellWidth: 30 }
        }
    });

    // --- Calculations ---
    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY + 10;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    
    const labelX = 135;
    const valueX = 180;
    
    if (invoice.subTotal) {
        doc.text('Sub Total:', labelX, finalY);
        doc.text(`Rs ${invoice.subTotal.toLocaleString()}`, valueX, finalY, { align: 'right' });
        finalY += 6;
        
        if (invoice.cgst) {
            doc.text('CGST:', labelX, finalY);
            doc.text(`Rs ${invoice.cgst.toLocaleString()}`, valueX, finalY, { align: 'right' });
            finalY += 6;
        }
        if (invoice.sgst) {
            doc.text('SGST:', labelX, finalY);
            doc.text(`Rs ${invoice.sgst.toLocaleString()}`, valueX, finalY, { align: 'right' });
            finalY += 6;
        }
        if (invoice.igst) {
            doc.text('IGST:', labelX, finalY);
            doc.text(`Rs ${invoice.igst.toLocaleString()}`, valueX, finalY, { align: 'right' });
            finalY += 6;
        }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Amount:', labelX, finalY + 4);
    doc.text(`Rs ${invoice.amount.toLocaleString()}`, valueX, finalY + 4, { align: 'right' });
    
    // Line under total
    doc.setLineWidth(0.5);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(labelX - 5, finalY + 6, valueX + 5, finalY + 6);
    
    // Amount in words (Basic stub, you can expand this if needed)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('Amount Chargeable (in words):', 14, finalY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(`Indian Rupees ${invoice.amount.toLocaleString()} Only`, 14, finalY + 5);

    // --- Footer / Bank Details ---
    finalY += 25;
    
    const pageHeight = doc.internal.pageSize.height;
    if (finalY > pageHeight - 40) {
        doc.addPage();
        finalY = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 14, finalY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Bank Name: State Bank of India', 14, finalY + 5);
    doc.text('Account No: 31234567890', 14, finalY + 10);
    doc.text('IFSC Code: SBIN0001234', 14, finalY + 15);
    doc.text('Branch: Amalapuram', 14, finalY + 20);

    // Signature
    doc.setFont('helvetica', 'bold');
    doc.text('For AVR Associates', 150, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(lightText[0], lightText[1], lightText[2]);
    doc.text('Authorized Signatory', 150, finalY + 20);

    // Terms
    doc.setFontSize(8);
    doc.text('Terms & Conditions:', 14, pageHeight - 15);
    doc.setFontSize(7);
    doc.text('1. Payment is due within 15 days of invoice date.', 14, pageHeight - 10);
    doc.text('2. Interest @ 18% p.a. will be charged if payment is delayed.', 14, pageHeight - 6);

    // Handle saving
    doc.save(`${invoice.invoiceNumber || invoice.id}_${client?.name.substring(0, 10).trim() || 'Invoice'}.pdf`);
};
