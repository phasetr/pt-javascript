import { todoVar } from "../cache";
import { useReactiveVar } from "@apollo/client";
import Link from "next/link";

export const LocalStateB: React.VFC = () => {
  const todos = useReactiveVar(todoVar);
  return (
    <>
      {todos.map((task, index) => (
        <p className="mb-3" key={index}>{task.title}</p>
      ))}
      <Link href={"/local-state-a"}><a>Back</a></Link>
    </>
  );
};
