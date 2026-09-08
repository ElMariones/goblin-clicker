export const DEFAULT_SAVE_LEASE_MS = 20_000;
export const DEFAULT_SAVE_HEARTBEAT_MS = 5_000;

export type SaveOwnershipRole = 'owner' | 'secondary' | 'uncoordinated';

export interface SaveOwnershipSnapshot {
  role: SaveOwnershipRole;
  canTakeOver: boolean;
  leaseExpiresAt: number | null;
}

interface SaveLease {
  ownerId: string;
  expiresAt: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function parseLease(raw: string | null): SaveLease | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.ownerId !== 'string' || parsed.ownerId.length === 0) return null;
    if (typeof parsed.expiresAt !== 'number' || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt < 0) return null;
    return { ownerId: parsed.ownerId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Synchronous localStorage lease. It deliberately never auto-acquires after a
 * tab has become secondary: takeover is an explicit user action after the
 * current lease disappears or expires.
 */
export class SaveOwnershipLease {
  readonly ownerId: string;
  readonly leaseKey: string;
  readonly leaseMs: number;
  private storage: StorageLike | null;
  private coordinated = true;
  private role: SaveOwnershipRole = 'secondary';

  constructor(leaseKey: string, storage: StorageLike | null, ownerId = makeId(), leaseMs = DEFAULT_SAVE_LEASE_MS) {
    this.leaseKey = leaseKey;
    this.storage = storage;
    this.ownerId = ownerId;
    this.leaseMs = leaseMs;
  }

  private readLease(): SaveLease | null {
    if (!this.storage || !this.coordinated) return null;
    try {
      return parseLease(this.storage.getItem(this.leaseKey));
    } catch {
      this.coordinated = false;
      this.role = 'uncoordinated';
      return null;
    }
  }

  private writeLease(now: number): boolean {
    if (!this.storage || !this.coordinated) {
      this.role = 'uncoordinated';
      return true;
    }
    const lease: SaveLease = { ownerId: this.ownerId, expiresAt: now + this.leaseMs };
    try {
      this.storage.setItem(this.leaseKey, JSON.stringify(lease));
      const confirmed = this.readLease();
      if (confirmed?.ownerId !== this.ownerId) {
        this.role = 'secondary';
        return false;
      }
      this.role = 'owner';
      return true;
    } catch {
      this.coordinated = false;
      this.role = 'uncoordinated';
      return true;
    }
  }

  /** Initial document election only. Existing secondary documents never call this automatically. */
  claimInitial(now: number): SaveOwnershipSnapshot {
    if (!this.storage) {
      this.coordinated = false;
      this.role = 'uncoordinated';
      return this.snapshot(now);
    }
    const lease = this.readLease();
    if (!this.coordinated) return this.snapshot(now);
    if (!lease || lease.expiresAt <= now || lease.ownerId === this.ownerId) this.writeLease(now);
    else this.role = 'secondary';
    return this.snapshot(now);
  }

  /** Explicit takeover. Refuses to steal an active lease. */
  tryTakeOver(now: number): boolean {
    if (!this.storage || !this.coordinated) {
      this.role = 'uncoordinated';
      return true;
    }
    const lease = this.readLease();
    if (!this.coordinated) return true;
    if (lease && lease.ownerId !== this.ownerId && lease.expiresAt > now) {
      this.role = 'secondary';
      return false;
    }
    return this.writeLease(now);
  }

  /** Renew only a lease still owned by this document. Never steals another tab's lease. */
  renew(now: number): boolean {
    if (!this.storage || !this.coordinated) {
      this.role = 'uncoordinated';
      return true;
    }
    const lease = this.readLease();
    if (!this.coordinated) return true;
    if (lease?.ownerId !== this.ownerId) {
      this.role = 'secondary';
      return false;
    }
    return this.writeLease(now);
  }

  /** Re-read ownership without acquiring a free/expired lease. */
  refresh(now: number): SaveOwnershipSnapshot {
    if (!this.storage || !this.coordinated) {
      this.role = 'uncoordinated';
      return this.snapshot(now);
    }
    const lease = this.readLease();
    if (!this.coordinated) return this.snapshot(now);
    this.role = lease?.ownerId === this.ownerId ? 'owner' : 'secondary';
    return this.snapshot(now);
  }

  /**
   * Verify immediately before simulation or save writes. An owner may renew its
   * own expired record; if another tab replaced it, this fails synchronously.
   */
  canWrite(now: number): boolean {
    if (!this.storage || !this.coordinated) return true;
    const lease = this.readLease();
    if (!this.coordinated) return true;
    if (lease?.ownerId !== this.ownerId) {
      this.role = 'secondary';
      return false;
    }
    if (lease.expiresAt <= now) return this.writeLease(now);
    this.role = 'owner';
    return true;
  }

  release(): void {
    if (!this.storage || !this.coordinated) return;
    try {
      const lease = this.readLease();
      if (lease?.ownerId === this.ownerId) this.storage.removeItem(this.leaseKey);
      this.role = 'secondary';
    } catch {
      this.coordinated = false;
      this.role = 'uncoordinated';
    }
  }

  snapshot(now: number): SaveOwnershipSnapshot {
    if (!this.storage || !this.coordinated || this.role === 'uncoordinated') {
      return { role: 'uncoordinated', canTakeOver: false, leaseExpiresAt: null };
    }
    const lease = this.readLease();
    if (!this.coordinated) return { role: 'uncoordinated', canTakeOver: false, leaseExpiresAt: null };
    if (lease?.ownerId === this.ownerId) this.role = 'owner';
    else this.role = 'secondary';
    return {
      role: this.role,
      canTakeOver: this.role === 'secondary' && (!lease || lease.expiresAt <= now),
      leaseExpiresAt: lease?.expiresAt ?? null,
    };
  }
}

interface CoordinationMessage { type: 'lease-changed' }

export interface BrowserSaveOwnership {
  claimInitial(now?: number): SaveOwnershipSnapshot;
  getSnapshot(now?: number): SaveOwnershipSnapshot;
  canWrite(now?: number): boolean;
  tryTakeOver(now?: number): boolean;
  release(): void;
  start(onChange: (snapshot: SaveOwnershipSnapshot) => void): () => void;
}

export function createBrowserSaveOwnership(saveKey: string): BrowserSaveOwnership {
  const leaseKey = `${saveKey}.owner.v1`;
  let storage: StorageLike | null;
  try {
    storage = typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    storage = null;
  }
  const lease = new SaveOwnershipLease(leaseKey, storage);
  let channel: BroadcastChannel | null;
  try {
    channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(`${saveKey}.ownership`);
  } catch {
    channel = null;
  }

  const notifyPeers = () => {
    try { channel?.postMessage({ type: 'lease-changed' } satisfies CoordinationMessage); }
    catch { /* localStorage storage events remain the fallback */ }
  };

  return {
    claimInitial(now = Date.now()) { return lease.claimInitial(now); },
    getSnapshot(now = Date.now()) { return lease.snapshot(now); },
    canWrite(now = Date.now()) { return lease.canWrite(now); },
    tryTakeOver(now = Date.now()) {
      const acquired = lease.tryTakeOver(now);
      if (acquired) notifyPeers();
      return acquired;
    },
    release() {
      lease.release();
      notifyPeers();
    },
    start(onChange) {
      const update = () => onChange(lease.refresh(Date.now()));
      const heartbeat = window.setInterval(() => {
        const now = Date.now();
        const current = lease.snapshot(now);
        if (current.role === 'owner') lease.renew(now);
        onChange(lease.snapshot(now));
      }, DEFAULT_SAVE_HEARTBEAT_MS);
      const onStorage = (event: StorageEvent) => {
        if (event.key === leaseKey) update();
      };
      const onMessage = (event: MessageEvent<CoordinationMessage>) => {
        if (event.data?.type === 'lease-changed') update();
      };
      window.addEventListener('storage', onStorage);
      channel?.addEventListener('message', onMessage);
      update();
      return () => {
        window.clearInterval(heartbeat);
        window.removeEventListener('storage', onStorage);
        channel?.removeEventListener('message', onMessage);
      };
    },
  };
}
