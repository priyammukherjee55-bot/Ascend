import React, { useState } from 'react';
import { MatchItem } from '../types/models';
import {
  exportMatchAsPDF,
  exportMatchAsJSON,
  exportMatchAsCSV,
  printMatchOfficialScorecard,
} from '../lib/exportUtils';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  X,
  Check,
  Share2,
  Calendar,
  MapPin,
  Trophy,
  ShieldCheck,
  FileType,
} from 'lucide-react';

interface MatchDownloadModalProps {
  match: MatchItem;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchDownloadModal: React.FC<MatchDownloadModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isCricket = match.sport === 'cricket';

  const handleCopySummary = () => {
    const summary = `🏆 ASCEND Match Record: ${match.teamAName} vs ${match.teamBName}
Sport: ${match.sport.toUpperCase()}
Score: ${match.teamAName} (${match.teamAScore || '-'}) vs ${match.teamBName} (${match.teamBScore || '-'})
Winner: ${match.winnerName || (match.isDrawOrTie ? 'TIE/DRAW' : 'Pending')}
Venue: ${match.venue || 'Stadium Arena'}, ${match.city}
Date: ${new Date(match.scheduledAt).toLocaleDateString()}
Status: ${match.status.toUpperCase()}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white tracking-tight">
                Export Match Record
              </h3>
              {match.isOfficial && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                  <ShieldCheck className="w-3 h-3" /> Official
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Download verified match telemetry, scorecards, and statistics
            </p>
          </div>
        </div>

        {/* Match Preview Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-bold mb-2">
            <span>{match.tournamentName || 'Fixture Record'}</span>
            <span className="uppercase text-emerald-600 dark:text-emerald-400 font-black">{match.status}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="text-sm font-black text-zinc-900 dark:text-white">{match.teamAName}</div>
            <div className="font-mono text-base font-black px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800">
              {match.teamAScore || '-'} : {match.teamBScore || '-'}
            </div>
            <div className="text-sm font-black text-zinc-900 dark:text-white">{match.teamBName}</div>
          </div>

          {match.winnerName && (
            <div className="mt-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>Result: {match.winnerName} won</span>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {match.venue || match.city}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(match.scheduledAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* 1. Direct Official PDF File (Works Offline and Online) */}
          <button
            onClick={() => {
              exportMatchAsPDF(match);
            }}
            className="p-3.5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/10 flex flex-col items-center text-center gap-1.5 group transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileType className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-zinc-900 dark:text-white flex items-center justify-center gap-1">
                <span>PDF Format</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Offline & Online</div>
            </div>
          </button>

          {/* 2. Official Printable Scorecard */}
          <button
            onClick={() => {
              printMatchOfficialScorecard(match);
            }}
            className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/60 bg-white dark:bg-zinc-900/80 flex flex-col items-center text-center gap-1.5 group transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-zinc-900 dark:text-white">Print View</div>
              <div className="text-[10px] text-zinc-500">Browser Print</div>
            </div>
          </button>

          {/* 3. CSV Spreadsheet */}
          <button
            onClick={() => exportMatchAsCSV(match)}
            className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 bg-white dark:bg-zinc-900/80 flex flex-col items-center text-center gap-1.5 group transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-zinc-900 dark:text-white">CSV Export</div>
              <div className="text-[10px] text-zinc-500">Excel / Sheets</div>
            </div>
          </button>

          {/* 4. JSON Data Record */}
          <button
            onClick={() => exportMatchAsJSON(match)}
            className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/60 bg-white dark:bg-zinc-900/80 flex flex-col items-center text-center gap-1.5 group transition shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-zinc-900 dark:text-white">JSON Record</div>
              <div className="text-[10px] text-zinc-500">Raw Schema</div>
            </div>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Summary Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
