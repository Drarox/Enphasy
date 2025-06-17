import z from "zod";

// For extending the Zod schema with OpenAPI properties
import "zod-openapi/extend";

export const getCurrentResponse = z.object({
    system_id: z.number().openapi({ example: 1234567 }),
    current_power: z.number().openapi({ example: 1953 }),
    energy_lifetime: z.number().openapi({ example: 8331057 }),
    energy_today: z.number().openapi({ example: 5223 }),
    last_interval_end_at: z.number().openapi({ example: 1750073601 }),
    last_report_at: z.number().openapi({ example: 1750073656 }),
    modules: z.number().openapi({ example: 7 }),
    operational_at: z.number().openapi({ example: 1677081194 }),
    size_w: z.number().openapi({ example: 2975 }),
    nmi: z.null().openapi({ example: null }),
    source: z.string().openapi({ example: "meter" }),
    status: z.string().openapi({ example: "normal" }),
    summary_date: z.string().openapi({ example: "2025-06-16" }),
    battery_charge_w: z.number().openapi({ example: 0 }),
    battery_discharge_w: z.number().openapi({ example: 0 }),
    battery_capacity_wh: z.number().openapi({ example: 0 })
});

export const getDailyParam = z.object({
    date: z.string().regex(/^(yesterday|\d{4}-\d{2}-\d{2})$/,
        { message: 'Must be "yesterday" or a date in YYYY-MM-DD format' }
    ).openapi({ example: "2022-01-01", description: 'Must be "yesterday" or a date in YYYY-MM-DD format' })
});

export const getDailyResponse = z.object({
    date: z.string().openapi({ example: "2022-01-01" }),
    production: z.number().openapi({ example: 1, description: "Wh" }),
    consumption: z.number().openapi({ example: 1, description: "Wh" }),
    import: z.number().openapi({ example: 1, description: "Wh" }),
    export: z.number().openapi({ example: 1, description: "Wh" })
});

export const getLifeTimeResponse = z.array(z.object({
    date: z.string().openapi({ example: "2023-02-22" }),
    production: z.number().openapi({ example: 5763 }),
    consumption: z.number().openapi({ example: 13450 }),
    import: z.number().openapi({ example: 13444 }),
    export: z.number().openapi({ example: 0 })
}));
