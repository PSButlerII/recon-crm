"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { mockClients } from "@/data/mock-clients";
import { mockProjects } from "@/data/mock-projects";
import { mockTasks } from "@/data/mock-tasks";
import { mockNotes } from "@/data/mock-notes";
import { mockServiceRequests } from "@/data/mock-service-requests";

import type { Client } from "@/types/client";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { Note } from "@/types/note";
import type { ServiceRequest } from "@/types/service-request";
import { mockIntakeSubmissions } from "@/data/mock-intake-submissions";
import type { IntakeSubmission } from "@/types/intake-submission";

type CrmContextType = {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;

  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;

  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;

  serviceRequests: ServiceRequest[];
  setServiceRequests: React.Dispatch<React.SetStateAction<ServiceRequest[]>>;

  intakeSubmissions: IntakeSubmission[];
  setIntakeSubmissions: React.Dispatch<React.SetStateAction<IntakeSubmission[]>
>;
};

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [intakeSubmissions, setIntakeSubmissions] = useState<IntakeSubmission[]>(mockIntakeSubmissions);
  
  return (
    <CrmContext.Provider
      value={{
        clients,
        setClients,
        projects,
        setProjects,
        tasks,
        setTasks,
        notes,
        setNotes,
        serviceRequests,
        setServiceRequests,
        intakeSubmissions,
        setIntakeSubmissions,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);

  if (!context) {
    throw new Error("useCrm must be used inside CrmProvider");
  }

  return context;
}