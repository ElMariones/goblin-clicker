import { describe, expect, it } from 'vitest';
import { SaveOwnershipLease, type StorageLike } from './saveOwnership';

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('browser save ownership lease', () => {
  it('elects one initial owner and makes a second document read-only', () => {
    const storage = new MemoryStorage();
    const first = new SaveOwnershipLease('save.owner', storage, 'first', 20_000);
    const second = new SaveOwnershipLease('save.owner', storage, 'second', 20_000);
    expect(first.claimInitial(1_000).role).toBe('owner');
    expect(second.claimInitial(1_000)).toMatchObject({ role: 'secondary', canTakeOver: false });
    expect(first.canWrite(1_001)).toBe(true);
    expect(second.canWrite(1_001)).toBe(false);
  });

  it('refuses explicit takeover while the owner lease is active', () => {
    const storage = new MemoryStorage();
    const first = new SaveOwnershipLease('save.owner', storage, 'first', 20_000);
    const second = new SaveOwnershipLease('save.owner', storage, 'second', 20_000);
    first.claimInitial(1_000);
    second.claimInitial(1_000);
    expect(second.tryTakeOver(20_999)).toBe(false);
    expect(second.snapshot(20_999).canTakeOver).toBe(false);
    expect(first.canWrite(20_999)).toBe(true);
  });

  it('allows takeover only after owner release and immediately revokes the old owner', () => {
    const storage = new MemoryStorage();
    const first = new SaveOwnershipLease('save.owner', storage, 'first', 20_000);
    const second = new SaveOwnershipLease('save.owner', storage, 'second', 20_000);
    first.claimInitial(1_000);
    second.claimInitial(1_000);
    first.release();
    expect(second.refresh(2_000)).toMatchObject({ role: 'secondary', canTakeOver: true });
    expect(second.tryTakeOver(2_000)).toBe(true);
    expect(second.canWrite(2_001)).toBe(true);
    expect(first.canWrite(2_001)).toBe(false);
  });

  it('allows explicit takeover of an expired lease without auto-acquiring on refresh', () => {
    const storage = new MemoryStorage();
    const first = new SaveOwnershipLease('save.owner', storage, 'first', 20_000);
    const second = new SaveOwnershipLease('save.owner', storage, 'second', 20_000);
    first.claimInitial(1_000);
    second.claimInitial(1_000);
    expect(second.refresh(21_000)).toMatchObject({ role: 'secondary', canTakeOver: true });
    expect(second.canWrite(21_000)).toBe(false);
    expect(second.tryTakeOver(21_000)).toBe(true);
    expect(first.refresh(21_001).role).toBe('secondary');
  });

  it('renews only the current owner and extends its expiry', () => {
    const storage = new MemoryStorage();
    const first = new SaveOwnershipLease('save.owner', storage, 'first', 20_000);
    const second = new SaveOwnershipLease('save.owner', storage, 'second', 20_000);
    expect(first.claimInitial(1_000).leaseExpiresAt).toBe(21_000);
    expect(first.renew(10_000)).toBe(true);
    expect(first.snapshot(10_000).leaseExpiresAt).toBe(30_000);
    second.claimInitial(10_000);
    expect(second.renew(10_000)).toBe(false);
  });

  it('falls back to uncoordinated in-memory play when persistent storage is unavailable', () => {
    const lease = new SaveOwnershipLease('save.owner', null, 'solo');
    expect(lease.claimInitial(1_000)).toEqual({ role: 'uncoordinated', canTakeOver: false, leaseExpiresAt: null });
    expect(lease.canWrite(1_000)).toBe(true);
  });
});
