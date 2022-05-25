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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
exports.__esModule = true;
var seedrandom_1 = require("seedrandom");
var index_1 = require("./projects/alias-nightmare/index");
var index_2 = require("./projects/the-backrooms/index");
var index_3 = require("./projects/on-the-island/index");
var seed = '70448428008674860000'; // Math.floor(Math.random() * 1e20).toString()
(0, seedrandom_1["default"])(seed, { global: true });
console.log("seed: ".concat(seed));
var config = {
    origin: { type: 'absolute', coords: [6000, 0, 6000] },
    levelIdx: 1,
    seed: seed,
    lootTable: [],
    bumpFactor: 3
};
var project = 'on-the-island';
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = project;
                switch (_a) {
                    case 'the-backrooms': return [3 /*break*/, 1];
                    case 'alias-nightmare': return [3 /*break*/, 3];
                    case 'on-the-island': return [3 /*break*/, 5];
                }
                return [3 /*break*/, 7];
            case 1: return [4 /*yield*/, (0, index_2["default"])(__assign(__assign({}, config), { numberOfRooms: 20, roomDimensions: { width: [1, 5], depth: [1, 5], height: 2 }, percentOfLightsOn: 35, lootTable: [
                        {
                            name: 'almondWater',
                            weight: 10,
                            variant: 'mana'
                        },
                        {
                            name: 'almondWater',
                            weight: 1,
                            variant: 'xp'
                        },
                        {
                            name: 'almondWater',
                            weight: 4,
                            variant: 'slow'
                        },
                        {
                            name: 'almondWater',
                            weight: 2,
                            variant: 'speed'
                        },
                    ] }))];
            case 2:
                _b.sent();
                return [3 /*break*/, 7];
            case 3: return [4 /*yield*/, (0, index_1["default"])(__assign({}, config))];
            case 4:
                _b.sent();
                return [3 /*break*/, 7];
            case 5: return [4 /*yield*/, (0, index_3["default"])(__assign({}, config))];
            case 6:
                _b.sent();
                return [3 /*break*/, 7];
            case 7:
                console.log('done');
                return [2 /*return*/];
        }
    });
}); })();
