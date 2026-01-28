import { describe, it, expect, beforeEach } from 'vitest';
import { BrewPackageManager } from '../../src/managers/brew.js';

describe('BrewPackageManager', () => {
    let manager: BrewPackageManager;

    beforeEach(() => {
        manager = new BrewPackageManager();
    });

    it('should have correct name', () => {
        expect(manager.name).toBe('Homebrew');
    });

    it('should check if brew is available', async () => {
        const isAvailable = await manager.isAvailable();
        // This will depend on the system
        expect(typeof isAvailable).toBe('boolean');
    });

    // More tests would go here
});
