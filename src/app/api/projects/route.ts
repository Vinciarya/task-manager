import { projectService } from "@/lib/container";
import { createProjectSchema } from "@/modules/project/project.schema";
import type { CreateProjectInput } from "@/modules/project/project.schema";
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
    
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    
    const projects = await projectService.getProjects(userId, page, limit);
    return ApiResponse.success(projects, "Projects fetched successfully");
  })
);

export const POST = withHandler(
  withAuth(
    withValidation(createProjectSchema)(async (req: NextRequest) => {
      const userId = getRequiredUserId(req.headers);
      const body = getParsedBody<CreateProjectInput>(req);
      const project = await projectService.createProject(body, userId);
      
      return ApiResponse.created(project, "Project created successfully");
    })
  )
);
