# AnCoffee

## Deployment

## Local full-stack development

Put the real MongoDB Atlas connection string in `backend/.env`, then run:

```bash
npm run dev
```

This starts the Express API on port `3000` and the Angular application on port `4200`. Open `http://localhost:4200/`. Angular proxies `/api` and `/uploads` to the backend.

Set the backend environment variables before starting it:

- `MONGO_URI`: MongoDB connection string
- `PORT`: HTTP port supplied by the hosting platform
- `CORS_ORIGIN`: optional comma-separated list of frontend origins

Build and serve the Angular SSR application with:

```bash
npm install
npm run build
npm start
```

Start the API separately with:

```bash
cd backend
npm install
npm start
```

For a separate frontend and API domain, set `CORS_ORIGIN` to the frontend origin and change the production `apiUrl` in `src/environments/environment.ts` to the deployed API URL.

## Vercel frontend deployment

The included `vercel.json` configures the Angular browser build for Vercel:

```bash
npm install
npm run build
```

Import the repository into Vercel and deploy the project root. Set the production `apiUrl` to the public Express API URL before building. Vercel does not host the local Express server or persistent `backend/uploads` directory; deploy the backend separately and use MongoDB Atlas and persistent object storage for production data and images.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.11.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
