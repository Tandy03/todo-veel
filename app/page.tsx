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
  const response = await axios.post('https://jsonplaceholder.typicode.com/todos', {
    title: newTodo,
    completed: false,
    id: Math.random() * 100,
  });
  return response.data;
};

const deleteTodo = async (id: number) => {
  const response = await axios.delete(`https://jsonplaceholder.typicode.com/todos/${id}`);
  if (response.status === 200) {
    return { id };
  } else {
    throw new Error("Failed to delete Todo");
  }
};

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const queryClient = useQueryClient();

  const { data: todos} = useQuery("todos", fetchTodos);

  const { mutate: addTodo } = useMutation(createTodo, {
    onMutate: async (newTodo) => {
      await queryClient.cancelQueries("todos");
      const previousTodos = queryClient.getQueryData<Todo[]>("todos") || [];

      const newItem = { id: Math.random() * 100, title: newTodo, completed: false };
      queryClient.setQueryData("todos", [...previousTodos, newItem]);

      return { previousTodos };
    },
    onError: (error, newTodo, context) => {
      queryClient.setQueryData("todos", context?.previousTodos);
    },
  });
  //add new todo item to Ui, client side, not for api, because cannot change https://jsonplaceholder.typicode.com/


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
//    onSettled: () => { //will update todo list from api and deletion will be canceled, because cannot change
//      queryClient.invalidateQueries("todos"); // api, so it deletes only from client side. if remove comments,
//    }, //                                        it will request list from api and deleted item will appear then
  });

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        Todo App
        <svg
            width="22"
            height="22"
            viewBox="0 0 15 15"
            fill="none"
        >
          <path
              d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
              fill="currentColor"
          ></path>
        </svg>
      </h1>


      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTodo.trim()) {
              addTodo(newTodo);
              setNewTodo("");
            }
          }}
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
                    onClick={() => removeTodo(todo.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
          </li>
        ))}
      </ul>
    </div>
  );
}