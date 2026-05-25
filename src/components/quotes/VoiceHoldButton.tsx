"use client";

import { Lock, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const LOCK_DRAG_PX = 72;

type VoiceHoldButtonProps = {
  onAudioReady: (blob: Blob) => void;
  disabled?: boolean;
};

export function VoiceHoldButton({ onAudioReady, disabled }: VoiceHoldButtonProps) {
  const recorder = useAudioRecorder();
  const [locked, setLocked] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(0);
  const holdingRef = useRef(false);
  const sentRef = useRef(false);

  useEffect(() => {
    if (
      recorder.status === "stopped" &&
      recorder.audioBlob &&
      !sentRef.current
    ) {
      sentRef.current = true;
      onAudioReady(recorder.audioBlob);
      recorder.reset();
      setLocked(false);
      setDragOffset(0);
      holdingRef.current = false;
      queueMicrotask(() => {
        sentRef.current = false;
      });
    }
  }, [recorder.status, recorder.audioBlob, onAudioReady, recorder]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || locked) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    holdingRef.current = true;
    startYRef.current = e.clientY;
    setDragOffset(0);
    void recorder.startRecording();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!holdingRef.current || locked || !recorder.isRecording) return;
    const delta = startYRef.current - e.clientY;
    setDragOffset(Math.max(0, Math.min(delta, 100)));
    if (delta >= LOCK_DRAG_PX) {
      setLocked(true);
      setDragOffset(LOCK_DRAG_PX);
    }
  };

  const handlePointerUp = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    if (!locked && recorder.isRecording) {
      recorder.stopRecording();
    }
  };

  const handleLockedTap = () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
    }
  };

  const active = recorder.isRecording || locked;

  return (
    <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2">
      {active && (
        <div className="pointer-events-auto max-w-[220px] rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm text-white shadow-lg">
          {locked ? (
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" />
              Gesperrt – tippen zum Senden
            </span>
          ) : (
            <span>
              {dragOffset >= LOCK_DRAG_PX - 10
                ? "Loslassen = Sperren"
                : "↑ wischen zum Sperren"}
            </span>
          )}
          <span className="mt-1 block font-mono text-xs opacity-80">
            {recorder.formatDuration(recorder.duration)}
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={disabled || recorder.isFinalizing}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={locked ? handleLockedTap : undefined}
        style={{ transform: `translateY(-${dragOffset}px)` }}
        className={`pointer-events-auto flex h-16 w-16 touch-none select-none items-center justify-center rounded-full shadow-2xl transition-transform ${
          active ? "bg-red-500 text-white" : "bg-[var(--primary)] text-white"
        } disabled:opacity-50`}
        aria-label="Spracheingabe gedrückt halten"
      >
        {active ? (
          <Square className="h-7 w-7 fill-current" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>
    </div>
  );
}
