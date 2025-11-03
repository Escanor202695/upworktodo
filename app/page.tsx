"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  userId: string;
}

interface TasksResponse {
  items: Task[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only redirect if we're sure the session is unauthenticated (not just loading)
    if (status === "unauthenticated" && !loading) {
      router.push("/auth/signin");
    }
  }, [status, loading, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
    }
  }, [status, currentPage, searchQuery]);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "10",
        ...(searchQuery && { q: searchQuery }),
      });

      const response = await fetch(`/api/tasks?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data: TasksResponse = await response.json();
      setTasks(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError("Failed to load tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) {
      setError("Task title cannot be empty");
      return;
    }

    if (newTaskTitle.length > 200) {
      setError("Task title must be 200 characters or less");
      return;
    }

    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTaskTitle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      setNewTaskTitle("");
      setCurrentPage(1);
      fetchTasks();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle task");
      }

      fetchTasks();
    } catch (err) {
      setError("Failed to toggle task");
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-lg text-gray-300 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">My Tasks</h1>
              <p className="text-sm text-gray-400 mt-1">
                Welcome, {session.user?.name || session.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-gray-700 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={createTask} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {newTaskTitle.length}/200 characters
            </p>
          </form>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="flex-1 px-4 py-2 bg-[#2a2a2a] border border-gray-700 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] border border-gray-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>

          <div className="mb-4 text-sm text-gray-400">
            {total} {total === 1 ? "task" : "tasks"} found
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No tasks found. Create one to get started!
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-4 bg-[#2a2a2a] border border-gray-800 rounded-md hover:bg-[#333] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 text-blue-600 bg-[#2a2a2a] border-gray-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p
                      className={`text-gray-200 ${
                        task.done ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#2a2a2a] border border-gray-700 text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#2a2a2a] border border-gray-700 text-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
