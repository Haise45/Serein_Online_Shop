import { Category } from "@/types";

export const buildCategoryTree = (
  categories: Category[],
  parentId: string | null = null,
): (Category & { children?: Category[] })[] => {
  const tree: (Category & { children?: Category[] })[] = [];
  const children = categories.filter((category) => {
    const categoryParentId = category.parent
      ? typeof category.parent === "string"
        ? category.parent
        : category.parent._id
      : null;
    const targetParentId = parentId ? parentId.toString() : null;
    return categoryParentId === targetParentId;
  });

  for (const child of children) {
    const grandchildren = buildCategoryTree(categories, child._id);
    if (grandchildren.length > 0) {
      child.children = grandchildren;
    }
    tree.push(child);
  }
  return tree;
};

export const flattenTreeForSelect = (
  categoryTree: (Category & { children?: Category[] })[],
  level = 0,
  prefix = "-- ",
): Category[] => {
  let flattened: Category[] = [];
  for (const category of categoryTree) {
    flattened.push({
      ...category,
      displayName: `${prefix.repeat(level)}${category.name}`,
    });
    if (category.children && category.children.length > 0) {
      flattened = flattened.concat(
        flattenTreeForSelect(category.children, level + 1, prefix),
      );
    }
  }
  return flattened;
};
