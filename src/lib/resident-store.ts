import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface Resident {
  id: string;
  name: string;
  email: string;
  houseNumber: string;
  status: "pending" | "approved" | "rejected";
  password?: string;
  submissionDeviceId: string;
  createdAt: string;
}

const COLLECTION_NAME = "residents";
const DEVICE_ID_KEY = "resident_device_id";
const CURRENT_RESIDENT_KEY = "current_resident_session";
const FIRST_LOGIN_KEY = "resident_first_login_after_approval";

function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function getResidents(): Promise<Resident[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    const { id: _id, ...rest } = data as { id?: string } & Omit<Resident, "id">;
    return { id: snapshot.id, ...rest } as Resident;
  });
}

export async function createResident(data: Omit<Resident, "id" | "status" | "createdAt" | "submissionDeviceId">): Promise<Resident> {
  const residentData = {
    ...data,
    status: "pending",
    submissionDeviceId: getOrCreateDeviceId(),
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), residentData);
  return { id: docRef.id, ...residentData } as Resident;
}

export async function updateResidentStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { status });
}

export async function getResidentByDeviceId(): Promise<Resident | null> {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) return null;
  const residents = await getResidents();
  return residents.find(r => r.submissionDeviceId === deviceId) || null;
}

export async function setResidentPassword(id: string, password: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { password });
}

export async function authenticateResident(emailOrName: string, password: string): Promise<Resident | null> {
  const residents = await getResidents();
  const resident = residents.find(
    r => r.status === "approved" && (r.email === emailOrName || r.name === emailOrName) && r.password === password
  );
  if (resident) {
    localStorage.setItem(CURRENT_RESIDENT_KEY, JSON.stringify(resident));
    // Mark as first login if not already done
    const firstLoginKey = `${FIRST_LOGIN_KEY}_${resident.id}`;
    if (!localStorage.getItem(firstLoginKey)) {
      localStorage.setItem(firstLoginKey, "true");
    }
    return resident;
  }
  return null;
}

export function isFirstLoginAfterApproval(residentId: string): boolean {
  const firstLoginKey = `${FIRST_LOGIN_KEY}_${residentId}`;
  return localStorage.getItem(firstLoginKey) === "true";
}

export function markFirstLoginComplete(residentId: string): void {
  const firstLoginKey = `${FIRST_LOGIN_KEY}_${residentId}`;
  localStorage.removeItem(firstLoginKey);
}

export function getCurrentResident(): Resident | null {
  const data = localStorage.getItem(CURRENT_RESIDENT_KEY);
  return data ? JSON.parse(data) : null;
}

export function logoutResident(): void {
  localStorage.removeItem(CURRENT_RESIDENT_KEY);
}