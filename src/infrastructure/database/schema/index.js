"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportsRelations = exports.userApiKeysRelations = exports.audioFilesRelations = exports.scenesRelations = exports.projectsRelations = exports.channelsRelations = exports.assetsRelations = exports.userRolesRelations = exports.aiUsageRelations = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var schema_1 = require("./schema");
__exportStar(require("./schema"), exports);
exports.aiUsageRelations = (0, drizzle_orm_1.relations)(schema_1.aiUsage, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.aiUsage.userId],
            references: [schema_1.users.id]
        })
    });
});
exports.userRolesRelations = (0, drizzle_orm_1.relations)(schema_1.userRoles, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.roles, {
            fields: [schema_1.userRoles.userId],
            references: [schema_1.roles.id]
        }),
        role: one(schema_1.roles, {
            fields: [schema_1.userRoles.roleId],
            references: [schema_1.roles.id]
        })
    });
});
exports.assetsRelations = (0, drizzle_orm_1.relations)(schema_1.assets, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.assets.userId],
            references: [schema_1.users.id]
        })
    });
});
exports.channelsRelations = (0, drizzle_orm_1.relations)(schema_1.channels, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.channels.userId],
            references: [schema_1.users.id]
        }),
        projects: many(schema_1.projects)
    });
});
exports.projectsRelations = (0, drizzle_orm_1.relations)(schema_1.projects, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.projects.userId],
            references: [schema_1.users.id]
        }),
        channel: one(schema_1.channels, {
            fields: [schema_1.projects.channelId],
            references: [schema_1.channels.id]
        }),
        scenes: many(schema_1.scenes),
        exports: many(schema_1.exports)
    });
});
exports.scenesRelations = (0, drizzle_orm_1.relations)(schema_1.scenes, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        project: one(schema_1.projects, {
            fields: [schema_1.scenes.projectId],
            references: [schema_1.projects.id]
        }),
        exports: many(schema_1.exports)
    });
});
exports.audioFilesRelations = (0, drizzle_orm_1.relations)(schema_1.audioFiles, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.audioFiles.userId],
            references: [schema_1.users.id]
        })
    });
});
exports.userApiKeysRelations = (0, drizzle_orm_1.relations)(schema_1.userApiKeys, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.userApiKeys.userId],
            references: [schema_1.users.id]
        })
    });
});
exports.exportsRelations = (0, drizzle_orm_1.relations)(schema_1.exports, function (_a) {
    var one = _a.one;
    return ({
        user: one(schema_1.users, {
            fields: [schema_1.exports.userId],
            references: [schema_1.users.id]
        }),
        project: one(schema_1.projects, {
            fields: [schema_1.exports.projectId],
            references: [schema_1.projects.id]
        }),
        scene: one(schema_1.scenes, {
            fields: [schema_1.exports.sceneId],
            references: [schema_1.scenes.id]
        })
    });
});
