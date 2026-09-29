import React, { useState, useEffect } from 'react';
import { MatchItem, SportType } from '../types/models';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, Sparkles, CheckCircle2, AlertCircle, X, RotateCw, Trophy } from 'lucide-react';

interface CircularCoinTossModalProps {
  match: MatchItem;
  isOpen: boolean;
  onClose: () => void;
  onTossCompleted?: (updatedMatch: MatchItem) => void;
}

export const CircularCoinTossModal: React.FC<CircularCoinTossModalProps> = ({
  match,
  isOpen,
  onClose,
  onTossCompleted,
}) => {
  const { currentUser, userProfile } = useAuth();

  // Toss State
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [landedZone, setLandedZone] = useState<'HEAD' | 'TAIL' | null>(
    match.toss?.zoneLanded || null
  );
  const [winningTeam, setWinningTeam] = useState<{ id: string; name: string } | null>(
    match.toss
      ? { id: match.toss.winnerTeamId, name: match.toss.winnerTeamName }
      : null
  );
  const [decision, setDecision] = useState<'bat' | 'bowl' | 'kickoff' | 'side'>(
    match.toss?.choice || (match.sport === 'cricket' ? 'bat' : 'kickoff')
  );
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check existing saved toss from match model
  const isAlreadyLocked = !!match.toss?.executed;

  // Authorization check: Only organizer or admin or team captains can toss
  const isAuthorized =
    currentUser &&
    (userProfile?.role === 'organizer' ||
      userProfile?.role === 'admin' ||
      match.organizerId === currentUser.uid);

  if (!isOpen) return null;

  const handleStartToss = () => {
    if (isAlreadyLocked) return;
    if (!isAuthorized) {
      setErrorMsg('Only the match referee, organizer, or admin can execute the official coin toss.');
      return;
    }
    setErrorMsg(null);
    setIsSpinning(true);

    // Randomize winning zone: HEAD or TAIL (50/50 probability)
    const outcomeZone: 'HEAD' | 'TAIL' = Math.random() >= 0.5 ? 'HEAD' : 'TAIL';
    // Randomize which team won the toss
    const winner = Math.random() >= 0.5
      ? { id: match.teamAId, name: match.teamAName }
      : { id: match.teamBId, name: match.teamBName };

    // Calculate rotation: multiple full 360 cycles (5 to 8 rotations) + exact zone alignment
    // Zone HEAD aligns to top (0 / 360 deg) and TAIL aligns to bottom (180 deg)
    const baseRotations = 360 * (5 + Math.floor(Math.random() * 3));
    const targetOffset = outcomeZone === 'HEAD' ? 0 : 180;
    const finalAngle = baseRotations + targetOffset;

    setRotationDegrees(finalAngle);

    // Realistic physics deceleration timer (3000ms duration matching cubic-bezier CSS)
    setTimeout(() => {
      setIsSpinning(false);
      setLandedZone(outcomeZone);
      setWinningTeam(winner);
    }, 3200);
  };

  const handleSaveTossToFirestore = async () => {
    if (!currentUser || !winningTeam || !landedZone) return;
    setSaveLoading(true);
    setErrorMsg(null);

    try {
      const tossPayload = {
        executed: true,
        executedBy: currentUser.uid,
        executedByName: userProfile?.name || 'Match Official',
        executedAt: Date.now(),
        winnerTeamId: winningTeam.id,
        winnerTeamName: winningTeam.name,
        choice: decision,
        zoneLanded: landedZone,
      };

      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        toss: tossPayload,
        status: match.status === 'upcoming' ? 'toss_completed' : match.status,
      });

      if (onTossCompleted) {
        onTossCompleted({
          ...match,
          toss: tossPayload,
          status: 'toss_completed',
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error locking toss to Firestore:', err);
      setErrorMsg(err.message || 'Failed to save coin toss state.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 text-zinc-100 shadow-2xl flex flex-col items-center">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/30">
              🪙
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight">
                {match.sport === 'cricket' ? 'Cricket Match Coin Toss' : 'Football Match Kickoff Toss'}
              </h3>
              <p className="text-xs text-zinc-400">
                {match.teamAName} vs {match.teamBName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="w-full p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Existing Locked Notice */}
        {isAlreadyLocked && (
          <div className="w-full p-3.5 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Toss State Locked in Firestore:</strong> Won by {match.toss?.winnerTeamName} (Landed {match.toss?.zoneLanded}), chose to{' '}
                <strong className="uppercase">{match.toss?.choice}</strong>.
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">Official Record</span>
          </div>
        )}

        {/* Circular Arena Divided 50/50 Into HEAD and TAIL Zones */}
        <div className="relative my-4 flex items-center justify-center select-none">
          {/* Outer Ring Ambient Glow */}
          <div className="w-72 h-72 md:w-80 md:h-80 rounded-full border-4 border-zinc-800 bg-gradient-to-tr from-zinc-900 to-zinc-950 p-2 shadow-2xl relative flex items-center justify-center">
            {/* Split Arena 50/50: Top Zone (HEADS), Bottom Zone (TAILS) */}
            <div className="absolute inset-2 rounded-full overflow-hidden flex flex-col pointer-events-none">
              {/* TOP ZONE: HEAD */}
              <div
                className={`h-1/2 w-full flex items-center justify-center transition-colors border-b-2 border-zinc-700/80 ${
                  landedZone === 'HEAD'
                    ? 'bg-amber-500/30'
                    : 'bg-amber-500/10'
                }`}
              >
                <div className="text-center">
                  <span className="text-base font-black tracking-widest text-amber-400 uppercase">
                    HEADS
                  </span>
                  <p className="text-[10px] text-amber-300/70 font-bold uppercase">Zone A (50%)</p>
                </div>
              </div>

              {/* BOTTOM ZONE: TAIL */}
              <div
                className={`h-1/2 w-full flex items-center justify-center transition-colors ${
                  landedZone === 'TAIL'
                    ? 'bg-cyan-500/30'
                    : 'bg-cyan-500/10'
                }`}
              >
                <div className="text-center">
                  <span className="text-base font-black tracking-widest text-cyan-400 uppercase">
                    TAILS
                  </span>
                  <p className="text-[10px] text-cyan-300/70 font-bold uppercase">Zone B (50%)</p>
                </div>
              </div>
            </div>

            {/* Rotating Center Coin with Smooth Physics Easing */}
            <div
              style={{
                transform: `rotate(${rotationDegrees}deg)`,
                transition: isSpinning
                  ? 'transform 3.2s cubic-bezier(0.2, 0.8, 0.25, 1)'
                  : 'none',
              }}
              className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-2xl shadow-amber-500/30 flex items-center justify-center border-4 border-amber-200 z-10"
            >
              {/* Embossed inner coin styling */}
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-amber-600/60 flex flex-col items-center justify-center text-center p-2">
                <span className="text-2xl font-black text-amber-950">
                  {landedZone || '🪙'}
                </span>
                <span className="text-[10px] font-black text-amber-950 tracking-tighter uppercase">
                  ASCEND
                </span>
              </div>
            </div>

            {/* Center TOSS Interactive Trigger Button (Centered Overlay) */}
            {!isSpinning && !isAlreadyLocked && !winningTeam && (
              <button
                type="button"
                onClick={handleStartToss}
                className="absolute z-20 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black uppercase text-xs rounded-full shadow-xl shadow-emerald-500/40 active:scale-95 transition"
              >
                SPIN TOSS
              </button>
            )}
          </div>
        </div>

        {/* Physics Status during rotation */}
        {isSpinning && (
          <div className="my-3 flex items-center gap-2 text-xs font-bold text-amber-400 animate-pulse">
            <RotateCw className="w-4 h-4 animate-spin" />
            <span>Coin is rotating in high-velocity flight physics...</span>
          </div>
        )}

        {/* Post-Toss Decision Console & Confirmation */}
        {winningTeam && landedZone && (
          <div className="w-full mt-4 p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-zinc-400">
                  Coin Landed on Zone
                </span>
                <h4 className="text-lg font-black text-amber-400 uppercase">
                  {landedZone} • {winningTeam.name} Won The Toss!
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                🏆
              </div>
            </div>

            {!isAlreadyLocked && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-zinc-400">
                  {winningTeam.name} Captain's Decision:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {match.sport === 'cricket' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecision('bat')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          decision === 'bat'
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        🏏 Elect to Bat First
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('bowl')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          decision === 'bowl'
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        ⚡ Elect to Bowl First
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDecision('kickoff')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          decision === 'kickoff'
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        ⚽ Choose Kickoff
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecision('side')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          decision === 'side'
                            ? 'bg-emerald-500 text-black border-emerald-500'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        🚩 Choose Pitch Side
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleStartToss}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold rounded-xl transition"
                  >
                    Re-Spin
                  </button>
                  <button
                    type="button"
                    disabled={saveLoading}
                    onClick={handleSaveTossToFirestore}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {saveLoading ? 'Locking State...' : 'Confirm & Lock to Firestore'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
