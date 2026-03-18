import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReport(recommendations, profile) {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('en-IN');
  const time = new Date().toLocaleTimeString('en-IN');

  // ── Colors ──────────────────────────────────────────────────────────────
  const navy   = [10, 22, 40];
  const gold   = [240, 165, 0];
  const teal   = [0, 180, 216];
  const green  = [45, 206, 137];
  const red    = [245, 54, 92];
  const white  = [255, 255, 255];
  const gray   = [140, 146, 176];
  const light  = [232, 240, 254];

  // ── Header Background ────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, 210, 40, 'F');

  // ── Logo + Title ─────────────────────────────────────────────────────────
  doc.setTextColor(...gold);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FundSage AI', 14, 18);

  doc.setTextColor(...teal);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Intelligent Mutual Fund Recommendation Report', 14, 26);

  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.text(`Generated: ${date} at ${time}`, 14, 33);

  // AI badges
  doc.setFillColor(...teal);
  doc.roundedRect(130, 10, 30, 8, 2, 2, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('AGENTIC AI', 135, 15.5);

  doc.setFillColor(...gold);
  doc.roundedRect(164, 10, 32, 8, 2, 2, 'F');
  doc.setTextColor(...navy);
  doc.text('EXPLAINABLE AI', 167, 15.5);

  // ── Investor Profile Section ─────────────────────────────────────────────
  doc.setFillColor(17, 34, 64);
  doc.rect(0, 42, 210, 36, 'F');

  doc.setTextColor(...gold);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Investor Profile', 14, 52);

  const profileItems = [
    ['Risk Appetite', profile.risk_appetite?.toUpperCase()],
    ['Time Horizon',  profile.time_horizon?.toUpperCase() + ' TERM'],
    ['Fund Type',     profile.fund_type?.toUpperCase()],
    ['Investment',    profile.investment_type?.toUpperCase()],
    ['Amount',        `Rs. ${Number(profile.investment_amount).toLocaleString('en-IN')}`],
  ];

  const colW = 38;
  profileItems.forEach(([label, value], i) => {
    const x = 14 + i * colW;
    doc.setTextColor(...gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, 61);
    doc.setTextColor(...light);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '-', x, 69);
  });

  // ── Section: Top Recommendations ─────────────────────────────────────────
  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Top Fund Recommendations', 14, 92);

  doc.setDrawColor(...teal);
  doc.setLineWidth(0.5);
  doc.line(14, 94, 196, 94);

  // Table
  const tableRows = recommendations.map((fund, i) => {
    const medals = ['#1 TOP PICK', '#2 Runner Up', '#3 Strong Pick', '#4', '#5'];
    return [
      medals[i] || `#${i+1}`,
      fund.scheme_name,
      fund.returns_1yr  > 0 ? `+${fund.returns_1yr}%`  : 'N/A',
      fund.returns_3yr  > 0 ? `+${fund.returns_3yr}%`  : 'N/A',
      fund.returns_5yr  > 0 ? `+${fund.returns_5yr}%`  : 'N/A',
      fund.returns_10yr > 0 ? `+${fund.returns_10yr}%` : 'N/A',
      `${fund.risk_score?.toFixed(1)}/10`,
      `${fund.recommendation_score?.toFixed(0)}/100`,
    ];
  });

  autoTable(doc, {
    startY: 97,
    head: [['Rank', 'Fund Name', '1 Year', '3 Year', '5 Year', '10 Year', 'Risk', 'AI Score']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: navy,
      textColor: gold,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 60],
    },
    alternateRowStyles: {
      fillColor: [240, 245, 255],
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2 && data.column.index <= 5) {
        const val = parseFloat(data.cell.raw);
        if (val > 15)     data.cell.styles.textColor = [0, 150, 80];
        else if (val > 8) data.cell.styles.textColor = [180, 120, 0];
        else if (val > 0) data.cell.styles.textColor = [0, 130, 180];
        else              data.cell.styles.textColor = [200, 0, 0];
      }
      if (data.section === 'body' && data.column.index === 7) {
        const val = parseFloat(data.cell.raw);
        if (val >= 70) data.cell.styles.textColor = [0, 150, 80];
        else           data.cell.styles.textColor = [180, 120, 0];
      }
    },
  });

  // ── Section: XAI Explanations ─────────────────────────────────────────────
  let y = doc.lastAutoTable.finalY + 12;

  doc.setTextColor(...navy);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Explainable AI Analysis', 14, y);

  doc.setDrawColor(...teal);
  doc.line(14, y + 2, 196, y + 2);
  y += 8;

  recommendations.forEach((fund, i) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Fund name header
    doc.setFillColor(...navy);
    doc.roundedRect(14, y, 182, 8, 1, 1, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${fund.scheme_name}`, 18, y + 5.5);
    y += 11;

    // AI Explanation
    doc.setTextColor(40, 40, 80);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const explanation = fund.explanation || 'AI explanation not available.';
    const lines = doc.splitTextToSize(explanation, 178);
    doc.text(lines, 16, y);
    y += lines.length * 4.5 + 2;

    // SHAP Features
    if (fund.shap_features) {
      const shapLabels = {
        '1yr_return':      '1-Year Return',
        '3yr_return':      '3-Year Return',
        '5yr_return':      '5-Year Return',
        '10yr_return':     '10-Year Return',
        'risk_alignment':  'Risk Alignment',
        'fund_type_match': 'Fund Type Match',
        'investment_type': 'Investment Type',
      };

      doc.setTextColor(...teal);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('SHAP Feature Contributions:', 16, y);
      y += 4;

      const entries = Object.entries(fund.shap_features)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

      const maxVal = Math.max(...entries.map(([_, v]) => Math.abs(v)), 0.001);
      const barMaxW = 60;

      entries.forEach(([feat, val]) => {
        if (y > 270) { doc.addPage(); y = 20; }

        const label = shapLabels[feat] || feat;
        doc.setTextColor(...gray);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(label, 18, y);

        // Bar background
        doc.setFillColor(220, 225, 240);
        doc.rect(80, y - 3, barMaxW, 3.5, 'F');

        // Bar fill
        const barW = (Math.abs(val) / maxVal) * barMaxW;
        const color = val >= 0 ? green : red;
        doc.setFillColor(...color);
        doc.rect(80, y - 3, barW, 3.5, 'F');

        // Value
        doc.setTextColor(val >= 0 ? 0 : 180, val >= 0 ? 150 : 0, 80);
        doc.setFontSize(7);
        doc.text(`${val >= 0 ? '+' : ''}${val.toFixed(3)}`, 145, y);
        y += 5;
      });

      // Metrics row
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(240, 245, 255);
      doc.roundedRect(16, y, 178, 10, 1, 1, 'F');

      doc.setTextColor(...gray);
      doc.setFontSize(7);
      doc.text(`Risk Score: ${fund.risk_score?.toFixed(1)}/10`, 20, y + 4);
      doc.text(`AI Confidence: ${fund.confidence?.toFixed(0)}%`, 70, y + 4);
      doc.text(`Recommendation Score: ${fund.recommendation_score?.toFixed(0)}/100`, 120, y + 4);
      y += 14;
    }
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFillColor(...navy);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(...gray);
    doc.setFontSize(7);
    doc.text('FundSage AI — Educational purposes only. Consult a SEBI-registered advisor before investing.', 14, 291);
    doc.text(`Page ${p} of ${pageCount}`, 185, 291);
  }

  // ── Disclaimer Page ───────────────────────────────────────────────────────
  doc.addPage();
  doc.setFillColor(...navy);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(...gold);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Disclaimer', 14, 30);

  doc.setDrawColor(...teal);
  doc.line(14, 33, 196, 33);

  const disclaimerText = [
    'This report is generated by FundSage AI for educational and informational purposes only.',
    '',
    'The mutual fund recommendations provided in this report are based on historical NAV data',
    'and algorithmic analysis. Past performance is not indicative of future results.',
    '',
    'This report does NOT constitute financial advice. Before making any investment decisions,',
    'please consult a SEBI-registered investment advisor or financial planner.',
    '',
    'Key Risks to Consider:',
    '  • Mutual fund investments are subject to market risks',
    '  • NAV of funds may go up or down based on market conditions',
    '  • Returns shown are historical CAGR and may not be repeated',
    '  • Tax implications vary based on fund type and holding period',
    '',
    'About the AI System:',
    '  • Agentic AI: Uses a 3-agent pipeline (Planner, Analyst, Explainer)',
    '  • Explainable AI: SHAP-inspired feature importance scoring',
    '  • Live Data: NAV data sourced from MFAPI.in',
    '  • Risk scoring based on annualised volatility of daily returns',
  ];

  let dy = 45;
  disclaimerText.forEach(line => {
    if (line === '') { dy += 4; return; }
    if (line.startsWith('  •')) {
      doc.setTextColor(...teal);
      doc.setFontSize(9);
    } else if (line.includes(':') && !line.startsWith(' ')) {
      doc.setTextColor(...gold);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...light);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(line, 14, dy);
    dy += 7;
  });

  // Save
  const filename = `FundSage_Report_${profile.fund_type}_${profile.risk_appetite}_${date.replace(/\//g, '-')}.pdf`;
  doc.save(filename);
}