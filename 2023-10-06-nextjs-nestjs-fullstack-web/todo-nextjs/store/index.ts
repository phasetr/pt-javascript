import { EditedTask } from "@/types";
import create from "zustand";

type State = {
  editedTask: EditedTask;
  updateEditedTask: (task: EditedTask) => void;
  resetEditedTask: () => void;
};

const useStore = create<State>((set) => ({
  editedTask: { id: 0, title: "", description: "" },
  updateEditedTask: (payload) =>
    set({
      editedTask: {
        id: payload.id,
        title: payload.title,
        description: payload.description,
      },
    }),
  resetEditedTask: () =>
    set({ editedTask: { id: 0, title: "", description: "" } }),
}));

export default useStore;
