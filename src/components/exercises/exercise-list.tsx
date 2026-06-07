"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from "@/lib/constants";
import type { Exercise } from "@/lib/types/database";

interface ExerciseListProps {
  exercises: Exercise[];
}

export function ExerciseList({ exercises: initial }: ExerciseListProps) {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string | null>(null);

  const filtered = initial.filter((ex) => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscleFilter && ex.muscle_group !== muscleFilter) return false;
    if (equipmentFilter && ex.equipment_type !== equipmentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild size="icon" className="ml-2 shrink-0">
          <Link href="/exercises/new">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={muscleFilter === null ? "default" : "outline"}
          onClick={() => setMuscleFilter(null)}
        >
          All
        </Button>
        {MUSCLE_GROUPS.map((mg) => (
          <Button
            key={mg.value}
            size="sm"
            variant={muscleFilter === mg.value ? "default" : "outline"}
            onClick={() => setMuscleFilter(mg.value)}
          >
            {mg.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_TYPES.map((eq) => (
          <Button
            key={eq.value}
            size="sm"
            variant={equipmentFilter === eq.value ? "default" : "outline"}
            onClick={() =>
              setEquipmentFilter(equipmentFilter === eq.value ? null : eq.value)
            }
          >
            {eq.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No exercises found</p>
        ) : (
          filtered.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{ex.name}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary">{ex.muscle_group}</Badge>
                    <Badge variant="outline">{ex.equipment_type}</Badge>
                    {!ex.is_system && (
                      <Badge variant="default">Custom</Badge>
                    )}
                  </div>
                </div>
                {!ex.is_system && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/exercises/${ex.id}/edit`}>Edit</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
