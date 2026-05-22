import { describe, expect, it } from "vitest";
import {
  buildFolderTree,
  filterFilesByFolder,
  flattenFileTree,
} from "@/lib/file-tree-utils";
import { mockFiles } from "@/test/fixtures/mock-data";

describe("file-tree-utils", () => {
  it("buildFolderTree groups by folderPath", () => {
    const tree = buildFolderTree(mockFiles);
    expect(tree.files).toHaveLength(1);
    expect(tree.subfolders.get("docs")?.files).toHaveLength(1);
  });

  it("flattenFileTree returns all files", () => {
    const flat = flattenFileTree(buildFolderTree(mockFiles));
    expect(flat).toHaveLength(2);
  });

  it("filterFilesByFolder limits to subtree", () => {
    const filtered = filterFilesByFolder(mockFiles, "docs");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.fileName).toBe("alpha.pdf");
  });
});
