import Dexie, { type Table } from "dexie";
import type { ActiveWorkout, PendingMutation } from "@/lib/types/database";

export class GymTrackDB extends Dexie {
  activeWorkout!: Table<ActiveWorkout, string>;
  pendingMutations!: Table<PendingMutation, string>;

  constructor() {
    super("GymTrackDB");
    this.version(1).stores({
      activeWorkout: "id",
      pendingMutations: "id, createdAt",
    });
  }
}

export const db = new GymTrackDB();
