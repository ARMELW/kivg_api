"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.client = void 0;
var node_process_1 = require("node:process");
var dotenv_1 = require("dotenv");
var postgres_js_1 = require("drizzle-orm/postgres-js");
var postgres_1 = require("postgres");
var schema = require("../schema");
dotenv_1.default.config();
if (!node_process_1.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}
var logQuery = node_process_1.env.NODE_ENV === 'development';
exports.client = (0, postgres_1.default)(node_process_1.env.DATABASE_URL, __assign({}, (logQuery && {
    debug: function (conn, query, params) {
        console.error('SQL Query:', query);
        if (params && params.length > 0) {
            console.error('Params:', params);
        }
    }
})));
exports.db = (0, postgres_js_1.drizzle)(exports.client, { schema: schema });
