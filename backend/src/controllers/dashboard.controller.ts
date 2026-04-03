import { Request, Response } from 'express'
import { dashboardService } from '../services/dashboard.service.js'

class DashboardController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.user?.workspace_id

      if (!workspaceId) {
        res.status(401).json({ error: 'Workspace not found' })
        return
      }

      const stats = await dashboardService.getStats(workspaceId)
      res.json(stats)
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      res.status(500).json({ error: 'Failed to get dashboard stats' })
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const workspaceId = req.user?.workspace_id

      if (!workspaceId) {
        res.status(401).json({ error: 'Workspace not found' })
        return
      }

      const limit = parseInt(req.query.limit as string) || 10
      const activity = await dashboardService.getRecentActivity(workspaceId, limit)
      res.json({ activity })
    } catch (error) {
      console.error('Error getting recent activity:', error)
      res.status(500).json({ error: 'Failed to get recent activity' })
    }
  }
}

export const dashboardController = new DashboardController()
