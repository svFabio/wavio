import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CleanupService } from './cleanup.service';
import type { CleanupRepository } from './cleanup.repository';

describe('CleanupService', () => {
  let service: CleanupService;
  let mockRepo: {
    deleteInactiveSessions: ReturnType<typeof vi.fn>;
    cancelExpiredInProgressAppointments: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      deleteInactiveSessions: vi.fn(),
      cancelExpiredInProgressAppointments: vi.fn(),
    };
    service = new CleanupService(mockRepo as unknown as CleanupRepository);
  });

  describe('handleCleanup', () => {
    it('should delete inactive sessions and cancel expired appointments', async () => {
      mockRepo.deleteInactiveSessions.mockResolvedValue(5);
      mockRepo.cancelExpiredInProgressAppointments.mockResolvedValue(3);

      await service.handleCleanup();

      expect(mockRepo.deleteInactiveSessions).toHaveBeenCalled();
      expect(mockRepo.cancelExpiredInProgressAppointments).toHaveBeenCalled();
    });

    it('should handle zero counts gracefully', async () => {
      mockRepo.deleteInactiveSessions.mockResolvedValue(0);
      mockRepo.cancelExpiredInProgressAppointments.mockResolvedValue(0);

      await service.handleCleanup();

      expect(mockRepo.deleteInactiveSessions).toHaveBeenCalled();
      expect(mockRepo.cancelExpiredInProgressAppointments).toHaveBeenCalled();
    });
  });
});
