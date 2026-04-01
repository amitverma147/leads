import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import {
  UpdateOrganizationInput,
  OrganizationResponse,
  OrganizationSettings,
  OrganizationStats,
} from './organizations.types';

export class OrganizationsService {
  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<OrganizationResponse> {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    const stats = await this.getOrganizationStats(organizationId);

    return this.formatOrganizationResponse(organization, stats);
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    input: UpdateOrganizationInput
  ): Promise<OrganizationResponse> {
    const existing = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existing) {
      throw ApiError.notFound('Organization not found');
    }

    // Merge settings
    let settings = existing.settings as OrganizationSettings;
    if (input.settings) {
      settings = {
        ...settings,
        ...input.settings,
      };
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: input.name,
        logo: input.logo,
        settings,
      },
    });

    const stats = await this.getOrganizationStats(organizationId);

    logger.info(`Organization updated: ${organizationId}`);

    return this.formatOrganizationResponse(organization, stats);
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    const [totalUsers, activeUsers, totalLeads, totalForms, totalTeams] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.user.count({ where: { organizationId, isActive: true } }),
      prisma.lead.count({ where: { organizationId } }),
      prisma.form.count({ where: { organizationId } }),
      prisma.team.count({ where: { organizationId } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalLeads,
      totalForms,
      totalTeams,
    };
  }

  /**
   * Format organization response
   */
  private formatOrganizationResponse(
    organization: any,
    stats: OrganizationStats
  ): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      settings: (organization.settings as OrganizationSettings) || {},
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      stats,
    };
  }
}

export const organizationsService = new OrganizationsService();