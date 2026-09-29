import React, { useState } from 'react';
import {
  Download,
  FileCode,
  FileText,
  FolderArchive,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Terminal,
  Shield,
  Zap,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CodebaseDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodebaseDownloadModal: React.FC<CodebaseDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedZipUrl, setCopiedZipUrl] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);
  const [downloadBlockedHelp, setDownloadBlockedHelp] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;
  const fullZipUrl = `${currentOrigin}/ascend-sports-platform.zip`;
  const fullPdfUrl = `${currentOrigin}/ascend-sports-platform-codebase.pdf`;
  const downloadPortalUrl = `${currentOrigin}/download.html`;

  const quickStartCmd = 'unzip ascend-sports-platform.zip -d ascend-app && cd ascend-app && npm install && npm run dev';
  const curlCmd = `curl -O ${fullZipUrl} && unzip ascend-sports-platform.zip -d ascend-app`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(quickStartCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyZipUrl = () => {
    navigator.clipboard.writeText(fullZipUrl);
    setCopiedZipUrl(true);
    setTimeout(() => setCopiedZipUrl(false), 2000);
  };

  const triggerDownload = async (path: string, type: 'zip' | 'pdf') => {
    setDownloadStarted(type);
    setDownloadBlockedHelp(true);

    try {
      // Method 1: Fetch as Blob to ensure full download byte stream
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = path.split('/').pop() || 'ascend-sports-platform';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 500);
    } catch (err) {
      console.warn('Direct blob trigger failed, trying direct link...', err);
      // Method 2: Standard anchor click fallback
      const link = document.createElement('a');
      link.href = path;
      link.download = path.split('/').pop() || 'ascend-sports-platform';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 500);
    }

    setTimeout(() => setDownloadStarted(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 text-zinc-900 dark:text-zinc-100 overflow-y-auto max-h-[90vh]">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 flex items-center justify-center font-black shadow-lg">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                Official Export
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">v2.4.0 Production</span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mt-0.5">
              Download Entire Codebase
            </h2>
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
          Get the complete, pristine ASCEND project repository containing all 74 source files, Three.js 3D Game Arena, CrickHeroes & Cricbuzz scoring dashboards, Guddu rules AI, and Firestore rules.
        </p>

        {/* Primary Download Options (ZIP & PDF) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* 1. Full ZIP Archive */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 font-black">
                  <FolderArchive className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  335 KB ZIP
                </span>
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-1">
                Full Codebase (.ZIP)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4">
                All 74 React, TypeScript, Three.js, and config files ready to unzip and run locally.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => triggerDownload('/ascend-sports-platform.zip', 'zip')}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {downloadStarted === 'zip' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Triggered Download!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download ZIP</span>
                  </>
                )}
              </button>

              <a
                href="/ascend-sports-platform.zip"
                download="ascend-sports-platform.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-3 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Right-Click &gt; "Save Link As..."</span>
              </a>
            </div>
          </div>

          {/* 2. Official PDF Documentation */}
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 font-black">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                  30 KB PDF
                </span>
              </div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-1">
                Code Guide & Specs (.PDF)
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4">
                Official architecture overview, manifest, milestone rules, and terminal instructions.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => triggerDownload('/ascend-sports-platform-codebase.pdf', 'pdf')}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {downloadStarted === 'pdf' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Triggered Download!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              <a
                href="/ascend-sports-platform-codebase.pdf"
                download="ascend-sports-platform-codebase.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-3 rounded-lg border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Right-Click &gt; "Save Link As..."</span>
              </a>
            </div>
          </div>
        </div>

        {/* If browser sandbox blocks downloads, show fallback options */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <HelpCircle className="w-4 h-4" /> If browser or iframe blocks the direct download:
            </span>
            <a
              href="/download.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-2.5 py-1 rounded-md transition flex items-center gap-1 shadow-sm"
            >
              Open in New Tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <button
              onClick={handleCopyZipUrl}
              className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono transition flex items-center gap-1"
            >
              {copiedZipUrl ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Copied Direct Link!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Direct .ZIP URL to Paste in Browser
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Start Terminal Command */}
        <div className="p-4 rounded-2xl bg-zinc-950 text-white border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Terminal Download &amp; Extract Command
            </span>
            <button
              onClick={handleCopyCmd}
              className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
            >
              {copiedCmd ? (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Command
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900/80 font-mono text-[11px] text-zinc-300 select-all overflow-x-auto">
            {curlCmd}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Complete Clean Codebase • 74 Files
          </span>
          <button
            onClick={onClose}
            className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
