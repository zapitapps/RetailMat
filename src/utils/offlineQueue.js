/**
 * Simple Offline Queue for critical actions (Experience Blueprint)
 * Stores actions in localStorage when offline.
 * Syncs when online.
 */
const OFFLINE_KEY = 'vendrai_offline_queue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

function addOfflineAction(action) {
  const queue = getQueue();
  queue.push({
    id: Date.now() + Math.random(),
    ...action,
    queuedAt: new Date().toISOString(),
    synced: false
  });
  saveQueue(queue);
  return true;
}

async function syncOfflineActions(apiCallFn) {
  const queue = getQueue();
  if (!queue.length) return { synced: 0 };

  const stillPending = [];
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.type === 'confirmPayment') {
        await apiCallFn(`/dashboard/orders/${item.orderId}/confirm-payment`, {
          method: 'POST',
          body: JSON.stringify(item.payload)
        });
        synced++;
      } else if (item.type === 'markShipped') {
        await apiCallFn(`/dashboard/orders/${item.orderId}/mark-shipped`, {
          method: 'POST',
          body: JSON.stringify(item.payload)
        });
        synced++;
      }
    } catch (e) {
      stillPending.push(item);
    }
  }

  saveQueue(stillPending);
  return { synced, remaining: stillPending.length };
}

module.exports = { addOfflineAction, syncOfflineActions, getQueue };
