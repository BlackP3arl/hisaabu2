import { getDashboardStats } from '../queries/dashboard.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Get dashboard statistics
 * GET /api/v1/dashboard/stats
 */
export const getStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await getDashboardStats(userId);

    return successResponse(
      res,
      stats,
      null,
      200
    );
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};


