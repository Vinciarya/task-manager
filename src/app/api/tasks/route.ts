import { taskService } from "@/lib/container";
import { createTaskSchema, taskFilterSchema } from "@/modules/task/task.schema";
import type { CreateTaskInput } from "@/modules/task/task.schema";
import { withHandler } from "@/lib/with-handler";
import { withAuth } from "@/lib/with-auth";
import { withValidation, getParsedBody } from "@/lib/with-validation";
import { ApiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getRequiredUserId } from "@/lib/request-context";

export const GET = withHandler(
  withAuth(async (req: NextRequest) => {
    const userId = getRequiredUserId(req.headers);
    const { searchParams } = new URL(req.url);
    
    const query = Object.fromEntries(searchParams.entries());
    const filters = taskFilterSchema.parse(query);
    
    const tasks = await taskService.getTasksByFilters(filters, userId);
    return ApiResponse.success(tasks, "Tasks fetched successfully");
  })
);

export const POST = withHandler(
  withAuth(
    withValidation(createTaskSchema)(async (req: NextRequest) => {
      const userId = getRequiredUserId(req.headers);
      const body = getParsedBody<CreateTaskInput>(req);
      const task = await taskService.createTask(body, userId);
      
      return ApiResponse.created(task, "Task created successfully");
    })
  )
);
