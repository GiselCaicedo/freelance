import { Router } from 'express'
import {
  convertQuoteToInvoiceCtrl,
  generateQuotePdfCtrl,
  getQuoteByIdCtrl,
  listQuotesCtrl,
  sendQuoteEmailCtrl,
} from '../controllers/quoteController.js'

const quoteRoutes = Router()

quoteRoutes.get('/', listQuotesCtrl)
quoteRoutes.get('/:id', getQuoteByIdCtrl)
quoteRoutes.post('/:id/pdf', generateQuotePdfCtrl)
quoteRoutes.post('/:id/email', sendQuoteEmailCtrl)
quoteRoutes.post('/:id/invoice', convertQuoteToInvoiceCtrl)

export default quoteRoutes
