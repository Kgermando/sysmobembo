import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ICommandeLine } from '../../layouts/commandes/models/commandeLine.model';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  constructor() { }

  generateInvoice(dataList: ICommandeLine[]) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 100] // Format pour une petite imprimante POS
    });

    // En-tête de la facture
    doc.setFontSize(10);
    doc.text('Facture', 10, 10);
    doc.setFontSize(8);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 20);

    // Table des produits
    const startY = 30;
    (doc as any).autoTable({
      head: [['Désignation', 'Qté', 'P.U', 'TVA', 'Total']],
      body: dataList.map((item: any) => [
        item.Product!.name,
        item.quantity,
        item.Product!.prix_vente,
        item.Product!.tva,
        (item.quantity * item.Product!.prix_vente),
      ]),
      startY,
      theme: 'plain',
      headStyles: {
        fontSize: 8,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0]
      },
      bodyStyles: {
        fontSize: 7
      },
      styles: {
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      }
    });

    const finalY = (doc as any).autoTable.previous.finalY || startY;

    // Calcul des totaux
    const subtotalTVA = dataList.filter((f:ICommandeLine) => f.Product!.tva === 16).reduce((acc: number, item: ICommandeLine) => acc + item.quantity * item.Product!.prix_vente, 0);
    const subtotalSansTVA = dataList.filter((f:ICommandeLine) => f.Product!.tva !== 16).reduce((acc: number, item: ICommandeLine) => acc + item.quantity * item.Product!.prix_vente, 0);
    
    const tva = subtotalTVA * 0.16; // Par exemple, TVA à 16%
    const total = subtotalTVA + subtotalSansTVA + tva;

    const subtotal = subtotalTVA + subtotalSansTVA;

    // Totaux
    doc.text(`Sous-total: ${subtotal} $`, 10, finalY + 10);
    doc.text(`TVA (16%): ${tva} $`, 10, finalY + 20);
    doc.text(`Total: ${total} $`, 10, finalY + 30);

    // Sauvegarder le PDF
    const date = new Date().getMilliseconds()
    doc.save(`facture-${date}.pdf`);
  }
}