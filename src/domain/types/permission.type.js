"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Actions = exports.Subjects = exports.Permission = exports.Roles = void 0;
exports.Roles = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user'
};
exports.Permission = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete'
};
exports.Subjects = {
    ADMIN: 'admin',
    STAT: 'stat',
    ACTIVITY: 'activity'
};
exports.Actions = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete'
};
