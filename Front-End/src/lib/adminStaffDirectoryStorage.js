/** Local persisted directory for Teachers / Employees until dedicated APIs exist (mirrors list UI). */

const TEACHERS_KEY = "fp.admin.directory.teachers.v1";
const EMPLOYEES_KEY = "fp.admin.directory.employees.v1";

const seedTeachers = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@school.edu",
    phone: "",
    departmentId: "",
    department: "Mathematics",
    username: "john.doe",
    status: "active",
    joined: "2023-09-01",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@school.edu",
    phone: "",
    departmentId: "",
    department: "Physics",
    username: "jane.smith",
    status: "pending",
    joined: "2023-09-15",
  },
  {
    id: 3,
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@school.edu",
    phone: "",
    departmentId: "",
    department: "Computer Science",
    username: "mike.johnson",
    status: "active",
    joined: "2023-08-20",
  },
  {
    id: 4,
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.wilson@school.edu",
    phone: "",
    departmentId: "",
    department: "Biology",
    username: "sarah.wilson",
    status: "suspended",
    joined: "2023-10-01",
  },
  {
    id: 5,
    firstName: "David",
    lastName: "Brown",
    email: "david.brown@school.edu",
    phone: "",
    departmentId: "",
    department: "Chemistry",
    username: "david.brown",
    status: "rejected",
    joined: "2023-09-10",
  },
];

const seedEmployees = [
  {
    id: 1,
    firstName: "Robert",
    lastName: "Miller",
    email: "robert.miller@company.com",
    phone: "",
    departmentId: "",
    department: "HR",
    username: "robert.miller",
    status: "active",
    joined: "2023-07-01",
  },
  {
    id: 2,
    firstName: "Lisa",
    lastName: "Davis",
    email: "lisa.davis@company.com",
    phone: "",
    departmentId: "",
    department: "Finance",
    username: "lisa.davis",
    status: "active",
    joined: "2023-07-15",
  },
  {
    id: 3,
    firstName: "James",
    lastName: "Wilson",
    email: "james.wilson@company.com",
    phone: "",
    departmentId: "",
    department: "IT",
    username: "james.wilson",
    status: "pending",
    joined: "2023-08-01",
  },
  {
    id: 4,
    firstName: "Mary",
    lastName: "Taylor",
    email: "mary.taylor@company.com",
    phone: "",
    departmentId: "",
    department: "Administration",
    username: "mary.taylor",
    status: "suspended",
    joined: "2023-06-20",
  },
  {
    id: 5,
    firstName: "Richard",
    lastName: "Moore",
    email: "richard.moore@company.com",
    phone: "",
    departmentId: "",
    department: "HR",
    username: "richard.moore",
    status: "rejected",
    joined: "2023-08-10",
  },
];

function parseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function nextNumericId(rows) {
  const nums = rows
    .map((r) => Number(r?.id))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

export function readTeachersFromStorage() {
  return parseJson(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TEACHERS_KEY)
      : null,
    [...seedTeachers],
  );
}

export function writeTeachersToStorage(list) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(list));
}

export function readEmployeesFromStorage() {
  return parseJson(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(EMPLOYEES_KEY)
      : null,
    [...seedEmployees],
  );
}

export function writeEmployeesToStorage(list) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(list));
}

/** @param {"teacher"|"employee"} kind */
export function deleteStaff(kind, id) {
  const sid = `${id}`;
  if (kind === "teacher") {
    const list = readTeachersFromStorage().filter((r) => `${r.id}` !== sid);
    writeTeachersToStorage(list);
    return list;
  }
  const list = readEmployeesFromStorage().filter((r) => `${r.id}` !== sid);
  writeEmployeesToStorage(list);
  return list;
}

/**
 * @param {"teacher"|"employee"} kind
 * @param {Record<string, unknown>} payload
 */
export function upsertStaff(kind, payload) {
  const isTeacher = kind === "teacher";
  const read = isTeacher ? readTeachersFromStorage : readEmployeesFromStorage;
  const write = isTeacher ? writeTeachersToStorage : writeEmployeesToStorage;
  let list = read();
  const id = payload?.id != null ? payload.id : null;
  if (id != null && `${id}` !== "") {
    const sid = `${id}`;
    list = list.map((r) => (`${r.id}` === sid ? { ...r, ...payload } : r));
    write(list);
    return list;
  }
  const newRow = {
    ...payload,
    id: nextNumericId(list),
  };
  write([...list, newRow]);
  return [...list, newRow];
}
