import { projectService } from "@/lib/container";
import { withAuth, withHandler, withValidation, getParsedBody } from "@/lib/middleware";
import { addMemberSchema, type AddMemberInput } from "@/modules/project/project.schema";
import { ApiResponse } from "@/lib/api-response";

export const POST = withHandler(
  withAuth(
    withValidation(addMemberSchema)(async (req, { params }) => {
      const p = await params;
      const projectId = p.id;
      const userId = req.headers.get("x-user-id")!;
      const body = getParsedBody<AddMemberInput>(req);

      const member = await projectService.addMember(
        projectId,
        body.email,
        body.role,
        userId
      );

      return ApiResponse.created(member, "Member added successfully.");
    })
  )
);
