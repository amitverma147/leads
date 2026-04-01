import { prisma } from '../../config/database';
import { LEAD_STATUS, LEAD_SOURCE, LEAD_PRIORITY, ROLES } from '../../config/constants';
import {
  DateRangeFilter,
  DashboardStats,
  LeadsByStatusData,
  LeadsBySourceData,
  LeadsByPriorityData,
  LeadsTrendData,
  AgentPerformanceData,
  TopPerformersData,
  ConversionFunnelData,
  GeographicData,
} from './analytics.types';

export class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(organizationId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Leads stats
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId } }),
      prisma.lead.count({ where: { organizationId, status: LEAD_STATUS.NEW } }),
      prisma.lead.count({ where: { organizationId, status: LEAD_STATUS.CONTACTED } }),
      prisma.lead.count({ where: { organizationId, status: LEAD_STATUS.QUALIFIED } }),
      prisma.lead.count({ where: { organizationId, status: LEAD_STATUS.CONVERTED } }),
    ]);

    // Users stats
    const [totalUsers, activeUsers, agents, marketing] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.user.count({ where: { organizationId, isActive: true } }),
      prisma.user.count({
        where: {
          organizationId,
          role: { in: [ROLES.FIELD_AGENT, ROLES.AGENT_SUPERVISOR] },
        },
      }),
      prisma.user.count({
        where: {
          organizationId,
          role: { in: [ROLES.MARKETING_AGENT, ROLES.MARKETING_MANAGER] },
        },
      }),
    ]);

    // Forms stats
    const [totalForms, publishedForms] = await Promise.all([
      prisma.form.count({ where: { organizationId } }),
      prisma.form.count({ where: { organizationId, isPublished: true } }),
    ]);

    // Today's activity
    const [todayCreated, todayContacted, todayConverted] = await Promise.all([
      prisma.lead.count({
        where: { organizationId, createdAt: { gte: today } },
      }),
      prisma.lead.count({
        where: { organizationId, contactedAt: { gte: today } },
      }),
      prisma.lead.count({
        where: { organizationId, convertedAt: { gte: today } },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        agents,
        marketing,
      },
      forms: {
        total: totalForms,
        published: publishedForms,
      },
      todayActivity: {
        leadsCreated: todayCreated,
        leadsContacted: todayContacted,
        leadsConverted: todayConverted,
      },
    };
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(organizationId: string): Promise<LeadsByStatusData[]> {
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    const total = statusCounts.reduce((sum, item) => sum + item._count, 0);

    return Object.values(LEAD_STATUS).map((status) => {
      const found = statusCounts.find((s) => s.status === status);
      const count = found?._count || 0;

      return {
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
      };
    });
  }

  /**
   * Get leads by source
   */
  async getLeadsBySource(organizationId: string): Promise<LeadsBySourceData[]> {
    const sourceCounts = await prisma.lead.groupBy({
      by: ['source'],
      where: { organizationId },
      _count: true,
    });

    const total = sourceCounts.reduce((sum, item) => sum + item._count, 0);

    return Object.values(LEAD_SOURCE).map((source) => {
      const found = sourceCounts.find((s) => s.source === source);
      const count = found?._count || 0;

      return {
        source,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
      };
    });
  }

  /**
   * Get leads by priority
   */
  async getLeadsByPriority(organizationId: string): Promise<LeadsByPriorityData[]> {
    const priorityCounts = await prisma.lead.groupBy({
      by: ['priority'],
      where: { organizationId },
      _count: true,
    });

    const total = priorityCounts.reduce((sum, item) => sum + item._count, 0);

    return Object.values(LEAD_PRIORITY).map((priority) => {
      const found = priorityCounts.find((p) => p.priority === priority);
      const count = found?._count || 0;

      return {
        priority,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
      };
    });
  }

  /**
   * Get leads trend over time
   */
  async getLeadsTrend(
    organizationId: string,
    dateRange: DateRangeFilter
  ): Promise<LeadsTrendData[]> {
    const { startDate, endDate } = dateRange;

    // Get leads created per day
    const leads = await prisma.lead.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        convertedAt: true,
      },
    });

    // Group by date
    const trendMap = new Map<string, { created: number; converted: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      trendMap.set(dateKey, { created: 0, converted: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count leads
    leads.forEach((lead) => {
      const createdDate = lead.createdAt.toISOString().split('T')[0];
      const entry = trendMap.get(createdDate);
      if (entry) {
        entry.created++;
      }

      if (lead.convertedAt) {
        const convertedDate = lead.convertedAt.toISOString().split('T')[0];
        const convertedEntry = trendMap.get(convertedDate);
        if (convertedEntry) {
          convertedEntry.converted++;
        }
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        created: data.created,
        converted: data.converted,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(organizationId: string): Promise<AgentPerformanceData[]> {
    const agents = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: [ROLES.FIELD_AGENT, ROLES.AGENT_SUPERVISOR] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            createdLeads: true,
          },
        },
      },
    });

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const convertedCount = await prisma.lead.count({
          where: {
            createdById: agent.id,
            status: LEAD_STATUS.CONVERTED,
          },
        });

        const totalCreated = agent._count.createdLeads;
        const conversionRate =
          totalCreated > 0 ? Math.round((convertedCount / totalCreated) * 100 * 100) / 100 : 0;

        return {
          userId: agent.id,
          userName: `${agent.firstName} ${agent.lastName}`,
          leadsCreated: totalCreated,
          leadsConverted: convertedCount,
          conversionRate,
          avgResponseTime: null, // Would need activity timestamps to calculate
        };
      })
    );

    return performance.sort((a, b) => b.leadsCreated - a.leadsCreated);
  }

  /**
   * Get top performers
   */
  async getTopPerformers(organizationId: string, limit = 5): Promise<TopPerformersData> {
    // Top agents by leads created
    const agents = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: [ROLES.FIELD_AGENT, ROLES.AGENT_SUPERVISOR] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            createdLeads: true,
          },
        },
      },
      orderBy: {
        createdLeads: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    // Top marketing team by conversions
    const marketingTeam = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: [ROLES.MARKETING_AGENT, ROLES.MARKETING_MANAGER] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            assignedLeads: true,
          },
        },
      },
      orderBy: {
        assignedLeads: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const convertedCount = await prisma.lead.count({
          where: {
            createdById: agent.id,
            status: LEAD_STATUS.CONVERTED,
          },
        });

        return {
          userId: agent.id,
          userName: `${agent.firstName} ${agent.lastName}`,
          leadsCreated: agent._count.createdLeads,
          leadsConverted: convertedCount,
          conversionRate:
            agent._count.createdLeads > 0
              ? Math.round((convertedCount / agent._count.createdLeads) * 100 * 100) / 100
              : 0,
          avgResponseTime: null,
        };
      })
    );

    const marketingPerformance = await Promise.all(
      marketingTeam.map(async (user) => {
        const convertedCount = await prisma.lead.count({
          where: {
            assignedToId: user.id,
            status: LEAD_STATUS.CONVERTED,
          },
        });

        return {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          leadsCreated: user._count.assignedLeads,
          leadsConverted: convertedCount,
          conversionRate:
            user._count.assignedLeads > 0
              ? Math.round((convertedCount / user._count.assignedLeads) * 100 * 100) / 100
              : 0,
          avgResponseTime: null,
        };
      })
    );

    return {
      agents: agentPerformance,
      marketingTeam: marketingPerformance,
    };
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(organizationId: string): Promise<ConversionFunnelData[]> {
    const stages = [
      { stage: 'New', status: LEAD_STATUS.NEW },
      { stage: 'Contacted', status: LEAD_STATUS.CONTACTED },
      { stage: 'Qualified', status: LEAD_STATUS.QUALIFIED },
      { stage: 'Negotiation', status: LEAD_STATUS.NEGOTIATION },
      { stage: 'Converted', status: LEAD_STATUS.CONVERTED },
    ];

    const totalLeads = await prisma.lead.count({
      where: { organizationId },
    });

    const funnel: ConversionFunnelData[] = [];
    let previousCount = totalLeads;

    for (const { stage, status } of stages) {
      const count = await prisma.lead.count({
        where: {
          organizationId,
          status: {
            in: stages.slice(stages.findIndex((s) => s.status === status)).map((s) => s.status),
          },
        },
      });

      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100 * 100) / 100 : 0;
      const dropOff =
        previousCount > 0
          ? Math.round(((previousCount - count) / previousCount) * 100 * 100) / 100
          : 0;

      funnel.push({
        stage,
        count,
        percentage,
        dropOff: funnel.length === 0 ? 0 : dropOff,
      });

      previousCount = count;
    }

    return funnel;
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(
    organizationId: string,
    limit = 10
  ): Promise<GeographicData[]> {
    const leads = await prisma.lead.groupBy({
      by: ['city', 'state'],
      where: {
        organizationId,
        city: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
      take: limit,
    });

    const total = leads.reduce((sum, item) => sum + item._count, 0);

    return leads.map((item) => ({
      city: item.city || 'Unknown',
      state: item.state || 'Unknown',
      count: item._count,
      percentage: total > 0 ? Math.round((item._count / total) * 100 * 100) / 100 : 0,
    }));
  }
}

export const analyticsService = new AnalyticsService();