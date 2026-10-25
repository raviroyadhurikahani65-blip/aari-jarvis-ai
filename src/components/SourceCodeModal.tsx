import React, {useEffect, useState} from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  UploadCloud,
  X,
} from 'lucide-react';

interface SourceFileItem {
  path: string;
  content: string;
}

export const SourceCodeExporter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto-github' | 'manual-files'>(
    'auto-github'
  );
  const [files, setFiles] = useState<SourceFileItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('package.json');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1-Click GitHub Auto-Push state
  const [githubToken, setGithubToken] = useState('');
  const [repoName, setRepoName] = useState('aari-jarvis-ai');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    success?: boolean;
    repoUrl?: string;
    uploadedCount?: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && files.length === 0) {
      setLoading(true);
      fetch('/api/companion/source-files')
        .then((r) => r.json())
        .then((data) => {
          if (data.files && data.files.length > 0) {
            setFiles(data.files);
            setSelectedPath(data.files[0].path);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, files.length]);

  const currentFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPath(label);
      window.setTimeout(() => setCopiedPath(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadSingleFile = (file: SourceFileItem) => {
    const blob = new Blob([file.content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAutoPushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim() || pushing) return;

    setPushing(true);
    setPushResult(null);

    try {
      const res = await fetch('/api/companion/push-github', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          githubToken: githubToken.trim(),
          repoName: repoName.trim() || 'aari-jarvis-ai',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPushResult({error: data.error || 'Failed to upload to GitHub'});
      } else {
        setPushResult({
          success: true,
          repoUrl: data.repoUrl,
          uploadedCount: data.uploadedCount,
        });
      }
    } catch {
      setPushResult({error: 'Network error while connecting to GitHub'});
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <UploadCloud className="w-4 h-4 text-rose-400" />
        <span>Send Project to GitHub / Get Files</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6">
          <div className="w-full max-w-4xl h-[88vh] rounded-3xl bg-[#161220] border border-white/15 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  GitHub Auto-Uploader & Source Files
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Push all files automatically in 1 click or download/copy files
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close source code modal"
                className="min-h-[42px] min-w-[42px] rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-5 py-3 bg-[#110D19] border-b border-white/10 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('auto-github')}
                className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'auto-github'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/5 text-stone-300 hover:bg-white/10'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>1-Click Auto Upload to GitHub</span>
              </button>
              <button
                onClick={() => setActiveTab('manual-files')}
                className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'manual-files'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/5 text-stone-300 hover:bg-white/10'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Copy / Download Files</span>
              </button>
            </div>

            {activeTab === 'auto-github' ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="rounded-2xl bg-[#1E182B] border border-white/10 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-white font-display">
                    Bina Copy-Paste Kiye Seedha GitHub Par Bhejein (Sabse Aasan)
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs text-stone-300 leading-relaxed">
                    <li>
                      Is link par tap karein:{' '}
                      <a
                        href="https://github.com/settings/tokens/new?description=AariJarvis&scopes=repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 underline font-semibold inline-flex items-center gap-1"
                      >
                        <span>Create GitHub Token</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      GitHub page par neeche scroll karke green{' '}
                      <strong>“Generate token”</strong> button dabayein aur
                      token (`ghp_...`) copy kar lein.
                    </li>
                    <li>
                      Neeche box mein woh token paste karein aur{' '}
                      <strong>“Auto-Upload All Files to GitHub”</strong> daba
                      dein — saari 17 files aur folders apne aap aapke GitHub
                      mein chale jayenge!
                    </li>
                  </ol>
                </div>

                <form onSubmit={handleAutoPushToGitHub} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      Repository Name (Naya ya Purana Naam)
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="aari-jarvis-ai"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#110D19] border border-white/15 text-sm text-white font-mono-tabular focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-300">
                      GitHub Personal Access Token (ghp_...)
                    </label>
                    <input
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="Paste your ghp_... token here"
                      className="w-full min-h-[44px] px-4 rounded-xl bg-[#110D19] border border-white/15 text-sm text-white font-mono-tabular focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!githubToken.trim() || pushing}
                    className="w-full min-h-[48px] rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-5 h-5" />
                    <span>
                      {pushing
                        ? 'Uploading All 17 Files to GitHub...'
                        : 'Auto-Upload All Files to GitHub Now'}
                    </span>
                  </button>
                </form>

                {pushResult?.error && (
                  <div className="rounded-2xl bg-rose-950/60 border border-rose-500/40 p-4 text-xs text-rose-200">
                    {pushResult.error}
                  </div>
                )}

                {pushResult?.success && pushResult.repoUrl && (
                  <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-4 space-y-3">
                    <p className="text-sm font-bold text-emerald-300">
                      Badhai Ho! Saari {pushResult.uploadedCount} files aapke
                      GitHub par upload ho gayi hain!
                    </p>
                    <a
                      href={pushResult.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                    >
                      <span>Open Your GitHub Repository</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* File Selector Tabs */}
                <div className="px-4 py-2.5 bg-[#110D19] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
                  {files.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedPath(file.path)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedPath === file.path
                          ? 'bg-rose-600 text-white font-semibold'
                          : 'bg-white/5 text-stone-300 hover:bg-white/10'
                      }`}
                    >
                      {file.path}
                    </button>
                  ))}
                </div>

                {/* Active File Action Bar */}
                {currentFile && (
                  <div className="px-5 py-2.5 bg-[#1B1627] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono-tabular text-rose-300 truncate">
                      {currentFile.path}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadSingleFile(currentFile)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() =>
                          handleCopy(currentFile.content, currentFile.path)
                        }
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedPath === currentFile.path ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* File Code Viewer */}
                <div className="flex-1 overflow-auto p-4 bg-[#0D0A12]">
                  {loading ? (
                    <p className="text-xs text-stone-400">
                      Loading project files...
                    </p>
                  ) : currentFile ? (
                    <pre className="text-xs font-mono-tabular text-stone-200 whitespace-pre overflow-x-auto leading-relaxed select-all">
                      {currentFile.content}
                    </pre>
                  ) : (
                    <p className="text-xs text-stone-400">No files loaded.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
