import React, { useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import {
  Scissors,
  Layers,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileText,
  User,
  CheckCircle,
} from 'lucide-react';

export type SeoModalTab = 'about' | 'guides' | 'privacy' | 'terms';

interface SeoModalsProps {
  activeTab: SeoModalTab | null;
  onClose: () => void;
  onOpenTab: (tab: SeoModalTab) => void;
}

export const SeoModals: React.FC<SeoModalsProps> = ({
  activeTab,
  onClose,
  onOpenTab,
}) => {
  const [guideCategory, setGuideCategory] = useState<'trim' | 'merge' | 'split'>('trim');

  if (!activeTab) return null;

  return (
    <Dialog
      isOpen={activeTab !== null}
      onClose={onClose}
      title={
        activeTab === 'about'
          ? 'About CraftSound & Creator'
          : activeTab === 'guides'
          ? 'Audio Editing Guides & Tutorials'
          : activeTab === 'privacy'
          ? 'Privacy Policy (100% Client-Side)'
          : 'Terms of Service'
      }
      description={
        activeTab === 'about'
          ? 'CraftSound by arshadakl.in — Browser-based Multitrack DAW'
          : activeTab === 'guides'
          ? 'Step-by-step guides for trimming, merging, and cutting audio'
          : 'Zero server uploads. Your audio files stay 100% on your device'
      }
      maxWidth="max-w-2xl"
    >
      {/* Navigation Tabs inside modal */}
      <div className="flex items-center gap-1.5 border-b border-[var(--border-default)] pb-3 mb-4 overflow-x-auto text-xs">
        <button
          onClick={() => onOpenTab('about')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'about'
              ? 'bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>About &amp; Creator</span>
        </button>

        <button
          onClick={() => onOpenTab('guides')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'guides'
              ? 'bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>How-To Guides</span>
        </button>

        <button
          onClick={() => onOpenTab('privacy')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'privacy'
              ? 'bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => onOpenTab('terms')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            activeTab === 'terms'
              ? 'bg-[var(--primary-accent)] text-white dark:text-neutral-900 font-semibold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms</span>
        </button>
      </div>

      {/* About Tab Content */}
      {activeTab === 'about' && (
        <div className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-base)] space-y-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary-accent)]" />
              What is CraftSound?
            </h4>
            <p>
              <strong>CraftSound</strong> (<a href="https://mix.arshadakl.in" className="text-[var(--primary-accent)] hover:underline font-mono">mix.arshadakl.in</a>) is a high-performance, web-based digital audio workstation (DAW) designed for instant, zero-latency multitrack audio trimming, splitting, and merging.
            </p>
            <p>
              Unlike traditional online converters that upload your audio to a remote server, CraftSound processes every sample directly in your web browser using the <strong>Web Audio API</strong>, <strong>Web Workers</strong>, and <strong>IndexedDB</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-raised)]">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              Creator &amp; Engineering
            </h4>
            <p className="mb-2">
              CraftSound was architected and built by <strong>Arshad</strong>. Discover more open-source tools, software engineering writeups, and projects on the personal portfolio:
            </p>
            <a
              href="https://arshadakl.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--primary-accent)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <span>Visit arshadakl.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">
              Key Features
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li className="flex items-center gap-2 p-2 rounded bg-[var(--surface-card)] border border-[var(--border-default)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Lossless Audio Trimmer</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded bg-[var(--surface-card)] border border-[var(--border-default)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multitrack Audio Merger</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded bg-[var(--surface-card)] border border-[var(--border-default)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Playhead Clip Splitting</span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded bg-[var(--surface-card)] border border-[var(--border-default)]">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Client-Side WAV &amp; MP3 Export</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Guides Tab Content */}
      {activeTab === 'guides' && (
        <div className="space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed">
          <div className="flex gap-2 border-b border-[var(--border-default)] pb-2.5">
            <button
              onClick={() => setGuideCategory('trim')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                guideCategory === 'trim'
                  ? 'bg-[var(--surface-card)] border border-[var(--border-strong)] font-semibold text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>How to Trim Audio</span>
            </button>
            <button
              onClick={() => setGuideCategory('merge')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                guideCategory === 'merge'
                  ? 'bg-[var(--surface-card)] border border-[var(--border-strong)] font-semibold text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>How to Merge Audio</span>
            </button>
            <button
              onClick={() => setGuideCategory('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                guideCategory === 'split'
                  ? 'bg-[var(--surface-card)] border border-[var(--border-strong)] font-semibold text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>How to Split Clips</span>
            </button>
          </div>

          {guideCategory === 'trim' && (
            <article className="space-y-2.5">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                How to Trim &amp; Cut Audio Files Online (MP3, WAV, AAC)
              </h4>
              <p>
                Trimming audio removes unwanted beginnings, applause, or dead space. Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>
                  <strong>Import Audio:</strong> Click <em>&quot;Import Audio Files&quot;</em> in the Audio Library panel or drop your files directly onto the app.
                </li>
                <li>
                  <strong>Add to Timeline:</strong> Click the <strong>&quot;+ Add&quot;</strong> button next to the imported audio file or drag it onto Track 1.
                </li>
                <li>
                  <strong>Adjust Trim Handles:</strong> Hover over the left or right edge of the audio clip. Drag the edge inward to trim the start or end of the track.
                </li>
                <li>
                  <strong>Export Result:</strong> Click <strong>&quot;Export Audio&quot;</strong> in the top toolbar and choose MP3 or WAV format to download your trimmed track.
                </li>
              </ol>
            </article>
          )}

          {guideCategory === 'merge' && (
            <article className="space-y-2.5">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                How to Merge Multiple Audio Tracks &amp; Stems
              </h4>
              <p>
                Merging allows you to layer background music under voiceovers or join consecutive recordings into a seamless single file:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>
                  <strong>Create Additional Tracks:</strong> Click <em>&quot;Add Track&quot;</em> on the timeline toolbar to create separate audio channels.
                </li>
                <li>
                  <strong>Place Clips on Tracks:</strong> Add your voice recording on Track 1, and your background music stem on Track 2.
                </li>
                <li>
                  <strong>Balance Volume &amp; Pan:</strong> Use the volume sliders on each track header to set background music to a lower volume (e.g., 30-40%) so voices remain clear.
                </li>
                <li>
                  <strong>Export Mixed Track:</strong> When you click <em>&quot;Export Audio&quot;</em>, CraftSound automatically renders all tracks together through the client-side mixing engine.
                </li>
              </ol>
            </article>
          )}

          {guideCategory === 'split' && (
            <article className="space-y-2.5">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                How to Split an Audio Clip at the Playhead
              </h4>
              <p>
                Splitting lets you cut out a section from the middle of a recording:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>Click on the timeline ruler to position the red playhead right where you want to cut.</li>
                <li>Click on the clip to select it (it will highlight with an active border).</li>
                <li>Press the <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-base)] border border-[var(--border-default)] font-mono">S</kbd> key or click the <strong>Scissors icon</strong> in the top toolbar.</li>
                <li>The clip will split into two independent pieces that you can delete or reposition!</li>
              </ol>
            </article>
          )}
        </div>
      )}

      {/* Privacy Policy Tab Content */}
      {activeTab === 'privacy' && (
        <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
            <h4 className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Client-Side Privacy Guarantee
            </h4>
            <p>
              Your audio files are <strong>never sent to any server or cloud</strong>. All file decoding, waveform analysis, timeline mixing, and encoding occur locally inside your browser.
            </p>
          </div>

          <h4 className="font-semibold text-[var(--text-primary)] mt-3">Local Storage (IndexedDB)</h4>
          <p>
            CraftSound uses your browser&apos;s built-in <strong>IndexedDB</strong> storage so your timeline edits and imported clips survive page refreshes. This data remains on your physical device. You can purge all saved data at any time using the <em>Project Options &gt; Clear All Local Data</em> button.
          </p>

          <h4 className="font-semibold text-[var(--text-primary)]">No Tracking &amp; No Cookies</h4>
          <p>
            CraftSound does not load invasive ad networks, user profiling scripts, or tracking cookies.
          </p>

          <p className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-default)]">
            Last Updated: November 2026 · Maintained by <a href="https://arshadakl.in" className="underline">arshadakl.in</a>
          </p>
        </div>
      )}

      {/* Terms of Service Tab Content */}
      {activeTab === 'terms' && (
        <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
          <h4 className="font-semibold text-[var(--text-primary)]">Free &amp; Open Software</h4>
          <p>
            CraftSound is provided for free under the <strong>MIT License</strong>. You are free to edit, trim, merge, and export your personal or commercial audio tracks with zero royalty fees or attribution requirements.
          </p>

          <h4 className="font-semibold text-[var(--text-primary)]">Your Content Ownership</h4>
          <p>
            You retain 100% of all rights and intellectual property in any audio you import or export through CraftSound.
          </p>

          <h4 className="font-semibold text-[var(--text-primary)]">Disclaimer</h4>
          <p>
            The software is provided &quot;as is&quot;, without warranty of any kind, express or implied.
          </p>
        </div>
      )}
    </Dialog>
  );
};
