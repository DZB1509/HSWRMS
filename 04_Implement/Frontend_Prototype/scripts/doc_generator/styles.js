export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&display=swap');

@page {
  size: A4 portrait;
  margin: 14mm 14mm 16mm 14mm;
  @bottom-right {
    content: "Page " counter(page);
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    color: #888580;
  }
  @bottom-left {
    content: "HeavenStay Wellness Resort Management System (HSWRMS) — UI Demo Overview";
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    color: #888580;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 9.5pt;
  line-height: 1.55;
  color: #2b2b2b;
  background-color: #ffffff;
  -webkit-font-smoothing: antialiased;
}

/* Page Breaks */
.page-break {
  page-break-before: always;
}

.no-break {
  page-break-inside: avoid;
}

/* Typography */
h1, h2, h3, h4, .font-display {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #1f2b23;
  font-weight: 600;
  line-height: 1.25;
}

h1 {
  font-size: 24pt;
  margin-bottom: 12px;
  border-bottom: 1.5px solid #d8c7ae;
  padding-bottom: 6px;
  color: #243d2c;
}

h2 {
  font-size: 16pt;
  margin-top: 18px;
  margin-bottom: 8px;
  color: #2d4834;
  border-left: 3.5px solid #4f5a50;
  padding-left: 8px;
}

h3 {
  font-size: 13pt;
  margin-top: 14px;
  margin-bottom: 6px;
  color: #3b5341;
}

h4 {
  font-size: 11pt;
  margin-top: 10px;
  margin-bottom: 4px;
  color: #4a5d4e;
}

p {
  margin-bottom: 8px;
  text-align: justify;
}

ul, ol {
  margin-left: 20px;
  margin-bottom: 10px;
}

li {
  margin-bottom: 4px;
}

strong {
  font-weight: 600;
  color: #1a241c;
}

/* Cover Page */
.cover-page {
  height: 98vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 20px 20px 20px;
  border: 1px solid #e5e2dc;
  background: linear-gradient(180deg, #faf9f6 0%, #f4f0e8 100%);
  page-break-after: always;
}

.cover-header {
  border-bottom: 2px solid #4f5a50;
  padding-bottom: 20px;
}

.cover-brand {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16pt;
  letter-spacing: 2px;
  color: #4f5a50;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.cover-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32pt;
  font-weight: 700;
  color: #1d3123;
  line-height: 1.15;
  margin-bottom: 12px;
}

.cover-subtitle {
  font-size: 13pt;
  color: #636b61;
  font-weight: 400;
  max-width: 600px;
  line-height: 1.4;
}

.cover-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid #dcd7ce;
}

.cover-meta-item {
  font-size: 9.5pt;
}

.cover-meta-label {
  font-weight: 600;
  color: #4f5a50;
  text-transform: uppercase;
  font-size: 8pt;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.cover-meta-val {
  color: #2b2b2b;
  font-weight: 500;
}

.cover-footer {
  border-top: 1px solid #dcd7ce;
  padding-top: 15px;
  font-size: 8.5pt;
  color: #706e6b;
  display: flex;
  justify-content: space-between;
}

/* Callout Boxes */
.callout {
  padding: 10px 14px;
  margin: 10px 0;
  border-radius: 6px;
  font-size: 9pt;
  line-height: 1.5;
  page-break-inside: avoid;
}

.callout-info {
  background-color: #f0f5f9;
  border-left: 4px solid #527086;
  color: #233b4d;
}

.callout-warning {
  background-color: #fdf8ee;
  border-left: 4px solid #b38634;
  color: #5c4111;
}

.callout-danger {
  background-color: #fcf1f0;
  border-left: 4px solid #b0463e;
  color: #5e1c17;
}

.callout-success {
  background-color: #eef6f0;
  border-left: 4px solid #4e7259;
  color: #1e3d26;
}

.callout-luxury {
  background-color: #f7f4ee;
  border-left: 4px solid #a68c67;
  color: #473926;
}

.callout-title {
  font-weight: 700;
  font-size: 9.5pt;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Actor Badges */
.badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 7.5pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.badge-public { background: #e0e0e0; color: #424242; }
.badge-customer { background: #c8e6c9; color: #204b23; }
.badge-receptionist { background: #fff3b0; color: #665a00; }
.badge-therapist { background: #d1c4e9; color: #3c2466; }
.badge-fb { background: #ffd8a8; color: #703c00; }
.badge-manager { background: #b2dfdb; color: #004d40; }
.badge-admin { background: #bbdefb; color: #0d47a1; }

.severity-high { background: #fce8e6; color: #a51d24; border: 1px solid #f5c6cb; }
.severity-med { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
.severity-low { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 16px 0;
  font-size: 8.5pt;
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

thead {
  display: table-header-group;
}

th {
  background-color: #f1ede5;
  color: #2b392e;
  font-weight: 600;
  text-align: left;
  padding: 6px 8px;
  border: 1px solid #d4cebe;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

td {
  padding: 5px 8px;
  border: 1px solid #e2ddd4;
  vertical-align: top;
  line-height: 1.45;
}

tr:nth-child(even) td {
  background-color: #faf9f6;
}

/* Figures & Screenshots */
.figure-card {
  border: 1px solid #e0dbd0;
  border-radius: 6px;
  overflow: hidden;
  margin: 14px 0;
  background: #ffffff;
  page-break-inside: avoid;
}

.figure-img-wrap {
  background: #1a1a1a;
  text-align: center;
  max-height: 380px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.figure-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.figure-caption {
  padding: 10px 14px;
  background: #fbf9f5;
  border-top: 1px solid #eae5db;
}

.figure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.figure-title {
  font-weight: 700;
  font-size: 9pt;
  color: #283e2f;
}

.figure-desc {
  font-size: 8.5pt;
  color: #555350;
  line-height: 1.4;
}

.figure-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 6px;
  font-size: 8pt;
  color: #696662;
  border-top: 1px dashed #e2ded5;
  padding-top: 6px;
}

/* Compact Grid */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.card-box {
  border: 1px solid #e5e0d5;
  border-radius: 6px;
  padding: 10px;
  background: #faf9f6;
  margin-bottom: 8px;
  page-break-inside: avoid;
}

.card-title {
  font-weight: 600;
  color: #2d4834;
  margin-bottom: 4px;
  font-size: 9pt;
}

.card-body {
  font-size: 8.5pt;
  color: #52504d;
}

/* Viva Q&A Box */
.viva-box {
  margin-bottom: 12px;
  border: 1px solid #ddd7cc;
  border-radius: 6px;
  overflow: hidden;
  page-break-inside: avoid;
}

.viva-q {
  background: #f4efe6;
  padding: 8px 12px;
  font-weight: 600;
  color: #263b2c;
  font-size: 9pt;
  border-bottom: 1px solid #e3ded5;
}

.viva-intent {
  padding: 6px 12px;
  background: #fbfbf9;
  font-size: 8pt;
  color: #736d64;
  font-style: italic;
  border-bottom: 1px dashed #e5e0d7;
}

.viva-a {
  padding: 8px 12px;
  background: #ffffff;
  font-size: 8.5pt;
  color: #2b2b2b;
  line-height: 1.5;
}

.viva-badge {
  float: right;
  font-size: 7.5pt;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e2d7c5;
  color: #3d3121;
}

/* TOC */
.toc-list {
  list-style: none;
  margin-left: 0;
}

.toc-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dotted #ccc;
  font-size: 9pt;
}

.toc-num {
  font-weight: 600;
  color: #3b5341;
  margin-right: 8px;
}
`;
