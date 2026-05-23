"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Client } from "@/types/client";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { Note } from "@/types/note";
import type { ServiceRequest } from "@/types/service-request";
import type { IntakeSubmission } from "@/types/intake-submission";
import type { FileRecord } from "@/types/file-record";
import type { Activity } from "@/types/activity";
import type { Quote, Invoice } from "@/types/billing";
import type { AppSettings } from "@/types/settings";

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
  setIntakeSubmissions: React.Dispatch<React.SetStateAction<IntakeSubmission[]>>;

  files: FileRecord[];
  setFiles: React.Dispatch<React.SetStateAction<FileRecord[]>>;

  activity: Activity[];
  setActivity: React.Dispatch<React.SetStateAction<Activity[]>>;

  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;

  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;

  isLoadingCrm: boolean;
  refreshCrmData: () => Promise<void>;

  settings: AppSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings | null>>;
};

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [intakeSubmissions, setIntakeSubmissions] = useState<IntakeSubmission[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingCrm, setIsLoadingCrm] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  async function refreshCrmData() {
    setIsLoadingCrm(true);

    try {
      const [
        settingsResponse,
        clientsResponse,
        intakeResponse,
        requestsResponse,
        projectsResponse,
        tasksResponse,
        notesResponse,
        activityResponse,
        quotesResponse,
        invoicesResponse,
      ] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/clients"),
        fetch("/api/intake"),
        fetch("/api/service-requests"),
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/notes"),
        fetch("/api/activity"),
        fetch("/api/quotes"),
        fetch("/api/invoices"),
      ]);

      const [
        settingsData,
        clientsData,
        intakeData,
        requestsData,
        projectsData,
        tasksData,
        notesData,
        activityData,
        quotesData,
        invoicesData,
      ] = await Promise.all([
        settingsResponse.json(),
        clientsResponse.json(),
        intakeResponse.json(),
        requestsResponse.json(),
        projectsResponse.json(),
        tasksResponse.json(),
        notesResponse.json(),
        activityResponse.json(),
        quotesResponse.json(),
        invoicesResponse.json(),
      ]);

      if (invoicesData.invoices) {
        setInvoices(invoicesData.invoices);
      }

      if (settingsData.settings) {
        setSettings(settingsData.settings);
      }
      
      if (clientsData.clients) {
        setClients(clientsData.clients);
      }
      
      if (intakeData.submissions) {
        setIntakeSubmissions(intakeData.submissions);
      }

      if (requestsData.serviceRequests) {
        setServiceRequests(requestsData.serviceRequests);
      }

      if (projectsData.projects) {
        setProjects(projectsData.projects);
      }

      if (tasksData.tasks) {
        setTasks(tasksData.tasks);
      }

      if (notesData.notes) {
        setNotes(notesData.notes);
      }

      if (activityData.activity) {
        setActivity(activityData.activity);
      }

      if (quotesData.quotes) {
        setQuotes(quotesData.quotes);
      }
      
      } catch (error) {
        console.error("Failed to refresh CRM data:", error);
      } finally {
        setIsLoadingCrm(false);
      }
  }

  useEffect(() => {
    refreshCrmData();
  }, []);
  
  return (
    <CrmContext.Provider
      value={{
        settings,
        setSettings,
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
        isLoadingCrm,
        refreshCrmData,
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