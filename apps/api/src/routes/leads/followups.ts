import type { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate'
import { leadSummarySelect } from './service'
import { Role, LeadStatus } from '@lms/types'

export async function leadFollowUpsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/followups', { preHandler: authenticate }, async (request, reply) => {
    const { id: userId, role, branchId } = request.user
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const excludedStatuses: LeadStatus[] = [LeadStatus.CLIENT, LeadStatus.DUPLICATE, LeadStatus.LOST]

    // Employees see only their own leads; admins/sub-admins see the whole branch
    const scopeWhere =
      role === Role.EMPLOYEE
        ? { OR: [{ assignedToId: userId }, { createdById: userId }] }
        : { branchId }

    const [overdue, upcoming] = await Promise.all([
      fastify.prisma.lead.findMany({
        where: {
          ...scopeWhere,
          status: { notIn: excludedStatuses },
          nextFollowUpAt: { lte: now },
        },
        select: leadSummarySelect,
        orderBy: { nextFollowUpAt: 'asc' },
      }),
      fastify.prisma.lead.findMany({
        where: {
          ...scopeWhere,
          status: { notIn: excludedStatuses },
          nextFollowUpAt: { gt: now, lte: sevenDaysLater },
        },
        select: leadSummarySelect,
        orderBy: { nextFollowUpAt: 'asc' },
      }),
    ])

    return reply.status(200).send({ success: true, data: { overdue, upcoming } })
  })

  fastify.get('/meetings', { preHandler: authenticate }, async (request, reply) => {
    const { branchId } = request.user
    const now = new Date()
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const baseWhere = {
      type: 'MEETING' as const,
      isDeleted: false,
      lead: { branchId },
    }
    const select = {
      id: true,
      scheduledAt: true,
      lead: { select: { id: true, name: true, phone: true, status: true } },
    } as const

    const [overdue, upcoming] = await Promise.all([
      fastify.prisma.interactionLog.findMany({
        where: { ...baseWhere, scheduledAt: { not: null, lte: now } },
        select,
        orderBy: { scheduledAt: 'asc' },
      }),
      fastify.prisma.interactionLog.findMany({
        where: { ...baseWhere, scheduledAt: { gt: now, lte: sevenDaysLater } },
        select,
        orderBy: { scheduledAt: 'asc' },
      }),
    ])

    return reply.status(200).send({ success: true, data: { overdue, upcoming } })
  })
}
