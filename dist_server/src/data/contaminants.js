"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTAMINANT_KEYS = exports.CONTAMINANT_COLUMNS = void 0;
exports.createEmptyContaminantCounts = createEmptyContaminantCounts;
exports.CONTAMINANT_COLUMNS = [
    { key: "hair", displayName: "Hair", iconKey: "hair" },
    { key: "foreign_object", displayName: "Foreign Object", iconKey: "other" },
    { key: "blood_clots", displayName: "Blood Clots", iconKey: "blood-clots" },
    { key: "grease", displayName: "Grease", iconKey: "grease-oil" },
    { key: "rail_dust", displayName: "Rail Dust", iconKey: "rail-dust" },
    { key: "faceal_over_1cm", displayName: "Faceal\nOver 1cm", iconKey: "faceal" },
    {
        key: "faceal_under_1cm",
        displayName: "Faceal\nUnder 1cm",
        iconKey: "faceal",
    },
    {
        key: "ingesta_over_1cm",
        displayName: "Ingesta\nOver 1cm",
        iconKey: "soft-plastic",
    },
    {
        key: "ingesta_under_1cm",
        displayName: "Ingesta\nUnder 1cm",
        iconKey: "hard-plastic",
    },
    { key: "other", displayName: "Other", iconKey: "other" },
];
exports.CONTAMINANT_KEYS = exports.CONTAMINANT_COLUMNS.map((column) => column.key);
function createEmptyContaminantCounts() {
    return Object.fromEntries(exports.CONTAMINANT_KEYS.map((key) => [key, 0]));
}
