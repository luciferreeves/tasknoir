import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const categoriesTagsRouter = createTRPCRouter({
  // Categories - Global categories (not project-specific)
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    try {
      const categories = await ctx.db.taskCategory.findMany({
        orderBy: { name: "asc" },
      });
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories",
      });
    }
  }),

  createCategory: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const category = await ctx.db.taskCategory.create({
          data: {
            name: input.name,
            color: input.color,
          },
        });
        return category;
      } catch (error) {
        console.error("Error creating category:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create category",
        });
      }
    }),

  updateCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if category exists
        const existingCategory = await ctx.db.taskCategory.findUnique({
          where: { id: input.id },
        });

        if (!existingCategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        const category = await ctx.db.taskCategory.update({
          where: { id: input.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.color && { color: input.color }),
          },
        });
        return category;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating category:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update category",
        });
      }
    }),

  deleteCategory: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if category exists
        const existingCategory = await ctx.db.taskCategory.findUnique({
          where: { id: input.id },
        });

        if (!existingCategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        await ctx.db.taskCategory.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting category:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete category",
        });
      }
    }),

  // Tags - Global tags (not project-specific)
  getTags: protectedProcedure.query(async ({ ctx }) => {
    try {
      const tags = await ctx.db.taskTag.findMany({
        orderBy: { name: "asc" },
      });
      return tags;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),

  createTag: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tag = await ctx.db.taskTag.create({
          data: {
            name: input.name,
            color: input.color,
          },
        });
        return tag;
      } catch (error) {
        console.error("Error creating tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tag",
        });
      }
    }),

  updateTag: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if tag exists
        const existingTag = await ctx.db.taskTag.findUnique({
          where: { id: input.id },
        });

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        const tag = await ctx.db.taskTag.update({
          where: { id: input.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.color && { color: input.color }),
          },
        });
        return tag;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error updating tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tag",
        });
      }
    }),

  deleteTag: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if tag exists
        const existingTag = await ctx.db.taskTag.findUnique({
          where: { id: input.id },
        });

        if (!existingTag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        await ctx.db.taskTag.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error deleting tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tag",
        });
      }
    }),

  // Search tags for autocomplete
  searchTags: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const tags = await ctx.db.taskTag.findMany({
          where: {
            name: {
              contains: input.query,
              mode: "insensitive",
            },
          },
          orderBy: { name: "asc" },
          take: input.limit,
        });
        return tags;
      } catch (error) {
        console.error("Error searching tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search tags",
        });
      }
    }),

  // Create tag or return existing one
  createOrFindTag: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First try to find existing tag
        const existingTag = await ctx.db.taskTag.findFirst({
          where: {
            name: {
              equals: input.name,
              mode: "insensitive",
            },
          },
        });

        if (existingTag) {
          return existingTag;
        }

        // Create new tag if not found
        const tag = await ctx.db.taskTag.create({
          data: {
            name: input.name,
            color: input.color,
          },
        });
        return tag;
      } catch (error) {
        console.error("Error creating or finding tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create or find tag",
        });
      }
    }),
});
