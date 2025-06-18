import { Hono } from 'hono';
import { describeRoute, openAPISpecs } from "hono-openapi";
 import {getCurrentData, getDailyData, getLifeTimeData} from "@services/service";
import {InternalServerException, NotFoundException} from "@exceptions/http-exceptions";
import {resolver, validator as zValidator} from "hono-openapi/zod";
import {Scalar} from "@scalar/hono-api-reference";
import * as schema from "@schemas/schema";

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
            200: { description: 'Successful response', content: { "application/json": { schema: resolver(schema.getCurrentResponse) } } },
            500: { description: 'Failed to fetch data' },
        },
    }),
    async (c) => {
        const lastSummary = await getCurrentData();
        if (!lastSummary)
            throw new InternalServerException('Failed to fetch data');

        return c.json(lastSummary);
});

// Data by date
app.get('/daily/:date',
    describeRoute({
        summary: 'Daily data',
        description: 'Get data by date',
        responses: {
            200: { description: 'Successful response', content: { "application/json": { schema: resolver(schema.getDailyResponse) } } },
            404: { description: 'No data found' },
        },
    }),
    zValidator("param", schema.getDailyParam),
    async (c) => {
        const date = c.req.valid('param').date;

        const data = await getDailyData(date);
        if (!data)
            throw new NotFoundException('No data found');

        return c.json(data);
});

// Lifetime data
app.get('/lifetime',
    describeRoute({
        summary: 'Lifetime data',
        description: 'Get lifetime data',
        responses: {
            200: { description: 'Successful response', content: { "application/json": { schema: resolver(schema.getLifeTimeResponse) } } },
        },
    }),
    async (c) => {
        return c.json(await getLifeTimeData());
});

// OpenAPI with Scalar
app.get(
    "/docs",
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
