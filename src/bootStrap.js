import cors from 'cors';
import { globalErrorHandling } from "./utils/appError.js";
import { clothesRouter } from './modules/index.js';

export const bootStrap = (app, express) => {
    // parse req
    app.use(express.json());
    // cors edit
    const corsOptions = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    };
    app.use(cors(corsOptions));

    // routing
    app.use('/clothes', clothesRouter)
    
    // global error
    app.use(globalErrorHandling);
};
