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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRepository = void 0;
var node_crypto_1 = require("node:crypto");
var drizzle_orm_1 = require("drizzle-orm");
var db_1 = require("../database/db");
var schema_1 = require("../database/schema/schema");
var PlanRepository = /** @class */ (function () {
    function PlanRepository() {
    }
    PlanRepository.prototype.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.query.plans.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.plans.id, id)
                        })];
                    case 1:
                        result = _a.sent();
                        if (!result)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.mapToPlan(result)];
                }
            });
        });
    };
    PlanRepository.prototype.findBySlug = function (slug) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.query.plans.findFirst({
                            where: (0, drizzle_orm_1.eq)(schema_1.plans.slug, slug)
                        })];
                    case 1:
                        result = _a.sent();
                        if (!result)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.mapToPlan(result)];
                }
            });
        });
    };
    PlanRepository.prototype.findAll = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var conditions, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        conditions = [];
                        if ((filters === null || filters === void 0 ? void 0 : filters.isActive) !== undefined) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_1.plans.isActive, filters.isActive));
                        }
                        if ((filters === null || filters === void 0 ? void 0 : filters.isPublic) !== undefined) {
                            conditions.push((0, drizzle_orm_1.eq)(schema_1.plans.isPublic, filters.isPublic));
                        }
                        if (!(conditions.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, db_1.db
                                .select()
                                .from(schema_1.plans)
                                .where(drizzle_orm_1.and.apply(void 0, conditions))
                                .orderBy(schema_1.plans.sortOrder, schema_1.plans.createdAt)];
                    case 1:
                        // Use and() to combine conditions - plans must match ALL criteria
                        results = _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, db_1.db.select().from(schema_1.plans).orderBy(schema_1.plans.sortOrder, schema_1.plans.createdAt)];
                    case 3:
                        results = _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, results.map(function (result) { return _this.mapToPlan(result); })];
                }
            });
        });
    };
    PlanRepository.prototype.create = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, result;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        id = (0, node_crypto_1.randomUUID)();
                        now = new Date();
                        return [4 /*yield*/, db_1.db
                                .insert(schema_1.plans)
                                .values({
                                id: id,
                                name: data.name,
                                slug: data.slug,
                                description: data.description,
                                isActive: (_a = data.isActive) !== null && _a !== void 0 ? _a : true,
                                isPublic: (_b = data.isPublic) !== null && _b !== void 0 ? _b : true,
                                sortOrder: (_c = data.sortOrder) !== null && _c !== void 0 ? _c : 0,
                                priceMonthly: data.pricing.monthly,
                                priceYearly: data.pricing.yearly,
                                features: data.features,
                                stripeProductId: data.stripeProductId,
                                stripePriceIdMonthly: data.stripePriceIdMonthly,
                                stripePriceIdYearly: data.stripePriceIdYearly,
                                metadata: data.metadata,
                                createdAt: now,
                                updatedAt: now
                            })
                                .returning()];
                    case 1:
                        result = (_d.sent())[0];
                        return [2 /*return*/, this.mapToPlan(result)];
                }
            });
        });
    };
    PlanRepository.prototype.update = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, existingPlan, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updateData = {
                            updatedAt: new Date()
                        };
                        if (data.name !== undefined)
                            updateData.name = data.name;
                        if (data.slug !== undefined)
                            updateData.slug = data.slug;
                        if (data.description !== undefined)
                            updateData.description = data.description;
                        if (data.isActive !== undefined)
                            updateData.isActive = data.isActive;
                        if (data.isPublic !== undefined)
                            updateData.isPublic = data.isPublic;
                        if (data.sortOrder !== undefined)
                            updateData.sortOrder = data.sortOrder;
                        if (data.stripeProductId !== undefined)
                            updateData.stripeProductId = data.stripeProductId;
                        if (data.stripePriceIdMonthly !== undefined)
                            updateData.stripePriceIdMonthly = data.stripePriceIdMonthly;
                        if (data.stripePriceIdYearly !== undefined)
                            updateData.stripePriceIdYearly = data.stripePriceIdYearly;
                        if (data.metadata !== undefined)
                            updateData.metadata = data.metadata;
                        if (data.pricing) {
                            if (data.pricing.monthly !== undefined)
                                updateData.priceMonthly = data.pricing.monthly;
                            if (data.pricing.yearly !== undefined)
                                updateData.priceYearly = data.pricing.yearly;
                        }
                        if (!data.features) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.findById(id)];
                    case 1:
                        existingPlan = _a.sent();
                        if (!existingPlan) {
                            throw new Error('Plan not found');
                        }
                        updateData.features = __assign(__assign({}, existingPlan.features), data.features);
                        _a.label = 2;
                    case 2: return [4 /*yield*/, db_1.db.update(schema_1.plans).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.plans.id, id)).returning()];
                    case 3:
                        result = (_a.sent())[0];
                        if (!result) {
                            throw new Error('Plan not found');
                        }
                        return [2 /*return*/, this.mapToPlan(result)];
                }
            });
        });
    };
    PlanRepository.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .update(schema_1.plans)
                            .set({
                            isActive: false,
                            updatedAt: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.plans.id, id))
                            .returning()];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.length > 0];
                }
            });
        });
    };
    PlanRepository.prototype.slugExists = function (slug, excludeId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db_1.db.select({ id: schema_1.plans.id }).from(schema_1.plans).where((0, drizzle_orm_1.eq)(schema_1.plans.slug, slug));
                        return [4 /*yield*/, query];
                    case 1:
                        results = _a.sent();
                        if (results.length === 0)
                            return [2 /*return*/, false];
                        if (excludeId) {
                            return [2 /*return*/, results.some(function (r) { return r.id !== excludeId; })];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    PlanRepository.prototype.findByStripePriceId = function (priceId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.query.plans.findFirst({
                            where: (0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.plans.stripePriceIdMonthly, priceId), (0, drizzle_orm_1.eq)(schema_1.plans.stripePriceIdYearly, priceId))
                        })];
                    case 1:
                        result = _a.sent();
                        if (!result)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.mapToPlan(result)];
                }
            });
        });
    };
    PlanRepository.prototype.mapToPlan = function (row) {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            isActive: row.isActive,
            isPublic: row.isPublic,
            sortOrder: row.sortOrder,
            pricing: {
                monthly: row.priceMonthly,
                yearly: row.priceYearly
            },
            features: row.features,
            stripeProductId: row.stripeProductId,
            stripePriceIdMonthly: row.stripePriceIdMonthly,
            stripePriceIdYearly: row.stripePriceIdYearly,
            metadata: row.metadata,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        };
    };
    return PlanRepository;
}());
exports.PlanRepository = PlanRepository;
