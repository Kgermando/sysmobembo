import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { 
  IndicateursDeplacementResponse,
  AlertesTempsReelResponse,
  RepartitionGeographiqueResponse,
  ChartDataPoint,
  ChartSeries,
  RepartitionProvinceStats,
  EvolutionTemporelleStats,
  CauseDetailStats,
  AlertePrecoceStats,
  ZoneRisqueStats
} from './interfaces/deplacement.interface';
import { DeplacementService } from './services/deplacement.service';
import { ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexTitleSubtitle, ApexDataLabels, ApexStroke, ApexYAxis, ApexLegend, ApexPlotOptions } from 'ng-apexcharts';
import { ProvinceList } from '../../../../utils/province-list';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
  stroke: ApexStroke;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
};

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit, OnDestroy {
  @ViewChild('causesChart') causesChart!: ChartComponent;
  @ViewChild('provincesChart') provincesChart!: ChartComponent;
  
  private destroy$ = new Subject<void>();
  
  // États de chargement
  loading = true;
  error: string | null = null;
  
  // Données principales
  indicateurs: IndicateursDeplacementResponse | null = null;
  
  // Paramètres de filtre
  periodeSelectionnee = 12;
  provinceSelectionnee = '';
  
  // ApexCharts configuration for causes
  causesChartOptions: Partial<ChartOptions> = {};
  
  // ApexCharts configuration for provinces
  provincesChartOptions: Partial<ChartOptions> = {};
  
  // Données pour les graphiques
  
  // 📊 KPIs principaux
  totalPDI = 0;
  totalMigrants = 0;
  deplacesInternes = 0;
  personnesRetournees = 0;
  tauxRetour = 0;
  tauxDeplacementInterne = 0;
  mouvementsMassifs = 0;
  
  // 🍕 Graphique en secteurs - Causes de déplacement
  causesPieData: ChartDataPoint[] = [];
  
  // 📈 Graphique linéaire - Évolution temporelle
  evolutionLineData: ChartSeries[] = [];
  
  // 🗺️ Graphique en barres - Répartition géographique
  repartitionBarData: ChartDataPoint[] = [];
  
  // 👥 Graphique démographique
  demographiqueData: ChartDataPoint[] = [];
  
  // 🏠 Accès aux services
  servicesData: ChartDataPoint[] = [];
  
  // ⚠️ Zones à risque
  zonesRisqueData: ChartDataPoint[] = [];
  
  // 📋 Alertes récentes
  alertesRecentes: AlertePrecoceStats[] = [];
  
  // 🏆 Top provinces
  topProvinces: RepartitionProvinceStats[] = [];
  
  // Configuration des graphiques
  colorScheme = {
    domain: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  };
  
  gradient = true;
  showXAxis = true;
  showYAxis = true;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  animations = true;

  constructor(private deplacementService: DeplacementService) {
    this.initializeCausesChart();
    this.initializeProvincesChart();
  }

  // Getter pour les provinces de la RDC
  get provincesRdcOptions(): string[] {
    return ProvinceList;
  }
  
  private initializeCausesChart(): void {
    this.causesChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          distributed: true,
          borderRadius: 8,
          barHeight: '60%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          // Arrondir à 1 décimale maximum et supprimer les zéros inutiles
          const roundedVal = Math.round(parseFloat(val.toString()) * 10) / 10;
          return roundedVal % 1 === 0 ? roundedVal.toString() + '%' : roundedVal.toFixed(1) + '%';
        },
        style: {
          colors: ['#fff'],
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Pourcentage (%)'
        }
      },
      yaxis: {
        title: {
          text: 'Causes de déplacement'
        }
      },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
      title: {
        text: 'Répartition des causes de déplacement',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      legend: {
        show: false
      }
    };
  }
  
  private initializeProvincesChart(): void {
    this.provincesChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 500, // Augmenté de 400 à 500 pour la pleine largeur
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          distributed: true,
          borderRadius: 6,
          columnWidth: '60%' // Réduit de 70% à 60% pour un meilleur espacement
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          // Arrondir à 1 décimale maximum et supprimer les zéros inutiles
          const roundedVal = Math.round(parseFloat(val.toString()) * 10) / 10;
          return roundedVal % 1 === 0 ? roundedVal.toString() : roundedVal.toFixed(1);
        },
        style: {
          colors: ['#fff'],
          fontSize: '12px', // Augmenté de 11px à 12px
          fontWeight: 'bold'
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Provinces'
        },
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Nombre de PDI'
        }
      },
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF9F43', '#10AC84', '#5F27CD'],
      title: {
        text: 'Top 10 Provinces par nombre de PDI',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      legend: {
        show: false
      }
    };
  }

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les données du dashboard
   */
  chargerDonnees(): void {
    this.loading = true;
    this.error = null;

    // Utiliser les 3 endpoints optimisés du backend
    combineLatest([
      this.deplacementService.getIndicateursGeneraux(this.periodeSelectionnee, this.provinceSelectionnee),
      this.deplacementService.getAlertesTempsReel('danger,critical', this.provinceSelectionnee, 7),
      this.deplacementService.getRepartitionGeographique(this.periodeSelectionnee)
    ]).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: ([indicateurs, alertesResponse, repartitionResponse]) => {
        this.indicateurs = indicateurs;
        this.alertesRecentes = alertesResponse.alertes_actives || [];
        
        // Utiliser les données de répartition géographique globale pour une vue d'ensemble
        if (repartitionResponse && repartitionResponse.repartition_provinces) {
          this.indicateurs.volume_localisation.repartition_geographique = repartitionResponse.repartition_provinces;
        }
        
        this.preparerDonneesGraphiques();
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        console.error('Erreur API:', error);
      }
    });
  }

  /**
   * Prépare toutes les données pour les graphiques
   */
  private preparerDonneesGraphiques(): void {
    if (!this.indicateurs) return;

    // KPIs principaux
    this.preparerKPIs();
    
    // Graphiques
    this.preparerCausesPieChart();
    this.preparerEvolutionLineChart();
    this.preparerRepartitionBarChart();
    this.preparerDemographiqueChart();
    this.preparerServicesChart();
    this.preparerZonesRisqueChart();
    this.preparerTopProvinces();
  }

  /**
   * Prépare les indicateurs clés (KPIs)
   */
  private preparerKPIs(): void {
    if (!this.indicateurs) return;

    this.totalPDI = this.indicateurs.volume_localisation.nombre_total_pdi;
    this.totalMigrants = this.indicateurs.volume_localisation.nombre_total_migrants;
    this.deplacesInternes = this.indicateurs.volume_localisation.nombre_deplaces_internes;
    this.personnesRetournees = this.indicateurs.volume_localisation.personnes_retournees;
    this.mouvementsMassifs = this.indicateurs.dynamiques_alerte.mouvements_massifs_recent;
    
    // Calcul du taux de retour
    this.tauxRetour = this.totalPDI > 0 
      ? (this.personnesRetournees / this.totalPDI) * 100 
      : 0;
      
    // Calcul du taux de déplacement interne
    this.tauxDeplacementInterne = this.totalMigrants > 0 
      ? (this.deplacesInternes / this.totalMigrants) * 100 
      : 0;
  }

  /**
   * Prépare le graphique en secteurs des causes
   */
  private preparerCausesPieChart(): void {
    if (!this.indicateurs) return;

    const causes = this.indicateurs.causes_deplacements;
    this.causesPieData = [
      { name: 'Conflits armés', value: causes.pourcentage_conflits_armes },
      { name: 'Catastrophes naturelles', value: causes.pourcentage_catastrophes },
      { name: 'Persécution', value: causes.pourcentage_persecution },
      { name: 'Violence généralisée', value: causes.pourcentage_violence_generalisee },
      { name: 'Autres causes', value: causes.pourcentage_autres_causes }
    ].filter(item => item.value > 0);
    
    // Mettre à jour le graphique ApexCharts
    this.updateCausesChart();
  }
  
  /**
   * Met à jour le graphique ApexCharts des causes
   */
  private updateCausesChart(): void {
    if (this.causesPieData.length === 0) return;
    
    const series = [{
      name: 'Pourcentage',
      data: this.causesPieData.map(item => {
        // Arrondir à 1 décimale maximum
        return Math.round(item.value * 10) / 10;
      })
    }];
    
    const categories = this.causesPieData.map(item => item.name);
    
    this.causesChartOptions = {
      ...this.causesChartOptions,
      series: series,
      xaxis: {
        ...this.causesChartOptions.xaxis,
        categories: categories
      }
    };
  }

  /**
   * Prépare le graphique d'évolution temporelle
   */
  private preparerEvolutionLineChart(): void {
    if (!this.indicateurs) return;

    const evolution = this.indicateurs.volume_localisation.evolution_mensuelle;
    
    this.evolutionLineData = [
      {
        name: 'Nouveaux déplacés',
        series: evolution.map(item => ({
          name: item.periode,
          value: item.nouveaux_deplaces
        }))
      },
      {
        name: 'Retours',
        series: evolution.map(item => ({
          name: item.periode,
          value: item.retours
        }))
      },
      {
        name: 'Total cumulé',
        series: evolution.map(item => ({
          name: item.periode,
          value: item.total_cumule
        }))
      }
    ];
  }

  /**
   * Prépare le graphique de répartition géographique
   */
  private preparerRepartitionBarChart(): void {
    if (!this.indicateurs) return;

    this.repartitionBarData = this.indicateurs.volume_localisation.repartition_geographique
      .slice(0, 10) // Top 10 provinces
      .map(item => ({
        name: item.province,
        value: item.nombre_pdi
      }));
      
    // Mettre à jour le graphique ApexCharts
    this.updateProvincesChart();
  }
  
  /**
   * Met à jour le graphique ApexCharts des provinces
   */
  private updateProvincesChart(): void {
    if (this.repartitionBarData.length === 0) return;
    
    const series = [{
      name: 'Nombre de PDI',
      data: this.repartitionBarData.map(item => Math.round(item.value))
    }];
    
    const categories = this.repartitionBarData.map(item => item.name);
    
    this.provincesChartOptions = {
      ...this.provincesChartOptions,
      series: series,
      xaxis: {
        ...this.provincesChartOptions.xaxis,
        categories: categories
      }
    };
  }

  /**
   * Prépare le graphique démographique
   */
  private preparerDemographiqueChart(): void {
    if (!this.indicateurs) return;

    const demo = this.indicateurs.vulnerabilite_besoins.profil_demographique;
    this.demographiqueData = [
      { name: 'Femmes', value: demo.pourcentage_femmes },
      { name: 'Enfants', value: demo.pourcentage_enfants },
      { name: 'Personnes âgées', value: demo.pourcentage_ages },
      { name: 'Autres', value: 100 - demo.pourcentage_femmes - demo.pourcentage_enfants - demo.pourcentage_ages }
    ].filter(item => item.value > 0);
  }

  /**
   * Prépare le graphique d'accès aux services
   */
  private preparerServicesChart(): void {
    if (!this.indicateurs) return;

    const services = this.indicateurs.vulnerabilite_besoins.acces_services_base;
    this.servicesData = [
      { name: 'Eau', value: services.acces_eau },
      { name: 'Santé', value: services.acces_sante },
      { name: 'Éducation', value: services.acces_education },
      { name: 'Logement', value: services.acces_logement }
    ];
  }

  /**
   * Prépare les données des zones à risque
   */
  private preparerZonesRisqueChart(): void {
    if (!this.indicateurs) return;

    this.zonesRisqueData = this.indicateurs.dynamiques_alerte.zones_haut_risque
      .slice(0, 8) // Top 8 zones
      .map(zone => ({
        name: zone.zone,
        value: zone.population_risque,
        extra: {
          niveau: zone.niveau_risque,
          menace: zone.type_menace
        }
      }));
  }

  /**
   * Prépare le top des provinces avec des pourcentages arrondis
   */
  private preparerTopProvinces(): void {
    if (!this.indicateurs) return;

    this.topProvinces = this.indicateurs.volume_localisation.repartition_geographique
      .slice(0, 5) // Top 5
      .sort((a, b) => b.nombre_pdi - a.nombre_pdi)
      .map(province => ({
        ...province,
        pourcentage: Math.round(province.pourcentage * 10) / 10 // Arrondir à 1 décimale
      }));
  }

  /**
   * Change la période d'analyse
   */
  changerPeriode(periode: number): void {
    this.periodeSelectionnee = periode;
    this.chargerDonnees();
  }

  /**
   * Change la province sélectionnée
   */
  changerProvince(province: string): void {
    this.provinceSelectionnee = province;
    this.chargerDonnees();
  }

  /**
   * Actualise les données
   */
  actualiser(): void {
    this.chargerDonnees();
  }

  /**
   * Formate les nombres pour l'affichage
   */
  formaterNombre(nombre: number): string {
    if (nombre >= 1000000) {
      return (nombre / 1000000).toFixed(1) + 'M';
    } else if (nombre >= 1000) {
      return (nombre / 1000).toFixed(1) + 'K';
    }
    return nombre.toString();
  }

  /**
   * Formate les pourcentages en supprimant les décimales inutiles
   */
  formaterPourcentage(pourcentage: number): string {
    // Arrondir à 1 décimale maximum et supprimer les zéros inutiles
    const roundedVal = Math.round(pourcentage * 10) / 10;
    return roundedVal % 1 === 0 ? roundedVal.toString() + '%' : roundedVal.toFixed(1) + '%';
  }

  /**
   * Retourne la classe CSS selon le niveau de risque
   */
  getClasseRisque(niveau: string): string {
    switch (niveau?.toUpperCase()) {
      case 'CRITIQUE':
        return 'risque-critique';
      case 'ÉLEVÉ':
        return 'risque-eleve';
      case 'MOYEN':
        return 'risque-moyen';
      default:
        return 'risque-faible';
    }
  }

  /**
   * Retourne la classe CSS selon le niveau d'alerte
   */
  getClasseAlerte(niveau: string): string {
    switch (niveau?.toLowerCase()) {
      case 'critical':
        return 'alerte-critique';
      case 'danger':
        return 'alerte-danger';
      case 'warning':
        return 'alerte-warning';
      default:
        return 'alerte-info';
    }
  }

  /**
   * Méthodes utilitaires pour les graphiques CSS
   */
  getMaxValue(series: any[]): number {
    if (!series || series.length === 0) return 1;
    return Math.max(...series.map(item => item.value));
  }

  getRetourValue(periode: string): number {
    const retourSeries = this.evolutionLineData[1]?.series;
    if (!retourSeries) return 0;
    const item = retourSeries.find(s => s.name === periode);
    return item ? item.value : 0;
  }

  getCumuleValue(periode: string): number {
    const cumuleSeries = this.evolutionLineData[2]?.series;
    if (!cumuleSeries) return 0;
    const item = cumuleSeries.find(s => s.name === periode);
    return item ? item.value : 0;
  }

  getMaxBarValue(): number {
    if (!this.repartitionBarData || this.repartitionBarData.length === 0) return 1;
    return Math.max(...this.repartitionBarData.map(item => item.value));
  }

  getColorByIndex(index: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[index % colors.length];
  }

  getServiceColor(serviceName: string): string {
    const serviceColors: { [key: string]: string } = {
      'Eau': '#4ECDC4',
      'Santé': '#FF6B6B',
      'Éducation': '#45B7D1',
      'Logement': '#96CEB4'
    };
    return serviceColors[serviceName] || '#FFEAA7';
  }

  getBarHeight(value: number, seriesIndex: number): number {
    const series = this.evolutionLineData[seriesIndex]?.series;
    if (!series || series.length === 0) return 0;
    const maxValue = this.getMaxValue(series);
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }
}
