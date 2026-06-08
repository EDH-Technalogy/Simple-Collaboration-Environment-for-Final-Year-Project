import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStaff,
  upsertStaff,
  readTeachersFromStorage,
  readEmployeesFromStorage,
} from "../lib/adminStaffDirectoryStorage";

export const ADMIN_TEACHERS_QUERY_KEY = ["admin-directory-teachers"];

export const ADMIN_EMPLOYEES_QUERY_KEY = ["admin-directory-employees"];

export function useAdminTeachers(queryOptions = {}) {
  const { ...rest } = queryOptions;
  return useQuery({
    queryKey: ADMIN_TEACHERS_QUERY_KEY,
    queryFn: () => Promise.resolve(readTeachersFromStorage()),
    ...rest,
  });
}

export function useAdminEmployees(queryOptions = {}) {
  const { ...rest } = queryOptions;
  return useQuery({
    queryKey: ADMIN_EMPLOYEES_QUERY_KEY,
    queryFn: () => Promise.resolve(readEmployeesFromStorage()),
    ...rest,
  });
}

export function useUpsertTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      return upsertStaff("teacher", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TEACHERS_QUERY_KEY });
    },
  });
}

export function useUpsertEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      return upsertStaff("employee", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_EMPLOYEES_QUERY_KEY });
    },
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => deleteStaff("teacher", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TEACHERS_QUERY_KEY });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => deleteStaff("employee", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_EMPLOYEES_QUERY_KEY });
    },
  });
}
