import { authService } from "@/lib/container";
import { registerSchema, type RegisterInput } from "@/modules/auth/auth.schema";
import { withHandler } from "@/lib/with-handler";
import { withValidation, getParsedBody } from "@/lib/with-validation";
import { ApiResponse } from "@/lib/api-response";

export const POST = withHandler(
  withValidation(registerSchema)(async (req) => {
    const body = getParsedBody<RegisterInput>(req);
    const user = await authService.register(body);
    
    return ApiResponse.created(user, "User registered successfully");
  })
);
