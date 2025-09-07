import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { IProduct } from '../../layouts/products/models/product.model';

export interface ExportOptions {
  columns?: string[];
  includeStats?: boolean;
  filters?: {
    stockFaible?: boolean;
    stockEndommage?: boolean;
    margeNegative?: boolean;
    produitActif?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  /**
   * Exporte les données de produits vers un fichier Excel avec mise en forme
   * @param products - Liste des produits à exporter
   * @param fileName - Nom du fichier (optionnel)
   * @param currency - Devise pour le formatage des prix
   * @param options - Options d'export avancées
   */
  exportProductsToExcel(
    products: IProduct[], 
    fileName: string = 'produits-export', 
    currency: string = 'USD',
    options?: ExportOptions
  ): void {
    try {
      // Filtrer les produits selon les options
      let filteredProducts = this.filterProducts(products, options?.filters);
      
      // Préparer les données pour l'export
      const exportData = this.prepareProductData(filteredProducts, currency, options?.columns);
      
      // Créer un nouveau workbook
      const workbook = XLSX.utils.book_new();
      
      // Créer la feuille de calcul avec les données
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Appliquer la mise en forme
      this.applyFormattingToWorksheet(worksheet, exportData.length);
      
      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
      
      // Créer une feuille de résumé si demandé
      if (options?.includeStats !== false) {
        const summarySheet = this.createSummarySheet(filteredProducts, currency);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');
      }
      
      // Générer le fichier Excel
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        cellStyles: true
      });
      
      // Télécharger le fichier
      this.saveExcelFile(excelBuffer, fileName);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      throw new Error('Échec de l\'export Excel');
    }
  }

  /**
   * Filtre les produits selon les critères spécifiés
   */
  private filterProducts(products: IProduct[], filters?: ExportOptions['filters']): IProduct[] {
    if (!filters) return products;

    return products.filter(product => {
      if (filters.stockFaible && (product.stock || 0) >= 10) return false;
      if (filters.stockEndommage && (product.stock_endommage || 0) === 0) return false;
      if (filters.margeNegative && ((product.prix_vente || 0) - (product.prix_achat || 0)) >= 0) return false;
      if (filters.produitActif && (product.stock || 0) === 0) return false;
      return true;
    });
  }

  /**
   * Prépare les données de produits pour l'export
   */
  private prepareProductData(products: IProduct[], currency: string, selectedColumns?: string[]): any[] {
    return products.map((product, index) => {
      const marginBenefit = (product.prix_vente || 0) - (product.prix_achat || 0);
      const marginPercentage = product.prix_vente > 0 ? 
        ((marginBenefit / product.prix_vente) * 100).toFixed(2) : '0.00';
      
      const fullData = {
        'N°': index + 1,
        'Référence': product.reference || 'N/A',
        'Nom du Produit': product.name || 'N/A',
        'Description': product.description || 'N/A',
        'Unité de Vente': product.unite_vente || 'N/A',
        'Prix de Vente': this.formatCurrency(product.prix_vente || 0, currency),
        'Prix d\'Achat': this.formatCurrency(product.prix_achat || 0, currency),
        'Marge Bénéficiaire': this.formatCurrency(marginBenefit, currency),
        'Marge (%)': `${marginPercentage}%`,
        'TVA (%)': `${product.tva || 0}%`,
        'Remise (%)': `${product.remise || 0}%`,
        'Remise dès': `${product.remise_min_quantity || 0} ${product.unite_vente || 'unité'}${(product.remise_min_quantity || 0) > 1 ? 's' : ''}`,
        'Stock Disponible': `${product.stock || 0} ${product.unite_vente || 'unité'}${(product.stock || 0) > 1 ? 's' : ''}`,
        'Stock Endommagé': `${product.stock_endommage || 0} ${product.unite_vente || 'unité'}${(product.stock_endommage || 0) > 1 ? 's' : ''}`,
        'Restitution': `${product.restitution || 0} ${product.unite_vente || 'unité'}${(product.restitution || 0) > 1 ? 's' : ''}`,
        'Valeur du Stock': this.formatCurrency((product.stock || 0) * (product.prix_achat || 0), currency),
        'Date de Création': product.CreatedAt ? new Date(product.CreatedAt).toLocaleDateString('fr-FR') : 'N/A',
        'Dernière Modification': product.UpdatedAt ? new Date(product.UpdatedAt).toLocaleDateString('fr-FR') : 'N/A'
      };

      // Si des colonnes spécifiques sont sélectionnées, filtrer les données
      if (selectedColumns && selectedColumns.length > 0) {
        const filteredData: any = { 'N°': fullData['N°'] }; // Toujours inclure le numéro
        
        const columnMapping: { [key: string]: string } = {
          'reference': 'Référence',
          'name': 'Nom du Produit',
          'description': 'Description',
          'unite_vente': 'Unité de Vente',
          'prix_vente': 'Prix de Vente',
          'prix_achat': 'Prix d\'Achat',
          'marge': 'Marge Bénéficiaire',
          'tva': 'TVA (%)',
          'remise': 'Remise (%)',
          'stock': 'Stock Disponible',
          'stock_endommage': 'Stock Endommagé',
          'restitution': 'Restitution',
          'valeur_stock': 'Valeur du Stock',
          'dates': 'Date de Création'
        };

        selectedColumns.forEach(col => {
          const mappedColumn = columnMapping[col];
          if (mappedColumn && (fullData as any)[mappedColumn]) {
            filteredData[mappedColumn] = (fullData as any)[mappedColumn];
          }
        });

        // Ajouter aussi la date de modification si les dates sont sélectionnées
        if (selectedColumns.includes('dates')) {
          filteredData['Dernière Modification'] = fullData['Dernière Modification'];
        }

        return filteredData;
      }

      return fullData;
    });
  }

  /**
   * Crée une feuille de résumé avec des statistiques
   */
  private createSummarySheet(products: IProduct[], currency: string): XLSX.WorkSheet {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalStockValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.prix_achat || 0)), 0);
    const totalDamagedStock = products.reduce((sum, p) => sum + (p.stock_endommage || 0), 0);
    const totalRestitution = products.reduce((sum, p) => sum + (p.restitution || 0), 0);
    const averageSellingPrice = totalProducts > 0 ? 
      products.reduce((sum, p) => sum + (p.prix_vente || 0), 0) / totalProducts : 0;
    const averagePurchasePrice = totalProducts > 0 ? 
      products.reduce((sum, p) => sum + (p.prix_achat || 0), 0) / totalProducts : 0;
    
    // Produits avec stock faible (moins de 10)
    const lowStockProducts = products.filter(p => (p.stock || 0) < 10).length;
    
    // Produits les plus vendus (estimation basée sur le stock)
    const topProducts = products
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .slice(0, 5)
      .map(p => p.name);

    const summaryData = [
      { 'Indicateur': 'STATISTIQUES GÉNÉRALES', 'Valeur': '' },
      { 'Indicateur': 'Nombre total de produits', 'Valeur': totalProducts.toString() },
      { 'Indicateur': 'Stock total (toutes unités)', 'Valeur': totalStock.toString() },
      { 'Indicateur': 'Valeur totale du stock', 'Valeur': this.formatCurrency(totalStockValue, currency) },
      { 'Indicateur': 'Stock endommagé total', 'Valeur': totalDamagedStock.toString() },
      { 'Indicateur': 'Restitutions totales', 'Valeur': totalRestitution.toString() },
      { 'Indicateur': 'Prix de vente moyen', 'Valeur': this.formatCurrency(averageSellingPrice, currency) },
      { 'Indicateur': 'Prix d\'achat moyen', 'Valeur': this.formatCurrency(averagePurchasePrice, currency) },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'ALERTES ET ANALYSES', 'Valeur': '' },
      { 'Indicateur': 'Produits avec stock faible (<10)', 'Valeur': lowStockProducts.toString() },
      { 'Indicateur': 'Taux de produits endommagés (%)', 'Valeur': totalStock > 0 ? ((totalDamagedStock / totalStock) * 100).toFixed(2) + '%' : '0%' },
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'TOP 5 PRODUITS (par stock)', 'Valeur': '' },
      ...topProducts.map((name, index) => ({ 'Indicateur': `${index + 1}. ${name}`, 'Valeur': '' })),
      { 'Indicateur': '', 'Valeur': '' },
      { 'Indicateur': 'Date du rapport', 'Valeur': new Date().toLocaleString('fr-FR') }
    ];

    return XLSX.utils.json_to_sheet(summaryData);
  }

  /**
   * Applique la mise en forme à la feuille de calcul
   */
  private applyFormattingToWorksheet(worksheet: XLSX.WorkSheet, dataLength: number): void {
    // Définir la plage de données
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Largeurs de colonnes optimisées
    const columnWidths = [
      { wch: 5 },   // N°
      { wch: 15 },  // Référence
      { wch: 25 },  // Nom du Produit
      { wch: 30 },  // Description
      { wch: 12 },  // Unité de Vente
      { wch: 15 },  // Prix de Vente
      { wch: 15 },  // Prix d'Achat
      { wch: 18 },  // Marge Bénéficiaire
      { wch: 10 },  // Marge (%)
      { wch: 8 },   // TVA (%)
      { wch: 10 },  // Remise (%)
      { wch: 15 },  // Remise dès
      { wch: 18 },  // Stock Disponible
      { wch: 18 },  // Stock Endommagé
      { wch: 15 },  // Restitution
      { wch: 18 },  // Valeur du Stock
      { wch: 15 },  // Date de Création
      { wch: 20 }   // Dernière Modification
    ];
    
    worksheet['!cols'] = columnWidths;

    // Appliquer des styles pour les en-têtes (première ligne)
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Style pour les en-têtes
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Appliquer des styles pour les données (lignes 2 et suivantes)
    for (let row = 1; row <= dataLength; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        // Style alterné pour les lignes
        const isEvenRow = row % 2 === 0;
        worksheet[cellAddress].s = {
          alignment: { horizontal: "left", vertical: "center" },
          fill: { fgColor: { rgb: isEvenRow ? "F8F9FA" : "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "E5E5E5" } },
            bottom: { style: "thin", color: { rgb: "E5E5E5" } },
            left: { style: "thin", color: { rgb: "E5E5E5" } },
            right: { style: "thin", color: { rgb: "E5E5E5" } }
          }
        };

        // Style spécial pour les colonnes de prix et marges
        if (col >= 5 && col <= 7) { // Prix de vente, achat, marge
          worksheet[cellAddress].s!.alignment!.horizontal = "right";
        }

        // Style spécial pour les colonnes de pourcentages
        if (col === 8 || col === 9 || col === 10) { // Marge %, TVA %, Remise %
          worksheet[cellAddress].s!.alignment!.horizontal = "center";
        }
      }
    }

    // Figer la première ligne (en-têtes)
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  }

  /**
   * Formate une valeur monétaire
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Sauvegarde le fichier Excel
   */
  private saveExcelFile(buffer: any, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    saveAs(data, `${fileName}_${timestamp}.xlsx`);
  }

  /**
   * Exporte des produits filtrés selon des critères spécifiques
   */
  exportFilteredProducts(
    products: IProduct[], 
    filters: {
      stockFaible?: boolean;
      stockEndommage?: boolean;
      margeNegative?: boolean;
    },
    fileName: string = 'produits-filtres',
    currency: string = 'USD'
  ): void {
    let filteredProducts = [...products];

    if (filters.stockFaible) {
      filteredProducts = filteredProducts.filter(p => (p.stock || 0) < 10);
    }

    if (filters.stockEndommage) {
      filteredProducts = filteredProducts.filter(p => (p.stock_endommage || 0) > 0);
    }

    if (filters.margeNegative) {
      filteredProducts = filteredProducts.filter(p => 
        ((p.prix_vente || 0) - (p.prix_achat || 0)) < 0
      );
    }

    this.exportProductsToExcel(filteredProducts, fileName, currency);
  }
}
