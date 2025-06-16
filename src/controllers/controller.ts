import { Hono } from 'hono';
import { describeRoute, openAPISpecs } from "hono-openapi";
 import {getCurrentData, getDailyData, getLifeTimeData} from "@services/service";
import {InternalServerException, NotFoundException} from "@exceptions/http-exceptions";
import z from "zod";
import "zod-openapi/extend";
import {resolver, validator as zValidator} from "hono-openapi/zod";
import {Scalar} from "@scalar/hono-api-reference";

const app = new Hono();

// Health check
app.get('/health',
    describeRoute({
        summary: 'Health check',
        description: 'Health check',
        responses: {
            200: {
                description: 'Successful response',
            },
        },
    }),
    (c) => c.text('Server is running'));

// Public endpoint: Cached Enphase data
app.get('/current',
    describeRoute({
        summary: 'Current data',
        description: 'Get current data with cache',
        responses: {
            200: { description: 'Successful response', content: { "application/json": { schema: { example: { "system_id": 1234567, "current_power": 1953, "energy_lifetime": 8331057, "energy_today": 5223, "last_interval_end_at": 1750073601, "last_report_at": 1750073656, "modules": 7, "operational_at": 1677081194, "size_w": 2975, "nmi": null, "source": "meter", "status": "normal", "summary_date": "2025-06-16", "battery_charge_w": 0, "battery_discharge_w": 0, "battery_capacity_wh": 0 }} } } },
            500: { description: 'Failed to fetch data' },
        },
    }),
    async (c) => {
        const lastSummary = await getCurrentData();
        if (!lastSummary)
            throw new InternalServerException('Failed to fetch data');

        return c.json(lastSummary);
});

// Lifetime data by date
app.get('/daily/:date',
    describeRoute({
        summary: 'Daily data',
        description: 'Get data by date',
        responses: {
            200: { description: 'Successful response',
                content: { "application/json": { schema: resolver(
                    z.object({
                        date: z.string().openapi({ example: "2022-01-01" }),
                        production: z.number().openapi({ example: 1, description: "Wh" }),
                        consumption: z.number().openapi({ example: 1, description: "Wh" }),
                        import: z.number().openapi({ example: 1, description: "Wh" }),
                        export: z.number().openapi({ example: 1, description: "Wh" })
                    })) }}
            },
            404: { description: 'No data found' },
        },
    }),
    zValidator("param",
        z.object({
            date: z.string().regex(/^(yesterday|\d{4}-\d{2}-\d{2})$/,
                { message: 'Must be "yesterday" or a date in YYYY-MM-DD format' }
            ).openapi({ example: "2022-01-01", description: 'Must be "yesterday" or a date in YYYY-MM-DD format' })
        })),
    async (c) => {
        const date = c.req.valid('param').date;

        const data = await getDailyData(date);
        if (!data)
            throw new NotFoundException('No data found');

        return c.json(data);
})

// Lifetime data
app.get('/lifetime',
    describeRoute({
        summary: 'Lifetime data',
        description: 'Get lifetime data',
        responses: {
            200: { description: 'Successful response', content: { "application/json": { schema: { example: [ { "date": "2023-02-22", "production": 5763, "consumption": 13450, "import": 13444, "export": 0 }, { "date": "2023-02-23", "production": 9349, "consumption": 38696, "import": 29488, "export": 141 } ] } } } },
        },
    }),
    async (c) => {
        return c.json(await getLifeTimeData());
});

// OpenAPI with Scalar
app.get(
    "/",
    Scalar({
        theme: "default",
        url: "/openapi",
    })
);
app.get(
    "/openapi",
    openAPISpecs(app, {
        documentation: {
            info: {
                title: "Enphasy",
                version: "1.0.0",
                description: "Enphase Monitoring Server",
            },
            servers: [
                {
                    url: "http://localhost:3000",
                    description: "Local server",
                },
            ],
        },
    })
);

export default app;
