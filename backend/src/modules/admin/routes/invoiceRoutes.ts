import { Router } from 'express'
import {
  listInvoicesCtrl,
  getInvoiceByIdCtrl,
  createInvoiceCtrl,
  updateInvoiceCtrl,
  deleteInvoiceCtrl,
  sendInvoiceEmailCtrl,
  downloadInvoiceArtifactCtrl,
  getInvoiceCatalogCtrl,
} from '../controllers/invoiceController.js'

const invoiceRoutes = Router()

invoiceRoutes.get('/', listInvoicesCtrl)
invoiceRoutes.get('/catalog', getInvoiceCatalogCtrl)
invoiceRoutes.post('/', createInvoiceCtrl)
invoiceRoutes.get('/:id', getInvoiceByIdCtrl)
invoiceRoutes.put('/:id', updateInvoiceCtrl)
invoiceRoutes.delete('/:id', deleteInvoiceCtrl)
invoiceRoutes.post('/:id/send-email', sendInvoiceEmailCtrl)
invoiceRoutes.get('/:id/download/:format', downloadInvoiceArtifactCtrl)

export default invoiceRoutes
