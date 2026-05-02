import { taskService } from "@/lib/container";
import { updateStatusSchema } from "@/modules/task/task.schema";
import type { UpdateStatusInput } from "@/modules/task/task.schema";
import { withHandler, type RouteContext } from "@/lib/with-handler";
import { withAuth } from "@/lib/with-auth";
import { withValidation, getParsedBody } from "@/lib/with-validation";
import { ApiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getRequiredUserId } from "@/lib/request-context";

export const PATCH = withHandler(
  withAuth(
    withValidation(updateStatusSchema)(async (req: NextRequest, context: RouteContext) => {
      const userId = getRequiredUserId(req.headers);
      const { id } = await context.params;
      const body = getParsedBody<UpdateStatusInput>(req);
      
      const task = await taskService.updateStatus(id, body, userId);
      return ApiResponse.success(task, "Task status updated successfully");
    })
  )
);
