import { create } from "zustand";

interface dataModel{
    value: string;
    label: string;
}

interface Props {
  complex: boolean;
  setComplex: (data: boolean) => void;
  model: dataModel;
  setModel: (data: dataModel) => void;
}

export const useDataStore = create<Props>()((set) => ({
  complex: false,
  model: {value:"gemini", label:"Gemini"},

  setComplex: (complex) => set({ complex }),
  setModel: (model) => set({ model }),
}));