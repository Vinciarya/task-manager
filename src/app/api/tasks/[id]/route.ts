import { taskService } from "@/lib/container";
import { updateTaskSchema } from "@/modules/task/task.schema";
import type { UpdateTaskInput } from "@/modules/task/task.schema";
import { withHandler, type RouteContext } from "@/lib/with-handler";
import { withAuth } from "@/lib/with-auth";
import { withValidation, getParsedBody } from "@/lib/with-validation";
import { ApiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getRequiredUserId } from "@/lib/request-context";

export const GET = withHandler(
  withAuth(async (req: NextRequest, context: RouteContext) => {
    const userId = getRequiredUserId(req.headers);
    const { id } = await context.params;
    
    const task = await taskService.getTaskById(id, userId);
    return ApiResponse.success(task, "Task fetched successfully");
  })
);

export const PATCH = withHandler(
  withAuth(
    withValidation(updateTaskSchema)(async (req: NextRequest, context: RouteContext) => {
      const userId = getRequiredUserId(req.headers);
      const { id } = await context.params;
      const body = getParsedBody<UpdateTaskInput>(req);
      
      const task = await taskService.updateTask(id, body, userId);
      return ApiResponse.success(task, "Task updated successfully");
    })
  )
);

export const DELETE = withHandler(
  withAuth(async (req: NextRequest, context: RouteContext) => {
    const userId = getRequiredUserId(req.headers);
    const { id } = await context.params;
    
    await taskService.deleteTask(id, userId);
    return ApiResponse.noContent();
  })
);
