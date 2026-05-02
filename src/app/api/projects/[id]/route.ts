import { projectService } from "@/lib/container";
import { updateProjectSchema } from "@/modules/project/project.schema";
import type { UpdateProjectInput } from "@/modules/project/project.schema";
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
    
    const project = await projectService.getProjectById(id, userId);
    return ApiResponse.success(project, "Project fetched successfully");
  })
);

export const PATCH = withHandler(
  withAuth(
    withValidation(updateProjectSchema)(async (req: NextRequest, context: RouteContext) => {
      const userId = getRequiredUserId(req.headers);
      const { id } = await context.params;
      const body = getParsedBody<UpdateProjectInput>(req);
      
      const project = await projectService.updateProject(id, body, userId);
      return ApiResponse.success(project, "Project updated successfully");
    })
  )
);

export const DELETE = withHandler(
  withAuth(async (req: NextRequest, context: RouteContext) => {
    const userId = getRequiredUserId(req.headers);
    const { id } = await context.params;
    
    await projectService.deleteProject(id, userId);
    return ApiResponse.noContent();
  })
);
