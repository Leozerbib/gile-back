import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./gilentry.module";
import { GrpcToHttpExceptionFilter } from "./common/filters/grpc-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global error handler for gRPC connectivity issues (use DI-provided filter)
  const grpcFilter = app.get(GrpcToHttpExceptionFilter);
  app.useGlobalFilters(grpcFilter);

  // Swagger configuration
  const config = new DocumentBuilder().setTitle("Gile Backend API").setDescription("Main gateway for the microservices architecture").setVersion("1.0").addBearerAuth().build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.MAIN_HTTP_PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
