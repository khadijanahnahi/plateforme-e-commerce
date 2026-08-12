import { useEffect, useState } from "react";
import {
  getAdminNotifications,
  getAdminPushStatus,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  streamAdminNotifications,
  subscribeAdminDevice,
  unsubscribeAdminDevice,
} from "../api/adminNotificationsApi";

const SERVICE_WORKER_PATH = "/push-sw.js";

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState({ configured: false, subscribed: false, publicKey: null });
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  const pushSupported = typeof window !== "undefined"
    && window.isSecureContext
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [notificationData, statusData] = await Promise.all([
          getAdminNotifications(),
          getAdminPushStatus(),
        ]);
        if (cancelled) return;
        setNotifications(notificationData.notifications || []);
        setUnreadCount(notificationData.unreadCount || 0);
        setPushStatus(statusData);
        if (pushSupported) {
          const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
          const subscription = await registration.pushManager.getSubscription();
          if (!cancelled) setDeviceSubscribed(Boolean(subscription));
        }
      } catch {
        if (!cancelled) setPushMessage("Impossible de charger les notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [pushSupported]);

  useEffect(() => {
    let stopped = false;
    let retryTimer;
    let controller;

    async function connect() {
      controller = new AbortController();
      try {
        await streamAdminNotifications({
          signal: controller.signal,
          onNotification: (notification) => {
            setNotifications((current) => [
              notification,
              ...current.filter((item) => item.id !== notification.id),
            ].slice(0, 12));
            if (!notification.read) setUnreadCount((current) => current + 1);
          },
        });
      } catch (error) {
        if (stopped || error.name === "AbortError") return;
        if (error.status === 401) {
          try {
            await getAdminNotifications(1);
          } catch {
            return;
          }
        }
      }
      if (!stopped) retryTimer = window.setTimeout(connect, 3000);
    }

    connect();
    return () => {
      stopped = true;
      controller?.abort();
      window.clearTimeout(retryTimer);
    };
  }, []);

  async function markRead(notification) {
    if (!notification.read) {
      await markAdminNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read: true } : item
      )));
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  }

  async function markAllRead() {
    await markAllAdminNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }

  async function enablePush() {
    if (!pushSupported || !pushStatus.configured || pushBusy) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushMessage("Autorisation de notification refusée sur cet appareil.");
        return;
      }
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
      let subscription = await registration.pushManager.getSubscription();
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pushStatus.publicKey),
      });
      const status = await subscribeAdminDevice(subscription, detectDeviceName());
      setPushStatus(status);
      setDeviceSubscribed(true);
      setPushMessage("Notifications activées sur cet appareil.");
    } catch {
      setPushMessage("Impossible d'activer les notifications sur cet appareil.");
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    if (!pushSupported || pushBusy) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/")
        || await navigator.serviceWorker.ready;
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeAdminDevice(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setDeviceSubscribed(false);
      setPushMessage("Notifications désactivées sur cet appareil.");
    } catch {
      setPushMessage("Impossible de désactiver les notifications.");
    } finally {
      setPushBusy(false);
    }
  }

  return {
    deviceSubscribed,
    disablePush,
    enablePush,
    loading,
    markAllRead,
    markRead,
    notifications,
    pushBusy,
    pushMessage,
    pushStatus,
    pushSupported,
    unreadCount,
  };
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function detectDeviceName() {
  const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  return mobile ? "Téléphone admin" : "Navigateur admin";
}
