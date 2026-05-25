"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus =
  | "idle"
  | "recording"
  | "finalizing"
  | "stopped"
  | "error";

const BAR_COUNT = 28;

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(0.15),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("audio/webm");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const animateLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const step = Math.floor(data.length / BAR_COUNT);
    const next = Array.from({ length: BAR_COUNT }, (_, i) => {
      const slice = data.slice(i * step, (i + 1) * step);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      return Math.max(0.12, Math.min(1, avg / 128));
    });

    setLevels(next);
    animationRef.current = requestAnimationFrame(animateLevels);
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    chunksRef.current = [];
    setDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      mimeTypeRef.current = mimeType || "audio/webm";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeTypeRef.current,
        });
        cleanup();

        if (blob.size === 0) {
          setStatus("idle");
          setErrorMessage(
            "Aufnahme konnte nicht gespeichert werden. Bitte erneut aufnehmen.",
          );
          return;
        }

        setAudioBlob(blob);
        setStatus("stopped");
      };

      recorder.onerror = () => {
        cleanup();
        setStatus("error");
        setErrorMessage("Aufnahme fehlgeschlagen. Bitte erneut versuchen.");
      };

      recorder.start(250);
      setStatus("recording");
      animateLevels();

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setStatus("error");
      setErrorMessage(
        "Mikrofon-Zugriff verweigert. Bitte Berechtigung in den Browser-Einstellungen erlauben.",
      );
      cleanup();
    }
  }, [animateLevels, cleanup]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      setStatus("finalizing");
      recorder.requestData();
      recorder.stop();
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    chunksRef.current = [];
    setAudioBlob(null);
    setDuration(0);
    setLevels(Array(BAR_COUNT).fill(0.15));
    setStatus("idle");
    setErrorMessage(null);
  }, [cleanup]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    status,
    duration,
    levels,
    audioBlob,
    errorMessage,
    startRecording,
    stopRecording,
    reset,
    formatDuration,
    isRecording: status === "recording",
    isFinalizing: status === "finalizing",
    hasRecording: status === "stopped" && audioBlob !== null,
  };
}
