import { Router } from 'express'
import {
  getBillingTotalsCtrl,
  getClientStatusCtrl,
  getDashboardSummaryCtrl,
  getMonthlyComparisonCtrl,
  getTopServicesCtrl,
  getUpcomingExpirationsCtrl,
} from '../controllers/dashboardController.js'

const dashboardRoutes = Router()

dashboardRoutes.get('/summary', getDashboardSummaryCtrl)
dashboardRoutes.get('/totals', getBillingTotalsCtrl)
dashboardRoutes.get('/expirations', getUpcomingExpirationsCtrl)
dashboardRoutes.get('/clients/status', getClientStatusCtrl)
dashboardRoutes.get('/top-services', getTopServicesCtrl)
dashboardRoutes.get('/billing/comparison', getMonthlyComparisonCtrl)

export default dashboardRoutes
