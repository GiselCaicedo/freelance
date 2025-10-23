import { Router } from 'express'
import {
  createPaymentCtrl,
  deletePaymentCtrl,
  getPaymentByIdCtrl,
  listPaymentsCtrl,
  updatePaymentCtrl,
} from '../controllers/paymentController.js'

const paymentRoutes = Router()

paymentRoutes.get('/', listPaymentsCtrl)
paymentRoutes.post('/', createPaymentCtrl)
paymentRoutes.get('/:id', getPaymentByIdCtrl)
paymentRoutes.put('/:id', updatePaymentCtrl)
paymentRoutes.delete('/:id', deletePaymentCtrl)

export default paymentRoutes

