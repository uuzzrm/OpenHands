import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AgentServerGitService from "#/api/git-service/agent-server-git-service.api";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";

const conversation = {
  conversation_url: "http://localhost:18000/api/conversations/c1",
  session_api_key: "test-key",
  workspace: { working_dir: "/workspace/project" },
};

vi.mock("#/hooks/use-conversation-id", () => ({
  useConversationId: () => ({ conversationId: "c1" }),
}));

vi.mock("#/hooks/query/use-active-conversation", () => ({
  useActiveConversation: () => ({ data: conversation }),
}));

vi.mock("#/hooks/use-runtime-is-ready", () => ({
  useRuntimeIsReady: () => true,
}));

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function UnifiedGetGitChangesTestWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  return UnifiedGetGitChangesTestWrapper;
}

describe("useUnifiedGetGitChanges", () => {
  const getGitChangesSpy = vi.spyOn(AgentServerGitService, "getGitChanges");

  beforeEach(() => {
    getGitChangesSpy.mockReset();
  });

  it("only returns one entry when the runtime reports a path more than once", async () => {
    getGitChangesSpy.mockResolvedValue([
      { path: "src/file.ts", status: "M" },
      { path: "src/file.ts", status: "M" },
    ]);

    const { result } = renderHook(() => useUnifiedGetGitChanges(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([{ path: "src/file.ts", status: "M" }]);
  });
});
