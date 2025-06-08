import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { isAdmin } from "~/server/api/utils/admin";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Get user's projects (owned or member)
      const userConditions = [
        { ownerId: ctx.session.user.id },
        {
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      ];

      const whereCondition = isAdmin(ctx.session)
        ? {} // Admins see all projects
        : { OR: userConditions };

      const projects = await ctx.db.project.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
      });

      // Get user's tasks (assigned or owned through projects)
      const taskConditions = [
        {
          assignments: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        {
          project: {
            OR: userConditions,
          },
        },
      ];

      const taskWhereCondition = isAdmin(ctx.session)
        ? {} // Admins see all tasks
        : { OR: taskConditions };

      const tasks = await ctx.db.task.findMany({
        where: taskWhereCondition,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      // Get recent activities
      const recentActivities = await ctx.db.taskActivity.findMany({
        where: {
          task: taskWhereCondition,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              project: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Calculate statistics
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const taskStats = {
        total: tasks.length,
        completed: tasks.filter((task) => task.status === "COMPLETED").length,
        inProgress: tasks.filter((task) => task.status === "IN_PROGRESS")
          .length,
        todo: tasks.filter((task) => task.status === "TODO").length,
        review: tasks.filter((task) => task.status === "REVIEW").length,
        overdue: tasks.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) < now &&
            task.status !== "COMPLETED",
        ).length,
        dueThisWeek: tasks.filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) >= now &&
            new Date(task.dueDate) <= weekFromNow &&
            task.status !== "COMPLETED",
        ).length,
      };

      const projectStats = {
        total: projects.length,
        owned: projects.filter(
          (project) => project.ownerId === ctx.session.user.id,
        ).length,
        member: projects.filter(
          (project) => project.ownerId !== ctx.session.user.id,
        ).length,
      };

      const priorityStats = {
        urgent: tasks.filter(
          (task) => task.priority === "URGENT" && task.status !== "COMPLETED",
        ).length,
        high: tasks.filter(
          (task) => task.priority === "HIGH" && task.status !== "COMPLETED",
        ).length,
        medium: tasks.filter(
          (task) => task.priority === "MEDIUM" && task.status !== "COMPLETED",
        ).length,
        low: tasks.filter(
          (task) => task.priority === "LOW" && task.status !== "COMPLETED",
        ).length,
      };

      // Get upcoming deadlines
      const upcomingDeadlines = tasks
        .filter(
          (task) =>
            task.dueDate &&
            new Date(task.dueDate) >= now &&
            new Date(task.dueDate) <= weekFromNow &&
            task.status !== "COMPLETED",
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
        )
        .slice(0, 5);

      // Get recent tasks
      const recentTasks = tasks.slice(0, 5);

      return {
        taskStats,
        projectStats,
        priorityStats,
        recentTasks,
        upcomingDeadlines,
        recentActivities,
        projects: projects.slice(0, 4), // Get first 4 projects for overview
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard statistics",
      });
    }
  }),
});
