import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import { describeRoute, openAPISpecs } from "hono-openapi";
import {getCurrentData, getDailyData, getLifeTimeData} from "./service";
import {InternalServerException, NotFoundException} from "./exception";

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
            200: { description: 'Successful response' },
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
            200: { description: 'Successful response' },
            400: { description: 'Failed to fetch data' },
        },
    }),
    async (c) => {
        const date = c.req.param('date');

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
            200: { description: 'Successful response' },
            400: { description: 'Failed to fetch data' },
        },
    }),
    async (c) => {
        return c.json(await getLifeTimeData());
});

// OpenAPI with Swagger UI
app.get('/', swaggerUI({ url: '/openapi' }));
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
