"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Project, ReimburseRequest } from "../types";
import { MOCK_USERS, INITIAL_PROJECTS, INITIAL_REQUESTS } from "../data/mockData";

interface DataContextType {
  currentUser: User;
  switchUser: (username: string) => void;
  projects: Project[];
  requests: ReimburseRequest[];
  addProject: (newProject: Project) => void;
  addRequest: (newRequest: ReimburseRequest) => void;
  updateRequestStatus: (requestId: string, status: "approved" | "rejected", rejectReason?: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [requests, setRequests] = useState<ReimburseRequest[]>(INITIAL_REQUESTS);

  useEffect(() => {
    const savedUser = localStorage.getItem("dune_user");
    const savedProjects = localStorage.getItem("dune_projects");
    const savedRequests = localStorage.getItem("dune_requests");

    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedRequests) setRequests(JSON.parse(savedRequests));
  }, []);

  const switchUser = (username: string) => {
    const user = MOCK_USERS.find((u) => u.username === username);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("dune_user", JSON.stringify(user));
    }
  };

  const addProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem("dune_projects", JSON.stringify(updated));
  };

  const addRequest = (newRequest: ReimburseRequest) => {
    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("dune_requests", JSON.stringify(updated));
  };

  const updateRequestStatus = (requestId: string, status: "approved" | "rejected", rejectReason?: string) => {
    const updated = requests.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status,
          rejectReason: rejectReason || r.rejectReason,
        };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem("dune_requests", JSON.stringify(updated));
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        switchUser,
        projects,
        requests,
        addProject,
        addRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};