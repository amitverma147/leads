import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { parsePaginationParams, PaginatedResult } from '../../utils/pagination';
import { INVOICE_STATUS, InvoiceStatus } from '../../config/constants';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFilters,
  InvoiceListResponse,
  InvoiceDetailResponse,
  InvoiceCustomerResponse,
  InvoiceStatsResponse,
  LineItemResponse,
} from './Invoice.types';
import { InvoiceTemplateSettings } from '../invoice-templates/InvoiceTemplates.types';

export class InvoiceService {
  // ─── Invoice Number Generation ────────────────────────────────────────────

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Count existing invoices this year in the org
    const count = await prisma.invoice.count({
      where: {
        organizationId,
        invoiceNumber: { startsWith: prefix },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // ─── Create Invoice ───────────────────────────────────────────────────────

  async createInvoice(
    input: CreateInvoiceInput,
    organizationId: string,
    createdById: string
  ): Promise<InvoiceDetailResponse> {
    // Validate template
    const template = await prisma.invoiceTemplate.findFirst({
      where: { id: input.templateId, organizationId, isActive: true },
    });
    if (!template) throw ApiError.notFound('Invoice template not found or inactive');

    const templateSettings = template.settings as InvoiceTemplateSettings;
    const currency = input.currency ?? templateSettings.currency ?? 'INR';
    const globalTaxRate = input.taxRate ?? templateSettings.defaultTaxRate ?? 0;

    // Validate lead if provided
    if (input.leadId) {
      const lead = await prisma.lead.findFirst({ where: { id: input.leadId, organizationId } });
      if (!lead) throw ApiError.notFound('Lead not found');
    }

    // ── Upsert InvoiceCustomer (dedup by phone or email within org) ─────────
    const customerId = await this.upsertCustomer(input.customer, organizationId);

    // ── Calculate totals ──────────────────────────────────────────────────────
    let subtotal = 0;
    const lineItemsData = input.lineItems.map((li, idx) => {
      const lineDiscount = (li.discountPct ?? 0) / 100;
      const lineTax = (li.taxRatePct ?? globalTaxRate) / 100;
      const baseAmount = li.quantity * li.unitPrice;
      const afterDiscount = baseAmount * (1 - lineDiscount);
      const amount = afterDiscount * (1 + lineTax);
      subtotal += baseAmount;
      return {
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPct: li.discountPct ?? 0,
        taxRatePct: li.taxRatePct ?? globalTaxRate,
        amount: Math.round(amount * 100) / 100,
        order: li.order ?? idx,
        metadata: (li.metadata ?? {}) as object,
      };
    });

    const discountAmount = input.discount ?? 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * (globalTaxRate / 100) * 100) / 100;
    const total = Math.round((taxableAmount + taxAmount) * 100) / 100;

    // ── Customer snapshot ────────────────────────────────────────────────────
    const customerSnapshot = { ...input.customer };

    // ── Invoice number ───────────────────────────────────────────────────────
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    // ── Persist ───────────────────────────────────────────────────────────────
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: INVOICE_STATUS.ISSUED,
        customerSnapshot: customerSnapshot as object,
        subtotal: Math.round(subtotal * 100) / 100,
        discount: discountAmount,
        taxAmount,
        total,
        currency,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes,
        formData: (input.formData ?? {}) as object,
        organizationId,
        templateId: input.templateId,
        customerId,
        createdById,
        leadId: input.leadId ?? null,
        lineItems: { create: lineItemsData },
      },
      include: {
        lineItems: { orderBy: { order: 'asc' } },
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // Update customer analytics
    await prisma.invoiceCustomer.update({
      where: { id: customerId },
      data: {
        totalSpend: { increment: total },
        invoiceCount: { increment: 1 },
        lastInvoiceAt: new Date(),
      },
    });

    logger.info(`Invoice created: ${invoice.id} (${invoiceNumber}) by user: ${createdById}`);
    return this.formatDetail(invoice);
  }

  // ─── Upsert Customer ──────────────────────────────────────────────────────

  private async upsertCustomer(
    input: CreateInvoiceInput['customer'],
    organizationId: string
  ): Promise<string> {
    // Try to find by phone first, then email
    let customer = null;

    if (input.phone) {
      customer = await prisma.invoiceCustomer.findFirst({
        where: { phone: input.phone, organizationId },
      });
    }

    if (!customer && input.email) {
      customer = await prisma.invoiceCustomer.findFirst({
        where: { email: input.email, organizationId },
      });
    }

    if (customer) {
      // Update profile fields
      await prisma.invoiceCustomer.update({
        where: { id: customer.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName ?? customer.lastName,
          email: input.email ?? customer.email,
          phone: input.phone ?? customer.phone,
          address: input.address ?? customer.address,
          city: input.city ?? customer.city,
          state: input.state ?? customer.state,
          pincode: input.pincode ?? customer.pincode,
          country: input.country ?? customer.country,
          leadId: input.leadId ?? customer.leadId,
        },
      });
      return customer.id;
    }

    const newCustomer = await prisma.invoiceCustomer.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country,
        organizationId,
        leadId: input.leadId,
      },
    });
    return newCustomer.id;
  }

  // ─── Get Invoices ─────────────────────────────────────────────────────────

  async getInvoices(
    organizationId: string,
    filters: InvoiceFilters,
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<InvoiceListResponse>> {
    const pagination = parsePaginationParams(page, limit);
    const where: Record<string, unknown> = { organizationId };

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
              { phone: { contains: filters.search } },
            ],
          },
        },
      ];
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
    }
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.templateId) where.templateId = filters.templateId;
    if (filters.createdById) where.createdById = filters.createdById;

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
      if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
      where.invoiceDate = dateFilter;
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          template: { select: { id: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return {
      data: invoices.map((inv) => this.formatList(inv)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  async getInvoiceById(
    invoiceId: string,
    organizationId: string
  ): Promise<InvoiceDetailResponse> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        lineItems: { orderBy: { order: 'asc' } },
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!invoice) throw ApiError.notFound('Invoice not found');
    return this.formatDetail(invoice);
  }

  async updateInvoice(
    invoiceId: string,
    organizationId: string,
    input: UpdateInvoiceInput
  ): Promise<InvoiceDetailResponse> {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
    });
    if (!existing) throw ApiError.notFound('Invoice not found');

    if (
      (existing.status === INVOICE_STATUS.VOID ||
        existing.status === INVOICE_STATUS.CANCELLED) &&
      input.status
    ) {
      throw ApiError.badRequest('Cannot update a void or cancelled invoice');
    }

    const updateData: Record<string, unknown> = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (input.paidAt !== undefined) updateData.paidAt = input.paidAt ? new Date(input.paidAt) : null;

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        lineItems: { orderBy: { order: 'asc' } },
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
    });

    logger.info(`Invoice updated: ${invoiceId}`);
    return this.formatDetail(invoice);
  }

  // ─── Customer Profiles ────────────────────────────────────────────────────

  async getCustomers(
    organizationId: string,
    filters: { search?: string; tags?: string[] },
    page?: number,
    limit?: number,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<InvoiceCustomerResponse>> {
    const pagination = parsePaginationParams(page, limit);
    const where: Record<string, unknown> = { organizationId };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [total, customers] = await Promise.all([
      prisma.invoiceCustomer.count({ where }),
      prisma.invoiceCustomer.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return {
      data: customers.map((c) => this.formatCustomer(c)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(total / pagination.limit),
        hasPrevPage: pagination.page > 1,
      },
    };
  }

  async getCustomerById(
    customerId: string,
    organizationId: string
  ): Promise<InvoiceCustomerResponse & { recentInvoices: InvoiceListResponse[] }> {
    const customer = await prisma.invoiceCustomer.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!customer) throw ApiError.notFound('Customer not found');

    const recentInvoices = await prisma.invoice.findMany({
      where: { customerId, organizationId },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
    });

    return {
      ...this.formatCustomer(customer),
      recentInvoices: recentInvoices.map((inv) => this.formatList(inv)),
    };
  }

  async updateCustomerTags(
    customerId: string,
    organizationId: string,
    tags: string[]
  ): Promise<InvoiceCustomerResponse> {
    const customer = await prisma.invoiceCustomer.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!customer) throw ApiError.notFound('Customer not found');

    const updated = await prisma.invoiceCustomer.update({
      where: { id: customerId },
      data: { tags },
    });
    return this.formatCustomer(updated);
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getInvoiceStats(organizationId: string): Promise<InvoiceStatsResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, statusGroups, revenueAgg, paidAgg, thisMonthCount, thisMonthRevenue] =
      await Promise.all([
        prisma.invoice.count({ where: { organizationId } }),
        prisma.invoice.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: { organizationId },
          _sum: { total: true },
        }),
        prisma.invoice.aggregate({
          where: { organizationId, status: INVOICE_STATUS.PAID },
          _sum: { total: true },
        }),
        prisma.invoice.count({
          where: { organizationId, invoiceDate: { gte: startOfMonth } },
        }),
        prisma.invoice.aggregate({
          where: {
            organizationId,
            invoiceDate: { gte: startOfMonth },
            status: { notIn: [INVOICE_STATUS.VOID, INVOICE_STATUS.CANCELLED] },
          },
          _sum: { total: true },
        }),
      ]);

    const totalRevenue = revenueAgg._sum.total ?? 0;
    const paidRevenue = paidAgg._sum.total ?? 0;

    const byStatus = Object.values(INVOICE_STATUS).reduce((acc, s) => {
      acc[s] = statusGroups.find((g) => g.status === s)?._count ?? 0;
      return acc;
    }, {} as Record<InvoiceStatus, number>);

    return {
      total,
      byStatus,
      totalRevenue,
      paidRevenue,
      pendingRevenue: totalRevenue - paidRevenue,
      thisMonthCount,
      thisMonthRevenue: thisMonthRevenue._sum.total ?? 0,
    };
  }

  // ─── Formatters ───────────────────────────────────────────────────────────

  private formatList(inv: any): InvoiceListResponse {
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status as InvoiceStatus,
      customerName: `${inv.customer.firstName}${inv.customer.lastName ? ' ' + inv.customer.lastName : ''}`,
      customerEmail: inv.customer.email,
      customerPhone: inv.customer.phone,
      subtotal: inv.subtotal,
      discount: inv.discount,
      taxAmount: inv.taxAmount,
      total: inv.total,
      currency: inv.currency,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      createdById: inv.createdById,
      createdByName: `${inv.createdBy.firstName} ${inv.createdBy.lastName}`,
      templateId: inv.templateId,
      templateName: inv.template.name,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
    };
  }

  private formatDetail(inv: any): InvoiceDetailResponse {
    return {
      ...this.formatList(inv),
      lineItems: inv.lineItems.map((li: any): LineItemResponse => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPct: li.discountPct,
        taxRatePct: li.taxRatePct,
        amount: li.amount,
        order: li.order,
      })),
      customer: this.formatCustomer(inv.customer),
      customerSnapshot: inv.customerSnapshot as Record<string, unknown>,
      formData: inv.formData as Record<string, unknown>,
      notes: inv.notes,
      paidAt: inv.paidAt,
      leadId: inv.leadId,
    };
  }

  private formatCustomer(c: any): InvoiceCustomerResponse {
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      address: c.address,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      country: c.country,
      tags: c.tags ?? [],
      totalSpend: c.totalSpend,
      invoiceCount: c.invoiceCount,
      lastInvoiceAt: c.lastInvoiceAt,
    };
  }
}

export const invoiceService = new InvoiceService();
