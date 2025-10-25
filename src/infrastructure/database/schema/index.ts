import { relations, type InferModel } from 'drizzle-orm'
import { assets, audioFiles, channels, exports, projects, roles, scenes, userRoles, users } from './schema'

export * from './schema'

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(roles, {
    fields: [userRoles.userId],
    references: [roles.id]
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id]
  })
}))

export const assetsRelations = relations(assets, ({ one }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id]
  })
}))

export const channelsRelations = relations(channels, ({ one, many }) => ({
  user: one(users, {
    fields: [channels.userId],
    references: [users.id]
  }),
  projects: many(projects)
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id]
  }),
  channel: one(channels, {
    fields: [projects.channelId],
    references: [channels.id]
  }),
  scenes: many(scenes),
  exports: many(exports)
}))

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  project: one(projects, {
    fields: [scenes.projectId],
    references: [projects.id]
  }),
  exports: many(exports)
}))

export const audioFilesRelations = relations(audioFiles, ({ one }) => ({
  user: one(users, {
    fields: [audioFiles.userId],
    references: [users.id]
  })
}))

export const exportsRelations = relations(exports, ({ one }) => ({
  user: one(users, {
    fields: [exports.userId],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [exports.projectId],
    references: [projects.id]
  }),
  scene: one(scenes, {
    fields: [exports.sceneId],
    references: [scenes.id]
  })
}))

export type Role = InferModel<typeof roles>
export type UserRole = InferModel<typeof userRoles>
