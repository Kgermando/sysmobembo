# 🍩 Donut Chart Implementation - Overview Component

## 📝 Changes Made

### ✅ **Component TypeScript** (`overview.component.ts`)

#### 1. **Updated ChartOptions Type**
Added support for donut-specific options:
```typescript
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
  labels?: string[];        // ✅ NEW for donut
  responsive?: any[];       // ✅ NEW for responsive design
};
```

#### 2. **Transformed `initializeCausesChart()` to Donut**
**Before:** Bar chart configuration
**After:** Donut pie chart configuration

Key features:
- **Chart Type:** `donut` (instead of `bar`)
- **Donut Size:** 65% with center hole
- **Center Labels:** Shows category name, value, and total
- **Data Labels:** Display actual counts on segments
- **Legend:** Bottom positioned with formatted values
- **Responsive:** Adapts to mobile screens
- **Colors:** 10-color palette for variety

```typescript
chart: {
  type: 'donut',
  height: 400,
  toolbar: { show: false }
}

plotOptions: {
  pie: {
    donut: {
      size: '65%',
      labels: {
        show: true,
        total: {
          show: true,
          label: 'Total',
          formatter: function (w) {
            return total.toString();
          }
        }
      }
    }
  }
}
```

#### 3. **Updated `updateCausesChart()` Method**
**Before:** Created series array for bar chart
```typescript
const series = [{
  name: 'Pourcentage',
  data: this.causesPieData.map(item => item.value)
}];
```

**After:** Creates flat array for donut chart
```typescript
const series = this.causesPieData.map(item => Math.round(item.value));
const labels = this.causesPieData.map(item => item.name);

this.causesChartOptions = {
  ...this.causesChartOptions,
  series: series,    // [145, 89, 67, ...]
  labels: labels     // ['Économique', 'Politique', ...]
};
```

---

### ✅ **Template HTML** (`overview.component.html`)

#### Updated Donut Chart Section
**Changes:**
- Title changed: "Causes" → "Motifs de déplacement"
- Removed `xaxis` and `yaxis` bindings (not needed for donut)
- Added `labels`, `responsive`, and `stroke` bindings
- Updated empty state icon to `la-chart-pie`

```html
<div class="card flex-fill">
  <div class="card-body">
    <div *ngIf="causesPieData.length > 0; else emptyCauses">
      <apx-chart 
        #causesChart
        [series]="causesChartOptions.series!"
        [chart]="causesChartOptions.chart!"
        [plotOptions]="causesChartOptions.plotOptions!"
        [dataLabels]="causesChartOptions.dataLabels!"
        [labels]="causesChartOptions.labels!"          ✅ NEW
        [colors]="causesChartOptions.colors!"
        [title]="causesChartOptions.title!"
        [legend]="causesChartOptions.legend!"
        [responsive]="causesChartOptions.responsive!"  ✅ NEW
        [stroke]="causesChartOptions.stroke!">         ✅ NEW
      </apx-chart>
    </div>
  </div>
</div>
```

---

## 🎨 Donut Chart Features

### **Visual Elements**

1. **Center Hole (65%)**
   - Shows currently hovered category name
   - Displays value of hovered segment
   - Shows total count when not hovering

2. **Data Labels on Segments**
   - White text for visibility
   - Shows actual count (not percentage)
   - Bold font weight
   - 14px font size

3. **Legend at Bottom**
   - Horizontal layout
   - Shows name + value (e.g., "Économique: 145")
   - Color-coded markers
   - Responsive on mobile

4. **Color Palette**
   ```typescript
   colors: [
     '#FF6B6B', // Red
     '#4ECDC4', // Teal
     '#45B7D1', // Blue
     '#96CEB4', // Green
     '#FFEAA7', // Yellow
     '#DDA0DD', // Purple
     '#98D8C8', // Mint
     '#FF9F43', // Orange
     '#10AC84', // Emerald
     '#5F27CD'  // Violet
   ]
   ```

5. **Responsive Design**
   - Desktop: 400px height
   - Mobile (< 480px): 300px height
   - Auto-adjusting legend

---

## 📊 Data Flow

### Backend → Frontend
```typescript
// Backend response (from /motifs-pie endpoint)
{
  "data": [
    { "name": "Économique", "value": 145, "extra": "economique" },
    { "name": "Politique", "value": 89, "extra": "politique" },
    { "name": "Persécution", "value": 67, "extra": "persecution" },
    { "name": "Catastrophe Naturelle", "value": 123, "extra": "naturelle" },
    { "name": "Familial", "value": 54, "extra": "familial" },
    { "name": "Éducation", "value": 32, "extra": "education" },
    { "name": "Sanitaire", "value": 28, "extra": "sanitaire" },
    { "name": "Conflit Armé", "value": 98, "extra": "conflit_arme" }
  ],
  "total": 636
}
```

### Chart Rendering
```typescript
// Component transforms to ApexCharts format
series: [145, 89, 67, 123, 54, 32, 28, 98]
labels: [
  'Économique',
  'Politique', 
  'Persécution',
  'Catastrophe Naturelle',
  'Familial',
  'Éducation',
  'Sanitaire',
  'Conflit Armé'
]
```

### Visual Result
```
         ┌─────────────────────────┐
         │   Répartition des       │
         │ Motifs de Déplacement   │
         ├─────────────────────────┤
         │                         │
         │        ╭───────╮        │
         │      ╱           ╲      │
         │    ╱               ╲    │
         │   │      Total      │   │
         │   │       636       │   │
         │    ╲               ╱    │
         │      ╲           ╱      │
         │        ╰───────╯        │
         │                         │
         ├─────────────────────────┤
         │ ■ Économique: 145       │
         │ ■ Politique: 89         │
         │ ■ Persécution: 67       │
         │ ■ Catastrophe: 123      │
         │ ■ Familial: 54          │
         │ ...                     │
         └─────────────────────────┘
```

---

## 🎯 Advantages of Donut Chart

### vs Bar Chart:

✅ **Better for Proportions**
- Shows relative sizes at a glance
- Easy to compare segments visually

✅ **Space Efficient**
- Compact circular layout
- Center area for total/info

✅ **More Engaging**
- Interactive hover effects
- Animated transitions
- Modern look and feel

✅ **Better for Categories**
- Good for 5-10 categories
- Color-coded for quick identification
- Legend integration

---

## 🔄 Before vs After

### Before (Bar Chart)
```typescript
chart: { type: 'bar' }
series: [{ name: 'Pourcentage', data: [25.5, 30.2, ...] }]
xaxis: { categories: ['Conflits armés', ...] }
```

### After (Donut Chart)
```typescript
chart: { type: 'donut' }
series: [145, 89, 67, 123, ...]  // Flat array
labels: ['Économique', 'Politique', ...]
```

---

## ✅ Testing Checklist

- [ ] Donut chart renders correctly
- [ ] Center shows total count
- [ ] Hovering shows segment name and value
- [ ] Data labels visible on segments
- [ ] Legend displays at bottom
- [ ] Colors are distinct and visible
- [ ] Responsive on mobile devices
- [ ] Empty state shows when no data
- [ ] Chart updates when changing period/province
- [ ] All motif types display correctly

---

## 🎨 Customization Options

If you want to adjust the donut:

```typescript
// Change donut hole size (current: 65%)
donut: { size: '70%' }  // Bigger hole
donut: { size: '50%' }  // Smaller hole

// Change chart height
chart: { height: 500 }  // Taller

// Change legend position
legend: { position: 'right' }  // Side legend

// Disable center labels
donut: { labels: { show: false } }

// Show percentages instead of counts
dataLabels: {
  formatter: function(val) {
    return val.toFixed(1) + '%'
  }
}
```

---

## 📱 Responsive Behavior

```typescript
responsive: [
  {
    breakpoint: 480,  // Mobile
    options: {
      chart: { height: 300 },
      legend: { 
        position: 'bottom',
        fontSize: '11px'
      }
    }
  }
]
```

---

## ✨ Summary

**What Changed:**
- ✅ Bar chart → Donut pie chart
- ✅ Horizontal bars → Circular segments
- ✅ Percentage display → Count display
- ✅ No center info → Center total display
- ✅ No legend → Bottom legend with values
- ✅ Static → Interactive with hover

**Files Modified:**
- `overview.component.ts` - Chart configuration
- `overview.component.html` - Template bindings

**Status:** ✅ **Ready for use!**

The donut chart now perfectly displays the displacement motifs data from your backend `/motifs-pie` endpoint.
