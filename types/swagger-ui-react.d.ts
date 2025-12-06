declare module "swagger-ui-react" {
  import { ComponentType } from "react";
  // Swagger UI accepts many props; for simplicity we loosen typing here.
  // If you want strict typing later, replace `any` with the specific prop types.
  const SwaggerUI: ComponentType<any>;
  export default SwaggerUI;
}
