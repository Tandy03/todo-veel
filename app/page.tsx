"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const API_URL = "https://jsonplaceholder.typicode.com/todos";

const fetchTodos = async () => {
  const response = await axios.get(`${API_URL}?_limit=10`);
  return response.data;
};

const createTodo = async (newTodo: string) => {
  const response = await axios.post(API_URL, {
    title: newTodo,
    completed: false,
  });
  return response.data;
};

const deleteTodo = async (id: number) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  if (response.status === 200) {
    return { id };
  } else {
    throw new Error("Failed to delete Todo");
  }
};

const updateTodo = async ({
  id,
  updatedTitle,
}: {
  id: number;
  updatedTitle: string;
}) => {
  const response = await axios.put(`${API_URL}/${id}`, {
    title: updatedTitle,
    completed: false,
  });
  return response.data;
};

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: todos, isLoading, isError } = useQuery("todos", fetchTodos);

  const { mutate: addTodo } = useMutation(createTodo, {
    onSuccess: () => {
      queryClient.invalidateQueries("todos");
    },
  });

  const { mutate: removeTodo } = useMutation(deleteTodo, {
    onMutate: async (id) => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<Todo[]>("todos");
      queryClient.setQueryData("todos", (oldTodos: Todo[] | undefined) => {
        return oldTodos ? oldTodos.filter((todo) => todo.id !== id) : [];
      });
      return { previousTodos };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData("todos", context?.previousTodos);
      console.error("Failed to delete Todo");
    },
    onSettled: () => {
      queryClient.invalidateQueries("todos");
    },
  });

  const { mutate: editTodo } = useMutation(updateTodo, {
    onSuccess: () => {
      queryClient.invalidateQueries("todos");
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error!</div>;

  const handleEditClick = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
  };

  const handleSaveEdit = () => {
    if (
      editingTodoId &&
      editingTitle.trim() &&
      editingTitle !==
        todos?.find((todo: Todo) => todo.id === editingTodoId)?.title
    ) {
      editTodo({ id: editingTodoId, updatedTitle: editingTitle });
      setEditingTodoId(null);
      setEditingTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingTitle("");
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Todo App</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add new todo"
          className="px-4 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={() => {
            if (newTodo.trim()) {
              addTodo(newTodo);
              setNewTodo("");
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2">
        {todos?.map((todo: Todo) => (
          <li key={todo.id} className="flex justify-between items-center">
            {editingTodoId === todo.id ? (
              <div className="flex gap-2 ml-4">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded"
                />
                <button
                  onClick={handleSaveEdit}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Canсel
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span
                  className={`${
                    todo.completed ? "line-through text-gray-500" : "text-white"
                  }`}
                >
                  {todo.title}
                </span>
                <div className="flex gap-2 ml-4 mr-0">
                  <button
                    onClick={() => handleEditClick(todo)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}