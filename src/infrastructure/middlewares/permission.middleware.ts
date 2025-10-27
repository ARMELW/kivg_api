import { PermissionService } from '@/application/services/permission.service'
import type { Action, Subject } from '@/domain/types/permission.type'
import type { Context, Next } from 'hono'

export function checkPermission(subject: Subject, action: Action) {
  const permissionService = new PermissionService()

  return async (c: Context, next: Next) => {
    try {
      const user = c.get('user')

      if (!user) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }

      const userPermissions = await permissionService.getUserRolesWithPermissions(user.id)
      const hasPermission = userPermissions.some((permission) => {
        if (permission.roleName === 'super_admin') return true
        return permission.resourceType === subject && permission.actions?.includes(action)
      })

      if (!hasPermission) {
        return c.json(
          {
            success: false,
            error: `You don't have permission to ${action} ${subject}`
          },
          403
        )
      }

      await next()
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message
        },
        400
      )
    }
  }
}

/**
 * Middleware to check if user has one of the specified roles
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (c: Context, next: Next) => {
    const user = c.get('user') as any

    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Check if user has admin flag or one of the allowed roles
    const hasRole =
      user.isAdmin || user.role === 'super_admin' || allowedRoles.includes(user.role) || allowedRoles.includes('admin')

    if (!hasRole) {
      return c.json(
        {
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        },
        403
      )
    }

    return next()
  }
}
