import { Router } from 'express';
import * as ctrl from './Invoice.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMinRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ROLES } from '../../config/constants';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdParamSchema,
  invoiceListQuerySchema,
  customerIdParamSchema,
  customerListQuerySchema,
  createInvoiceProductSchema,
  updateInvoiceProductSchema,
  invoiceProductIdParamSchema,
  invoiceProductListQuerySchema,
} from './Invoice.validation';

const router = Router();

router.use(authenticate);

// ─── Invoice Routes ──────────────────────────────────���────────────────────────

router.get('/stats', ctrl.getInvoiceStats);

router.get(
  '/products',
  validate({ query: invoiceProductListQuerySchema }),
  ctrl.getInvoiceProducts
);

router.post(
  '/products',
  validate({ body: createInvoiceProductSchema }),
  ctrl.createInvoiceProduct
);

router.patch(
  '/products/:id',
  validate({ params: invoiceProductIdParamSchema, body: updateInvoiceProductSchema }),
  ctrl.updateInvoiceProduct
);

router.delete(
  '/products/:id',
  validate({ params: invoiceProductIdParamSchema }),
  ctrl.deleteInvoiceProduct
);

router.post(
  '/',
  validate({ body: createInvoiceSchema }),
  ctrl.createInvoice
);

router.get(
  '/',
  validate({ query: invoiceListQuerySchema }),
  ctrl.getInvoices
);

router.get(
  '/:id',
  validate({ params: invoiceIdParamSchema }),
  ctrl.getInvoiceById
);

router.patch(
  '/:id',
  validate({ params: invoiceIdParamSchema, body: updateInvoiceSchema }),
  ctrl.updateInvoice
);

// ─── Customer Routes ──────────────────────���───────────────────────────────────

router.get(
  '/customers/list',
  requireMinRole(ROLES.MARKETING_MANAGER),
  validate({ query: customerListQuerySchema }),
  ctrl.getCustomers
);

router.get(
  '/customers/:id',
  requireMinRole(ROLES.MARKETING_MANAGER),
  validate({ params: customerIdParamSchema }),
  ctrl.getCustomerById
);

router.patch(
  '/customers/:id/tags',
  requireMinRole(ROLES.MARKETING_MANAGER),
  validate({ params: customerIdParamSchema }),
  ctrl.updateCustomerTags
);

export default router;
