import { MatchItem } from '../types/models';
import { jsPDF } from 'jspdf';

/**
 * Helper to download text content with a specific MIME type and filename
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export single match record as formatted JSON
 */
export function exportMatchAsJSON(match: MatchItem) {
  const safeFilename = `Match_${match.sport.toUpperCase()}_${match.teamAName}_vs_${match.teamBName}_${new Date(match.scheduledAt).toISOString().slice(0, 10)}.json`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '');

  const data = JSON.stringify(match, null, 2);
  downloadFile(safeFilename, data, 'application/json');
}

/**
 * Export all match records in bulk as JSON
 */
export function exportAllMatchesAsJSON(matches: MatchItem[], sport?: string) {
  const prefix = sport ? `ASCEND_${sport.toUpperCase()}_Matches` : 'ASCEND_All_Matches';
  const filename = `${prefix}_${new Date().toISOString().slice(0, 10)}.json`;
  const data = JSON.stringify(matches, null, 2);
  downloadFile(filename, data, 'application/json');
}

/**
 * Export single match as detailed CSV
 */
export function exportMatchAsCSV(match: MatchItem) {
  const isCricket = match.sport === 'cricket';
  const rows: string[][] = [];

  // Match Header Metadata
  rows.push(['ASCEND OFFICIAL MATCH RECORD']);
  rows.push(['Sport', match.sport.toUpperCase()]);
  rows.push(['Match ID', match.id]);
  rows.push(['Title', match.title || 'Official Fixture']);
  rows.push(['Status', match.status.toUpperCase()]);
  rows.push(['Official Tournament Tier', match.isOfficial ? 'OFFICIAL LEAGUE' : 'CASUAL/COMMUNITY']);
  rows.push(['Date & Time', new Date(match.scheduledAt).toLocaleString()]);
  rows.push(['Venue', match.venue || 'Stadium Arena']);
  rows.push(['City', match.city || 'Local Hub']);
  rows.push(['Team A', match.teamAName]);
  rows.push(['Team B', match.teamBName]);
  rows.push(['Team A Score', match.teamAScore || 'N/A']);
  rows.push(['Team B Score', match.teamBScore || 'N/A']);
  rows.push(['Winner', match.winnerName || (match.isDrawOrTie ? 'TIE/DRAW' : 'Pending Result')]);

  if (match.toss?.executed) {
    rows.push(['Toss Winner', match.toss.winnerTeamName]);
    rows.push(['Toss Decision', match.toss.choice]);
  }

  rows.push([]); // blank line

  // Sport Specific Detailed Tables
  if (isCricket && match.cricketState) {
    const cs = match.cricketState;
    rows.push(['CRICKET INNINGS TELEMETRY']);
    rows.push(['Current Innings', `Innings ${cs.currentInnings}`]);
    rows.push(['Batting Team', cs.battingTeamName]);
    rows.push(['Bowling Team', cs.bowlingTeamName]);
    rows.push(['Total Runs', cs.runs.toString()]);
    rows.push(['Wickets Fallen', cs.wickets.toString()]);
    rows.push(['Overs Bowled', `${cs.overs}.${cs.ballsInCurrentOver}`]);
    rows.push(['Extras', `Wides: ${cs.totalExtras.wides}, NoBalls: ${cs.totalExtras.noBalls}, Byes: ${cs.totalExtras.byes}, LegByes: ${cs.totalExtras.legByes}`]);

    rows.push([]);
    rows.push(['BATTING SCORECARD (ACTIVE/LAST)']);
    rows.push(['Player', 'Runs', 'Balls', '4s', '6s', 'Strike Rate', 'Status']);
    if (cs.striker) {
      rows.push([
        cs.striker.name,
        cs.striker.runs.toString(),
        cs.striker.balls.toString(),
        cs.striker.fours.toString(),
        cs.striker.sixes.toString(),
        cs.striker.strikeRate.toFixed(2),
        cs.striker.isOut ? 'Out' : 'Not Out (*)',
      ]);
    }
    if (cs.nonStriker) {
      rows.push([
        cs.nonStriker.name,
        cs.nonStriker.runs.toString(),
        cs.nonStriker.balls.toString(),
        cs.nonStriker.fours.toString(),
        cs.nonStriker.sixes.toString(),
        cs.nonStriker.strikeRate.toFixed(2),
        cs.nonStriker.isOut ? 'Out' : 'Not Out',
      ]);
    }

    rows.push([]);
    rows.push(['BOWLING ANALYSIS']);
    rows.push(['Bowler', 'Overs', 'Maidens', 'Runs Conceded', 'Wickets', 'Economy']);
    if (cs.currentBowler) {
      rows.push([
        cs.currentBowler.name,
        cs.currentBowler.overs.toString(),
        cs.currentBowler.maidens.toString(),
        cs.currentBowler.runs.toString(),
        cs.currentBowler.wickets.toString(),
        cs.currentBowler.economy.toFixed(2),
      ]);
    }
  } else if (!isCricket && match.footballState) {
    const fs = match.footballState;
    rows.push(['FOOTBALL MATCH TIMELINE & EVENTS']);
    rows.push(['Current Minute', `${fs.currentMinute}' (${fs.period})`]);
    rows.push(['Scoreline', `${match.teamAName} ${fs.teamAGoals} - ${fs.teamBGoals} ${match.teamBName}`]);
    rows.push(['Discipline Team A', `Yellows: ${fs.teamAYellows}, Reds: ${fs.teamAReds}`]);
    rows.push(['Discipline Team B', `Yellows: ${fs.teamBYellows}, Reds: ${fs.teamBReds}`]);

    rows.push([]);
    rows.push(['MATCH EVENTS']);
    rows.push(['Minute', 'Event Type', 'Team', 'Primary Player', 'Assisted By / Detail']);
    if (fs.events && fs.events.length > 0) {
      fs.events.forEach((ev) => {
        rows.push([
          `${ev.minute}'`,
          ev.type.toUpperCase(),
          ev.teamName,
          ev.playerName,
          ev.secondaryPlayerName || ev.detail || '-',
        ]);
      });
    } else {
      rows.push(['-', 'No disciplinary or goal events logged', '-', '-', '-']);
    }
  }

  // Convert to CSV string with proper quoting
  const csvContent = rows
    .map((r) => r.map((field) => `"${(field || '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const safeFilename = `Match_${match.teamAName}_vs_${match.teamBName}_${new Date(match.scheduledAt).toISOString().slice(0, 10)}.csv`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '');

  downloadFile(safeFilename, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Bulk export all matches into a CSV spreadsheet
 */
export function exportAllMatchesAsCSV(matches: MatchItem[], sport?: string) {
  const headers = [
    'Match ID',
    'Sport',
    'Tournament',
    'Stage / Round',
    'Date',
    'Status',
    'Official Verified',
    'Team A',
    'Team B',
    'Team A Score',
    'Team B Score',
    'Winner',
    'Venue',
    'City',
    'Toss Winner',
    'Toss Decision',
  ];

  const rows = matches.map((m) => [
    m.id,
    m.sport.toUpperCase(),
    m.tournamentName || 'Friendly',
    m.stageName || m.roundNumber ? `Round ${m.roundNumber}` : 'Standard',
    new Date(m.scheduledAt).toISOString(),
    m.status,
    m.isOfficial ? 'YES' : 'NO',
    m.teamAName,
    m.teamBName,
    m.teamAScore || '-',
    m.teamBScore || '-',
    m.winnerName || (m.isDrawOrTie ? 'TIE/DRAW' : '-'),
    m.venue || '-',
    m.city || '-',
    m.toss?.winnerTeamName || '-',
    m.toss?.choice || '-',
  ]);

  const csvRows = [headers, ...rows];
  const csvContent = csvRows
    .map((r) => r.map((field) => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  const prefix = sport ? `ASCEND_${sport.toUpperCase()}_Matches_Export` : 'ASCEND_All_Matches_Export';
  const filename = `${prefix}_${new Date().toISOString().slice(0, 10)}.csv`;

  downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
}

/**
 * Generates and triggers printable Official Scorecard (ICC / FIFA Formatted Match Sheet)
 */
export function printMatchOfficialScorecard(match: MatchItem) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the printable scorecard');
    return;
  }

  const isCricket = match.sport === 'cricket';
  const dateFormatted = new Date(match.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official Scorecard - ${match.teamAName} vs ${match.teamBName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 40px;
          color: #111827;
          background: #fff;
          font-size: 13px;
          line-height: 1.5;
        }
        .header {
          border-bottom: 3px solid #10b981;
          padding-bottom: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .badge {
          display: inline-block;
          padding: 4px 10px;
          background: #111827;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .official-tag {
          background: #059669;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          margin-left: 8px;
        }
        .title {
          font-size: 24px;
          font-weight: 900;
          margin: 6px 0;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }
        .subtitle {
          color: #6b7280;
          font-size: 13px;
        }
        .score-banner {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin-bottom: 28px;
          border: 1px solid #e5e7eb;
        }
        .team-box {
          text-align: center;
        }
        .team-name {
          font-size: 18px;
          font-weight: 800;
        }
        .team-score {
          font-size: 28px;
          font-family: monospace;
          font-weight: 900;
          color: #047857;
          margin-top: 4px;
        }
        .vs {
          font-size: 14px;
          font-weight: 800;
          color: #9ca3af;
        }
        .winner-banner {
          margin-top: 10px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: #059669;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background: #f9fafb;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          font-size: 11px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 20px 0 10px 0;
          color: #1f2937;
          border-left: 4px solid #10b981;
          padding-left: 8px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { margin: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
      </div>

      <div class="header">
        <div>
          <span class="badge">ASCEND SPORTS PLATFORM</span>
          ${match.isOfficial ? '<span class="official-tag">OFFICIAL CERTIFIED FIXTURE</span>' : ''}
          <div class="title">${match.sport.toUpperCase()}: ${match.teamAName} vs ${match.teamBName}</div>
          <div class="subtitle">${match.tournamentName || 'Competitive League'} • ${match.venue || 'Stadium'}, ${match.city} • ${dateFormatted}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 800; color: #374151;">MATCH #${match.id.slice(-6).toUpperCase()}</div>
          <div style="color: #6b7280; font-size: 11px;">Status: ${match.status.toUpperCase()}</div>
        </div>
      </div>

      <div class="score-banner">
        <div class="team-box">
          <div class="team-name">${match.teamAName}</div>
          <div class="team-score">${match.teamAScore || '-'}</div>
        </div>
        <div class="vs">VS</div>
        <div class="team-box">
          <div class="team-name">${match.teamBName}</div>
          <div class="team-score">${match.teamBScore || '-'}</div>
        </div>
      </div>

      ${match.winnerName ? `<div class="winner-banner">🏆 RESULT: ${match.winnerName} WON</div>` : ''}

      ${
        isCricket && match.cricketState
          ? `
        <div class="section-title">Current Innings & Overs</div>
        <table>
          <tr>
            <th>Batting Team</th>
            <td>${match.cricketState.battingTeamName}</td>
            <th>Bowling Team</th>
            <td>${match.cricketState.bowlingTeamName}</td>
          </tr>
          <tr>
            <th>Score & Wickets</th>
            <td><strong>${match.cricketState.runs} / ${match.cricketState.wickets}</strong></td>
            <th>Overs Bowled</th>
            <td>${match.cricketState.overs}.${match.cricketState.ballsInCurrentOver} ov</td>
          </tr>
          <tr>
            <th>Extras</th>
            <td colspan="3">Wides: ${match.cricketState.totalExtras.wides}, No-Balls: ${match.cricketState.totalExtras.noBalls}, Byes: ${match.cricketState.totalExtras.byes}, Leg-Byes: ${match.cricketState.totalExtras.legByes}</td>
          </tr>
        </table>

        <div class="section-title">Active Batting Performance</div>
        <table>
          <thead>
            <tr>
              <th>Batter</th>
              <th>Runs</th>
              <th>Balls</th>
              <th>4s</th>
              <th>6s</th>
              <th>SR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              match.cricketState.striker
                ? `<tr>
                    <td><strong>${match.cricketState.striker.name}</strong> *</td>
                    <td>${match.cricketState.striker.runs}</td>
                    <td>${match.cricketState.striker.balls}</td>
                    <td>${match.cricketState.striker.fours}</td>
                    <td>${match.cricketState.striker.sixes}</td>
                    <td>${match.cricketState.striker.strikeRate.toFixed(2)}</td>
                    <td>${match.cricketState.striker.isOut ? 'Out' : 'Not Out'}</td>
                  </tr>`
                : ''
            }
            ${
              match.cricketState.nonStriker
                ? `<tr>
                    <td>${match.cricketState.nonStriker.name}</td>
                    <td>${match.cricketState.nonStriker.runs}</td>
                    <td>${match.cricketState.nonStriker.balls}</td>
                    <td>${match.cricketState.nonStriker.fours}</td>
                    <td>${match.cricketState.nonStriker.sixes}</td>
                    <td>${match.cricketState.nonStriker.strikeRate.toFixed(2)}</td>
                    <td>${match.cricketState.nonStriker.isOut ? 'Out' : 'Not Out'}</td>
                  </tr>`
                : ''
            }
          </tbody>
        </table>
      `
          : ''
      }

      ${
        !isCricket && match.footballState
          ? `
        <div class="section-title">Football Match Events & Disciplines</div>
        <table>
          <thead>
            <tr>
              <th>Minute</th>
              <th>Event</th>
              <th>Team</th>
              <th>Player</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${
              match.footballState.events && match.footballState.events.length > 0
                ? match.footballState.events
                    .map(
                      (e) => `
                <tr>
                  <td><strong>${e.minute}'</strong></td>
                  <td>${e.type.toUpperCase()}</td>
                  <td>${e.teamName}</td>
                  <td><strong>${e.playerName}</strong></td>
                  <td>${e.secondaryPlayerName || e.detail || '-'}</td>
                </tr>`
                    )
                    .join('')
                : '<tr><td colspan="5" style="text-align:center; color:#9ca3af;">No disciplinary or goal events registered</td></tr>'
            }
          </tbody>
        </table>
      `
          : ''
      }

      <div class="footer">
        <div>Generated by ASCEND Sports Platform • Verified Match Record Integrity</div>
        <div>Timestamp: ${new Date().toUTCString()}</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generates and downloads an official high-fidelity PDF match document
 * Works completely offline and online via client-side jsPDF
 */
export function exportMatchAsPDF(match: MatchItem) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const isCricket = match.sport === 'cricket';

  // 1. Top Header Accent Band
  doc.setFillColor(9, 9, 11); // Dark background
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(16, 185, 129); // Emerald accent line
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('ASCEND SPORTS OFFICIAL MATCH SHEET', 14, 12);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Sport: ${match.sport.toUpperCase()}  |  Match ID: #${match.id.slice(-8).toUpperCase()}  |  Status: ${match.status.toUpperCase()}`,
    14,
    20
  );

  let curY = 36;

  // 2. Tournament & Venue Info Block
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(match.title || `${match.teamAName} vs ${match.teamBName}`, 14, curY);

  curY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const matchDate = new Date(match.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(
    `Tournament: ${match.tournamentName || 'Competitive League'}  •  Venue: ${match.venue || 'Arena Stadium'}, ${match.city}  •  ${matchDate}`,
    14,
    curY
  );

  curY += 8;

  // 3. Main Scoreboard Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, curY, pageWidth - 28, 28, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, curY, pageWidth - 28, 28, 3, 3, 'S');

  // Team A
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(match.teamAName, 20, curY + 12);

  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(match.teamAScore || 'N/A', 20, curY + 22);

  // VS text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(156, 163, 175);
  doc.text('VS', pageWidth / 2 - 3, curY + 16);

  // Team B
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text(match.teamBName, pageWidth - 20, curY + 12, { align: 'right' });

  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(match.teamBScore || 'N/A', pageWidth - 20, curY + 22, { align: 'right' });

  curY += 34;

  // Result / Winner Banner
  if (match.winnerName || match.isDrawOrTie) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, curY, pageWidth - 28, 10, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    const resultText = match.winnerName
      ? `WINNER: ${match.winnerName.toUpperCase()} CONQUERED THE FIXTURE`
      : 'RESULT: MATCH CONCLUDED IN A TIE / DRAW';
    doc.text(resultText, pageWidth / 2, curY + 6.5, { align: 'center' });

    curY += 16;
  }

  // Toss Information
  if (match.toss?.executed) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Toss: ${match.toss.winnerTeamName} won the toss and elected to ${match.toss.choice.toUpperCase()}`,
      14,
      curY
    );
    curY += 7;
  }

  // 4. Sport-Specific Detailed Tables
  if (isCricket && match.cricketState) {
    const cs = match.cricketState;

    // Cricket Innings Summary
    doc.setFillColor(16, 185, 129);
    doc.rect(14, curY, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`INNINGS ${cs.currentInnings} TELEMETRY`, 20, curY + 5);

    curY += 9;
    doc.setFillColor(249, 250, 251);
    doc.rect(14, curY, pageWidth - 28, 12, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, curY, pageWidth - 28, 12, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text(`Batting: ${cs.battingTeamName}   |   Bowling: ${cs.bowlingTeamName}`, 18, curY + 5);
    doc.text(
      `Total: ${cs.runs}/${cs.wickets} (${cs.overs}.${cs.ballsInCurrentOver} ov)   |   Extras: W:${cs.totalExtras.wides} NB:${cs.totalExtras.noBalls} B:${cs.totalExtras.byes} LB:${cs.totalExtras.legByes}`,
      18,
      curY + 9.5
    );

    curY += 17;

    // Batters Scorecard
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('BATTING RECORD', 14, curY);

    curY += 4;
    // Table Header
    doc.setFillColor(243, 244, 246);
    doc.rect(14, curY, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Batter', 18, curY + 4.2);
    doc.text('Runs', 80, curY + 4.2);
    doc.text('Balls', 105, curY + 4.2);
    doc.text('4s', 125, curY + 4.2);
    doc.text('6s', 145, curY + 4.2);
    doc.text('SR', 165, curY + 4.2);
    doc.text('Dismissal', 185, curY + 4.2);

    curY += 6;
    const batters = [cs.striker, cs.nonStriker].filter(Boolean);
    batters.forEach((b) => {
      if (!b) return;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(b.name + (b.isOut ? '' : ' *'), 18, curY + 4.5);
      doc.text(b.runs.toString(), 80, curY + 4.5);
      doc.text(b.balls.toString(), 105, curY + 4.5);
      doc.text(b.fours.toString(), 125, curY + 4.5);
      doc.text(b.sixes.toString(), 145, curY + 4.5);
      doc.text(b.strikeRate.toFixed(1), 165, curY + 4.5);
      doc.text(b.isOut ? 'Out' : 'Not Out', 185, curY + 4.5);
      curY += 6;
    });

    curY += 4;

    // Bowling Analysis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('BOWLING ANALYSIS', 14, curY);

    curY += 4;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, curY, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Bowler', 18, curY + 4.2);
    doc.text('Overs', 80, curY + 4.2);
    doc.text('Maidens', 105, curY + 4.2);
    doc.text('Runs', 125, curY + 4.2);
    doc.text('Wickets', 145, curY + 4.2);
    doc.text('Economy', 165, curY + 4.2);

    curY += 6;
    if (cs.currentBowler) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(cs.currentBowler.name, 18, curY + 4.5);
      doc.text(cs.currentBowler.overs.toString(), 80, curY + 4.5);
      doc.text(cs.currentBowler.maidens.toString(), 105, curY + 4.5);
      doc.text(cs.currentBowler.runs.toString(), 125, curY + 4.5);
      doc.text(cs.currentBowler.wickets.toString(), 145, curY + 4.5);
      doc.text(cs.currentBowler.economy.toFixed(2), 165, curY + 4.5);
      curY += 7;
    }
  } else if (!isCricket && match.footballState) {
    const fs = match.footballState;

    doc.setFillColor(16, 185, 129);
    doc.rect(14, curY, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(`FOOTBALL TIMELINE (${fs.currentMinute}' - ${fs.period.toUpperCase()})`, 20, curY + 5);

    curY += 9;
    doc.setFillColor(249, 250, 251);
    doc.rect(14, curY, pageWidth - 28, 10, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(14, curY, pageWidth - 28, 10, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text(
      `Disciplinary Stats: ${match.teamAName} (Yellows: ${fs.teamAYellows}, Reds: ${fs.teamAReds})  vs  ${match.teamBName} (Yellows: ${fs.teamBYellows}, Reds: ${fs.teamBReds})`,
      18,
      curY + 6.5
    );

    curY += 15;

    // Events Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('MATCH EVENTS & GOALS TIMELINE', 14, curY);

    curY += 4;
    doc.setFillColor(243, 244, 246);
    doc.rect(14, curY, pageWidth - 28, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    doc.text('Min', 18, curY + 4.2);
    doc.text('Type', 36, curY + 4.2);
    doc.text('Team', 65, curY + 4.2);
    doc.text('Player', 110, curY + 4.2);
    doc.text('Detail / Assist', 155, curY + 4.2);

    curY += 6;
    if (fs.events && fs.events.length > 0) {
      fs.events.slice(0, 14).forEach((ev) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(`${ev.minute}'`, 18, curY + 4.5);
        doc.text(ev.type.toUpperCase(), 36, curY + 4.5);
        doc.text(ev.teamName.slice(0, 16), 65, curY + 4.5);
        doc.text(ev.playerName.slice(0, 20), 110, curY + 4.5);
        doc.text((ev.secondaryPlayerName || ev.detail || '-').slice(0, 22), 155, curY + 4.5);
        curY += 5.5;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('No goals or cards recorded for this match session', 18, curY + 4.5);
      curY += 6;
    }
  }

  // 5. Official Verification Footer
  const footerY = 280;
  doc.setDrawColor(229, 231, 235);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text('Official Match Telemetry generated by ASCEND Sports Platform', 14, footerY + 5);
  doc.text(`Offline/Online Certified: ${new Date().toISOString()}`, pageWidth - 14, footerY + 5, {
    align: 'right',
  });

  const safeFilename = `Match_${match.sport.toUpperCase()}_${match.teamAName}_vs_${match.teamBName}_${new Date(match.scheduledAt).toISOString().slice(0, 10)}.pdf`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '');

  doc.save(safeFilename);
}

