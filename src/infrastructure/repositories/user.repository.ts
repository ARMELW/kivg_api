import { and, eq, ilike, or, sql } from 'drizzle-orm'
import type { User } from '@/domain/models/user.model'
import type {
  PaginatedUsers,
  UserFilter,
  UserRepositoryInterface
} from '@/domain/repositories/user.repository.interface'
import { db } from '../database/db'

import { users } from '../database/schema'
import type { z } from 'zod'

export class UserRepository implements UserRepositoryInterface {
  async findById(id: string): Promise<z.infer<typeof User> | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id))

    if (!user) return null

    return {
      id: user.id,
      name: user.name,
      firstname: user.firstname || undefined,
      lastname: user.lastname || undefined,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || undefined,
      isAdmin: user.isAdmin,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }

  async findAll(): Promise<z.infer<typeof User>[]> {
    const dbUsers = await db.select().from(users)

    return dbUsers.map((user) => ({
      id: user.id,
      name: user.name,
      firstname: user.firstname || undefined,
      lastname: user.lastname || undefined,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || undefined,
      isAdmin: user.isAdmin,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))
  }

  async findPaginatedUsers(filter: UserFilter): Promise<PaginatedUsers> {
    const page = filter.page || 1
    const limit = filter.limit || 10
    const offset = (page - 1) * limit

    const conditions = []

    if (filter.role) {
      conditions.push(eq(users.role, filter.role))
    }

    if (filter.search) {
      conditions.push(
        or(
          ilike(users.name, `%${filter.search}%`),
          ilike(users.firstname || '', `%${filter.search}%`),
          ilike(users.lastname || '', `%${filter.search}%`)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Get total count with filters applied
    const countQuery = db.select({ count: sql<number>`count(*)::int` }).from(users)
    const countWithFilters = whereClause ? countQuery.where(whereClause) : countQuery
    const [{ count }] = await countWithFilters

    const total = count

    // Get paginated results with filters applied
    const resultsQuery = db.select().from(users)
    const resultsWithFilters = whereClause ? resultsQuery.where(whereClause) : resultsQuery
    const results = await resultsWithFilters.orderBy(users.createdAt).limit(limit).offset(offset)

    const mappedUsers = results.map((user) => ({
      id: user.id,
      name: user.name,
      firstname: user.firstname || undefined,
      lastname: user.lastname || undefined,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || undefined,
      isAdmin: user.isAdmin,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role
    }))

    return {
      users: mappedUsers,
      total,
      page,
      limit
    }
  }
}
