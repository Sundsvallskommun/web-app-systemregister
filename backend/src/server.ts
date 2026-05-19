import App from './app';
import validateEnv from './utils/validateEnv';

validateEnv();

async function bootstrap(): Promise<void> {
  const app = new App();
  app.listen();
}

bootstrap().catch(err => {
  console.error('Failed to start app:', err);
  process.exit(1);
});
