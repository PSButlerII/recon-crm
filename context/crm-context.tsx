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
import { mockFiles } from "@/data/mock-files";
import { mockActivity } from "@/data/mock-activity";
import { mockQuotes, mockInvoices } from "@/data/mock-billing";

import type { FileRecord } from "@/types/file-record";
import type { Activity } from "@/types/activity";
import type { Quote, Invoice } from "@/types/billing";

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
  files: FileRecord[];
  setFiles: React.Dispatch<React.SetStateAction<FileRecord[]>>;

  activity: Activity[];
  setActivity: React.Dispatch<React.SetStateAction<Activity[]>>;

  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;

  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
};

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(mockServiceRequests);
  const [intakeSubmissions, setIntakeSubmissions] = useState<IntakeSubmission[]>(mockIntakeSubmissions);
  const [files, setFiles] = useState<FileRecord[]>(mockFiles);
  const [activity, setActivity] = useState<Activity[]>(mockActivity);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

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
        files,
        setFiles,
        activity,
        setActivity,
        quotes,
        setQuotes,
        invoices,
        setInvoices,
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