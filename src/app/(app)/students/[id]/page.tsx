import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";

import { requireUser } from "@/lib/auth/guards";
import { getStudentDetail } from "@/lib/data/students";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteStudent } from "@/components/students/delete-student";
import { HealthForm, MarkForm, NotesForm } from "@/components/students/record-forms";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getStudentDetail(user, id);
  if (!detail) notFound();

  const { student, marks, health, assignments, audit } = detail;

  return (
    <>
      <PageHeader title={student.fullName} description={student.externalId ?? undefined}>
        <Button asChild variant="outline" size="sm">
          <Link href={`/students/${student.id}/edit`}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
        <DeleteStudent id={student.id} name={student.fullName} />
      </PageHeader>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>{student.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External ID</span>
                  <span>{student.externalId ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(student.createdAt, "PP")}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned teachers</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {assignments.length === 0 ? (
                  <p className="text-muted-foreground">No teachers assigned.</p>
                ) : (
                  <ul className="space-y-1">
                    {assignments.map((a) => (
                      <li key={a.id}>
                        {a.teacher.name}{" "}
                        <span className="text-muted-foreground">({a.teacher.email})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marks">
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground py-6 text-center">
                        No marks yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    marks.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.subject}</TableCell>
                        <TableCell>{m.term}</TableCell>
                        <TableCell className="text-right">
                          {String(m.score)} / {String(m.maxScore)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {format(m.recordedAt, "PP")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add mark</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkForm studentId={student.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health">
          <div className="space-y-4">
            {health.length === 0 ? (
              <p className="text-muted-foreground text-sm">No health records yet.</p>
            ) : (
              <div className="space-y-3">
                {health.map((h) => (
                  <Card key={h.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm">{h.summary}</CardTitle>
                      <Badge variant={h.category === "MENTAL" ? "secondary" : "outline"}>
                        {h.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      {h.details && <p>{h.details}</p>}
                      <p className="text-muted-foreground text-xs">{format(h.recordedAt, "PPp")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add health record</CardTitle>
              </CardHeader>
              <CardContent>
                <HealthForm studentId={student.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesForm studentId={student.id} initialNotes={student.notes ?? ""} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity recorded.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {audit.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-2">
                      <span>
                        <span className="font-medium">{a.actor.name}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
