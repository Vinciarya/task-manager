import { projectService } from "@/lib/container";
import { withAuth, withHandler } from "@/lib/middleware";
import { ApiResponse } from "@/lib/api-response";

export const DELETE = withHandler(
  withAuth(async (req, { params }) => {
    const p = await params;
    const projectId = p.id;
    const targetUserId = p.userId;
    const currentUserId = req.headers.get("x-user-id")!;

    await projectService.removeMember(projectId, targetUserId, currentUserId);

    return ApiResponse.noContent();
  })
);
