import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { gooeyToast } from "goey-toast";
import { getStoredAccessToken } from "../auth/storageBridge";
import {
  getNotificationRecordId,
  notificationBodyPreview,
  notificationSubject,
} from "../utils/notificationDisplay";
import { unwrapNotificationEnvelope } from "../utils/notificationEnvelope";

function resolveSockJsUrl() {
  const explicit = import.meta.env.VITE_NOTIFICATION_WS_URL;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  const notificationApiBase = import.meta.env.VITE_NOTIFICATION_API_BASE_URL;
  if (notificationApiBase && String(notificationApiBase).trim()) {
    try {
      const u = new URL(
        String(notificationApiBase).trim(),
        typeof window !== "undefined" ? window.location.href : undefined,
      );
      return `${u.origin}/ws`;
    } catch {
      /* fall through */
    }
  }
  const base = import.meta.env.VITE_API_BASE_URL || "";
  try {
    const u = new URL(
      base,
      typeof window !== "undefined" ? window.location.href : undefined,
    );
    return `${u.origin}/ws`;
  } catch {
    return typeof window !== "undefined"
      ? `${window.location.origin}/ws`
      : "/ws";
  }
}

function parseIncomingNotification(message) {
  const raw = message?.body ?? message;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = unwrapNotificationEnvelope(JSON.parse(raw));
      if (parsed && typeof parsed === "object") {
        return {
          ...parsed,
          __rawMessage: raw,
        };
      }
      return {
        subject: "New notification",
        body: raw,
        __rawMessage: raw,
      };
    } catch {
      return {
        subject: "New notification",
        body: raw,
        __rawMessage: raw,
      };
    }
  }
  if (typeof raw === "object") {
    const parsed = unwrapNotificationEnvelope(raw);
    if (parsed && typeof parsed === "object") {
      return {
        ...parsed,
        __rawMessage: JSON.stringify(raw),
      };
    }
    return {
      subject: "New notification",
      body: String(raw),
      __rawMessage: JSON.stringify(raw),
    };
  }
  return {
    subject: "New notification",
    body: String(raw),
    __rawMessage: String(raw),
  };
}

function notificationDedupeKey(payload) {
  const id = getNotificationRecordId(payload);
  if (id) return `id:${id}`;
  const title = notificationSubject(payload);
  const body = notificationBodyPreview(payload);
  const stamp =
    payload?.createdAt ?? payload?.created_at ?? payload?.sentAt ?? payload?.timestamp ?? "";
  const composite = [title, body, stamp, payload?.__rawMessage].filter(Boolean).join("|");
  return composite ? `composite:${composite}` : "";
}

function rememberNotificationKey(seenRef, key) {
  if (!key) return false;
  if (seenRef.current.has(key)) return false;
  seenRef.current.add(key);
  if (seenRef.current.size > 50) {
    const oldest = seenRef.current.values().next().value;
    if (oldest) seenRef.current.delete(oldest);
  }
  return true;
}

function playNotificationSound() {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    const context =
      window.__finalProjectNotificationAudioContext ||
      new AudioContextCtor();
    window.__finalProjectNotificationAudioContext = context;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.055, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    master.connect(context.destination);

    const first = context.createOscillator();
    first.type = "sine";
    first.frequency.setValueAtTime(880, now);
    first.connect(master);
    first.start(now);
    first.stop(now + 0.14);

    const second = context.createOscillator();
    second.type = "sine";
    second.frequency.setValueAtTime(1174, now + 0.16);
    second.connect(master);
    second.start(now + 0.16);
    second.stop(now + 0.32);
  } catch {
    // Browser audio can fail when autoplay permissions are unavailable.
  }
}

/**
 * Subscribes to the Spring STOMP user queue and refreshes notification queries.
 * Requires backend JWT-on-connect (or cookie session) compatible with your gateway.
 */
export function useNotificationWebSocket(userId, enabled = true, options = {}) {
  const queryClient = useQueryClient();
  const clientRef = useRef(null);
  const seenNotificationsRef = useRef(new Set());
  const {
    showPopup = true,
    playSound = true,
    onNotification,
  } = options;

  useEffect(() => {
    if (!enabled || !userId) return undefined;

    const token = getStoredAccessToken();
    const sockUrl = resolveSockJsUrl();

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe("/user/queue/notifications", (message) => {
          const payload = parseIncomingNotification(message);
          const key = notificationDedupeKey(payload);
          const isFresh = rememberNotificationKey(seenNotificationsRef, key);

          if (payload && isFresh) {
            const title = notificationSubject(payload) || "New notification";
            const description = notificationBodyPreview(payload);
            if (showPopup) {
              gooeyToast.info(
                title,
                description ? { description } : undefined,
              );
            }
            if (playSound) {
              playNotificationSound();
            }
            if (typeof onNotification === "function") {
              onNotification(payload);
            }
          }

          queryClient.invalidateQueries({
            queryKey: ["notifications", "user", userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread", userId],
          });
        });
      },
      onStompError: (frame) => {
        console.warn("Notification STOMP error:", frame.headers?.message || frame.body);
      },
      onWebSocketError: (event) => {
        console.warn("Notification WebSocket error:", event);
      },
      onWebSocketClose: (event) => {
        if (event?.code && event.code !== 1000) {
          console.warn("Notification WebSocket closed:", event.code, event.reason);
        }
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [enabled, onNotification, playSound, queryClient, showPopup, userId]);
}
