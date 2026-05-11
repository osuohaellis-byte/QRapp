import { v4 as uuidv4 } from "uuid";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface VisitorPass {
  id: string;
  residentId?: string;
  securityCode: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  expectedDate: string;
  expectedTime: string;
  residentName: string;
  residentUnit: string;
  status: "pending" | "used" | "expired" | "denied";
  createdAt: string;
}

const COLLECTION_NAME = "visitorPasses";

function generateSecurityCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getPasses(residentId?: string): Promise<VisitorPass[]> {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const allPasses = querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    const { id: _id, ...rest } = data as { id?: string } & Omit<VisitorPass, "id">;
    return { id: snapshot.id, ...rest } as VisitorPass;
  });

  return residentId
    ? allPasses.filter((pass) => pass.residentId === residentId)
    : allPasses;
}

export async function createPass(data: Omit<VisitorPass, "id" | "securityCode" | "status" | "createdAt">): Promise<VisitorPass> {
  const passData = {
    ...data,
    securityCode: generateSecurityCode(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), passData);
  return { id: docRef.id, ...passData } as VisitorPass;
}

export async function getPassById(id: string): Promise<VisitorPass | undefined> {
  const passes = await getPasses();
  return passes.find((p) => p.id === id || p.securityCode === id);
}

export async function markPassUsed(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { status: "used" });
}

export async function markPassDenied(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, { status: "denied" });
}
