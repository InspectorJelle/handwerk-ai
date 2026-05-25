"use client";

import { Check, Loader2, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

type RecordStepProps = {
  onBack: () => void;
  onSubmit: (audio: Blob) => void;
};

export function RecordStep({ onBack, onSubmit }: RecordStepProps) {
  const recorder = useAudioRecorder();

  const handleMicPress = () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }
    if (!recorder.hasRecording && !recorder.isFinalizing) {
      void recorder.startRecording();
    }
  };

  const handleCalculate = () => {
    if (recorder.audioBlob) {
      onSubmit(recorder.audioBlob);
    }
  };

  const hintText = recorder.isRecording
    ? "Großen Button tippen zum Stoppen"
    : recorder.isFinalizing
      ? "Aufnahme wird gespeichert…"
      : recorder.hasRecording
        ? "Aufnahme fertig – unten berechnen"
        : "Großen Button tippen zum Aufnehmen";

  return (
    <div className="flex min-h-[60dvh] flex-col gap-6 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Spracheingabe</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Schritt 2 von 3 – Beschreiben Sie die Arbeiten laut.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex h-24 w-full items-end justify-center gap-1 px-4">
          {recorder.levels.map((level, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-[var(--primary)] transition-transform duration-75"
              style={{
                height: "4rem",
                transform: `scaleY(${recorder.isRecording ? level : recorder.hasRecording ? 0.5 : 0.15})`,
                transformOrigin: "bottom",
                opacity: recorder.isRecording ? 1 : 0.35,
              }}
            />
          ))}
        </div>

        <p className="font-mono text-2xl font-semibold tabular-nums text-[var(--foreground)]">
          {recorder.formatDuration(recorder.duration)}
        </p>

        <button
          type="button"
          onClick={handleMicPress}
          disabled={
            recorder.status === "error" ||
            recorder.isFinalizing ||
            recorder.hasRecording
          }
          className={`flex h-28 w-28 items-center justify-center rounded-full shadow-xl transition-transform active:scale-95 disabled:opacity-60 ${
            recorder.isRecording
              ? "bg-red-500 text-white"
              : recorder.hasRecording
                ? "bg-emerald-500 text-white"
                : "bg-[var(--primary)] text-white"
          }`}
          aria-label={
            recorder.isRecording
              ? "Aufnahme stoppen"
              : recorder.hasRecording
                ? "Aufnahme abgeschlossen"
                : "Aufnahme starten"
          }
        >
          {recorder.isFinalizing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : recorder.isRecording ? (
            <Square className="h-10 w-10 fill-current" />
          ) : recorder.hasRecording ? (
            <Check className="h-12 w-12" strokeWidth={3} />
          ) : (
            <Mic className="h-12 w-12" />
          )}
        </button>

        <p className="max-w-xs text-center text-sm text-[var(--muted)]">
          {hintText}
        </p>

        {recorder.errorMessage && (
          <p className="text-center text-sm text-red-600">
            {recorder.errorMessage}
          </p>
        )}

        {recorder.hasRecording && (
          <div className="w-full max-w-sm space-y-3 px-2">
            <button
              type="button"
              className="btn-primary flex min-h-[3.5rem] w-full items-center justify-center gap-2 text-lg"
              onClick={handleCalculate}
            >
              <Sparkles className="h-5 w-5" />
              Angebot berechnen
            </button>
            <button
              type="button"
              className="flex min-h-12 w-full items-center justify-center gap-2 text-sm text-[var(--muted)]"
              onClick={recorder.reset}
            >
              <RotateCcw className="h-4 w-4" />
              Neu aufnehmen
            </button>
          </div>
        )}
      </div>

      <button type="button" className="btn-secondary" onClick={onBack}>
        Zurück
      </button>
    </div>
  );
}
