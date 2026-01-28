import { describe, it, expect } from 'vitest';
import { formatBytes, formatDate, formatDuration } from '../../src/utils/format.js';

describe('Format Utils', () => {
    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 B');
            expect(formatBytes(1024)).toBe('1 KB');
            expect(formatBytes(1024 * 1024)).toBe('1 MB');
            expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2024-01-15');
            const formatted = formatDate(date);
            expect(formatted).toMatch(/2024-01-\d{2}/);
        });
    });

    describe('formatDuration', () => {
        it('should format duration correctly', () => {
            expect(formatDuration(500)).toBe('500ms');
            expect(formatDuration(5000)).toBe('5s');
            expect(formatDuration(65000)).toBe('1m 5s');
        });
    });
});
